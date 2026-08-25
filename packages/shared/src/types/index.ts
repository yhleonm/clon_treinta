export type RolUsuario = 'propietario' | 'administrador' | 'vendedor' | 'empleado';

export type MedioPago = 
  | 'efectivo'
  | 'nequi'
  | 'daviplata'
  | 'tarjeta'
  | 'transferencia'
  | 'credito';

export type TipoMovimientoInventario = 
  | 'entrada_compra'
  | 'salida_venta'
  | 'ajuste_manual'
  | 'devolucion'
  | 'merma';

export type EstadoVenta = 'completada' | 'anulada' | 'pendiente';
export type EstadoCuenta = 'pendiente' | 'parcial' | 'pagada';
export type EstadoCaja = 'abierta' | 'cerrada';

export interface Negocio {
  id: string;
  nombre: string;
  documento_identidad?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  moneda: string;
  simbolo_moneda: string;
  configuraciones?: {
    alertas_stock?: boolean;
    permitir_stock_negativo?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface PermisosEmpleado {
  // Ventas y gastos
  registrar_ventas_gastos: boolean;
  editar_eliminar_ventas_gastos: boolean;
  visualizar_movimientos: boolean;
  ver_resumen_movimientos: boolean;
  editar_precio_venta: boolean;
  editar_fecha_venta: boolean;

  // Inventario
  crear_productos: boolean;
  editar_eliminar_productos: boolean;
  ver_inventario: boolean;
  permitir_conteo_inventario: boolean;
  descargar_reporte_conteo: boolean;
  ver_historial_stock: boolean;

  // Reportes
  descargar_reporte_inventario: boolean;
  descargar_reporte_movimientos: boolean;
  usar_filtros_balance: boolean;
  ver_estadisticas: boolean;

  // Clientes y proveedores
  crear_clientes_proveedores: boolean;
  editar_eliminar_clientes_proveedores: boolean;

  // Configuraciones
  ver_info_negocio: boolean;

  // Empleados
  crear_empleados: boolean;
  editar_eliminar_empleados: boolean;
}

export const PERMISOS_DEFAULT_ADMIN: PermisosEmpleado = {
  registrar_ventas_gastos: true,
  editar_eliminar_ventas_gastos: true,
  visualizar_movimientos: true,
  ver_resumen_movimientos: true,
  editar_precio_venta: true,
  editar_fecha_venta: true,
  crear_productos: true,
  editar_eliminar_productos: true,
  ver_inventario: true,
  permitir_conteo_inventario: true,
  descargar_reporte_conteo: true,
  ver_historial_stock: true,
  descargar_reporte_inventario: true,
  descargar_reporte_movimientos: true,
  usar_filtros_balance: true,
  ver_estadisticas: true,
  crear_clientes_proveedores: true,
  editar_eliminar_clientes_proveedores: true,
  ver_info_negocio: true,
  crear_empleados: true,
  editar_eliminar_empleados: true,
};

export const PERMISOS_DEFAULT_VENDEDOR: PermisosEmpleado = {
  registrar_ventas_gastos: true,
  editar_eliminar_ventas_gastos: false,
  visualizar_movimientos: true,
  ver_resumen_movimientos: false,
  editar_precio_venta: true,
  editar_fecha_venta: false,
  crear_productos: false,
  editar_eliminar_productos: false,
  ver_inventario: true,
  permitir_conteo_inventario: false,
  descargar_reporte_conteo: false,
  ver_historial_stock: false,
  descargar_reporte_inventario: false,
  descargar_reporte_movimientos: false,
  usar_filtros_balance: false,
  ver_estadisticas: true,
  crear_clientes_proveedores: false,
  editar_eliminar_clientes_proveedores: false,
  ver_info_negocio: false,
  crear_empleados: false,
  editar_eliminar_empleados: false,
};

export interface Usuario {
  id: string;
  negocio_id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  password?: string | null;
  rol: RolUsuario;
  permisos?: PermisosEmpleado;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  negocio_id: string;
  nombre: string;
  color_hex?: string;
  icono?: string;
  activo: boolean;
  created_at: string;
}

export interface Producto {
  id: string;
  negocio_id: string;
  categoria_id?: string | null;
  nombre: string;
  descripcion?: string | null;
  sku?: string | null;
  precio_venta: number;
  costo: number;
  stock_actual: number;
  stock_minimo: number;
  imagen_url?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  categoria?: Categoria | null;
}

export interface MovimientoInventario {
  id: string;
  negocio_id: string;
  producto_id: string;
  usuario_id?: string | null;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string | null;
  referencia_id?: string | null;
  created_at: string;
  producto?: Producto;
  usuario?: Usuario;
}

export interface Cliente {
  id: string;
  negocio_id: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  documento?: string | null;
  saldo_deuda: number;
  limite_credito: number;
  activo: boolean;
  created_at: string;
}

export interface Proveedor {
  id: string;
  negocio_id: string;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  nit?: string | null;
  saldo_deuda: number;
  activo: boolean;
  created_at: string;
}

export interface CajaSesion {
  id: string;
  negocio_id: string;
  usuario_id: string;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  monto_inicial: number;
  total_ventas_efectivo: number;
  total_gastos_efectivo: number;
  total_abonos_efectivo: number;
  monto_esperado: number;
  monto_real?: number | null;
  diferencia?: number | null;
  notas?: string | null;
  estado: EstadoCaja;
  created_at: string;
  usuario?: Usuario;
}

export interface VentaItem {
  id: string;
  venta_id: string;
  producto_id?: string | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface Venta {
  id: string;
  negocio_id: string;
  numero_folio: string;
  usuario_id: string;
  cliente_id?: string | null;
  sesion_caja_id?: string | null;
  subtotal: number;
  descuento: number;
  total: number;
  medio_pago: MedioPago;
  estado: EstadoVenta;
  notas?: string | null;
  offline_id?: string | null;
  created_at: string;
  items?: VentaItem[];
  cliente?: Cliente | null;
  usuario?: Usuario;
}

export interface CuentaPorCobrar {
  id: string;
  negocio_id: string;
  venta_id?: string | null;
  cliente_id: string;
  monto_total: number;
  saldo_pendiente: number;
  estado: EstadoCuenta;
  fecha_vencimiento?: string | null;
  notas?: string | null;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  venta?: Venta;
}

export interface AbonoCuentaCobrar {
  id: string;
  negocio_id: string;
  cuenta_id: string;
  cliente_id: string;
  usuario_id: string;
  sesion_caja_id?: string | null;
  monto: number;
  medio_pago: MedioPago;
  notas?: string | null;
  created_at: string;
}

export interface Gasto {
  id: string;
  negocio_id: string;
  usuario_id: string;
  proveedor_id?: string | null;
  sesion_caja_id?: string | null;
  categoria: string;
  concepto: string;
  valor: number;
  medio_pago: MedioPago;
  es_credito: boolean;
  comprobante_url?: string | null;
  fecha: string;
  created_at: string;
  proveedor?: Proveedor | null;
  usuario?: Usuario;
}

export interface CuentaPorPagar {
  id: string;
  negocio_id: string;
  gasto_id?: string | null;
  proveedor_id: string;
  monto_total: number;
  saldo_pendiente: number;
  estado: EstadoCuenta;
  fecha_vencimiento?: string | null;
  notas?: string | null;
  created_at: string;
  updated_at: string;
  proveedor?: Proveedor;
  gasto?: Gasto;
}

export interface AbonoCuentaPagar {
  id: string;
  negocio_id: string;
  cuenta_id: string;
  proveedor_id: string;
  usuario_id: string;
  sesion_caja_id?: string | null;
  monto: number;
  medio_pago: MedioPago;
  notas?: string | null;
  created_at: string;
}

// Interfaces de UI y Carrito
export interface ItemCarrito {
  producto_id?: string | null; // null si es venta libre
  nombre: string;
  precio_unitario: number;
  costo_unitario: number;
  cantidad: number;
  stock_disponible?: number;
  imagen_url?: string | null;
}
