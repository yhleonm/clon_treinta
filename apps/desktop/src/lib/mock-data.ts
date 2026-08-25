import {
  Negocio,
  Usuario,
  Categoria,
  Producto,
  Cliente,
  Proveedor,
  CajaSesion,
  Venta,
  Gasto,
  CuentaPorCobrar,
  CuentaPorPagar,
  PERMISOS_DEFAULT_ADMIN,
  PERMISOS_DEFAULT_VENDEDOR,
} from '@treinta/shared';

export const INITIAL_NEGOCIO: Negocio = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  nombre: 'Minimarket & Variedades El Triunfo',
  documento_identidad: '901.458.789-1',
  telefono: '+57 310 456 7890',
  direccion: 'Cra. 45 # 26-10, Bogotá, Colombia',
  moneda: 'COP',
  simbolo_moneda: '$',
  configuraciones: {
    alertas_stock: true,
    permitir_stock_negativo: true,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 'u-jackeline',
    negocio_id: INITIAL_NEGOCIO.id,
    nombre: 'Jackeline',
    email: 'jackeline@eltriunfo.com',
    telefono: '+573143574221',
    rol: 'administrador',
    permisos: PERMISOS_DEFAULT_ADMIN,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-manolo',
    negocio_id: INITIAL_NEGOCIO.id,
    nombre: 'Manolo',
    email: 'manolo@eltriunfo.com',
    telefono: '+573123822341',
    rol: 'vendedor',
    permisos: PERMISOS_DEFAULT_VENDEDOR,
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const INITIAL_CATEGORIAS: Categoria[] = [
  { id: 'c1', negocio_id: INITIAL_NEGOCIO.id, nombre: 'Bebidas y Refrescos', color_hex: '#3B82F6', icono: 'cup-soda', activo: true, created_at: new Date().toISOString() },
  { id: 'c2', negocio_id: INITIAL_NEGOCIO.id, nombre: 'Snacks y Pasabocas', color_hex: '#F59E0B', icono: 'cookie', activo: true, created_at: new Date().toISOString() },
  { id: 'c3', negocio_id: INITIAL_NEGOCIO.id, nombre: 'Lácteos y Huevos', color_hex: '#10B981', icono: 'milk', activo: true, created_at: new Date().toISOString() },
  { id: 'c4', negocio_id: INITIAL_NEGOCIO.id, nombre: 'Abarrotes y Granos', color_hex: '#8B5CF6', icono: 'shopping-bag', activo: true, created_at: new Date().toISOString() },
  { id: 'c5', negocio_id: INITIAL_NEGOCIO.id, nombre: 'Aseo y Hogar', color_hex: '#EC4899', icono: 'sparkles', activo: true, created_at: new Date().toISOString() },
];

export const INITIAL_PRODUCTOS: Producto[] = [
  {
    id: 'p1',
    negocio_id: INITIAL_NEGOCIO.id,
    categoria_id: 'c1',
    nombre: 'Coca Cola 400ml Botella',
    sku: 'BEB-001',
    precio_venta: 3500,
    costo: 2400,
    stock_actual: 24,
    stock_minimo: 6,
    imagen_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p2',
    negocio_id: INITIAL_NEGOCIO.id,
    categoria_id: 'c1',
    nombre: 'Agua Mineral Manantial 500ml',
    sku: 'BEB-002',
    precio_venta: 2500,
    costo: 1500,
    stock_actual: 18,
    stock_minimo: 5,
    imagen_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&q=80',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p3',
    negocio_id: INITIAL_NEGOCIO.id,
    categoria_id: 'c2',
    nombre: 'Papas Margarita Natural 110g',
    sku: 'SNK-001',
    precio_venta: 4200,
    costo: 3100,
    stock_actual: 4, // Alerta stock bajo
    stock_minimo: 6,
    imagen_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p4',
    negocio_id: INITIAL_NEGOCIO.id,
    categoria_id: 'c2',
    nombre: 'Galletas Festival Chocolate',
    sku: 'SNK-002',
    precio_venta: 1800,
    costo: 1200,
    stock_actual: 30,
    stock_minimo: 8,
    imagen_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p5',
    negocio_id: INITIAL_NEGOCIO.id,
    categoria_id: 'c3',
    nombre: 'Leche Entera Alquería 1.1L',
    sku: 'LAC-001',
    precio_venta: 4800,
    costo: 3900,
    stock_actual: 12,
    stock_minimo: 5,
    imagen_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p6',
    negocio_id: INITIAL_NEGOCIO.id,
    categoria_id: 'c3',
    nombre: 'Queso Campesino Bloque 500g',
    sku: 'LAC-002',
    precio_venta: 9500,
    costo: 7200,
    stock_actual: 2, // Alerta stock bajo
    stock_minimo: 5,
    imagen_url: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=400&q=80',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p7',
    negocio_id: INITIAL_NEGOCIO.id,
    categoria_id: 'c4',
    nombre: 'Arroz Diana Premium 1kg',
    sku: 'ABA-001',
    precio_venta: 4500,
    costo: 3600,
    stock_actual: 40,
    stock_minimo: 10,
    imagen_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p8',
    negocio_id: INITIAL_NEGOCIO.id,
    categoria_id: 'c4',
    nombre: 'Aceite Premier Girasol 1L',
    sku: 'ABA-002',
    precio_venta: 12500,
    costo: 9800,
    stock_actual: 10,
    stock_minimo: 4,
    imagen_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p9',
    negocio_id: INITIAL_NEGOCIO.id,
    categoria_id: 'c5',
    nombre: 'Detergente Fab Polvo 1kg',
    sku: 'ASE-001',
    precio_venta: 8900,
    costo: 6800,
    stock_actual: 14,
    stock_minimo: 4,
    imagen_url: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&q=80',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const INITIAL_CLIENTES: Cliente[] = [
  { id: 'cl1', negocio_id: INITIAL_NEGOCIO.id, nombre: 'Carlos Mendoza', telefono: '+57 312 987 6543', email: 'carlos.mendoza@email.com', documento: '10203040', saldo_deuda: 35000, limite_credito: 200000, activo: true, created_at: new Date().toISOString() },
  { id: 'cl2', negocio_id: INITIAL_NEGOCIO.id, nombre: 'María Fernanda Gómez', telefono: '+57 320 555 1234', email: 'mafe.gomez@email.com', documento: '52304918', saldo_deuda: 0, limite_credito: 150000, activo: true, created_at: new Date().toISOString() },
  { id: 'cl3', negocio_id: INITIAL_NEGOCIO.id, nombre: 'Don Pedro Vecino', telefono: '+57 301 777 8899', email: 'pedro.vecino@email.com', documento: '19283746', saldo_deuda: 18500, limite_credito: 100000, activo: true, created_at: new Date().toISOString() },
];

export const INITIAL_PROVEEDORES: Proveedor[] = [
  { id: 'pr1', negocio_id: INITIAL_NEGOCIO.id, nombre: 'Distribuidora Central de Bebidas', contacto: 'Andrés Rueda', telefono: '+57 315 111 2233', nit: '900.123.456-7', saldo_deuda: 120000, email: 'ventas@districentral.com', activo: true, created_at: new Date().toISOString() },
  { id: 'pr2', negocio_id: INITIAL_NEGOCIO.id, nombre: 'Lácteos del Campo', contacto: 'Claudia Morales', telefono: '+57 317 444 5566', nit: '860.987.654-2', saldo_deuda: 0, email: 'pedidos@lacteosdelcampo.com', activo: true, created_at: new Date().toISOString() },
];

export const INITIAL_CAJA: CajaSesion = {
  id: 'caja-sesion-hoy',
  negocio_id: INITIAL_NEGOCIO.id,
  usuario_id: INITIAL_USUARIOS[0]!.id,
  fecha_apertura: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  monto_inicial: 150000, // $150.000 de base en efectivo
  total_ventas_efectivo: 72000,
  total_gastos_efectivo: 25000,
  total_abonos_efectivo: 10000,
  monto_esperado: 207000,
  estado: 'abierta',
  created_at: new Date().toISOString(),
};

export const INITIAL_VENTAS: Venta[] = [
  {
    id: 'v1',
    negocio_id: INITIAL_NEGOCIO.id,
    numero_folio: 'V-1001',
    usuario_id: INITIAL_USUARIOS[0]!.id,
    cliente_id: 'cl2',
    sesion_caja_id: INITIAL_CAJA.id,
    subtotal: 35000,
    descuento: 0,
    total: 35000,
    medio_pago: 'nequi',
    estado: 'completada',
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    items: [
      { id: 'vi1', venta_id: 'v1', producto_id: 'p8', nombre_producto: 'Aceite Premier Girasol 1L', cantidad: 2, precio_unitario: 12500, costo_unitario: 9800, subtotal: 25000, created_at: new Date().toISOString() },
      { id: 'vi2', venta_id: 'v1', producto_id: 'p6', nombre_producto: 'Queso Campesino Bloque 500g', cantidad: 1, precio_unitario: 9500, costo_unitario: 7200, subtotal: 9500, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'v2',
    negocio_id: INITIAL_NEGOCIO.id,
    numero_folio: 'V-1002',
    usuario_id: INITIAL_USUARIOS[0]!.id,
    cliente_id: 'cl1',
    sesion_caja_id: INITIAL_CAJA.id,
    subtotal: 35000,
    descuento: 0,
    total: 35000,
    medio_pago: 'credito',
    estado: 'completada',
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    items: [
      { id: 'vi3', venta_id: 'v2', producto_id: 'p1', nombre_producto: 'Coca Cola 400ml Botella', cantidad: 10, precio_unitario: 3500, costo_unitario: 2400, subtotal: 35000, created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'v3',
    negocio_id: INITIAL_NEGOCIO.id,
    numero_folio: 'V-1003',
    usuario_id: INITIAL_USUARIOS[0]!.id,
    sesion_caja_id: INITIAL_CAJA.id,
    subtotal: 72000,
    descuento: 0,
    total: 72000,
    medio_pago: 'efectivo',
    estado: 'completada',
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    items: [
      { id: 'vi4', venta_id: 'v3', producto_id: 'p7', nombre_producto: 'Arroz Diana Premium 1kg', cantidad: 8, precio_unitario: 4500, costo_unitario: 3600, subtotal: 36000, created_at: new Date().toISOString() },
      { id: 'vi5', venta_id: 'v3', producto_id: 'p9', nombre_producto: 'Detergente Fab Polvo 1kg', cantidad: 4, precio_unitario: 8900, costo_unitario: 6800, subtotal: 35600, created_at: new Date().toISOString() }
    ]
  }
];

export const INITIAL_GASTOS: Gasto[] = [
  {
    id: 'g1',
    negocio_id: INITIAL_NEGOCIO.id,
    usuario_id: INITIAL_USUARIOS[0]!.id,
    proveedor_id: 'pr1',
    sesion_caja_id: INITIAL_CAJA.id,
    categoria: 'Compra de Mercancía / Inventario',
    concepto: 'Bolsas y Empaques Plásticos',
    valor: 25000,
    medio_pago: 'efectivo',
    es_credito: false,
    fecha: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'g2',
    negocio_id: INITIAL_NEGOCIO.id,
    usuario_id: INITIAL_USUARIOS[0]!.id,
    proveedor_id: 'pr1',
    categoria: 'Compra de Mercancía / Inventario',
    concepto: 'Pedido Refrescos y Jugos',
    valor: 120000,
    medio_pago: 'credito',
    es_credito: true,
    fecha: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
    created_at: new Date().toISOString(),
  }
];

export const INITIAL_CXC: CuentaPorCobrar[] = [
  {
    id: 'cxc-1',
    negocio_id: INITIAL_NEGOCIO.id,
    venta_id: 'v2',
    cliente_id: 'cl1',
    monto_total: 35000,
    saldo_pendiente: 35000,
    estado: 'pendiente',
    fecha_vencimiento: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    notas: 'Crédito venta #V-1002 - Coca Cola x10',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cxc-2',
    negocio_id: INITIAL_NEGOCIO.id,
    cliente_id: 'cl3',
    monto_total: 28500,
    saldo_pendiente: 18500,
    estado: 'parcial',
    fecha_vencimiento: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    notas: 'Abarrotes fin de semana - abonó $10.000',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const INITIAL_CXP: CuentaPorPagar[] = [
  {
    id: 'cxp-1',
    negocio_id: INITIAL_NEGOCIO.id,
    gasto_id: 'g2',
    proveedor_id: 'pr1',
    monto_total: 120000,
    saldo_pendiente: 120000,
    estado: 'pendiente',
    fecha_vencimiento: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
    notas: 'Factura Distribuidora Central #8945',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];
