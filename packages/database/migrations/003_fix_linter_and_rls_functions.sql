-- ==============================================================================
-- MIGRACIÓN 003: RESOLUCIÓN DE LINTER SUPABASE & CORRECCIÓN FUNCIONES RLS
-- Corrige:
-- 1. function_search_path_mutable (fijando SET search_path = public, pg_temp)
-- 2. anon_security_definer_function_executable (revocando permisos a anon en triggers/helpers)
-- 3. authenticated_security_definer_function_executable (restringiendo triggers a ejecución interna)
-- 4. Soporte universal de enlace Auth: compatible tanto si la columna es 'id' como si es 'auth_user_id'
-- ==============================================================================

-- 1. LIMPIAR SOBRECARGAS OBSOLETAS
DROP FUNCTION IF EXISTS public.bootstrap_negocio(TEXT, TEXT, TEXT);

-- 2. FUNCIONES DE AUTENTICACIÓN Y CONTEXTO RLS MULTI-TENANT
CREATE OR REPLACE FUNCTION public.auth_negocio_id()
RETURNS UUID 
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_negocio_id UUID;
    v_has_auth_user_id BOOLEAN;
BEGIN
    -- Comprobar si existe columna auth_user_id o si id es la PK de Auth
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'auth_user_id'
    ) INTO v_has_auth_user_id;

    IF v_has_auth_user_id THEN
        EXECUTE 'SELECT negocio_id FROM public.usuarios WHERE auth_user_id = $1 OR id = $1 LIMIT 1'
        INTO v_negocio_id
        USING auth.uid();
    ELSE
        SELECT u.negocio_id INTO v_negocio_id 
        FROM public.usuarios u
        WHERE u.id = auth.uid()
        LIMIT 1;
    END IF;

    RETURN v_negocio_id;
END;
$$;

-- RLS policies require execution permission for all roles evaluating table policies
GRANT EXECUTE ON FUNCTION public.auth_negocio_id() TO PUBLIC, anon, authenticated, service_role;


CREATE OR REPLACE FUNCTION public.auth_rol()
RETURNS TEXT 
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_rol TEXT;
    v_has_auth_user_id BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'auth_user_id'
    ) INTO v_has_auth_user_id;

    IF v_has_auth_user_id THEN
        EXECUTE 'SELECT rol FROM public.usuarios WHERE auth_user_id = $1 OR id = $1 LIMIT 1'
        INTO v_rol
        USING auth.uid();
    ELSE
        SELECT u.rol INTO v_rol 
        FROM public.usuarios u
        WHERE u.id = auth.uid()
        LIMIT 1;
    END IF;

    RETURN v_rol;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auth_rol() TO PUBLIC, anon, authenticated, service_role;


-- 3. TRIGGERS AUTOMÁTICOS (REVOCAR ACCESO RPC A ANON Y AUTHENTICATED)
CREATE OR REPLACE FUNCTION public.fn_actualizar_saldo_cxc()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_saldo_actual NUMERIC(14, 2);
    v_nuevo_saldo NUMERIC(14, 2);
BEGIN
    SELECT saldo_pendiente INTO v_saldo_actual
    FROM public.cuentas_por_cobrar
    WHERE id = NEW.cuenta_id;

    v_nuevo_saldo := GREATEST(0, COALESCE(v_saldo_actual, 0) - NEW.monto);

    UPDATE public.cuentas_por_cobrar
    SET saldo_pendiente = v_nuevo_saldo,
        estado = CASE WHEN v_nuevo_saldo = 0 THEN 'pagada' ELSE 'parcial' END,
        updated_at = NOW()
    WHERE id = NEW.cuenta_id;

    -- Actualizar saldo_deuda consolidado en el cliente
    UPDATE public.clientes
    SET saldo_deuda = GREATEST(0, COALESCE(saldo_deuda, 0) - NEW.monto)
    WHERE id = NEW.cliente_id;

    -- Si el abono fue en efectivo y hay caja abierta, actualizar la sesión de caja
    IF NEW.medio_pago = 'efectivo' AND NEW.sesion_caja_id IS NOT NULL THEN
        UPDATE public.caja_sesiones
        SET total_abonos_efectivo = total_abonos_efectivo + NEW.monto,
            monto_esperado = monto_esperado + NEW.monto
        WHERE id = NEW.sesion_caja_id;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_actualizar_saldo_cxc() FROM PUBLIC, anon, authenticated;


CREATE OR REPLACE FUNCTION public.fn_actualizar_saldo_cxp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_saldo_actual NUMERIC(14, 2);
    v_nuevo_saldo NUMERIC(14, 2);
