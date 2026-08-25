-- ==============================================================================
-- DATOS SEMILLA (SEED DATA) - TIENDA DE EJEMPLO COLOMBIANA
-- Permite iniciar y probar la aplicación inmediatamente con datos realistas
-- ==============================================================================

-- 1. Insertar Negocio demo si no existe
INSERT INTO public.negocios (id, nombre, documento_identidad, telefono, direccion, moneda, simbolo_moneda)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Minimarket & Variedades El Triunfo',
    '901.458.789-1',
    '+57 310 456 7890',
    'Cra. 45 # 26-10, Bogotá, Colombia',
    'COP',
    '$'
) ON CONFLICT (id) DO NOTHING;

-- 2. Categorías
INSERT INTO public.categorias (id, negocio_id, nombre, color_hex, icono)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bebidas y Refrescos', '#3B82F6', 'cup-soda'),
    ('c2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Snacks y Pasabocas', '#F59E0B', 'cookie'),
    ('c3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lácteos y Huevos', '#10B981', 'milk'),
    ('c4444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Abarrotes y Granos', '#8B5CF6', 'shopping-bag'),
    ('c5555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aseo y Hogar', '#EC4899', 'sparkles')
ON CONFLICT (id) DO NOTHING;

-- 3. Productos (Catálogo con precios en COP)
INSERT INTO public.productos (id, negocio_id, categoria_id, nombre, sku, precio_venta, costo, stock_actual, stock_minimo, imagen_url)
VALUES
    ('p1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1111111-1111-1111-1111-111111111111', 'Coca Cola 400ml Botella', 'BEB-001', 3500, 2400, 24, 6, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80'),
    ('p2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1111111-1111-1111-1111-111111111111', 'Agua Mineral Manantial 500ml', 'BEB-002', 2500, 1500, 18, 5, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&q=80'),
    ('p3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2222222-2222-2222-2222-222222222222', 'Papas Margarita Natural 110g', 'SNK-001', 4200, 3100, 15, 4, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80'),
    ('p4444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2222222-2222-2222-2222-222222222222', 'Galletas Festival Chocolate', 'SNK-002', 1800, 1200, 30, 8, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80'),
    ('p5555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c3333333-3333-3333-3333-333333333333', 'Leche Entera Alquería 1.1L', 'LAC-001', 4800, 3900, 12, 3, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'),
    ('p6666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c3333333-3333-3333-3333-333333333333', 'Queso Campesino Bloque 500g', 'LAC-002', 9500, 7200, 8, 2, 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=400&q=80'),
    ('p7777777-7777-7777-7777-777777777777', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c4444444-4444-4444-4444-444444444444', 'Arroz Diana Premium 1kg', 'ABA-001', 4500, 3600, 40, 10, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80'),
    ('p8888888-8888-8888-8888-888888888888', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c4444444-4444-4444-4444-444444444444', 'Aceite Premier Girasol 1L', 'ABA-002', 12500, 9800, 10, 3, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80'),
    ('p9999999-9999-9999-9999-999999999999', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c5555555-5555-5555-5555-555555555555', 'Detergente Fab Polvo 1kg', 'ASE-001', 8900, 6800, 14, 4, 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&q=80')
ON CONFLICT (id) DO NOTHING;

-- 4. Clientes de Ejemplo
INSERT INTO public.clientes (id, negocio_id, nombre, telefono, email, documento, saldo_deuda, limite_credito)
VALUES
    ('cl111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Carlos Mendoza', '+57 312 987 6543', 'carlos.mendoza@email.com', '10203040', 35000, 200000),
    ('cl222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'María Fernanda Gómez', '+57 320 555 1234', 'mafe.gomez@email.com', '52304918', 0, 150000),
    ('cl333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Don Pedro Vecino', '+57 301 777 8899', 'pedro.vecino@email.com', '19283746', 18500, 100000)
ON CONFLICT (id) DO NOTHING;

-- 5. Proveedores de Ejemplo
INSERT INTO public.proveedores (id, negocio_id, nombre, contacto, telefono, nit, saldo_deuda)
VALUES
    ('pr111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Distribuidora Central de Bebidas S.A.S', 'Andrés Rueda', '+57 315 111 2233', '900.123.456-7', 120000),
    ('pr222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lácteos del Campo', 'Claudia Morales', '+57 317 444 5566', '860.987.654-2', 0)
ON CONFLICT (id) DO NOTHING;
