import React from 'react';
import {
  Wallet,
  Lock,
  PlusCircle,
  Cloud,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '@treinta/shared';

interface HeaderProps {
  onOpenCashModal: () => void;
  onOpenExpenseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCashModal,
  onOpenExpenseModal,
}) => {
  const { cajaSesion, usuarioActual } = useAppStore();

  const isCajaAbierta = cajaSesion && cajaSesion.estado === 'abierta';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none shadow-sm">
      <div className="flex items-center gap-4">
        {/* Cash Register Status */}
        <button
          onClick={onOpenCashModal}
          className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
            isCajaAbierta
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
          }`}
          title="Haz clic para ver arqueo o cerrar caja"
        >
          {isCajaAbierta ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Caja en turno: {formatCurrency(cajaSesion.monto_esperado)}</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Caja Cerrada (Abrir Turno)</span>
            </>
          )}
        </button>

        {/* Sync Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
          <Cloud className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sincronizado</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {usuarioActual.rol !== 'empleado' && (
          <button
            onClick={onOpenExpenseModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-rose-600" />
            <span>Nuevo Gasto</span>
          </button>
        )}

        <button
          onClick={onOpenCashModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
        >
          <Clock className="w-4 h-4 text-slate-500" />
          <span>{isCajaAbierta ? 'Arqueo de Caja' : 'Abrir Caja'}</span>
        </button>
      </div>
    </header>
  );
};
