import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Plus, Check, Upload, Image as ImageIcon, Link as LinkIcon, Trash2 } from 'lucide-react';
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
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      if (file.type === 'image/svg+xml' || file.size < 200000) {
        setImagenUrl(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL('image/jpeg', 0.85);
          setImagenUrl(optimized);
        } else {
          setImagenUrl(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
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

          {/* FOTO / IMAGEN DEL PRODUCTO (SUBIDA DE ARCHIVOS O ENLACE) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase text-slate-600">
                Foto del Producto (Opcional)
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    imageMode === 'upload'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📁 Subir Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    imageMode === 'url'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔗 Enlace URL
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
              className="hidden"
            />

            {imageMode === 'upload' ? (
              imagenUrl ? (
                /* Preview State */
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={imagenUrl}
                      alt="Vista previa"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-white shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Imagen cargada</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Formatos soportados: PNG, JPG, WEBP, SVG, GIF
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={() => setImagenUrl('')}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Dropzone State */
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-0.5">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-extrabold text-slate-800">
                    Haz clic o arrastra tu foto aquí
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Soporta PNG, JPG, JPEG, WEBP, SVG y GIF
                  </div>
                </div>
              )
            ) : (
              /* URL Mode */
              <div className="space-y-2">
                <input
                  type="url"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  placeholder="https://ejemplo.com/foto-producto.jpg"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                {imagenUrl && (
                  <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img
                      src={imagenUrl}
                      alt="Vista previa URL"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="text-xs text-slate-600 font-medium">Vista previa de imagen web</span>
                  </div>
                )}
              </div>
            )}
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
