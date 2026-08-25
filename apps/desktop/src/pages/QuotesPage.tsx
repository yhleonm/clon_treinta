import React, { useState } from 'react';
import {
  FileCheck,
  Crown,
  Plus,
  Search,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Share2,
  Download,
  ShoppingBag,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatDateTime, Producto } from '@treinta/shared';

interface CotizacionItem {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Cotizacion {
  id: string;
  clienteNombre: string;
  clienteTelefono?: string;
  fechaCreacion: string;
  fechaVencimiento: string;
  items: CotizacionItem[];
  total: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  notas?: string;
}

export const QuotesPage: React.FC = () => {
  const { productos, clientes, agregarAlCarrito } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Mock initial quotes
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([
    {
      id: 'COT-101',
      clienteNombre: 'Restaurante Doña Martha',
      clienteTelefono: '+57 310 998 8776',
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 7 * 86400000).toISOString(),
      items: [
        {
          producto: productos[0] || { id: 'p1', nombre: 'Gaseosa Postobón 350ml', precio_venta: 3500, costo: 2200, stock_actual: 30, stock_minimo: 5, activo: true, negocio_id: 'n1', created_at: '', updated_at: '' },
          cantidad: 12,
          precioUnitario: 3500,
          subtotal: 42000,
        },
      ],
      total: 42000,
      estado: 'pendiente',
      notas: 'Entrega a domicilio sin costo adicional',
    },
  ]);

  // Create Quote Form State
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [itemsTemp, setItemsTemp] = useState<CotizacionItem[]>([]);
  const [notas, setNotas] = useState('');

  const handleAddItem = () => {
    const prod = productos.find((p) => p.id === selectedProductId);
    if (!prod) return;

    setItemsTemp((prev) => [
      ...prev,
      {
        producto: prod,
        cantidad: Number(cantidad) || 1,
        precioUnitario: prod.precio_venta,
        subtotal: (Number(cantidad) || 1) * prod.precio_venta,
      },
    ]);

    setSelectedProductId('');
    setCantidad(1);
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim() || itemsTemp.length === 0) return;

    const total = itemsTemp.reduce((sum, item) => sum + item.subtotal, 0);

    const nuevaCot: Cotizacion = {
      id: `COT-${102 + cotizaciones.length}`,
      clienteNombre: clienteNombre.trim(),
      clienteTelefono: clienteTelefono.trim() || undefined,
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 15 * 86400000).toISOString(),
      items: itemsTemp,
      total,
      estado: 'pendiente',
      notas: notas.trim() || undefined,
    };

    setCotizaciones([nuevaCot, ...cotizaciones]);
    setIsCreateModalOpen(false);
    setClienteNombre('');
    setClienteTelefono('');
    setItemsTemp([]);
    setNotas('');
  };

  const handleConvertToSale = (cot: Cotizacion) => {
    cot.items.forEach((item) => {
      agregarAlCarrito(item.producto);
    });
    alert(`Cotización ${cot.id} cargada exitosamente en el Carrito de Ventas.`);
  };

  const filteredQuotes = cotizaciones.filter(
    (c) =>
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-slate-50">
      {/* Top Header */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Cotizaciones Comerciales
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3 text-emerald-700 fill-emerald-700" />
                <span>Ventas Pro</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              Crea propuestas de venta, envíalas por WhatsApp y conviértelas en ventas POS
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-extrabold rounded-2xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cotización</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Search */}
        <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-bold">
            Total cotizaciones:{' '}
            <span className="text-slate-900 font-extrabold">{cotizaciones.length}</span>
          </div>
        </div>

        {/* Quotes Grid / Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuotes.map((cot) => (
            <div
              key={cot.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{cot.id}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {cot.estado}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 mt-1">
                    {cot.clienteNombre}
                  </h4>
                  {cot.clienteTelefono && (
                    <p className="text-xs text-slate-500 font-medium">{cot.clienteTelefono}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold">Total Propuesta</div>
                  <div className="text-xl font-black text-emerald-700">
                    {formatCurrency(cot.total)}
                  </div>
                </div>
              </div>

              {/* Items preview */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                {cot.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-slate-700">
                    <span>
                      {item.cantidad}x {item.producto.nombre}
                    </span>
                    <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {cot.notas && (
                <p className="text-xs text-slate-500 italic">"{cot.notas}"</p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`Hola ${cot.clienteNombre}, te compartimos la cotización ${cot.id} por valor de ${formatCurrency(cot.total)}.`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-emerald-700 rounded-xl hover:bg-emerald-50 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar WhatsApp</span>
                </button>

                <button
                  onClick={() => handleConvertToSale(cot)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Convertir a Venta</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Quote Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-base text-slate-900">
                Nueva Cotización Comercial
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-slate-200/60 text-slate-500 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora Los Andes"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+57 300 000 0000"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Add items */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-black uppercase text-slate-500">Agregar Productos</label>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    <option value="">Selecciona un producto...</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} - {formatCurrency(p.precio_venta)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-xl text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-2 bg-slate-900 text-white font-bold rounded-xl"
                  >
                    +
                  </button>
                </div>

                {/* Items in temp list */}
                {itemsTemp.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-200">
                    {itemsTemp.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-800">
                        <span>{item.cantidad}x {item.producto.nombre}</span>
                        <span className="font-black">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas / Condiciones</label>
                <input
                  type="text"
                  placeholder="Validez 15 días, pago de contado..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={itemsTemp.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl hover:bg-emerald-500 shadow-md transition disabled:opacity-50"
                >
                  Guardar Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
