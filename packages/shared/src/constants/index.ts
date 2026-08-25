import { MedioPago, RolUsuario, TipoMovimientoInventario } from '../types';

export const MEDIOS_DE_PAGO: { id: MedioPago; label: string; icono: string; color: string }[] = [
  { id: 'efectivo', label: 'Efectivo', icono: 'banknote', color: '#10B981' },
  { id: 'nequi', label: 'Nequi', icono: 'smartphone', color: '#7828C8' },
  { id: 'daviplata', label: 'Daviplata', icono: 'smartphone', color: '#EE3124' },
  { id: 'transferencia', label: 'Transferencia Bancaria', icono: 'building-2', color: '#3B82F6' },
  { id: 'tarjeta', label: 'Tarjeta Débito / Crédito', icono: 'credit-card', color: '#6366F1' },
  { id: 'credito', label: 'Fiado / Por Cobrar', icono: 'clock', color: '#F59E0B' },
];

export const ROLES_USUARIO: { id: RolUsuario; label: string; descripcion: string }[] = [
  { id: 'propietario', label: 'Propietario', descripcion: 'Acceso total y configuración del negocio' },
  { id: 'administrador', label: 'Administrador', descripcion: 'Gestión de inventario, ventas, gastos y balances' },
  { id: 'empleado', label: 'Empleado / Cajero', descripcion: 'Solo ventas (POS) y consulta de catálogo' },
];

export const CATEGORIAS_GASTO_DEFAULT = [
  'Compra de Mercancía / Inventario',
  'Servicios Públicos (Luz, Agua, Gas, Internet)',
  'Arriendo / Alquiler del Local',
  'Nómina / Salarios / Comisiones',
  'Mantenimiento y Reparaciones',
  'Transporte y Domicilios',
  'Impuestos y Tasas',
  'Publicidad y Marketing',
  'Otros Gastos Operativos',
];

export const TIPOS_MOVIMIENTO_INVENTARIO: { id: TipoMovimientoInventario; label: string; signo: '+' | '-' }[] = [
  { id: 'entrada_compra', label: 'Entrada por Compra', signo: '+' },
  { id: 'salida_venta', label: 'Salida por Venta', signo: '-' },
  { id: 'ajuste_manual', label: 'Ajuste Manual de Inventario', signo: '+' },
  { id: 'devolucion', label: 'Devolución de Cliente', signo: '+' },
  { id: 'merma', label: 'Merma / Producto Dañado o Vencido', signo: '-' },
];
