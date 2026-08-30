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
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const [
      { data: categorias, error: errCat },
      { data: productos, error: errProd },
      { data: clientes, error: errCli },
      { data: proveedores, error: errProv },
      { data: ventas, error: errVentas },
      { data: gastos, error: errGastos },
      { data: cuentasPorCobrar, error: errCxC },
      { data: cuentasPorPagar, error: errCxP },
      { data: cajaSesiones, error: errCaja },
      { data: usuarios, error: errUsers },
      { data: movimientosInventario, error: errMov }
    ] = await Promise.all([
      supabase.from('categorias').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }),
      supabase.from('productos').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }),
      supabase.from('clientes').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }),
      supabase.from('proveedores').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }),
      supabase.from('ventas').select('*, venta_items(*)').eq('negocio_id', negocioId).order('created_at', { ascending: false }),
      supabase.from('gastos').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }),
      supabase.from('cuentas_por_cobrar').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }),
      supabase.from('cuentas_por_pagar').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }),
      supabase.from('caja_sesiones').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false }),
      supabase.from('usuarios').select('*').eq('negocio_id', negocioId),
      supabase.from('movimientos_inventario').select('*').eq('negocio_id', negocioId).order('created_at', { ascending: false })
    ]);

    if (errCat) console.warn('[Supabase DB] Error loading categorias:', errCat.message);
    if (errProd) console.warn('[Supabase DB] Error loading productos:', errProd.message);
    if (errVentas) console.warn('[Supabase DB] Error loading ventas:', errVentas.message);
    if (errGastos) console.warn('[Supabase DB] Error loading gastos:', errGastos.message);

    return {
      categorias: categorias || [],
      productos: productos || [],
      clientes: clientes || [],
      proveedores: proveedores || [],
      ventas: (ventas || []).map((v: any) => ({
        ...v,
        items: v.venta_items || v.items || []
      })),
      gastos: gastos || [],
      cuentasPorCobrar: cuentasPorCobrar || [],
      cuentasPorPagar: cuentasPorPagar || [],
      cajaSesiones: cajaSesiones || [],
      usuarios: usuarios || [],
      movimientosInventario: movimientosInventario || []
    };
  } catch (error) {
    console.error('[Supabase DB] Error loading business data:', error);
    return null;
  }
}

export async function insertCategoria(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('categorias')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        nombre: data.nombre,
        color_hex: data.color_hex || '#10B981',
        icono: data.icono || 'tag',
        activo: data.activo !== false
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertCategoria:', error.message || error);
    return null;
  }
}

export async function insertProducto(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('productos')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        categoria_id: data.categoria_id || null,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        sku: data.sku || null,
        precio_venta: data.precio_venta,
        costo: data.costo || 0,
        stock_actual: data.stock_actual || 0,
        stock_minimo: data.stock_minimo || 5,
        imagen_url: data.imagen_url || null,
        activo: data.activo !== false
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertProducto:', error.message || error);
    return null;
  }
}

export async function insertCliente(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('clientes')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        nombre: data.nombre,
        telefono: data.telefono || null,
        email: data.email || null,
        documento: data.documento || null,
        saldo_deuda: data.saldo_deuda || 0,
        limite_credito: data.limite_credito || 0,
        activo: data.activo !== false
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertCliente:', error.message || error);
    return null;
  }
}

export async function insertProveedor(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('proveedores')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        nombre: data.nombre,
        contacto: data.contacto || null,
        telefono: data.telefono || null,
        email: data.email || null,
        nit: data.nit || null,
        saldo_deuda: data.saldo_deuda || 0,
        activo: data.activo !== false
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertProveedor:', error.message || error);
    return null;
  }
}

export async function insertGasto(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('gastos')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        usuario_id: data.usuario_id,
        proveedor_id: data.proveedor_id || null,
        sesion_caja_id: data.sesion_caja_id || null,
        categoria: data.categoria,
        concepto: data.concepto,
        valor: data.valor,
        medio_pago: data.medio_pago,
        es_credito: Boolean(data.es_credito),
        fecha: data.fecha || new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertGasto:', error.message || error);
    return null;
  }
}

