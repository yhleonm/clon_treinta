-- ==============================================================================
-- MIGRACIÓN 004: IMPORTADOR MASIVO DE INVENTARIO (EXCEL, CSV, PDF)
-- 1. Añade 'importacion' a la restricción tipo en movimientos_inventario.
-- 2. Crea la tabla public.importaciones para trazabilidad y auditoría.
-- 3. Crea la función RPC transaccional public.importar_inventario_batch.
-- ==============================================================================

-- 1. ACTUALIZAR CHECK CONSTRAINT DE MOVIMIENTOS_INVENTARIO
ALTER TABLE public.movimientos_inventario 
DROP CONSTRAINT IF EXISTS movimientos_inventario_tipo_check;

ALTER TABLE public.movimientos_inventario 
ADD CONSTRAINT movimientos_inventario_tipo_check 
CHECK (tipo IN ('entrada_compra', 'salida_venta', 'ajuste_manual', 'devolucion', 'merma', 'importacion'));

-- 2. TABLA: IMPORTACIONES (REGISTRO Y AUDITORÍA)
CREATE TABLE IF NOT EXISTS public.importaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    nombre_archivo TEXT NOT NULL,
    formato TEXT NOT NULL,
    total_filas INTEGER NOT NULL DEFAULT 0,
    creados INTEGER NOT NULL DEFAULT 0,
    actualizados INTEGER NOT NULL DEFAULT 0,
    omitidos INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en tabla importaciones
ALTER TABLE public.importaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "importaciones_negocio_isolation" ON public.importaciones;
CREATE POLICY "importaciones_negocio_isolation" ON public.importaciones
    FOR ALL
    USING (negocio_id = public.auth_negocio_id())
    WITH CHECK (negocio_id = public.auth_negocio_id());

CREATE INDEX IF NOT EXISTS idx_importaciones_negocio_fecha ON public.importaciones(negocio_id, created_at DESC);

