import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, MedioPago, MEDIOS_DE_PAGO } from '@treinta/shared';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (folio: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { carrito, clientes, registrarVenta } = useAppStore();

  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
  const [clienteId, setClienteId] = useState<string>('');
  const [descuento, setDescuento] = useState<number>(0);
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const subtotal = carrito.reduce(
    (sum, item) => sum + item.precio_unitario * item.cantidad,
    0
  );
  const total = Math.max(0, subtotal - (Number(descuento) || 0));

  const recibidoNum = Number(montoRecibido) || 0;
  const cambioVueltas = Math.max(0, recibidoNum - total);

  const getMedioPagoIcon = (id: MedioPago) => {
    switch (id) {
      case 'efectivo':
        return Banknote;
      case 'nequi':
      case 'daviplata':
        return Smartphone;
      case 'tarjeta':
        return CreditCard;
      case 'transferencia':
        return Building2;
      case 'credito':
        return Clock;
      default:
        return Banknote;
    }
  };

  const handleConfirmarVenta = () => {
    setErrorMsg('');

    if (medioPago === 'credito' && !clienteId) {
      setErrorMsg('Para ventas a crédito (Fiado) es obligatorio seleccionar un cliente');
      return;
    }

    if (medioPago === 'efectivo' && recibidoNum > 0 && recibidoNum < total) {
      setErrorMsg('El efectivo recibido no cubre el total de la venta');
      return;
    }

    const res = registrarVenta({
      clienteId: clienteId || null,
      medioPago: medioPago,
      descuento: Number(descuento) || 0,
      notas: notas.trim() || undefined,
    });

    if (res.success && res.venta) {
      onSuccess(res.venta.numero_folio);
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al procesar la venta');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Cobrar Venta</h3>
            <p className="text-xs text-slate-500 font-medium">
              Total a Pagar:{' '}
              <span className="font-bold text-slate-900">
                {formatCurrency(total)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Method Selector Grid */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
              Medio de Pago
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {MEDIOS_DE_PAGO.map((m) => {
                const isSelected = medioPago === m.id;
                const Icon = getMedioPagoIcon(m.id);

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMedioPago(m.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-1.5 ${
                        isSelected ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Specific Calculations */}
          {medioPago === 'efectivo' && (
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/70 space-y-3">
              <label className="block text-xs font-bold uppercase text-emerald-900">
                Efectivo Recibido
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={total.toString()}
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setMontoRecibido(total.toString())}
                  className="px-3 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition"
                >
                  Exacto
                </button>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex gap-2 pt-1 overflow-x-auto">
                {[10000, 20000, 50000, 100000].map((billete) => (
                  <button
                    key={billete}
                    type="button"
                    onClick={() => setMontoRecibido(billete.toString())}
                    className="px-2.5 py-1 bg-white border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-lg hover:bg-emerald-100 transition shadow-sm shrink-0"
                  >
                    {formatCurrency(billete)}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              {recibidoNum >= total && (
                <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-sm font-bold">
                  <span className="text-emerald-900">Cambio (Vueltas):</span>
                  <span className="text-emerald-700 text-base font-extrabold">
                    {formatCurrency(cambioVueltas)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Fiado / Credit Specific: Customer Required */}
          {medioPago === 'credito' && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
              <label className="block text-xs font-bold uppercase text-amber-900">
                Seleccionar Cliente para Fiado (Obligatorio)
              </label>
              <select
                required
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Selecciona un cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.telefono ? `(${c.telefono})` : ''} - Saldo: {formatCurrency(c.saldo_deuda)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-amber-700 font-medium">
                Esta venta se añadirá a la cuenta por cobrar del cliente seleccionado.
              </p>
            </div>
          )}

          {/* Optional Customer Selection for normal payment */}
          {medioPago !== 'credito' && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Asociar Cliente (Opcional)
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Venta de mostrador (Cliente genérico)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Discount Field */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Descuento Global ($ COP)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={descuento || ''}
              onChange={(e) => setDescuento(Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Notas de la venta
            </label>
            <input
              type="text"
              placeholder="Ej. Mesa 4, Domicilio..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmarVenta}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-98 rounded-xl shadow-lg shadow-emerald-500/25 transition"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirmar Cobro ({formatCurrency(total)})</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
