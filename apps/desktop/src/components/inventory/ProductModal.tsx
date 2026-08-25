import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Plus, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Producto } from '@treinta/shared';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Producto | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categorias, agregarCategoria, agregarProducto, editarProducto } = useAppStore();

  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [costo, setCosto] = useState('');
  const [stockActual, setStockActual] = useState('10');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [imagenUrl, setImagenUrl] = useState('');

  // Nueva Categoría inline
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatNombre, setNewCatNombre] = useState('');

  const handleSaveNewCat = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newCatNombre.trim()) return;
    const nueva = agregarCategoria(newCatNombre.trim());
    setCategoriaId(nueva.id);
    setNewCatNombre('');
    setIsAddingCat(false);
  };

  useEffect(() => {
    if (productToEdit) {
      setNombre(productToEdit.nombre);
      setSku(productToEdit.sku || '');
      setCategoriaId(productToEdit.categoria_id || '');
      setPrecioVenta(productToEdit.precio_venta.toString());
      setCosto(productToEdit.costo.toString());
      setStockActual(productToEdit.stock_actual.toString());
      setStockMinimo(productToEdit.stock_minimo.toString());
      setImagenUrl(productToEdit.imagen_url || '');
    } else {
      setNombre('');
      setSku('');
      setCategoriaId(categorias[0]?.id || '');
      setPrecioVenta('');
      setCosto('');
      setStockActual('10');
      setStockMinimo('5');
      setImagenUrl('');
    }
  }, [productToEdit, isOpen, categorias]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precioVenta) return;

    const data = {
      nombre: nombre.trim(),
      sku: sku.trim() || undefined,
      categoria_id: categoriaId || null,
      precio_venta: Number(precioVenta) || 0,
      costo: Number(costo) || 0,
      stock_actual: Number(stockActual) || 0,
      stock_minimo: Number(stockMinimo) || 5,
      imagen_url: imagenUrl.trim() || undefined,
      activo: true,
    };

    if (productToEdit) {
      editarProducto(productToEdit.id, data);
    } else {
      agregarProducto(data);
    }

    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">
              {productToEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Gaseosa Postobón 350ml"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-600">
                Categoría
              </label>
              {!isAddingCat && (
                <button
                  type="button"
                  onClick={() => setIsAddingCat(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva Categoría</span>
                </button>
              )}
            </div>

            {isAddingCat ? (
              <div className="flex items-center gap-2 mb-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <input
                  type="text"
                  placeholder="Nombre de la categoría..."
                  value={newCatNombre}
                  onChange={(e) => setNewCatNombre(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSaveNewCat}
                  className="px-3 py-1.5 text-xs bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCat(false);
                    setNewCatNombre('');
                  }}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>
            ) : null}

            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">Sin Categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Precio de Venta *
              </label>
              <input
                type="number"
                required
                min="0"
                step="50"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Costo (Compra)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Stock Inicial
              </label>
              <input
                type="number"
                min="0"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                min="0"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Código de Barras / SKU (Opcional)
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ej. 7701234567890"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              URL de Imagen (Opcional)
            </label>
            <input
              type="url"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 transition"
            >
              <Check className="w-4 h-4" />
              <span>{productToEdit ? 'Guardar Cambios' : 'Crear Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
