import React, { useState } from 'react';
import {
  X,
  Wallet,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatDateTime } from '@treinta/shared';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { cajaSesion, abrirCaja, cerrarCaja, usuarioActual } = useAppStore();

  const [montoInicial, setMontoInicial] = useState<string>('100000');
  const [montoReal, setMontoReal] = useState<string>('');
  const [notas, setNotas] = useState<string>('');

  if (!isOpen) return null;

  const isAbierta = cajaSesion && cajaSesion.estado === 'abierta';

  const handleAbrir = (e: React.FormEvent) => {
    e.preventDefault();
    abrirCaja(Number(montoInicial) || 0, notas);
    setNotas('');
    onClose();
  };

  const handleCerrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoReal) return;
    cerrarCaja(Number(montoReal) || 0, notas);
    setNotas('');
    setMontoReal('');
    onClose();
  };

  const esperado = cajaSesion?.monto_esperado || 0;
  const real = Number(montoReal) || 0;
  const diferencia = real - esperado;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isAbierta ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isAbierta ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {isAbierta ? 'Arqueo y Cierre de Caja' : 'Apertura de Caja (Nuevo Turno)'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAbierta ? `Turno iniciado ${formatDateTime(cajaSesion.fecha_apertura)}` : 'Inicia el turno para registrar cobros en efectivo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAbierta ? (
          /* ABRIR CAJA FORM */
          <form onSubmit={handleAbrir} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Base Inicial en Efectivo ($ COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monto físico en billetes y monedas para dar cambio al iniciar la jornada.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Notas / Observación (Opcional)
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Turno de la mañana..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/25 transition"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Caja de Turno</span>
              </button>
            </div>
          </form>
        ) : (
          /* ARQUEO Y CIERRE FORM */
          <form onSubmit={handleCerrar} className="p-6 space-y-4">
            {/* Balance Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>(+) Base Inicial:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(cajaSesion.monto_inicial)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>(+) Ventas en Efectivo:</span>
                <span className="font-semibold">{formatCurrency(cajaSesion.total_ventas_efectivo)}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>(+) Abonos Recibidos (Efectivo):</span>
                <span className="font-semibold">{formatCurrency(cajaSesion.total_abonos_efectivo)}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>(-) Gastos Pagados (Efectivo):</span>
                <span className="font-semibold">-{formatCurrency(cajaSesion.total_gastos_efectivo)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800 uppercase text-xs">Efectivo Esperado en Caja:</span>
                <span className="font-extrabold text-lg text-emerald-800">{formatCurrency(cajaSesion.monto_esperado)}</span>
              </div>
            </div>

            {/* Input Conteo Físico */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Conteo Real en Efectivo ($ COP) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder={cajaSesion.monto_esperado.toString()}
                  value={montoReal}
                  onChange={(e) => setMontoReal(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Diferencia Alert */}
            {montoReal !== '' && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  diferencia === 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : diferencia > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <span>
                  {diferencia === 0
                    ? '✓ Caja Cuadrada Perfectamente'
                    : diferencia > 0
                    ? '▲ Sobrante en caja:'
                    : '▼ Faltante en caja:'}
                </span>
                <span className="text-sm font-extrabold">{formatCurrency(Math.abs(diferencia))}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Notas de Cierre
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Cierre de turno sin novedades..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Mantener Abierta
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Turno de Caja</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
