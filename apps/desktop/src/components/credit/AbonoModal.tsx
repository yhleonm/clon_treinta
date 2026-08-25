import React, { useState } from 'react';
import { X, DollarSign, Check, HandCoins } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  CuentaPorCobrar,
  CuentaPorPagar,
  MedioPago,
  MEDIOS_DE_PAGO,
  formatCurrency,
} from '@treinta/shared';

interface AbonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'cobrar' | 'pagar';
  cuenta: CuentaPorCobrar | CuentaPorPagar | null;
}

export const AbonoModal: React.FC<AbonoModalProps> = ({
  isOpen,
  onClose,
  tipo,
  cuenta,
}) => {
  const { registrarAbonoCxC, registrarAbonoCxP, cajaSesion } = useAppStore();

  const [monto, setMonto] = useState('');
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
  const [notas, setNotas] = useState('');

  if (!isOpen || !cuenta) return null;

  const saldo = cuenta.saldo_pendiente;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = Number(monto) || 0;
    if (montoNum <= 0) return;

    if (tipo === 'cobrar') {
      registrarAbonoCxC(cuenta.id, montoNum, medioPago, notas);
    } else {
      registrarAbonoCxP(cuenta.id, montoNum, medioPago, notas);
    }

    onClose();
  };

  const nombreContacto =
    tipo === 'cobrar'
      ? (cuenta as CuentaPorCobrar).cliente?.nombre || 'Cliente'
      : (cuenta as CuentaPorPagar).proveedor?.nombre || 'Proveedor';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${tipo === 'cobrar' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {tipo === 'cobrar' ? 'Registrar Abono Recibido' : 'Registrar Pago a Proveedor'}
              </h3>
              <p className="text-xs text-slate-500">{nombreContacto}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Saldo Pendiente:</span>
              <div className="text-lg font-black text-slate-900">{formatCurrency(saldo)}</div>
            </div>
            <button
              type="button"
              onClick={() => setMonto(saldo.toString())}
              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition"
            >
              Pagar Todo
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Monto a Abonar ($ COP) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                required
                min="1"
                max={saldo}
                placeholder={saldo.toString()}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Medio de Pago</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MEDIOS_DE_PAGO.filter((m) => m.id !== 'credito').map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMedioPago(m.id)}
                  className={`py-2 px-1 rounded-xl border text-xs font-bold text-center truncate transition ${
                    medioPago === m.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Notas / Observación</label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Abono en efectivo..."
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Abono</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
