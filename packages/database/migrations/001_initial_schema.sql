-- ==============================================================================
-- CLON DE TREINTA: ESQUEMA INICIAL DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- Multi-tenant, RLS, Triggers atómicos de inventario, POS, Cuentas por Cobrar/Pagar
-- ==============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: NEGOCIOS (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.negocios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    documento_identidad TEXT, -- NIT o Cédula
    telefono TEXT,
    direccion TEXT,
    moneda TEXT DEFAULT 'COP',
    simbolo_moneda TEXT DEFAULT '$',
    configuraciones JSONB DEFAULT '{"alertas_stock": true, "permitir_stock_negativo": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: USUARIOS DEL SISTEMA
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('propietario', 'administrador', 'empleado')),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    color_hex TEXT DEFAULT '#10B981',
    icono TEXT DEFAULT 'tag',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: PRODUCTOS (INVENTARIO)
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    sku TEXT,
    precio_venta NUMERIC(14, 2) NOT NULL CHECK (precio_venta >= 0),
    costo NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (costo >= 0),
    stock_actual NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(12, 2) NOT NULL DEFAULT 5,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: MOVIMIENTOS DE INVENTARIO (KARDEX AUDITABLE)
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada_compra', 'salida_venta', 'ajuste_manual', 'devolucion', 'merma')),
    cantidad NUMERIC(12, 2) NOT NULL, -- Positivo o negativo
    stock_anterior NUMERIC(12, 2) NOT NULL,
    stock_nuevo NUMERIC(12, 2) NOT NULL,
    motivo TEXT,
    referencia_id UUID, -- ID de venta o compra
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    documento TEXT,
    saldo_deuda NUMERIC(14, 2) DEFAULT 0,
    limite_credito NUMERIC(14, 2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: PROVEEDORES
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    email TEXT,
    nit TEXT,
    saldo_deuda NUMERIC(14, 2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: CAJA SESIONES (APERTURA Y CIERRE DE CAJA / ARQUEO)
CREATE TABLE IF NOT EXISTS public.caja_sesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    monto_inicial NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_ventas_efectivo NUMERIC(14, 2) DEFAULT 0,
    total_gastos_efectivo NUMERIC(14, 2) DEFAULT 0,
    total_abonos_efectivo NUMERIC(14, 2) DEFAULT 0,
    monto_esperado NUMERIC(14, 2) DEFAULT 0,
    monto_real NUMERIC(14, 2),
    diferencia NUMERIC(14, 2),
    notas TEXT,
    estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA: VENTAS
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    numero_folio TEXT NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    sesion_caja_id UUID REFERENCES public.caja_sesiones(id) ON DELETE SET NULL,
    subtotal NUMERIC(14, 2) NOT NULL,
    descuento NUMERIC(14, 2) DEFAULT 0,
    total NUMERIC(14, 2) NOT NULL,
    medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo', 'nequi', 'daviplata', 'tarjeta', 'transferencia', 'credito', 'mixto')),
    estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada', 'anulada', 'pendiente')),
    notas TEXT,
    offline_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA: VENTA ITEMS (DETALLE DE PRODUCTOS VENDIDOS)
CREATE TABLE IF NOT EXISTS public.venta_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    nombre_producto TEXT NOT NULL,
    cantidad NUMERIC(12, 2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(14, 2) NOT NULL,
    costo_unitario NUMERIC(14, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLA: CUENTAS POR COBRAR (FIADO / CRÉDITO A CLIENTES)
CREATE TABLE IF NOT EXISTS public.cuentas_por_cobrar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    monto_total NUMERIC(14, 2) NOT NULL,
    saldo_pendiente NUMERIC(14, 2) NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagada')),
    fecha_vencimiento DATE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABLA: ABONOS A CUENTAS POR COBRAR
CREATE TABLE IF NOT EXISTS public.abonos_cuentas_cobrar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    cuenta_id UUID NOT NULL REFERENCES public.cuentas_por_cobrar(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    sesion_caja_id UUID REFERENCES public.caja_sesiones(id) ON DELETE SET NULL,
    monto NUMERIC(14, 2) NOT NULL CHECK (monto > 0),
    medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo', 'nequi', 'daviplata', 'tarjeta', 'transferencia')),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABLA: GASTOS (EGRESOS)
CREATE TABLE IF NOT EXISTS public.gastos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL,
    sesion_caja_id UUID REFERENCES public.caja_sesiones(id) ON DELETE SET NULL,
    categoria TEXT NOT NULL,
    concepto TEXT NOT NULL,
    valor NUMERIC(14, 2) NOT NULL CHECK (valor > 0),
    medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo', 'nequi', 'daviplata', 'tarjeta', 'transferencia', 'credito')),
    es_credito BOOLEAN DEFAULT FALSE,
    comprobante_url TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TABLA: CUENTAS POR PAGAR (DEUDAS CON PROVEEDORES)
CREATE TABLE IF NOT EXISTS public.cuentas_por_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    gasto_id UUID REFERENCES public.gastos(id) ON DELETE CASCADE,
    proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
    monto_total NUMERIC(14, 2) NOT NULL,
    saldo_pendiente NUMERIC(14, 2) NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagada')),
    fecha_vencimiento DATE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TABLA: ABONOS A CUENTAS POR PAGAR
CREATE TABLE IF NOT EXISTS public.abonos_cuentas_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    cuenta_id UUID NOT NULL REFERENCES public.cuentas_por_pagar(id) ON DELETE CASCADE,
    proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    sesion_caja_id UUID REFERENCES public.caja_sesiones(id) ON DELETE SET NULL,
    monto NUMERIC(14, 2) NOT NULL CHECK (monto > 0),
    medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo', 'nequi', 'daviplata', 'tarjeta', 'transferencia')),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES PARA RENDIMIENTO EN CONSULTAS FRECUENTES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_negocio ON public.usuarios(negocio_id);
CREATE INDEX IF NOT EXISTS idx_productos_negocio ON public.productos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_ventas_negocio_fecha ON public.ventas(negocio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_negocio_fecha ON public.gastos(negocio_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_cxc_negocio_estado ON public.cuentas_por_cobrar(negocio_id, estado);
CREATE INDEX IF NOT EXISTS idx_cxp_negocio_estado ON public.cuentas_por_pagar(negocio_id, estado);
CREATE INDEX IF NOT EXISTS idx_caja_sesiones_negocio_estado ON public.caja_sesiones(negocio_id, estado);

-- ==============================================================================
-- FUNCIONES Y TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- 1. Actualización de saldos al abonar a una cuenta por cobrar
CREATE OR REPLACE FUNCTION public.fn_actualizar_saldo_cxc()
RETURNS TRIGGER AS $$
DECLARE
    v_saldo_actual NUMERIC(14, 2);
    v_nuevo_saldo NUMERIC(14, 2);
BEGIN
    SELECT saldo_pendiente INTO v_saldo_actual
    FROM public.cuentas_por_cobrar
    WHERE id = NEW.cuenta_id;

    v_nuevo_saldo := GREATEST(0, v_saldo_actual - NEW.monto);

    UPDATE public.cuentas_por_cobrar
    SET saldo_pendiente = v_nuevo_saldo,
        estado = CASE WHEN v_nuevo_saldo = 0 THEN 'pagada' ELSE 'parcial' END,
        updated_at = NOW()
    WHERE id = NEW.cuenta_id;

    -- Actualizar saldo_deuda consolidado en el cliente
    UPDATE public.clientes
    SET saldo_deuda = GREATEST(0, saldo_deuda - NEW.monto)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_actualizar_saldo_cxc
AFTER INSERT ON public.abonos_cuentas_cobrar
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_saldo_cxc();

-- 2. Actualización de saldos al abonar a una cuenta por pagar
CREATE OR REPLACE FUNCTION public.fn_actualizar_saldo_cxp()
RETURNS TRIGGER AS $$
DECLARE
    v_saldo_actual NUMERIC(14, 2);
    v_nuevo_saldo NUMERIC(14, 2);
BEGIN
    SELECT saldo_pendiente INTO v_saldo_actual
    FROM public.cuentas_por_pagar
    WHERE id = NEW.cuenta_id;

    v_nuevo_saldo := GREATEST(0, v_saldo_actual - NEW.monto);

    UPDATE public.cuentas_por_pagar
    SET saldo_pendiente = v_nuevo_saldo,
        estado = CASE WHEN v_nuevo_saldo = 0 THEN 'pagada' ELSE 'parcial' END,
        updated_at = NOW()
    WHERE id = NEW.cuenta_id;

    -- Actualizar saldo_deuda consolidado en el proveedor
    UPDATE public.proveedores
    SET saldo_deuda = GREATEST(0, saldo_deuda - NEW.monto)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_actualizar_saldo_cxp
AFTER INSERT ON public.abonos_cuentas_pagar
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_saldo_cxp();

-- 3. Actualizar totales en caja al registrar un gasto
CREATE OR REPLACE FUNCTION public.fn_actualizar_caja_gasto()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_actualizar_caja_gasto
AFTER INSERT ON public.gastos
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_caja_gasto();

-- 4. PROCEDIMIENTO ALMACENADO ATÓMICO: REGISTRAR VENTA COMPLETA
-- Ejecuta la creación de la venta, el descuento atómico de inventario,
-- el registro en Kardex, el impacto en caja y cuentas por cobrar si es a crédito.
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
    p_items JSONB -- Array de items: [{"producto_id": "...", "nombre": "...", "cantidad": 2, "precio_unitario": 5000, "costo_unitario": 3000}]
)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURIDAD Y AISLAMIENTO MULTI-TENANT
-- ==============================================================================

-- Función auxiliar para obtener el negocio_id del usuario logueado
CREATE OR REPLACE FUNCTION public.auth_negocio_id()
RETURNS UUID AS $$
    SELECT negocio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función auxiliar para obtener el rol del usuario logueado
CREATE OR REPLACE FUNCTION public.auth_rol()
RETURNS TEXT AS $$
    SELECT rol FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Activar RLS en todas las tablas del esquema
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_por_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos_cuentas_cobrar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_por_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos_cuentas_pagar ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento por tenant (negocio_id)
CREATE POLICY "negocios_acceso" ON public.negocios
    FOR ALL USING (id = public.auth_negocio_id());

CREATE POLICY "usuarios_acceso" ON public.usuarios
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "categorias_acceso" ON public.categorias
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "productos_acceso" ON public.productos
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "movimientos_acceso" ON public.movimientos_inventario
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "clientes_acceso" ON public.clientes
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "proveedores_acceso" ON public.proveedores
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "caja_sesiones_acceso" ON public.caja_sesiones
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "ventas_acceso" ON public.ventas
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "venta_items_acceso" ON public.venta_items
    FOR ALL USING (venta_id IN (SELECT id FROM public.ventas WHERE negocio_id = public.auth_negocio_id()));

CREATE POLICY "cxc_acceso" ON public.cuentas_por_cobrar
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "abonos_cxc_acceso" ON public.abonos_cuentas_cobrar
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "gastos_acceso" ON public.gastos
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "cxp_acceso" ON public.cuentas_por_pagar
    FOR ALL USING (negocio_id = public.auth_negocio_id());

CREATE POLICY "abonos_cxp_acceso" ON public.abonos_cuentas_pagar
    FOR ALL USING (negocio_id = public.auth_negocio_id());

-- ==============================================================================
-- HABILITACIÓN PARA SUPABASE REALTIME
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'productos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'ventas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ventas;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'caja_sesiones') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.caja_sesiones;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'gastos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.gastos;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'cuentas_por_cobrar') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cuentas_por_cobrar;
    END IF;
END $$;
