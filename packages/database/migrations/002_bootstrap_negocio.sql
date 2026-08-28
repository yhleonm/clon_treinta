-- ==============================================================================
-- BOOTSTRAP: Función para registrar un negocio nuevo (bypasses RLS)
-- Se necesita porque las políticas RLS impiden insertar en negocios/usuarios
-- cuando el usuario aún no tiene un registro en la tabla usuarios.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.bootstrap_negocio(
    p_nombre TEXT,
    p_owner_name TEXT,
    p_email TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_negocio_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verificar que el usuario no tenga ya un negocio
    IF EXISTS (SELECT 1 FROM public.usuarios WHERE id = v_user_id) THEN
        RAISE EXCEPTION 'User already has a business registered';
    END IF;

    -- Crear el negocio
    INSERT INTO public.negocios (nombre, moneda, simbolo_moneda)
    VALUES (p_nombre, 'COP', '$')
    RETURNING id INTO v_negocio_id;

    -- Crear el usuario propietario
    INSERT INTO public.usuarios (id, negocio_id, nombre, email, rol, activo)
    VALUES (v_user_id, v_negocio_id, p_owner_name, p_email, 'propietario', true);

    RETURN jsonb_build_object('negocio_id', v_negocio_id, 'usuario_id', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
