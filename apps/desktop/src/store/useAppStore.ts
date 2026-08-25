import { create } from 'zustand';
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
  ItemCarrito,
  MedioPago,
  RolUsuario,
  EstadoCuenta,
  PermisosEmpleado,
  PERMISOS_DEFAULT_ADMIN,
  PERMISOS_DEFAULT_VENDEDOR,
  generateFolio,
  AbonoCuentaCobrar,
  AbonoCuentaPagar,
  MovimientoInventario,
} from '@treinta/shared';
import {
  INITIAL_NEGOCIO,
  INITIAL_USUARIOS,
  INITIAL_CATEGORIAS,
  INITIAL_PRODUCTOS,
  INITIAL_CLIENTES,
  INITIAL_PROVEEDORES,
  INITIAL_CAJA,
  INITIAL_VENTAS,
  INITIAL_GASTOS,
  INITIAL_CXC,
  INITIAL_CXP,
} from '../lib/mock-data';

interface AppState {
  // Configuración de Sesión y Negocio
  isAuthenticated: boolean;
  negocio: Negocio;
  usuarioActual: Usuario;
  usuarios: Usuario[];
  login: (emailOrPhone: string, pass: string) => { success: boolean; error?: string };
  registerBusiness: (businessName: string, ownerName: string, email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  demoLogin: (userId: string) => void;
  loadDemoBusiness: () => void;
  setUsuarioActual: (usuario: Usuario) => void;
  cambiarRol: (rol: RolUsuario) => void;
  actualizarNegocio: (datos: Partial<Negocio>) => void;
  actualizarPerfilUsuario: (datos: { nombre?: string; email?: string; telefono?: string | null; password?: string }) => void;
  agregarEmpleado: (datos: { nombre: string; telefono?: string; password?: string; rol: RolUsuario; permisos?: PermisosEmpleado }) => void;
  editarEmpleado: (id: string, datos: Partial<Usuario>) => void;
  eliminarEmpleado: (id: string) => void;

  // Catálogo e Inventario
  categorias: Categoria[];
  agregarCategoria: (nombre: string, colorHex?: string) => Categoria;
  eliminarCategoria: (id: string) => void;
  productos: Producto[];
  agregarProducto: (producto: Omit<Producto, 'id' | 'negocio_id' | 'created_at' | 'updated_at'>) => void;
  editarProducto: (id: string, datos: Partial<Producto>) => void;
  eliminarProducto: (id: string) => void;
  ajustarStock: (productoId: string, cantidad: number, motivo: string) => void;

  // Carrito de Ventas (POS)
  carrito: ItemCarrito[];
  agregarAlCarrito: (producto: Producto) => void;
  agregarVentaLibreAlCarrito: (nombre: string, precio: number, cantidad: number) => void;
  actualizarCantidadCarrito: (index: number, cantidad: number) => void;
  eliminarItemCarrito: (index: number) => void;
  vaciarCarrito: () => void;

  // Procesamiento de Ventas
  ventas: Venta[];
  registrarVenta: (params: {
    clienteId?: string | null;
    medioPago: MedioPago;
    descuento?: number;
    notas?: string;
  }) => { success: boolean; venta?: Venta; error?: string };

  // Gastos
  gastos: Gasto[];
  registrarGasto: (params: {
    categoria: string;
    concepto: string;
    valor: number;
    medioPago: MedioPago;
    esCredito: boolean;
    proveedorId?: string | null;
    fecha?: string;
  }) => void;

  // Cuentas por Cobrar (Clientes)
  cuentasPorCobrar: CuentaPorCobrar[];
  abonosCxC: AbonoCuentaCobrar[];
  registrarAbonoCxC: (cuentaId: string, monto: number, medioPago: MedioPago, notas?: string) => void;

  // Cuentas por Pagar (Proveedores)
  cuentasPorPagar: CuentaPorPagar[];
  abonosCxP: AbonoCuentaPagar[];
  registrarAbonoCxP: (cuentaId: string, monto: number, medioPago: MedioPago, notas?: string) => void;

  // Contactos
  clientes: Cliente[];
  proveedores: Proveedor[];
  agregarCliente: (cliente: Omit<Cliente, 'id' | 'negocio_id' | 'saldo_deuda' | 'created_at' | 'activo'>) => void;
  agregarProveedor: (proveedor: Omit<Proveedor, 'id' | 'negocio_id' | 'saldo_deuda' | 'created_at' | 'activo'>) => void;

  // Caja / Turno
  cajaSesion: CajaSesion | null;
  historialCajas: CajaSesion[];
  abrirCaja: (montoInicial: number, notas?: string) => void;
  cerrarCaja: (montoReal: number, notas?: string) => void;

  // Movimientos de Inventario (Kardex)
  movimientosInventario: MovimientoInventario[];

  // Filtro de Balance
  periodoBalance: 'hoy' | 'semana' | 'mes' | 'todo';
  setPeriodoBalance: (periodo: 'hoy' | 'semana' | 'mes' | 'todo') => void;
}

const STORAGE_KEY = 'treinta_app_state_v1';

// Cargar estado inicial desde localStorage si existe
const loadPersistedState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up / sanitize legacy state:
      // If business is NOT demo business, purge any mock users (Jackeline/Manolo) that might have been accidentally saved into it
      if (parsed.negocio && parsed.usuarios) {
        if (parsed.negocio.id !== INITIAL_NEGOCIO.id) {
          parsed.usuarios = parsed.usuarios.filter(
            (u: any) =>
              u.id !== 'u-jackeline' &&
              u.id !== 'u-manolo' &&
              (u.negocio_id === parsed.negocio.id || !u.negocio_id)
          );
          if (
            parsed.usuarioActual &&
            (parsed.usuarioActual.id === 'u-jackeline' || parsed.usuarioActual.id === 'u-manolo')
          ) {
            parsed.usuarioActual = parsed.usuarios[0] || null;
            parsed.isAuthenticated = false;
          }
        }
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading persisted state:', e);
  }
  return null;
};