-- 3. FUNCIÓN RPC TRANSACCIONAL ATÓMICA
CREATE OR REPLACE FUNCTION public.importar_inventario_batch(
    p_negocio_id UUID,
    p_usuario_id UUID,
    p_nombre_archivo TEXT,
    p_formato TEXT,
    p_actualizar_existentes BOOLEAN,
    p_productos JSONB -- Array de items: [{"nombre": "...", "categoria": "...", "cantidad": 10, "costo": 1000, "precio": 2000, "notas": "..."}]
)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_importacion_id UUID;
    v_item JSONB;
    v_nombre TEXT;
    v_categoria_nombre TEXT;
    v_categoria_id UUID;
    v_cantidad NUMERIC(12, 2);
    v_costo NUMERIC(14, 2);
    v_precio NUMERIC(14, 2);
    v_notas TEXT;
    v_prod_id UUID;
    v_stock_ant NUMERIC(12, 2);
    v_stock_nuev NUMERIC(12, 2);
    v_creados INTEGER := 0;
    v_actualizados INTEGER := 0;
    v_omitidos INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
    IF p_negocio_id IS NULL THEN
        RAISE EXCEPTION 'Negocio ID requerido';
    END IF;

    -- Registrar la cabecera de la importación
    INSERT INTO public.importaciones (
        negocio_id, usuario_id, nombre_archivo, formato, total_filas, metadata
    ) VALUES (
        p_negocio_id, p_usuario_id, p_nombre_archivo, p_formato, jsonb_array_length(p_productos),
        jsonb_build_object('ejecutado_en', NOW())
    ) RETURNING id INTO v_importacion_id;

    -- Procesar cada producto dentro de la transacción
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_productos)
    LOOP
        v_total := v_total + 1;
        v_nombre := TRIM(COALESCE(v_item->>'nombre', ''));
        
        -- Si no hay nombre válido, se omite
        IF v_nombre = '' THEN
            v_omitidos := v_omitidos + 1;
            CONTINUE;
        END IF;

        v_categoria_nombre := TRIM(COALESCE(v_item->>'categoria', ''));
        v_cantidad := GREATEST(0, COALESCE((v_item->>'cantidad')::NUMERIC, 0));
        v_costo := GREATEST(0, COALESCE((v_item->>'costo')::NUMERIC, 0));
        v_precio := GREATEST(0, COALESCE((v_item->>'precio')::NUMERIC, 0));
        v_notas := NULLIF(TRIM(COALESCE(v_item->>'notas', '')), '');

        -- 1. Resolver Categoría (Auto-creación si no existe)
        v_categoria_id := NULL;
        IF v_categoria_nombre <> '' THEN
            SELECT id INTO v_categoria_id
            FROM public.categorias
            WHERE negocio_id = p_negocio_id AND LOWER(TRIM(nombre)) = LOWER(v_categoria_nombre)
            LIMIT 1;

            IF v_categoria_id IS NULL THEN
                INSERT INTO public.categorias (negocio_id, nombre, color_hex, icono, activo)
                VALUES (p_negocio_id, v_categoria_nombre, '#10B981', 'tag', true)
                RETURNING id INTO v_categoria_id;
            END IF;
        END IF;

        -- 2. Verificar existencia del producto (por nombre exacto case-insensitive)
        v_prod_id := NULL;
        SELECT id, stock_actual INTO v_prod_id, v_stock_ant
        FROM public.productos
        WHERE negocio_id = p_negocio_id AND LOWER(TRIM(nombre)) = LOWER(v_nombre) AND activo = true
        LIMIT 1;

        IF v_prod_id IS NOT NULL THEN
            IF p_actualizar_existentes THEN
                -- Modo: Actualizar existente
                v_stock_nuev := v_stock_ant + v_cantidad;

                UPDATE public.productos
                SET precio_venta = CASE WHEN v_precio > 0 THEN v_precio ELSE precio_venta END,
                    costo = CASE WHEN v_costo > 0 THEN v_costo ELSE costo END,
                    stock_actual = v_stock_nuev,
                    categoria_id = COALESCE(v_categoria_id, categoria_id),
                    descripcion = COALESCE(v_notas, descripcion),
                    updated_at = NOW()
                WHERE id = v_prod_id;

                IF v_cantidad > 0 THEN
                    INSERT INTO public.movimientos_inventario (
                        negocio_id, producto_id, usuario_id, tipo,
                        cantidad, stock_anterior, stock_nuevo, motivo, referencia_id
                    ) VALUES (
                        p_negocio_id, v_prod_id, p_usuario_id, 'importacion',
                        v_cantidad, v_stock_ant, v_stock_nuev, 
                        'Importación de inventario desde archivo: ' || p_nombre_archivo, 
                        v_importacion_id
                    );
                END IF;

                v_actualizados := v_actualizados + 1;
            ELSE
                -- Modo: Crear como nuevo de todas formas
                INSERT INTO public.productos (
                    negocio_id, categoria_id, nombre, descripcion, precio_venta, costo, stock_actual, stock_minimo, activo
                ) VALUES (
                    p_negocio_id, v_categoria_id, v_nombre, v_notas, v_precio, v_costo, v_cantidad, 5, true
                ) RETURNING id INTO v_prod_id;

                IF v_cantidad > 0 THEN
                    INSERT INTO public.movimientos_inventario (
                        negocio_id, producto_id, usuario_id, tipo,
                        cantidad, stock_anterior, stock_nuevo, motivo, referencia_id
                    ) VALUES (
                        p_negocio_id, v_prod_id, p_usuario_id, 'importacion',
                        v_cantidad, 0, v_cantidad, 
                        'Importación de inventario desde archivo: ' || p_nombre_archivo, 
                        v_importacion_id
                    );
                END IF;

                v_creados := v_creados + 1;
            END IF;
        ELSE
            -- Producto nuevo (no existía previamente)
            INSERT INTO public.productos (
                negocio_id, categoria_id, nombre, descripcion, precio_venta, costo, stock_actual, stock_minimo, activo
            ) VALUES (
                p_negocio_id, v_categoria_id, v_nombre, v_notas, v_precio, v_costo, v_cantidad, 5, true
            ) RETURNING id INTO v_prod_id;

            IF v_cantidad > 0 THEN
                INSERT INTO public.movimientos_inventario (
                    negocio_id, producto_id, usuario_id, tipo,
                    cantidad, stock_anterior, stock_nuevo, motivo, referencia_id
                ) VALUES (
                    p_negocio_id, v_prod_id, p_usuario_id, 'importacion',
                    v_cantidad, 0, v_cantidad, 
                    'Importación de inventario desde archivo: ' || p_nombre_archivo, 
                    v_importacion_id
                );
            END IF;

            v_creados := v_creados + 1;
        END IF;
    END LOOP;

    -- Actualizar resumen final en auditoría
    UPDATE public.importaciones
    SET total_filas = v_total,
        creados = v_creados,
        actualizados = v_actualizados,
        omitidos = v_omitidos
    WHERE id = v_importacion_id;

    RETURN jsonb_build_object(
        'success', true,
        'importacion_id', v_importacion_id,
        'total', v_total,
        'creados', v_creados,
        'actualizados', v_actualizados,
        'omitidos', v_omitidos
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.importar_inventario_batch(UUID, UUID, TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.importar_inventario_batch(UUID, UUID, TEXT, TEXT, BOOLEAN, JSONB) TO authenticated, anon, service_role;
