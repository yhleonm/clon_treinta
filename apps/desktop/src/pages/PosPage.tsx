import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Tag,
  Store,
  ShoppingCart,
  Zap,
  ArrowRight,
  TrendingDown,
  Crown,
  Info,
  SlidersHorizontal,
  Barcode,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, Producto } from '@treinta/shared';
import { PaymentModal } from '../components/pos/PaymentModal';
import { FastSaleModal } from '../components/pos/FastSaleModal';

interface PosPageProps {
  onOpenExpenseModal: () => void;
  onOpenCashModal?: () => void;
}

export const PosPage: React.FC<PosPageProps> = ({
  onOpenExpenseModal,
  onOpenCashModal,
}) => {
  const {
    productos,
    categorias,
    carrito,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarItemCarrito,
    vaciarCarrito,
    cajaSesion,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFastSaleOpen, setIsFastSaleOpen] = useState(false);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return productos.filter((p) => {
      if (!p.activo) return false;
      const matchCategory =
        selectedCategory === 'todos' || p.categoria_id === selectedCategory;
      const matchSearch =
        searchTerm === '' ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [productos, selectedCategory, searchTerm]);

  // Cart Calculations
  const totalCart = useMemo(() => {
    return carrito.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0);
  }, [carrito]);

  const totalItemsCount = useMemo(() => {
    return carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }, [carrito]);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-slate-50 select-none">
      {/* 1. LEFT MAIN CATALOG AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200">
        {/* Top Header Bar */}
        <div className="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nueva venta</h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Abrir Caja button */}
            <button
              onClick={onOpenCashModal}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-2xl shadow-sm transition"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{cajaSesion?.estado === 'abierta' ? 'Caja Abierta' : 'Abrir caja'}</span>
            </button>

            {/* Nueva venta libre button */}
            <button
              onClick={() => setIsFastSaleOpen(true)}
              className="px-4 py-2 bg-[#10B981] hover:bg-emerald-600 active:scale-98 text-white text-xs font-extrabold rounded-2xl shadow-sm transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Nueva venta libre</span>
            </button>

            {/* Nuevo gasto button */}
            <button
              onClick={onOpenExpenseModal}
              className="px-4 py-2 bg-[#E11D48] hover:bg-rose-700 active:scale-98 text-white text-xs font-extrabold rounded-2xl shadow-sm transition flex items-center gap-1.5"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Nuevo gasto</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-6 pb-3 space-y-3 bg-white/70 backdrop-blur-sm border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 transition shadow-sm">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          </div>

          {/* Horizontal Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                selectedCategory === 'todos'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>

            {categorias.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md font-black'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock_actual <= p.stock_minimo;

              return (
                <div
                  key={p.id}
                  onClick={() => agregarAlCarrito(p)}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer flex flex-col items-center text-center relative group active:scale-98"
                >
                  {/* Low stock icon badge */}
                  {isLowStock && (
                    <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center" title="Stock bajo">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Thumbnail / Lavender Placeholder */}
                  <div className="w-full aspect-square rounded-2xl bg-purple-100/70 flex items-center justify-center mb-3 overflow-hidden">
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-black text-3xl text-purple-400">t.</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-base font-black text-slate-900 tracking-tight">
                    {formatCurrency(p.precio_venta)}
                  </div>

                  {/* Name */}
                  <div className="text-xs font-bold text-slate-700 truncate w-full mt-0.5">
                    {p.nombre}
                  </div>

                  {/* Stock pill */}
                  <div className="mt-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        p.stock_actual === 0
                          ? 'bg-rose-100 text-rose-700'
                          : p.stock_actual <= p.stock_minimo
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {p.stock_actual} disponibles
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. RIGHT CART PANEL (EXACT TREINTA POS CART) */}
      <div className="w-80 lg:w-96 bg-white flex flex-col justify-between shrink-0 h-full border-l border-slate-200">
        {/* Cart Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">Productos</h3>
          {carrito.length > 0 && (
            <button
              onClick={vaciarCarrito}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition underline"
            >
              Vaciar canasta
            </button>
          )}
        </div>

        {/* Cart Items or Barcode Scanner Empty State */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {carrito.length === 0 ? (
            /* Barcode Scanner Illustration */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto space-y-4">
              <div className="w-24 h-24 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner">
                <Barcode className="w-12 h-12" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                  Agrega productos rápidamente usando tu lector de código de barras
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Si no está en tu inventario, lo buscaremos en nuestra base de datos.
                </p>
              </div>
            </div>
          ) : (
            /* Cart Items List */
            <div className="space-y-3">
              {carrito.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">
                        {item.nombre}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        {formatCurrency(item.precio_unitario)} c/u
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarItemCarrito(index)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity Stepper & Item Total */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5 shadow-sm">
                      <button
                        onClick={() =>
                          actualizarCantidadCarrito(index, item.cantidad - 1)
                        }
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-600"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-extrabold text-xs text-slate-900">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          actualizarCantidadCarrito(index, item.cantidad + 1)
                        }
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-black text-sm text-slate-900">
                      {formatCurrency(item.precio_unitario * item.cantidad)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Checkout Button */}
        <div className="p-6 border-t border-slate-200 bg-white">
          <button
            disabled={carrito.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-between ${
              carrito.length > 0
                ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-98'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {totalItemsCount}
              </span>
              <span>Continuar</span>
            </span>
            <span className="flex items-center gap-1.5 text-base">
              <span>{formatCurrency(totalCart)}</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => setIsPaymentModalOpen(false)}
      />

      <FastSaleModal
        isOpen={isFastSaleOpen}
        onClose={() => setIsFastSaleOpen(false)}
      />
    </div>
  );
};