const savedState = loadPersistedState();

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: savedState?.isAuthenticated ?? false, // default false — require login on first visit
  negocio: savedState?.negocio || INITIAL_NEGOCIO,
  usuarioActual: savedState?.usuarioActual || INITIAL_USUARIOS[0]!,
  usuarios: savedState?.usuarios || INITIAL_USUARIOS,

  login: (emailOrPhone, pass) => {
    const state = get();
    const query = emailOrPhone.trim().toLowerCase();
    const cleanPhone = query.replace(/\D/g, '');
    const isPhone = cleanPhone.length >= 7;

    // Only search in valid users of the active business
    const validUsers = state.usuarios.filter(
      (u) =>
        state.negocio.id === INITIAL_NEGOCIO.id ||
        (u.id !== 'u-jackeline' && u.id !== 'u-manolo')
    );

    const found = validUsers.find((u) => {
      const emailMatch = u.email.toLowerCase() === query;
      const nameMatch = u.nombre.toLowerCase() === query;
      const phoneMatch = isPhone && u.telefono
        ? u.telefono.replace(/\D/g, '').endsWith(cleanPhone) || u.telefono.replace(/\D/g, '') === cleanPhone
        : false;
      return emailMatch || nameMatch || phoneMatch;
    });

    if (!found) {
      return {
        success: false,
        error: `Usuario no encontrado en el negocio "${state.negocio.nombre}".`,
      };
    }

    // Verificar contraseña: demo users aceptan PIN '1234', registered users usan su password
    const storedPass = (found as any).password || '1234';
    if (pass.trim() !== storedPass) {
      return {
        success: false,
        error: 'Contraseña o PIN incorrectos.',
      };
    }

    set({ usuarioActual: found, isAuthenticated: true });
    saveState();
    return { success: true };
  },

  registerBusiness: (businessName, ownerName, email, pass) => {
    const negocioId = 'neg-' + Date.now();
    const nuevoNegocio: Negocio = {
      id: negocioId,
      nombre: businessName.trim(),
      moneda: 'COP',
      simbolo_moneda: '$',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const propietario: Usuario = {
      id: 'u-owner-' + Date.now(),
      negocio_id: negocioId,
      nombre: ownerName.trim(),
      email: email.trim().toLowerCase(),
      password: pass.trim() || '1234',
      rol: 'propietario',
      permisos: PERMISOS_DEFAULT_ADMIN,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({
      negocio: nuevoNegocio,
      usuarioActual: propietario,
      usuarios: [propietario],
      isAuthenticated: true,
      // Reset all business data for the new negocio
      categorias: [],
      productos: [],
      ventas: [],
      gastos: [],
      carrito: [],
      clientes: [],
      proveedores: [],
      cuentasPorCobrar: [],
      cuentasPorPagar: [],
      abonosCxC: [],
      abonosCxP: [],
      cajaSesion: null,
      historialCajas: [],
      movimientosInventario: [],
    });
    saveState();
    return { success: true };
  },

  logout: () => {
    set({ isAuthenticated: false });
    saveState();
  },

  loadDemoBusiness: () => {
    set({
      negocio: INITIAL_NEGOCIO,
      usuarioActual: INITIAL_USUARIOS[0]!,
      usuarios: INITIAL_USUARIOS,
      categorias: INITIAL_CATEGORIAS,
      productos: INITIAL_PRODUCTOS,
      ventas: INITIAL_VENTAS,
      gastos: INITIAL_GASTOS,
      cuentasPorCobrar: INITIAL_CXC,
      cuentasPorPagar: INITIAL_CXP,
      abonosCxC: [],
      abonosCxP: [],
      cajaSesion: INITIAL_CAJA,
      historialCajas: [],
      movimientosInventario: [],
      isAuthenticated: false,
    });
    saveState();
  },

  demoLogin: (userId) => {
    const state = get();
    const isDemoBusiness = state.negocio.id === INITIAL_NEGOCIO.id;
    const targetUser = INITIAL_USUARIOS.find((u) => u.id === userId) || INITIAL_USUARIOS[0]!;

    if (!isDemoBusiness) {
      // Switch workspace to Demo Store
      set({
        negocio: INITIAL_NEGOCIO,
        usuarioActual: targetUser,
        usuarios: INITIAL_USUARIOS,
        categorias: INITIAL_CATEGORIAS,
        productos: INITIAL_PRODUCTOS,
        ventas: INITIAL_VENTAS,
        gastos: INITIAL_GASTOS,
        cuentasPorCobrar: INITIAL_CXC,
        cuentasPorPagar: INITIAL_CXP,
        abonosCxC: [],
        abonosCxP: [],
        cajaSesion: INITIAL_CAJA,
        historialCajas: [],
        movimientosInventario: [],
        isAuthenticated: true,
      });
    } else {
      set({
        usuarioActual: targetUser,
        isAuthenticated: true,
      });
    }
    saveState();
  },

  setUsuarioActual: (usuario) => {
    set({ usuarioActual: usuario });
    saveState();
  },

  cambiarRol: (rol) => {
    set((state) => ({
      usuarioActual: { ...state.usuarioActual, rol },
    }));
    saveState();
  },

  actualizarNegocio: (datos) => {
    set((state) => ({
      negocio: {
        ...state.negocio,
        ...datos,
        updated_at: new Date().toISOString(),
      },
    }));
    saveState();
  },

  actualizarPerfilUsuario: (datos) => {
    set((state) => {
      const updatedUser = {
        ...state.usuarioActual,
        ...datos,
        updated_at: new Date().toISOString(),
      };
      return {
        usuarioActual: updatedUser,
        usuarios: state.usuarios.map((u) =>
          u.id === updatedUser.id ? updatedUser : u
        ),
      };
    });
    saveState();
  },

  agregarEmpleado: ({ nombre, telefono, password, rol, permisos }) => {
    const state = get();
    const defaultPerms = rol === 'administrador' ? PERMISOS_DEFAULT_ADMIN : PERMISOS_DEFAULT_VENDEDOR;
    const cleanNombre = nombre.trim().toLowerCase().replace(/\s+/g, '');
    const cleanNegocio = state.negocio.nombre.trim().toLowerCase().replace(/\s+/g, '');
    const nuevo: Usuario = {
      id: 'u-' + Date.now(),
      negocio_id: state.negocio.id,
      nombre: nombre.trim(),
      email: `${cleanNombre}@${cleanNegocio || 'negocio'}.com`,
      telefono: telefono || null,
      password: password ? password.trim() : '1234',
      rol,
      permisos: permisos || defaultPerms,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((s) => ({ usuarios: [...s.usuarios, nuevo] }));
    saveState();
  },

  editarEmpleado: (id, datos) => {
    set((s) => ({
      usuarios: s.usuarios.map((u) =>
        u.id === id ? { ...u, ...datos, updated_at: new Date().toISOString() } : u
      ),
      usuarioActual:
        s.usuarioActual.id === id
          ? { ...s.usuarioActual, ...datos, updated_at: new Date().toISOString() }
          : s.usuarioActual,
    }));
    saveState();
  },

  eliminarEmpleado: (id) => {
    set((s) => ({
      usuarios: s.usuarios.filter((u) => u.id !== id),
    }));
    saveState();
  },

  categorias: savedState?.categorias || INITIAL_CATEGORIAS,
  agregarCategoria: (nombre: string, colorHex: string = '#10B981') => {
    const nueva: Categoria = {
      id: 'cat-' + Date.now(),
      negocio_id: get().negocio.id,
      nombre: nombre.trim(),
      color_hex: colorHex,
      icono: 'tag',
      activo: true,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ categorias: [...s.categorias, nueva] }));
    saveState();
    return nueva;
  },

  eliminarCategoria: (id: string) => {
    set((s) => ({
      categorias: s.categorias.filter((c) => c.id !== id),
    }));
    saveState();
  },

  productos: savedState?.productos || INITIAL_PRODUCTOS,

  agregarProducto: (prodData) => {
    const state = get();
    const nuevo: Producto = {
      ...prodData,
      id: 'p-' + Date.now(),
      negocio_id: state.negocio.id,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((s) => ({ productos: [nuevo, ...s.productos] }));
    saveState();
  },

  editarProducto: (id, datos) => {
    set((s) => ({
      productos: s.productos.map((p) =>
        p.id === id ? { ...p, ...datos, updated_at: new Date().toISOString() } : p
      ),
    }));
    saveState();
  },

  eliminarProducto: (id) => {
    set((s) => ({
      productos: s.productos.filter((p) => p.id !== id),
    }));
    saveState();
  },

  movimientosInventario: savedState?.movimientosInventario || [],

  ajustarStock: (productoId, cantidad, motivo) => {
    set((s) => {
      const prod = s.productos.find((p) => p.id === productoId);
      if (!prod) return s;
      const nuevoStock = prod.stock_actual + cantidad;
      const nuevoMov: MovimientoInventario = {
        id: 'mov-' + Date.now(),
        negocio_id: s.negocio.id,
        producto_id: productoId,
        usuario_id: s.usuarioActual.id,
        tipo: cantidad >= 0 ? 'ajuste_manual' : 'merma',
        cantidad: Math.abs(cantidad),
        stock_anterior: prod.stock_actual,
        stock_nuevo: nuevoStock,
        motivo: motivo || 'Ajuste manual de inventario',
        created_at: new Date().toISOString(),
        producto: prod,
        usuario: s.usuarioActual,
      };

      return {
        productos: s.productos.map((p) =>
          p.id === productoId
            ? { ...p, stock_actual: nuevoStock, updated_at: new Date().toISOString() }
            : p
        ),
        movimientosInventario: [nuevoMov, ...(s.movimientosInventario || [])],
      };
    });
    saveState();
  },

  // CARRITO
  carrito: [],

  agregarAlCarrito: (producto) => {
    set((s) => {
      const existingIndex = s.carrito.findIndex((item) => item.producto_id === producto.id);
      if (existingIndex > -1) {
        const updated = [...s.carrito];
        const current = updated[existingIndex]!;
        updated[existingIndex] = {
          ...current,
          cantidad: current.cantidad + 1,
        };
        return { carrito: updated };
      } else {
        const newItem: ItemCarrito = {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio_unitario: producto.precio_venta,
          costo_unitario: producto.costo,
          cantidad: 1,
          stock_disponible: producto.stock_actual,
          imagen_url: producto.imagen_url,
        };
        return { carrito: [...s.carrito, newItem] };
      }
    });
  },

  agregarVentaLibreAlCarrito: (nombre, precio, cantidad) => {
    set((s) => ({
      carrito: [
        ...s.carrito,
        {
          producto_id: null,
          nombre: nombre || 'Producto libre',
          precio_unitario: precio,
          costo_unitario: 0,
          cantidad: cantidad || 1,
        },
      ],
    }));
  },

  actualizarCantidadCarrito: (index, cantidad) => {
    set((s) => {
      if (cantidad <= 0) {
        return { carrito: s.carrito.filter((_, i) => i !== index) };
      }
      const updated = [...s.carrito];
      if (updated[index]) {
        updated[index] = { ...updated[index]!, cantidad };
      }
      return { carrito: updated };
    });
  },

  eliminarItemCarrito: (index) => {
    set((s) => ({
      carrito: s.carrito.filter((_, i) => i !== index),
    }));
  },

  vaciarCarrito: () => {
    set({ carrito: [] });
  },

  // VENTAS
  ventas: savedState?.ventas || INITIAL_VENTAS,

  registrarVenta: ({ clienteId, medioPago, descuento = 0, notas }) => {
    const state = get();
    if (state.carrito.length === 0) {
      return { success: false, error: 'El carrito está vacío' };
    }

    // BUG-07: Prevent credit sales without selecting a client
    if (medioPago === 'credito' && !clienteId) {
      return { success: false, error: 'Debe seleccionar un cliente para ventas a crédito (fiado).' };
    }

    const subtotal = state.carrito.reduce(
      (sum, item) => sum + item.precio_unitario * item.cantidad,
      0
    );
    const total = Math.max(0, subtotal - descuento);
    const folio = generateFolio('V');
    const ventaId = 'v-' + Date.now();

    const ventaItems = state.carrito.map((item, idx) => ({
      id: `vi-${Date.now()}-${idx}`,
      venta_id: ventaId,
      producto_id: item.producto_id,
      nombre_producto: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      costo_unitario: item.costo_unitario,
      subtotal: item.precio_unitario * item.cantidad,
      created_at: new Date().toISOString(),
    }));

    const nuevaVenta: Venta = {
      id: ventaId,
      negocio_id: state.negocio.id,
      numero_folio: folio,
      usuario_id: state.usuarioActual.id,
      cliente_id: clienteId || null,
      sesion_caja_id: state.cajaSesion?.id || null,
      subtotal,
      descuento,
      total,
      medio_pago: medioPago,
      estado: 'completada',
      notas,
      created_at: new Date().toISOString(),
      items: ventaItems,
      cliente: state.clientes.find((c) => c.id === clienteId) || null,
      usuario: state.usuarioActual,
    };

    // 1. Descontar stock de productos
    const productosActualizados = state.productos.map((prod) => {
      const itemEnVenta = state.carrito.find((i) => i.producto_id === prod.id);
      if (itemEnVenta) {
        return {
          ...prod,
          stock_actual: prod.stock_actual - itemEnVenta.cantidad,
          updated_at: new Date().toISOString(),
        };
      }
      return prod;
    });

    // 2. Si es efectivo y hay caja abierta, actualizar totales de caja
    let cajaActualizada = state.cajaSesion;
    if (medioPago === 'efectivo' && cajaActualizada && cajaActualizada.estado === 'abierta') {
      cajaActualizada = {
        ...cajaActualizada,
        total_ventas_efectivo: cajaActualizada.total_ventas_efectivo + total,
        monto_esperado: cajaActualizada.monto_esperado + total,
      };
    }

    // 3. Si es a crédito ("fiado") y hay cliente, crear cuenta por cobrar
    let nuevasCxC = state.cuentasPorCobrar;
    let clientesActualizados = state.clientes;
    if (medioPago === 'credito' && clienteId) {
      const nuevaCxC: CuentaPorCobrar = {
        id: 'cxc-' + Date.now(),
        negocio_id: state.negocio.id,
        venta_id: ventaId,
        cliente_id: clienteId,
        monto_total: total,
        saldo_pendiente: total,
        estado: 'pendiente',
        fecha_vencimiento: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
        notas: `Crédito originado en venta #${folio}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cliente: state.clientes.find((c) => c.id === clienteId),
        venta: nuevaVenta,
      };
      nuevasCxC = [nuevaCxC, ...nuevasCxC];

      clientesActualizados = clientesActualizados.map((c) =>
        c.id === clienteId ? { ...c, saldo_deuda: c.saldo_deuda + total } : c
      );
    }

    set({
      ventas: [nuevaVenta, ...state.ventas],
      productos: productosActualizados,
      cajaSesion: cajaActualizada,
      cuentasPorCobrar: nuevasCxC,
      clientes: clientesActualizados,
      carrito: [], // Limpiar carrito
    });

    saveState();
    return { success: true, venta: nuevaVenta };
  },

  // GASTOS
  gastos: savedState?.gastos || INITIAL_GASTOS,

  registrarGasto: ({ categoria, concepto, valor, medioPago, esCredito, proveedorId, fecha }) => {
    const state = get();
    const gastoId = 'g-' + Date.now();
    const nuevoGasto: Gasto = {
      id: gastoId,
      negocio_id: state.negocio.id,
      usuario_id: state.usuarioActual.id,
      proveedor_id: proveedorId || null,
      sesion_caja_id: state.cajaSesion?.id || null,
      categoria,
      concepto,
      valor,
      medio_pago: medioPago,
      es_credito: esCredito,
      fecha: fecha || new Date().toISOString(),
      created_at: new Date().toISOString(),
      proveedor: state.proveedores.find((p) => p.id === proveedorId) || null,
      usuario: state.usuarioActual,
    };

    // Actualizar caja si fue en efectivo
    let cajaActualizada = state.cajaSesion;
    if (medioPago === 'efectivo' && cajaActualizada && cajaActualizada.estado === 'abierta') {
      cajaActualizada = {
        ...cajaActualizada,
        total_gastos_efectivo: cajaActualizada.total_gastos_efectivo + valor,
        monto_esperado: cajaActualizada.monto_esperado - valor,
      };
    }

    // Crear cuenta por pagar si fue a crédito con proveedor
    let nuevasCxP = state.cuentasPorPagar;
    let proveedoresActualizados = state.proveedores;
    if (esCredito && proveedorId) {
      const nuevaCxP: CuentaPorPagar = {
        id: 'cxp-' + Date.now(),
        negocio_id: state.negocio.id,
        gasto_id: gastoId,
        proveedor_id: proveedorId,
        monto_total: valor,
        saldo_pendiente: valor,
        estado: 'pendiente',
        fecha_vencimiento: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
        notas: `Gasto a crédito: ${concepto}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        proveedor: state.proveedores.find((p) => p.id === proveedorId),
        gasto: nuevoGasto,
      };
      nuevasCxP = [nuevaCxP, ...nuevasCxP];

      proveedoresActualizados = proveedoresActualizados.map((p) =>
        p.id === proveedorId ? { ...p, saldo_deuda: p.saldo_deuda + valor } : p
      );
    }

    set({
      gastos: [nuevoGasto, ...state.gastos],
      cajaSesion: cajaActualizada,
      cuentasPorPagar: nuevasCxP,
      proveedores: proveedoresActualizados,
    });

    saveState();
  },

  // CUENTAS POR COBRAR (ABONOS)
  cuentasPorCobrar: savedState?.cuentasPorCobrar || INITIAL_CXC,
  abonosCxC: savedState?.abonosCxC || [],

  registrarAbonoCxC: (cuentaId, monto, medioPago, notas) => {
    const state = get();
    const cxc = state.cuentasPorCobrar.find((c) => c.id === cuentaId);
    if (!cxc) return;

    const abonoId = 'abcxc-' + Date.now();
    const nuevoAbono: AbonoCuentaCobrar = {
      id: abonoId,
      negocio_id: state.negocio.id,
      cuenta_id: cuentaId,
      cliente_id: cxc.cliente_id,
      usuario_id: state.usuarioActual.id,
      sesion_caja_id: state.cajaSesion?.id || null,
      monto,
      medio_pago: medioPago,
      notas,
      created_at: new Date().toISOString(),
    };

    const nuevoSaldo = Math.max(0, cxc.saldo_pendiente - monto);
    const nuevoEstado: EstadoCuenta = nuevoSaldo === 0 ? 'pagada' : 'parcial';

    const cxcActualizadas = state.cuentasPorCobrar.map((c) =>
      c.id === cuentaId
        ? { ...c, saldo_pendiente: nuevoSaldo, estado: nuevoEstado, updated_at: new Date().toISOString() }
        : c
    );

    const clientesActualizados = state.clientes.map((cl) =>
      cl.id === cxc.cliente_id
        ? { ...cl, saldo_deuda: Math.max(0, cl.saldo_deuda - monto) }
        : cl
    );

    let cajaActualizada = state.cajaSesion;
    if (medioPago === 'efectivo' && cajaActualizada && cajaActualizada.estado === 'abierta') {
      cajaActualizada = {
        ...cajaActualizada,
        total_abonos_efectivo: cajaActualizada.total_abonos_efectivo + monto,
        monto_esperado: cajaActualizada.monto_esperado + monto,
      };
    }

    set({
      cuentasPorCobrar: cxcActualizadas,
      abonosCxC: [nuevoAbono, ...state.abonosCxC],
      clientes: clientesActualizados,
      cajaSesion: cajaActualizada,
    });

    saveState();
  },

  // CUENTAS POR PAGAR (ABONOS)
  cuentasPorPagar: savedState?.cuentasPorPagar || INITIAL_CXP,
  abonosCxP: savedState?.abonosCxP || [],

  registrarAbonoCxP: (cuentaId, monto, medioPago, notas) => {
    const state = get();
    const cxp = state.cuentasPorPagar.find((c) => c.id === cuentaId);
    if (!cxp) return;

    const abonoId = 'abcxp-' + Date.now();
    const nuevoAbono: AbonoCuentaPagar = {
      id: abonoId,
      negocio_id: state.negocio.id,
      cuenta_id: cuentaId,
      proveedor_id: cxp.proveedor_id,
      usuario_id: state.usuarioActual.id,
      sesion_caja_id: state.cajaSesion?.id || null,
      monto,
      medio_pago: medioPago,
      notas,
      created_at: new Date().toISOString(),
    };

    const nuevoSaldo = Math.max(0, cxp.saldo_pendiente - monto);
    const nuevoEstado: EstadoCuenta = nuevoSaldo === 0 ? 'pagada' : 'parcial';

    const cxpActualizadas = state.cuentasPorPagar.map((c) =>
      c.id === cuentaId
        ? { ...c, saldo_pendiente: nuevoSaldo, estado: nuevoEstado, updated_at: new Date().toISOString() }
        : c
    );

    const proveedoresActualizados = state.proveedores.map((pr) =>
      pr.id === cxp.proveedor_id
        ? { ...pr, saldo_deuda: Math.max(0, pr.saldo_deuda - monto) }
        : pr
    );

    let cajaActualizada = state.cajaSesion;
    if (medioPago === 'efectivo' && cajaActualizada && cajaActualizada.estado === 'abierta') {
      cajaActualizada = {
        ...cajaActualizada,
        total_gastos_efectivo: cajaActualizada.total_gastos_efectivo + monto,
        monto_esperado: cajaActualizada.monto_esperado - monto,
      };
    }

    set({
      cuentasPorPagar: cxpActualizadas,
      abonosCxP: [nuevoAbono, ...state.abonosCxP],
      proveedores: proveedoresActualizados,
      cajaSesion: cajaActualizada,
    });

    saveState();
  },

  // CLIENTES Y PROVEEDORES
  clientes: savedState?.clientes || INITIAL_CLIENTES,
  proveedores: savedState?.proveedores || INITIAL_PROVEEDORES,

  agregarCliente: (data) => {
    const nuevo: Cliente = {
      ...data,
      id: 'cl-' + Date.now(),
      negocio_id: get().negocio.id,
      saldo_deuda: 0,
      activo: true,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ clientes: [nuevo, ...s.clientes] }));
    saveState();
  },

  agregarProveedor: (data) => {
    const nuevo: Proveedor = {
      ...data,
      id: 'pr-' + Date.now(),
      negocio_id: get().negocio.id,
      saldo_deuda: 0,
      activo: true,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ proveedores: [nuevo, ...s.proveedores] }));
    saveState();
  },

  // CAJA SESIONES
  cajaSesion: savedState?.cajaSesion || INITIAL_CAJA,

  abrirCaja: (montoInicial, notas) => {
    const state = get();

    // BUG-08: Prevent overwriting an active cash register session
    if (state.cajaSesion && state.cajaSesion.estado === 'abierta') {
      return; // Caja already open — must close it first
    }

    const nuevaCaja: CajaSesion = {
      id: 'caja-' + Date.now(),
      negocio_id: state.negocio.id,
      usuario_id: state.usuarioActual.id,
      fecha_apertura: new Date().toISOString(),
      monto_inicial: montoInicial,
      total_ventas_efectivo: 0,
      total_gastos_efectivo: 0,
      total_abonos_efectivo: 0,
      monto_esperado: montoInicial,
      estado: 'abierta',
      notas,
      created_at: new Date().toISOString(),
    };
    set({ cajaSesion: nuevaCaja });
    saveState();
  },

  historialCajas: savedState?.historialCajas || [],

  cerrarCaja: (montoReal, notas) => {
    set((s) => {
      if (!s.cajaSesion) return s;
      const diferencia = montoReal - s.cajaSesion.monto_esperado;
      const cajaCerrada: CajaSesion = {
        ...s.cajaSesion,
        fecha_cierre: new Date().toISOString(),
        monto_real: montoReal,
        diferencia,
        estado: 'cerrada',
        notas: notas || s.cajaSesion.notas,
      };
      return {
        cajaSesion: cajaCerrada,
        historialCajas: [cajaCerrada, ...(s.historialCajas || [])],
      };
    });
    saveState();
  },

  // BALANCE
  periodoBalance: 'hoy',
  setPeriodoBalance: (periodo) => set({ periodoBalance: periodo }),
}));

let saveTimeout: any = null;

function saveState() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    try {
      const state = useAppStore.getState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isAuthenticated: state.isAuthenticated,
        negocio: state.negocio,
        usuarioActual: state.usuarioActual,
        usuarios: state.usuarios,
        categorias: state.categorias,
        productos: state.productos,
        ventas: state.ventas,
        gastos: state.gastos,
        cuentasPorCobrar: state.cuentasPorCobrar,
        abonosCxC: state.abonosCxC,
        cuentasPorPagar: state.cuentasPorPagar,
        abonosCxP: state.abonosCxP,
        clientes: state.clientes,
        proveedores: state.proveedores,
        cajaSesion: state.cajaSesion,
        historialCajas: state.historialCajas,
        movimientosInventario: state.movimientosInventario,
      }));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, 50);
}
