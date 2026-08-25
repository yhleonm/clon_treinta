import React, { useState } from 'react';
import { X, TrendingDown, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  CATEGORIAS_GASTO_DEFAULT,
  MEDIOS_DE_PAGO,
  MedioPago,
  formatCurrency,
} from '@treinta/shared';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  const { registrarGasto, proveedores, cajaSesion } = useAppStore();

  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO_DEFAULT[0]!);
  const [concepto, setConcepto] = useState('');
  const [valor, setValor] = useState('');
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
  const [esCredito, setEsCredito] = useState(false);
  const [proveedorId, setProveedorId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = Number(valor) || 0;
    if (valorNum <= 0 || !concepto) return;

    registrarGasto({
      categoria,
      concepto: concepto.trim(),
      valor: valorNum,
      medioPago: esCredito ? 'credito' : medioPago,
      esCredito,
      proveedorId: proveedorId || null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Registrar Nuevo Gasto</h3>
              <p className="text-xs text-slate-500">Registra una salida de dinero o compra a proveedor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Valor del Gasto ($ COP) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                required
                min="1"
                placeholder="25000"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Concepto / Detalle *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Pago de recibo de luz Enel, Compra de bolsas..."
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {CATEGORIAS_GASTO_DEFAULT.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Proveedor (Opcional)</label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Ninguno / Gasto general</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase text-slate-600">Forma de Pago</label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esCredito}
                  onChange={(e) => setEsCredito(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-rose-700">Comprado a Crédito (Por Pagar)</span>
              </label>
            </div>

            {!esCredito && (
              <div className="grid grid-cols-3 gap-1.5">
                {MEDIOS_DE_PAGO.filter((m) => m.id !== 'credito').map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMedioPago(m.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition text-center truncate ${
                      medioPago === m.id
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {medioPago === 'efectivo' && !esCredito && cajaSesion?.estado === 'abierta' && (
              <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1 font-medium">
                ✓ Se descontará automáticamente de la caja en turno ({formatCurrency(cajaSesion.monto_esperado)}).
              </p>
            )}
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
              className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/25 transition"
            >
              <Check className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
