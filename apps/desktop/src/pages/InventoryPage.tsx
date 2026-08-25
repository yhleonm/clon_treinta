import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  TrendingUp,
  AlertTriangle,
  History,
  QrCode,
  Download,
  Settings,
  Store,
  ChevronDown,
  Layers,
  Info,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, Producto } from '@treinta/shared';
import { ProductModal } from '../components/inventory/ProductModal';
import { StockAdjustModal } from '../components/inventory/StockAdjustModal';
import { CategoryModal } from '../components/inventory/CategoryModal';

export const InventoryPage: React.FC = () => {
  const {
    productos,
    categorias,
    eliminarProducto,
    editarProducto,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [filterNoStockOnly, setFilterNoStockOnly] = useState(false);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
  const [productForKardex, setProductForKardex] = useState<Producto | null>(null);

  // Calculations
  const totalReferencias = productos.filter((p) => p.activo).length;

  const costoTotalInventario = useMemo(() => {
    return productos
      .filter((p) => p.activo)
      .reduce((sum, p) => sum + Math.max(0, p.stock_actual || 0) * (p.costo || 0), 0);
  }, [productos]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productos.filter((p) => {
      if (!p.activo) return false;
      if (filterNoStockOnly && p.stock_actual > 0) return false;
      const matchCategory =
        selectedCategory === 'todos' || p.categoria_id === selectedCategory;
      const matchSearch =
        searchTerm === '' ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [productos, selectedCategory, filterNoStockOnly, searchTerm]);

  const handleEditProduct = (p: Producto) => {
    setProductToEdit(p);
    setIsProductModalOpen(true);
  };

  const handleCreateProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenKardex = (p: Producto) => {
    setProductForKardex(p);
    setIsStockModalOpen(true);
  };

  // Quick inline update handlers
  const handleQuickUpdatePrecio = (p: Producto, nuevoPrecio: number) => {
    editarProducto(p.id, { precio_venta: nuevoPrecio });
  };

  const handleQuickUpdateCosto = (p: Producto, nuevoCosto: number) => {
    editarProducto(p.id, { costo: nuevoCosto });
  };

  const handleQuickUpdateStock = (p: Producto, nuevoStock: number) => {
    editarProducto(p.id, { stock_actual: nuevoStock });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-slate-50">
      {/* 1. TOP HEADER (EXACT TREINTA INVENTARIO) */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Inventario</h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Categorías button */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-extrabold rounded-2xl shadow-sm transition"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>Categorías</span>
            </button>

            {/* Crear productos button */}
            <button
              onClick={handleCreateProduct}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-2xl shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear productos</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Metrics Subheader: Referencias & Costo total */}
        <div className="flex items-center gap-6 text-xs text-slate-500 font-bold pt-1">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            <span>
              Total de referencias:{' '}
              <span className="text-slate-900 font-extrabold text-sm">{totalReferencias}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Costo total de inventario:{' '}
              <span className="text-slate-900 font-extrabold text-sm">
                {formatCurrency(costoTotalInventario)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & TOOLBAR */}
      <div className="bg-white/80 backdrop-blur-sm px-8 py-3.5 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
              <QrCode className="w-4 h-4 text-slate-600" />
              <span>Catálogo virtual</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button className="p-2 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 shadow-sm">
              <Store className="w-4 h-4" />
            </button>

            <button className="p-2 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 shadow-sm">
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                alert('Exportando inventario a archivo...');
              }}
              className="p-2 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 shadow-sm relative group"
              title="Descargar inventario"
            >
              <Download className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setSelectedCategory('todos');
              setFilterNoStockOnly(false);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              selectedCategory === 'todos' && !filterNoStockOnly
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Ver todos
          </button>

          <button
            onClick={() => {
              setFilterNoStockOnly(true);
              setSelectedCategory('todos');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterNoStockOnly
                ? 'bg-rose-500 text-white shadow-sm font-extrabold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Sin stock
          </button>

          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setFilterNoStockOnly(false);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat.id && !filterNoStockOnly
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* 3. INVENTORY TABLE */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Producto ℹ️</th>
                <th className="py-3.5 px-4 text-center">Precio</th>
                <th className="py-3.5 px-4 text-center">Costo</th>
                <th className="py-3.5 px-4 text-center">Cantidad disponible</th>
                <th className="py-3.5 px-4 text-right">Ganancia</th>
                <th className="py-3.5 px-4 text-center">%</th>
                <th className="py-3.5 px-5 text-right">Historial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock_actual <= p.stock_minimo;
                const ganancia = p.precio_venta - p.costo;
                const margenPct =
                  p.precio_venta > 0
                    ? Math.round((ganancia / p.precio_venta) * 100)
                    : 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                    {/* Producto */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                          {p.imagen_url ? (
                            <img
                              src={p.imagen_url}
                              alt={p.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>t.</span>
                          )}
                        </div>

                        <div>
                          <div
                            onClick={() => handleEditProduct(p)}
                            className="font-extrabold text-slate-900 hover:text-emerald-700 cursor-pointer underline-offset-2 hover:underline"
                          >
                            {p.nombre}
                          </div>
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                              <span>⚠️ Unidades bajas</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Precio Editable */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-2xl px-3 py-1.5 font-black text-slate-900 shadow-sm w-28">
                        <span>$</span>
                        <input
                          type="number"
                          value={p.precio_venta}
                          onChange={(e) =>
                            handleQuickUpdatePrecio(
                              p,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full ml-1 text-center font-black focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* Costo Editable */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-2xl px-3 py-1.5 font-bold text-slate-700 shadow-sm w-28">
                        <span>$</span>
                        <input
                          type="number"
                          value={p.costo}
                          onChange={(e) =>
                            handleQuickUpdateCosto(
                              p,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full ml-1 text-center font-bold focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* Cantidad disponible Editable */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-2xl px-3 py-1.5 font-black text-slate-900 shadow-sm w-20">
                        <input
                          type="number"
                          value={p.stock_actual}
                          onChange={(e) =>
                            handleQuickUpdateStock(
                              p,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className={`w-full text-center font-black focus:outline-none ${
                            p.stock_actual === 0 ? 'text-rose-600' : ''
                          }`}
                        />
                      </div>
                    </td>

                    {/* Ganancia */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(ganancia)}
                    </td>

                    {/* % Margen */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        {margenPct}%
                      </span>
                    </td>

                    {/* Ver Historial */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleOpenKardex(p)}
                        className="font-extrabold text-xs text-slate-900 hover:text-emerald-700 underline transition"
                      >
                        Ver historial
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {productForKardex && (
        <StockAdjustModal
          isOpen={isStockModalOpen}
          onClose={() => {
            setIsStockModalOpen(false);
            setProductForKardex(null);
          }}
          product={productForKardex}
        />
      )}
    </div>
  );
};
