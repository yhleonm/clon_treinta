import React, { useState, useEffect } from 'react';
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
  const { categorias, agregarProducto, editarProducto } = useAppStore();

  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [costo, setCosto] = useState('');
  const [stockActual, setStockActual] = useState('10');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [imagenUrl, setImagenUrl] = useState('');

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
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
              placeholder="Ej. Arroz Diana 1kg, Coca Cola 400ml..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Categoría
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Código / SKU (Opcional)
              </label>
              <input
                type="text"
                placeholder="BEB-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Precio de Venta ($ COP) *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="4500"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Costo Unitario ($ COP)
              </label>
              <input
                type="number"
                min="0"
                placeholder="3200"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Stock Inicial / Actual
              </label>
              <input
                type="number"
                min="0"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                min="1"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              URL de Imagen (Opcional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
    </div>
  );
};
