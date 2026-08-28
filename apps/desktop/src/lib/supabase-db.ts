import { supabase, isSupabaseConfigured } from './supabase';

export interface BusinessData {
  categorias: any[];
  productos: any[];
  clientes: any[];
  proveedores: any[];
  ventas: any[];
  gastos: any[];
  cuentasPorCobrar: any[];
  cuentasPorPagar: any[];
  cajaSesiones: any[];
  usuarios: any[];
  movimientosInventario: any[];
}

export async function loadBusinessData(negocioId: string): Promise<BusinessData | null> {
  if (!supabase) return null;

  try {
    const [
      { data: categorias },
      { data: productos },
      { data: clientes },
      { data: proveedores },
      { data: ventas },
      { data: gastos },
      { data: cuentasPorCobrar },
      { data: cuentasPorPagar },
      { data: cajaSesiones },
      { data: usuarios },
      { data: movimientosInventario }
    ] = await Promise.all([
      supabase.from('categorias').select('*').eq('negocio_id', negocioId),
      supabase.from('productos').select('*').eq('negocio_id', negocioId),
      supabase.from('clientes').select('*').eq('negocio_id', negocioId),
      supabase.from('proveedores').select('*').eq('negocio_id', negocioId),
      supabase.from('ventas').select('*, venta_items(*)').eq('negocio_id', negocioId),
      supabase.from('gastos').select('*').eq('negocio_id', negocioId),
      supabase.from('cuentas_por_cobrar').select('*').eq('negocio_id', negocioId),
      supabase.from('cuentas_por_pagar').select('*').eq('negocio_id', negocioId),
      supabase.from('caja_sesiones').select('*').eq('negocio_id', negocioId),
      supabase.from('usuarios').select('*').eq('negocio_id', negocioId),
      supabase.from('movimientos_inventario').select('*').eq('negocio_id', negocioId)
    ]);

    return {
      categorias: categorias || [],
      productos: productos || [],
      clientes: clientes || [],
      proveedores: proveedores || [],
      ventas: ventas || [],
      gastos: gastos || [],
      cuentasPorCobrar: cuentasPorCobrar || [],
      cuentasPorPagar: cuentasPorPagar || [],
      cajaSesiones: cajaSesiones || [],
      usuarios: usuarios || [],
      movimientosInventario: movimientosInventario || []
    };
  } catch (error) {
    console.error('Error loading business data:', error);
    return null;
  }
}

export async function insertCategoria(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('categorias').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertCategoria:', error);
    return null;
  }
}

export async function insertProducto(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('productos').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertProducto:', error);
    return null;
  }
}

export async function insertCliente(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('clientes').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertCliente:', error);
    return null;
  }
}

export async function insertProveedor(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('proveedores').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertProveedor:', error);
    return null;
  }
}

export async function insertGasto(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('gastos').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertGasto:', error);
    return null;
  }
}

export async function insertCajaSesion(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('caja_sesiones').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertCajaSesion:', error);
    return null;
  }
}

export async function updateProducto(id: string, data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('productos').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error updateProducto:', error);
    return null;
  }
}

export async function updateCajaSesion(id: string, data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('caja_sesiones').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error updateCajaSesion:', error);
    return null;
  }
}

export async function updateNegocio(id: string, data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('negocios').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error updateNegocio:', error);
    return null;
  }
}

export async function updateUsuario(id: string, data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('usuarios').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error updateUsuario:', error);
    return null;
  }
}

export async function deleteProducto(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleteProducto:', error);
    return false;
  }
}

export async function deleteCategoria(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleteCategoria:', error);
    return false;
  }
}

export async function registrarVentaAtomicaRPC(params: {
  negocioId: string;
  usuarioId: string;
  clienteId: string | null;
  numeroFolio: string;
  subtotal: number;
  descuento: number;
  total: number;
  medioPago: string;
  sesionCajaId: string | null;
  notas: string | null;
  offlineId: string | null;
  items: Array<{ producto_id: string | null; nombre: string; cantidad: number; precio_unitario: number; costo_unitario: number }>;
}): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('registrar_venta_atomica', {
      p_negocio_id: params.negocioId,
      p_usuario_id: params.usuarioId,
      p_cliente_id: params.clienteId,
      p_numero_folio: params.numeroFolio,
      p_subtotal: params.subtotal,
      p_descuento: params.descuento,
      p_total: params.total,
      p_medio_pago: params.medioPago,
      p_sesion_caja_id: params.sesionCajaId,
      p_notas: params.notas,
      p_offline_id: params.offlineId,
      p_items: params.items
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error registrarVentaAtomicaRPC:', error);
    return null;
  }
}

export async function insertAbonoCxC(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('abonos_cuentas_cobrar').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertAbonoCxC:', error);
    return null;
  }
}

export async function insertAbonoCxP(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('abonos_cuentas_pagar').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertAbonoCxP:', error);
    return null;
  }
}

export async function adjustStock(productoId: string, newStock: number): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('productos').update({ stock_actual: newStock }).eq('id', productoId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adjustStock:', error);
    return false;
  }
}

export async function insertMovimientoInventario(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('movimientos_inventario').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertMovimientoInventario:', error);
    return null;
  }
}

export async function insertUsuario(data: Partial<any>): Promise<any> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase.from('usuarios').insert(data).select().single();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error insertUsuario:', error);
    return null;
  }
}

export async function deleteUsuario(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleteUsuario:', error);
    return false;
  }
}
