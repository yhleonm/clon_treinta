import { z } from 'zod';

export const RolUsuarioSchema = z.enum(['propietario', 'administrador', 'empleado']);
export const MedioPagoSchema = z.enum(['efectivo', 'nequi', 'daviplata', 'tarjeta', 'transferencia', 'credito']);
export const TipoMovimientoInventarioSchema = z.enum(['entrada_compra', 'salida_venta', 'ajuste_manual', 'devolucion', 'merma']);

// Esquema de Producto
export const ProductoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  categoria_id: z.string().uuid('ID de categoría inválido').optional().nullable(),
  precio_venta: z.number().nonnegative('El precio de venta no puede ser negativo'),
  costo: z.number().nonnegative('El costo no puede ser negativo').default(0),
  stock_actual: z.number().default(0),
  stock_minimo: z.number().nonnegative().default(5),
  imagen_url: z.string().url('URL de imagen inválida').optional().nullable().or(z.literal('')),
  activo: z.boolean().default(true),
});

export type ProductoInput = z.infer<typeof ProductoSchema>;

// Esquema de Item de Carrito / Venta
export const ItemVentaSchema = z.object({
  producto_id: z.string().uuid().optional().nullable(),
  nombre: z.string().min(1, 'El nombre del producto es requerido'),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  precio_unitario: z.number().nonnegative('El precio no puede ser negativo'),
  costo_unitario: z.number().nonnegative().default(0),
});

// Esquema de Registro de Venta
export const RegistrarVentaSchema = z.object({
  cliente_id: z.string().uuid().optional().nullable(),
  medio_pago: MedioPagoSchema,
  descuento: z.number().nonnegative().default(0),
  notas: z.string().optional().nullable(),
  sesion_caja_id: z.string().uuid().optional().nullable(),
  items: z.array(ItemVentaSchema).min(1, 'El carrito debe tener al menos un producto'),
});

export type RegistrarVentaInput = z.infer<typeof RegistrarVentaSchema>;

// Esquema de Gasto
export const GastoSchema = z.object({
  categoria: z.string().min(2, 'La categoría es requerida'),
  concepto: z.string().min(3, 'El concepto debe tener al menos 3 caracteres'),
  valor: z.number().positive('El valor del gasto debe ser mayor a 0'),
  medio_pago: MedioPagoSchema,
  es_credito: z.boolean().default(false),
  proveedor_id: z.string().uuid().optional().nullable(),
  fecha: z.string().optional(),
  comprobante_url: z.string().optional().nullable(),
  sesion_caja_id: z.string().uuid().optional().nullable(),
});

export type GastoInput = z.infer<typeof GastoSchema>;

// Esquema de Cliente
export const ClienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  telefono: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  documento: z.string().optional().nullable(),
  limite_credito: z.number().nonnegative().default(0),
});

export type ClienteInput = z.infer<typeof ClienteSchema>;

// Esquema de Proveedor
export const ProveedorSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  contacto: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  nit: z.string().optional().nullable(),
});

export type ProveedorInput = z.infer<typeof ProveedorSchema>;

// Esquema de Apertura de Caja
export const AbrirCajaSchema = z.object({
  monto_inicial: z.number().nonnegative('El monto inicial no puede ser negativo'),
  notas: z.string().optional().nullable(),
});

export type AbrirCajaInput = z.infer<typeof AbrirCajaSchema>;

// Esquema de Cierre de Caja
export const CerrarCajaSchema = z.object({
  monto_real: z.number().nonnegative('El conteo físico de efectivo es requerido'),
  notas: z.string().optional().nullable(),
});

export type CerrarCajaInput = z.infer<typeof CerrarCajaSchema>;

// Esquema de Abono a Cuenta (Cobrar / Pagar)
export const AbonoSchema = z.object({
  cuenta_id: z.string().uuid(),
  monto: z.number().positive('El monto debe ser superior a 0'),
  medio_pago: z.enum(['efectivo', 'nequi', 'daviplata', 'tarjeta', 'transferencia']),
  notas: z.string().optional().nullable(),
  sesion_caja_id: z.string().uuid().optional().nullable(),
});

export type AbonoInput = z.infer<typeof AbonoSchema>;