BEGIN
    SELECT saldo_pendiente INTO v_saldo_actual
    FROM public.cuentas_por_pagar
    WHERE id = NEW.cuenta_id;

    v_nuevo_saldo := GREATEST(0, COALESCE(v_saldo_actual, 0) - NEW.monto);

    UPDATE public.cuentas_por_pagar
    SET saldo_pendiente = v_nuevo_saldo,
        estado = CASE WHEN v_nuevo_saldo = 0 THEN 'pagada' ELSE 'parcial' END,
        updated_at = NOW()
    WHERE id = NEW.cuenta_id;

    -- Actualizar saldo_deuda consolidado en el proveedor
    UPDATE public.proveedores
    SET saldo_deuda = GREATEST(0, COALESCE(saldo_deuda, 0) - NEW.monto)
    WHERE id = NEW.proveedor_id;

    -- Si el egreso fue en efectivo y hay caja abierta, registrarlo
    IF NEW.medio_pago = 'efectivo' AND NEW.sesion_caja_id IS NOT NULL THEN
        UPDATE public.caja_sesiones
        SET total_gastos_efectivo = total_gastos_efectivo + NEW.monto,
            monto_esperado = monto_esperado - NEW.monto
        WHERE id = NEW.sesion_caja_id;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_actualizar_saldo_cxp() FROM PUBLIC, anon, authenticated;


CREATE OR REPLACE FUNCTION public.fn_actualizar_caja_gasto()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.medio_pago = 'efectivo' AND NEW.sesion_caja_id IS NOT NULL THEN
        UPDATE public.caja_sesiones
        SET total_gastos_efectivo = total_gastos_efectivo + NEW.valor,
            monto_esperado = monto_esperado - NEW.valor
        WHERE id = NEW.sesion_caja_id;
    END IF;

    -- Si es a crédito y tiene proveedor, crear cuenta por pagar automáticamente
    IF NEW.es_credito = TRUE AND NEW.proveedor_id IS NOT NULL THEN
        INSERT INTO public.cuentas_por_pagar (negocio_id, gasto_id, proveedor_id, monto_total, saldo_pendiente, estado)
        VALUES (NEW.negocio_id, NEW.id, NEW.proveedor_id, NEW.valor, NEW.valor, 'pendiente');

        UPDATE public.proveedores
        SET saldo_deuda = saldo_deuda + NEW.valor
        WHERE id = NEW.proveedor_id;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_actualizar_caja_gasto() FROM PUBLIC, anon, authenticated;


