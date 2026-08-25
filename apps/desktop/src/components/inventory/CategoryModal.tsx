import React, { useState } from 'react';
import { X, Tag, Plus, Trash2, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#14B8A6', '#6366F1'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const { categorias, productos, agregarCategoria, eliminarCategoria } = useAppStore();
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#10B981');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    agregarCategoria(nombre.trim(), color);
    setNombre('');
  };

  const handleDelete = (id: string, catNombre: string) => {
    const prodsInCat = productos.filter((p) => p.categoria_id === id).length;
    if (
      window.confirm(
        `¿Eliminar categoría "${catNombre}"? ${
          prodsInCat > 0
            ? `(${prodsInCat} productos quedarán sin categoría)`
            : ''
        }`
      )
    ) {
      eliminarCategoria(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Categorías de Productos</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Create Category Form */}
          <form onSubmit={handleAdd} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-600">Crear Nueva Categoría</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Ej. Frutas y Verduras, Panadería..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Color:</span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition ${
                    color === c ? 'border-slate-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </form>

          {/* Categories List */}
          <div>
            <span className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Categorías Existentes ({categorias.length})
            </span>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {categorias.map((c) => {
                const count = productos.filter((p) => p.categoria_id === c.id).length;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.color_hex || '#10B981' }}
                      />
                      <span className="font-bold text-xs text-slate-900">{c.nombre}</span>
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                        {count} {count === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(c.id, c.nombre)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
