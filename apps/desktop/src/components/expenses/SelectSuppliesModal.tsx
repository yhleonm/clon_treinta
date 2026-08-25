import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  SlidersHorizontal,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, Producto } from '@treinta/shared';
import { ProductModal } from '../inventory/ProductModal';

export interface GastoProductoItem {
  producto: Producto;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

interface SelectSuppliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems: GastoProductoItem[];
  onConfirm: (items: GastoProductoItem[], totalCalculado: number) => void;
}

export const SelectSuppliesModal: React.FC<SelectSuppliesModalProps> = ({
  isOpen,
  onClose,
  initialItems,
  onConfirm,
}) => {
  const { productos, categorias } = useAppStore();

  const [selectedItems, setSelectedItems] = useState<GastoProductoItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Sync initial items when modal opens
  React.useEffect(() => {
    setSelectedItems(initialItems);
  }, [initialItems, isOpen]);

  if (!isOpen) return null;

  const handleAddProduct = (producto: Producto) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id);
      if (existing) {
        return prev.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.costoUnitario,
              }
            : item
        );
      } else {
        const initialCost = producto.costo || 0;
        return [
          ...prev,
          {
            producto,
            cantidad: 1,
            costoUnitario: initialCost,
            subtotal: initialCost,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      handleRemoveItem(productoId);
      return;
    }
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.costoUnitario,
            }
          : item
      )
    );
  };

  const handleUpdateCosto = (productoId: string, nuevoCosto: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              costoUnitario: nuevoCosto,
              subtotal: item.cantidad * nuevoCosto,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (productoId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

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

  const totalCalculado = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [selectedItems]);

  const handleFinish = () => {
    onConfirm(selectedItems, totalCalculado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 select-none">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col sm:flex-row border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* LEFT PRODUCT SELECTION AREA */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-full transition text-slate-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-extrabold text-base text-slate-900">
                Agregar productos al gasto
              </h3>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                selectedCategory === 'todos'
                  ? 'bg-[#FFCC00] text-slate-950 shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>

            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#FFCC00] text-slate-950 shadow-sm font-extrabold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Grid of Products */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Tile 1: Crear producto */}
              <div
                onClick={() => setIsProductModalOpen(true)}
                className="rounded-3xl border-2 border-dashed border-slate-300 hover:border-slate-800 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition aspect-square group bg-slate-50/50"
              >
                <PlusCircle className="w-8 h-8 text-slate-600 group-hover:scale-110 transition mb-2" />
                <span className="font-extrabold text-xs text-slate-900">
                  Crear producto
                </span>
              </div>

              {/* Product Cards */}
              {filteredProducts.map((p) => {
                const selectedInList = selectedItems.find(
                  (item) => item.producto.id === p.id
                );

                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className={`bg-white rounded-3xl p-4 border shadow-sm transition cursor-pointer flex flex-col items-center text-center relative group active:scale-98 ${
                      selectedInList
                        ? 'border-slate-900 ring-2 ring-slate-900/10'
                        : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    {/* Selected Count badge */}
                    {selectedInList && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                        {selectedInList.cantidad}
                      </div>
                    )}

                    {/* Thumbnail */}
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

                    {/* Cost */}
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(p.costo || 0)}
                    </div>

                    {/* Name */}
                    <div className="text-xs font-bold text-slate-700 truncate w-full mt-0.5">
                      {p.nombre}
                    </div>

                    {/* Stock available */}
                    <div className="mt-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                        {p.stock_actual} disponibles
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: SELECTED PRODUCTS FOR SUPPLY */}
        <div className="w-full sm:w-80 lg:w-96 bg-white flex flex-col justify-between shrink-0 h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900">Productos</h4>
            {selectedItems.length > 0 && (
              <button
                onClick={() => setSelectedItems([])}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 underline"
              >
                Vaciar canasta
              </button>
            )}
          </div>

          {/* Selected Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                <p className="text-xs font-semibold">
                  Selecciona los productos que estás comprando para registrar en el gasto
                </p>
              </div>
            ) : (
              selectedItems.map((item) => (
                <div
                  key={item.producto.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center font-bold text-xs text-purple-600 shrink-0">
                        t.
                      </div>
                      <span className="font-extrabold text-xs text-slate-900 truncate">
                        {item.producto.nombre}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.producto.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity Stepper and Unit Cost */}
                  <div className="flex items-center gap-2">
                    {/* Stepper */}
                    <div className="flex items-center bg-white rounded-xl border border-slate-300 p-1">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.producto.id, item.cantidad - 1)
                        }
                        className="p-1 hover:bg-slate-100 rounded text-slate-600"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-extrabold text-xs text-slate-900">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.producto.id, item.cantidad + 1)
                        }
                        className="p-1 hover:bg-slate-100 rounded text-slate-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Unit Cost input */}
                    <div className="flex-1 flex items-center bg-white rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-900">
                      <span>$</span>
                      <input
                        type="number"
                        min="0"
                        value={item.costoUnitario || ''}
                        onChange={(e) =>
                          handleUpdateCosto(
                            item.producto.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full ml-1 font-bold text-slate-900 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-slate-500 pt-1 text-right">
                    Costo por {item.cantidad} unidades:{' '}
                    <span className="font-black text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Bar: Continuar */}
          <div className="p-6 border-t border-slate-200 bg-white">
            <button
              disabled={selectedItems.length === 0}
              onClick={handleFinish}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-between ${
                selectedItems.length > 0
                  ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-98'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {selectedItems.length}
                </span>
                <span>Continuar</span>
              </span>
              <span className="flex items-center gap-1.5 text-base">
                <span>{formatCurrency(totalCalculado)}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Product Creator */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      />
    </div>
  );
};
