import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Tag,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, Producto } from '@treinta/shared';
import { ProductModal } from '../components/inventory/ProductModal';
import { StockAdjustModal } from '../components/inventory/StockAdjustModal';

export const InventoryPage: React.FC = () => {
  const { productos, categorias, eliminarProducto, usuarioActual } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Producto | null>(null);

  // Cálculos de métricas de inventario
  const totalItems = productos.length;
  const valorTotalCosto = productos.reduce(
    (sum, p) => sum + p.costo * Math.max(0, p.stock_actual),
    0
  );
  const valorTotalVenta = productos.reduce(
    (sum, p) => sum + p.precio_venta * Math.max(0, p.stock_actual),
    0
  );
  const productosBajoStock = productos.filter(
    (p) => p.stock_actual <= p.stock_minimo
  );

  // Filtrado
  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchCat =
        selectedCategoria === 'todas' || p.categoria_id === selectedCategoria;
      const matchSearch =
        searchTerm === '' ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchBajoStock = !soloBajoStock || p.stock_actual <= p.stock_minimo;

      return matchCat && matchSearch && matchBajoStock;
    });
  }, [productos, selectedCategoria, searchTerm, soloBajoStock]);

  const handleEdit = (p: Producto) => {
    setProductToEdit(p);
    setIsProductModalOpen(true);
  };

  const handleAdjust = (p: Producto) => {
    setProductToAdjust(p);
    setIsAdjustModalOpen(true);
  };

  const handleDelete = (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) {
      eliminarProducto(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5 select-none bg-slate-50">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Inventario y Stock</h2>
          <p className="text-xs text-slate-500">
            Control de existencias en tiempo real, costos y alertas de reposición
          </p>
        </div>

        <div className="flex items-center gap-2">
          {usuarioActual.rol !== 'empleado' && (
            <button
              onClick={() => {
                setProductToEdit(null);
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-500">Total Productos</span>
            <div className="text-xl font-extrabold text-slate-900">{totalItems} referencias</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-500">Valorización a Costo</span>
            <div className="text-xl font-extrabold text-slate-900">{formatCurrency(valorTotalCosto)}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-500">Valor Esperado en Ventas</span>
            <div className="text-xl font-extrabold text-purple-700">{formatCurrency(valorTotalVenta)}</div>
          </div>
        </div>

        <div
          onClick={() => setSoloBajoStock(!soloBajoStock)}
          className={`rounded-2xl p-4 border shadow-sm flex items-center gap-3 cursor-pointer transition ${
            soloBajoStock
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-500/20'
              : 'bg-white text-slate-900 border-slate-200 hover:border-amber-400'
          }`}
        >
          <div
            className={`p-3 rounded-xl ${
              soloBajoStock
                ? 'bg-white/20 text-white'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-[11px] uppercase font-bold ${soloBajoStock ? 'text-amber-100' : 'text-slate-500'}`}>
              Alertas de Bajo Stock
            </span>
            <div className="text-xl font-extrabold">
              {productosBajoStock.length} por reponer
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Categories Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategoria('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategoria === 'todas'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoria(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategoria === c.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {filteredProductos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Package className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">No se encontraron productos</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Costo Unit.</th>
                  <th className="py-3 px-4">Precio Venta</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-center">Mínimo</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProductos.map((p) => {
                  const isLow = p.stock_actual <= p.stock_minimo;
                  const cat = categorias.find((c) => c.id === p.categoria_id);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                            {p.imagen_url ? (
                              <img
                                src={p.imagen_url}
                                alt={p.nombre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Tag className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {p.nombre}
                            </div>
                            {p.sku && (
                              <span className="text-[10px] font-mono text-slate-400">
                                SKU: {p.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {cat?.nombre || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {formatCurrency(p.costo)}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-700 text-sm whitespace-nowrap">
                        {formatCurrency(p.precio_venta)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                            p.stock_actual <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock_actual} un.
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 whitespace-nowrap">
                        {p.stock_minimo} un.
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAdjust(p)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Ajustar stock / Registrar entrada"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>

                          {usuarioActual.rol !== 'empleado' && (
                            <>
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                                title="Editar producto"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id, p.nombre)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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

      <StockAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setProductToAdjust(null);
        }}
        product={productToAdjust}
      />
    </div>
  );
};