-- 4. PROCEDIMIENTO ATÓMICO DE VENTA
CREATE OR REPLACE FUNCTION public.registrar_venta_atomica(
    p_negocio_id UUID,
    p_usuario_id UUID,
    p_cliente_id UUID,
    p_numero_folio TEXT,
    p_subtotal NUMERIC(14, 2),
    p_descuento NUMERIC(14, 2),
    p_total NUMERIC(14, 2),
    p_medio_pago TEXT,
    p_sesion_caja_id UUID,
    p_notas TEXT,
    p_offline_id TEXT,
    p_items JSONB
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_venta_id UUID;
    v_item JSONB;
    v_prod_id UUID;
    v_cantidad NUMERIC(12, 2);
    v_precio NUMERIC(14, 2);
    v_costo NUMERIC(14, 2);
    v_nombre TEXT;
    v_stock_anterior NUMERIC(12, 2);
    v_stock_nuevo NUMERIC(12, 2);
BEGIN
    -- 1. Insertar Cabecera de Venta
    INSERT INTO public.ventas (
        negocio_id, usuario_id, cliente_id, sesion_caja_id,
        numero_folio, subtotal, descuento, total, medio_pago,
        estado, notas, offline_id
    ) VALUES (
        p_negocio_id, p_usuario_id, p_cliente_id, p_sesion_caja_id,
        p_numero_folio, p_subtotal, p_descuento, p_total, p_medio_pago,
        'completada', p_notas, p_offline_id
    ) RETURNING id INTO v_venta_id;

    -- 2. Procesar cada item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'producto_id')::UUID;
        v_nombre := (v_item->>'nombre')::TEXT;
        v_cantidad := (v_item->>'cantidad')::NUMERIC;
        v_precio := (v_item->>'precio_unitario')::NUMERIC;
        v_costo := COALESCE((v_item->>'costo_unitario')::NUMERIC, 0);

        -- Insertar línea de detalle
        INSERT INTO public.venta_items (
            venta_id, producto_id, nombre_producto, cantidad, precio_unitario, costo_unitario, subtotal
        ) VALUES (
            v_venta_id, v_prod_id, v_nombre, v_cantidad, v_precio, v_costo, (v_cantidad * v_precio)
        );

        -- Si el item está registrado en catálogo, descontar inventario y asentar Kardex
        IF v_prod_id IS NOT NULL THEN
            SELECT stock_actual INTO v_stock_anterior
            FROM public.productos
            WHERE id = v_prod_id FOR UPDATE;

            IF FOUND THEN
                v_stock_nuevo := v_stock_anterior - v_cantidad;

                -- Actualizar stock
                UPDATE public.productos
                SET stock_actual = v_stock_nuevo,
                    updated_at = NOW()
                WHERE id = v_prod_id;

                -- Registrar en Kardex
                INSERT INTO public.movimientos_inventario (
                    negocio_id, producto_id, usuario_id, tipo,
                    cantidad, stock_anterior, stock_nuevo, motivo, referencia_id
                ) VALUES (
                    p_negocio_id, v_prod_id, p_usuario_id, 'salida_venta',
                    -v_cantidad, v_stock_anterior, v_stock_nuevo, 'Venta Folio #' || p_numero_folio, v_venta_id
                );
            END IF;
        END IF;
    END LOOP;

    -- 3. Si la venta fue en efectivo y hay caja abierta, actualizar totales de caja
    IF p_medio_pago = 'efectivo' AND p_sesion_caja_id IS NOT NULL THEN
        UPDATE public.caja_sesiones
        SET total_ventas_efectivo = total_ventas_efectivo + p_total,
            monto_esperado = monto_esperado + p_total
        WHERE id = p_sesion_caja_id;
    END IF;

    -- 4. Si la venta es a crédito ("fiado") y se asignó cliente, registrar en Cuentas por Cobrar
    IF p_medio_pago = 'credito' AND p_cliente_id IS NOT NULL THEN
        INSERT INTO public.cuentas_por_cobrar (
            negocio_id, venta_id, cliente_id, monto_total, saldo_pendiente, estado, notas
        ) VALUES (
            p_negocio_id, v_venta_id, p_cliente_id, p_total, p_total, 'pendiente', 'Crédito originado en Venta #' || p_numero_folio
        );

        UPDATE public.clientes
        SET saldo_deuda = saldo_deuda + p_total
        WHERE id = p_cliente_id;
    END IF;

    RETURN v_venta_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_venta_atomica(UUID, UUID, UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_venta_atomica(UUID, UUID, UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID, TEXT, TEXT, JSONB) TO authenticated, service_role;


-- 5. BOOTSTRAP DE NEGOCIO
CREATE OR REPLACE FUNCTION public.bootstrap_negocio(
    p_user_id UUID,
    p_nombre TEXT,
    p_owner_name TEXT,
    p_email TEXT
)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_negocio_id UUID;
    v_user_id UUID;
    v_has_auth_user_id BOOLEAN;
BEGIN
    v_user_id := COALESCE(auth.uid(), p_user_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID required';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'auth_user_id'
    ) INTO v_has_auth_user_id;

    IF v_has_auth_user_id THEN
        IF EXISTS (SELECT 1 FROM public.usuarios WHERE auth_user_id = v_user_id OR id = v_user_id) THEN
            RAISE EXCEPTION 'User already has a business registered';
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM public.usuarios WHERE id = v_user_id) THEN
            RAISE EXCEPTION 'User already has a business registered';
        END IF;
    END IF;

    -- Crear el negocio
    INSERT INTO public.negocios (nombre, moneda, simbolo_moneda)
    VALUES (p_nombre, 'COP', '$')
    RETURNING id INTO v_negocio_id;

    -- Crear el usuario propietario según la estructura detectada
    IF v_has_auth_user_id THEN
        EXECUTE 'INSERT INTO public.usuarios (auth_user_id, negocio_id, nombre, email, rol, activo) VALUES ($1, $2, $3, $4, ''propietario'', true)'
        USING v_user_id, v_negocio_id, p_owner_name, p_email;
    ELSE
        INSERT INTO public.usuarios (id, negocio_id, nombre, email, rol, activo)
        VALUES (v_user_id, v_negocio_id, p_owner_name, p_email, 'propietario', true);
    END IF;

    RETURN jsonb_build_object('negocio_id', v_negocio_id, 'usuario_id', v_user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_negocio(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_negocio(UUID, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
