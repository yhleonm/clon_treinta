import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface FastSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FastSaleModal: React.FC<FastSaleModalProps> = ({ isOpen, onClose }) => {
  const { agregarVentaLibreAlCarrito } = useAppStore();
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState('1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const precioNum = Number(precio) || 0;
    const cantidadNum = Number(cantidad) || 1;

    if (precioNum <= 0) return;

    agregarVentaLibreAlCarrito(
      nombre.trim() || 'Venta Libre',
      precioNum,
      cantidadNum
    );

    setNombre('');
    setPrecio('');
    setCantidad('1');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Venta Rápida / Producto Libre</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Nombre o Concepto (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Recarga, Fotocopias, Dulce..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Precio Unitario ($) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="5000"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar a Canasta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
