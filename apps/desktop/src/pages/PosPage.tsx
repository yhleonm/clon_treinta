import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  AlertCircle,
  PackageX,
  TrendingDown,
  Tag,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, Producto } from '@treinta/shared';
import { PaymentModal } from '../components/pos/PaymentModal';
import { FastSaleModal } from '../components/pos/FastSaleModal';

interface PosPageProps {
  onOpenExpenseModal: () => void;
}

export const PosPage: React.FC<PosPageProps> = ({ onOpenExpenseModal }) => {
  const {
    productos,
    categorias,
    carrito,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarItemCarrito,
    vaciarCarrito,
  } = useAppStore();

  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isFastSaleOpen, setIsFastSaleOpen] = useState<boolean>(false);
  const [lastSuccessFolio, setLastSuccessFolio] = useState<string | null>(null);

  // Filtrado de productos en catálogo
  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      if (!p.activo) return false;
      const matchCat =
        selectedCategoria === 'todas' || p.categoria_id === selectedCategoria;
      const matchSearch =
        searchTerm === '' ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [productos, selectedCategoria, searchTerm]);

  // Cálculos del Carrito
  const totalArticulos = carrito.reduce((s, i) => s + i.cantidad, 0);
  const totalPagar = carrito.reduce(
    (s, i) => s + i.precio_unitario * i.cantidad,
    0
  );

  return (
    <div className="flex-1 flex h-full overflow-hidden select-none bg-slate-100">
      {/* SUCCESS NOTIFICATION TOAST */}
      {lastSuccessFolio && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="p-1 bg-white text-emerald-600 rounded-full font-bold text-xs">✓</div>
          <div>
            <div className="font-bold text-sm">¡Venta completada con éxito!</div>
            <div className="text-xs text-emerald-100">Folio registrado: #{lastSuccessFolio}</div>
          </div>
          <button
            onClick={() => setLastSuccessFolio(null)}
            className="text-emerald-200 hover:text-white ml-2 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* LEFT SECTION: CATALOG GRID */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-4">
        {/* Search & Action Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFastSaleOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-2xl text-xs font-bold transition shrink-0 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Venta Libre</span>
          </button>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          <button
            onClick={() => setSelectedCategoria('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategoria === 'todas'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todas ({productos.length})
          </button>
          {categorias.map((cat) => {
            const count = productos.filter((p) => p.categoria_id === cat.id).length;
            const isSelected = selectedCategoria === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoria(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.nombre} ({count})
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProductos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <PackageX className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">No se encontraron productos</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Prueba buscando con otro término o selecciona otra categoría.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pb-6">
              {filteredProductos.map((p) => {
                const isLowStock = p.stock_actual <= p.stock_minimo;
                const isOutOfStock = p.stock_actual <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => agregarAlCarrito(p)}
                    className="group bg-white rounded-2xl p-3 border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-150 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Stock Alert Badge */}
                    {isOutOfStock ? (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm z-10">
                        Agotado
                      </div>
                    ) : isLowStock ? (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm z-10">
                        Poco Stock ({p.stock_actual})
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 z-10">
                        Stock: {p.stock_actual}
                      </div>
                    )}

                    <div>
                      {/* Product Image / Placeholder */}
                      <div className="w-full h-28 rounded-xl bg-slate-100 overflow-hidden mb-2.5 flex items-center justify-center relative">
                        {p.imagen_url ? (
                          <img
                            src={p.imagen_url}
                            alt={p.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <Tag className="w-8 h-8 text-slate-300" />
                        )}
                      </div>

                      {/* Product Info */}
                      <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug">
                        {p.nombre}
                      </h4>
                      {p.sku && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</p>}
                    </div>

                    {/* Price and Add button */}
                    <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
                      <div className="font-extrabold text-sm text-emerald-700">
                        {formatCurrency(p.precio_venta)}
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition shadow-sm">
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: SHOPPING CART SIDEBAR */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full justify-between shadow-xl shrink-0 z-20">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Canasta de Venta ({totalArticulos})
            </h3>
          </div>
          {carrito.length > 0 && (
            <button
              onClick={vaciarCarrito}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline"
            >
              Vaciar canasta
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ShoppingCart className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-bold text-sm text-slate-700">Tu canasta está vacía</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Selecciona productos del catálogo o usa "Venta Libre" para agregar artículos.
              </p>
            </div>
          ) : (
            carrito.map((item, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col gap-2 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-slate-900 leading-snug">
                      {item.nombre}
                    </h5>
                    <div className="text-[11px] text-slate-500">
                      {formatCurrency(item.precio_unitario)} c/u
                    </div>
                  </div>
                  <button
                    onClick={() => eliminarItemCarrito(index)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition"
                    title="Eliminar artículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Quantity Controls & Line Subtotal */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => actualizarCantidadCarrito(index, item.cantidad - 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) =>
                        actualizarCantidadCarrito(index, Number(e.target.value) || 1)
                      }
                      className="w-10 text-center text-xs font-bold text-slate-800 focus:outline-none"
                    />
                    <button
                      onClick={() => actualizarCantidadCarrito(index, item.cantidad + 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="font-extrabold text-sm text-slate-900">
                    {formatCurrency(item.precio_unitario * item.cantidad)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          {/* Quick Access Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsFastSaleOpen(true)}
              className="py-2 px-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Venta Libre</span>
            </button>
            <button
              onClick={onOpenExpenseModal}
              className="py-2 px-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-[11px] font-bold text-rose-700 flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              <span>+ Nuevo Gasto</span>
            </button>
          </div>

          {/* Subtotal & Total */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
              <span>Subtotal ({totalArticulos} artículos)</span>
              <span>{formatCurrency(totalPagar)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
              <span className="font-extrabold text-slate-900 text-sm">TOTAL</span>
              <span className="font-black text-2xl text-emerald-700">
                {formatCurrency(totalPagar)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            disabled={carrito.length === 0}
            onClick={() => setIsPaymentOpen(true)}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              carrito.length > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 shadow-emerald-500/25 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Continuar y Cobrar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={(folio) => {
          setIsPaymentOpen(false);
          setLastSuccessFolio(folio);
          setTimeout(() => setLastSuccessFolio(null), 5000);
        }}
      />

      <FastSaleModal
        isOpen={isFastSaleOpen}
        onClose={() => setIsFastSaleOpen(false)}
      />
    </div>
  );
};