export async function insertCajaSesion(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('caja_sesiones')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        usuario_id: data.usuario_id,
        fecha_apertura: data.fecha_apertura || new Date().toISOString(),
        fecha_cierre: data.fecha_cierre || null,
        monto_inicial: data.monto_inicial || 0,
        total_ventas_efectivo: data.total_ventas_efectivo || 0,
        total_gastos_efectivo: data.total_gastos_efectivo || 0,
        total_abonos_efectivo: data.total_abonos_efectivo || 0,
        monto_esperado: data.monto_esperado || 0,
        monto_real: data.monto_real || null,
        diferencia: data.diferencia || null,
        estado: data.estado || 'abierta',
        notas: data.notas || null
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertCajaSesion:', error.message || error);
    return null;
  }
}

export async function updateProducto(id: string, data: Partial<any>): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('productos')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error updateProducto:', error.message || error);
    return null;
  }
}

export async function updateCajaSesion(id: string, data: Partial<any>): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('caja_sesiones')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error updateCajaSesion:', error.message || error);
    return null;
  }
}

export async function updateNegocio(id: string, data: Partial<any>): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('negocios')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error updateNegocio:', error.message || error);
    return null;
  }
}

export async function updateUsuario(id: string, data: Partial<any>): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('usuarios')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error updateUsuario:', error.message || error);
    return null;
  }
}

export async function deleteProducto(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('[Supabase DB] Error deleteProducto:', error.message || error);
    return false;
  }
}

export async function deleteCategoria(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('[Supabase DB] Error deleteCategoria:', error.message || error);
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
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    // 1. Try atomic procedure
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
  } catch (rpcError: any) {
    console.warn('[Supabase DB] RPC registrar_venta_atomica failed, falling back to direct table inserts:', rpcError.message);

    // Fallback: Direct table inserts
    try {
      const ventaId = params.offlineId || crypto.randomUUID();
      const { error: errVenta } = await supabase.from('ventas').upsert({
        id: ventaId,
        negocio_id: params.negocioId,
        usuario_id: params.usuarioId,
        cliente_id: params.clienteId || null,
        sesion_caja_id: params.sesionCajaId || null,
        numero_folio: params.numeroFolio,
        subtotal: params.subtotal,
        descuento: params.descuento || 0,
        total: params.total,
        medio_pago: params.medioPago,
        estado: 'completada',
        notas: params.notas || null,
        offline_id: params.offlineId
      }, { onConflict: 'id' });

      if (errVenta) throw errVenta;

      if (params.items && params.items.length > 0) {
        const itemsToInsert = params.items.map((it) => ({
          id: crypto.randomUUID(),
          venta_id: ventaId,
          producto_id: it.producto_id || null,
          nombre_producto: it.nombre,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          costo_unitario: it.costo_unitario || 0,
          subtotal: it.precio_unitario * it.cantidad
        }));

        await supabase.from('venta_items').insert(itemsToInsert);
      }

      return ventaId;
    } catch (fallbackError: any) {
      console.error('[Supabase DB] Fallback sale insert error:', fallbackError.message || fallbackError);
      return null;
    }
  }
}

export async function insertAbonoCxC(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('abonos_cuentas_cobrar')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        cuenta_id: data.cuenta_id,
        cliente_id: data.cliente_id,
        usuario_id: data.usuario_id,
        sesion_caja_id: data.sesion_caja_id || null,
        monto: data.monto,
        medio_pago: data.medio_pago,
        notas: data.notas || null
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertAbonoCxC:', error.message || error);
    return null;
  }
}

export async function insertAbonoCxP(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('abonos_cuentas_pagar')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        cuenta_id: data.cuenta_id,
        proveedor_id: data.proveedor_id,
        usuario_id: data.usuario_id,
        sesion_caja_id: data.sesion_caja_id || null,
        monto: data.monto,
        medio_pago: data.medio_pago,
        notas: data.notas || null
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertAbonoCxP:', error.message || error);
    return null;
  }
}

export async function adjustStock(productoId: string, newStock: number): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('productos')
      .update({ stock_actual: newStock })
      .eq('id', productoId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('[Supabase DB] Error adjustStock:', error.message || error);
    return false;
  }
}

export async function insertMovimientoInventario(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('movimientos_inventario')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        producto_id: data.producto_id,
        usuario_id: data.usuario_id || null,
        tipo: data.tipo,
        cantidad: data.cantidad,
        stock_anterior: data.stock_anterior,
        stock_nuevo: data.stock_nuevo,
        motivo: data.motivo || null,
        referencia_id: data.referencia_id || null
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertMovimientoInventario:', error.message || error);
    return null;
  }
}

