import React, { useState } from 'react';
import { X, ArrowUpDown, Plus, Minus, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Producto } from '@treinta/shared';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Producto | null;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { ajustarStock } = useAppStore();
  const [modo, setModo] = useState<'entrada' | 'salida' | 'fijar'>('entrada');
  const [cantidad, setCantidad] = useState('10');
  const [motivo, setMotivo] = useState('Compra de mercancía');

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cantNum = Number(cantidad) || 0;
    if (cantNum <= 0) return;

    let delta = 0;
    if (modo === 'entrada') {
      delta = cantNum;
    } else if (modo === 'salida') {
      delta = -cantNum;
    } else if (modo === 'fijar') {
      delta = cantNum - product.stock_actual;
    }

    ajustarStock(product.id, delta, motivo);
    onClose();
  };

  const nuevoStockEstimado =
    modo === 'entrada'
      ? product.stock_actual + (Number(cantidad) || 0)
      : modo === 'salida'
      ? product.stock_actual - (Number(cantidad) || 0)
      : Number(cantidad) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Ajuste de Stock</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-sm text-slate-900 truncate">{product.nombre}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Stock actual en estantería: <strong className="text-slate-900">{product.stock_actual} unidades</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Tipo de Movimiento</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setModo('entrada');
                  setMotivo('Compra de mercancía / Reposición');
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  modo === 'entrada'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                + Entrada
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo('salida');
                  setMotivo('Merma / Producto Dañado');
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  modo === 'salida'
                    ? 'bg-rose-50 border-rose-500 text-rose-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                - Salida / Merma
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo('fijar');
                  setMotivo('Reconteo físico de inventario');
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  modo === 'fijar'
                    ? 'bg-blue-50 border-blue-500 text-blue-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                = Conteo Exacto
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              {modo === 'fijar' ? 'Nuevo Stock Total Exacto' : 'Cantidad a Modificar'}
            </label>
            <input
              type="number"
              required
              min="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center">
            <span className="text-emerald-900 font-semibold">Stock resultante:</span>
            <span className="text-base font-black text-emerald-800">{nuevoStockEstimado} unidades</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Motivo del Ajuste (Auditoría)
            </label>
            <input
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Llegó factura proveedor..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md shadow-emerald-500/20 transition"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Ajuste</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