export async function insertUsuario(data: any): Promise<any> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data: result, error } = await supabase
      .from('usuarios')
      .upsert({
        id: data.id,
        negocio_id: data.negocio_id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        activo: data.activo !== false
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('[Supabase DB] Error insertUsuario:', error.message || error);
    return null;
  }
}

export async function deleteUsuario(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('[Supabase DB] Error deleteUsuario:', error.message || error);
    return false;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(id?: string | null): boolean {
  return Boolean(id && UUID_REGEX.test(id));
}

/**
 * Pushes all valid local entity collections to Supabase to ensure everything created locally
 * is backed up and immediately accessible from any device. Ignores mock/demo items.
 */
export async function pushAllLocalDataToSupabase(state: {
  negocio: any;
  categorias?: any[];
  productos?: any[];
  clientes?: any[];
  proveedores?: any[];
  gastos?: any[];
  cajaSesion?: any;
  historialCajas?: any[];
  ventas?: any[];
  cuentasPorCobrar?: any[];
  cuentasPorPagar?: any[];
  movimientosInventario?: any[];
}): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || !state?.negocio?.id) return false;

  const negocioId = state.negocio.id;
  // Ignore demo business sync
  if (negocioId === 'neg-triunfo-01' || !isUUID(negocioId)) return true;

  try {
    // 1. Categories
    if (state.categorias && state.categorias.length > 0) {
      for (const cat of state.categorias) {
        if (isUUID(cat.id)) {
          await insertCategoria({ ...cat, negocio_id: negocioId });
        }
      }
    }

    // 2. Clients & Suppliers
    if (state.clientes && state.clientes.length > 0) {
      for (const cli of state.clientes) {
        if (isUUID(cli.id)) {
          await insertCliente({ ...cli, negocio_id: negocioId });
        }
      }
    }
    if (state.proveedores && state.proveedores.length > 0) {
      for (const prov of state.proveedores) {
        if (isUUID(prov.id)) {
          await insertProveedor({ ...prov, negocio_id: negocioId });
        }
      }
    }

    // 3. Products
    if (state.productos && state.productos.length > 0) {
      for (const prod of state.productos) {
        if (isUUID(prod.id)) {
          await insertProducto({ ...prod, negocio_id: negocioId });
        }
      }
    }

    // 4. Cash Sessions
    const allCajas = [
      ...(state.cajaSesion ? [state.cajaSesion] : []),
      ...(state.historialCajas || [])
    ];
    for (const caja of allCajas) {
      if (isUUID(caja.id) && isUUID(caja.usuario_id)) {
        await insertCajaSesion({ ...caja, negocio_id: negocioId });
      }
    }

    // 5. Expenses
    if (state.gastos && state.gastos.length > 0) {
      for (const gasto of state.gastos) {
        if (isUUID(gasto.id) && isUUID(gasto.usuario_id)) {
          await insertGasto({ ...gasto, negocio_id: negocioId });
        }
      }
    }

    // 6. Sales
    if (state.ventas && state.ventas.length > 0) {
      for (const v of state.ventas) {
        if (isUUID(v.id) && isUUID(v.usuario_id)) {
          await supabase.from('ventas').upsert({
            id: v.id,
            negocio_id: negocioId,
            usuario_id: v.usuario_id,
            cliente_id: isUUID(v.cliente_id) ? v.cliente_id : null,
            sesion_caja_id: isUUID(v.sesion_caja_id) ? v.sesion_caja_id : null,
            numero_folio: v.numero_folio,
            subtotal: v.subtotal,
            descuento: v.descuento || 0,
            total: v.total,
            medio_pago: v.medio_pago,
            estado: v.estado || 'completada',
            notas: v.notas || null,
            offline_id: v.offline_id || v.id,
            created_at: v.created_at
          }, { onConflict: 'id' });

          if (v.items && v.items.length > 0) {
            for (const it of v.items) {
              await supabase.from('venta_items').upsert({
                id: isUUID(it.id) ? it.id : crypto.randomUUID(),
                venta_id: v.id,
                producto_id: isUUID(it.producto_id) ? it.producto_id : null,
                nombre_producto: it.nombre_producto || it.nombre || 'Item',
                cantidad: it.cantidad,
                precio_unitario: it.precio_unitario,
                costo_unitario: it.costo_unitario || 0,
                subtotal: it.subtotal || (it.precio_unitario * it.cantidad)
              }, { onConflict: 'id' });
            }
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('[Supabase Sync] Error pushing local data:', error);
    return false;
  }
}

