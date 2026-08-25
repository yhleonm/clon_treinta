import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  Clock,
  UserPlus,
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

  const billetesSugeridos = [2000, 5000, 10000, 20000, 50000, 100000].filter(
    (b) => b >= total
  );

  const handleConfirmarVenta = () => {
    setErrorMsg('');

    if (medioPago === 'credito' && !clienteId) {
      setErrorMsg('Debes seleccionar un cliente para registrar una venta a crédito (fiado).');
      return;
    }

    if (medioPago === 'efectivo' && recibidoNum > 0 && recibidoNum < total) {
      setErrorMsg('El dinero recibido en efectivo es menor al total de la venta.');
      return;
    }

    const res = registrarVenta({
      clienteId: clienteId || null,
      medioPago,
      descuento: Number(descuento) || 0,
      notas: notas || undefined,
    });

    if (res.success && res.venta) {
      onSuccess(res.venta.numero_folio);
    } else {
      setErrorMsg(res.error || 'Ocurrió un error al procesar la venta');
    }
  };

  const selectedCliente = clientes.find((c) => c.id === clienteId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Cobrar Venta</h3>
            <p className="text-xs text-slate-500">
              {carrito.reduce((s, i) => s + i.cantidad, 0)} artículos en canasta
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-100 uppercase tracking-wider font-semibold">Total a Pagar</span>
            <div className="text-3xl font-extrabold tracking-tight">{formatCurrency(total)}</div>
          </div>
          {descuento > 0 && (
            <div className="text-right">
              <span className="text-xs text-emerald-200">Subtotal: {formatCurrency(subtotal)}</span>
              <div className="text-sm font-semibold text-emerald-100">Descuento: -{formatCurrency(descuento)}</div>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Medio de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {MEDIOS_DE_PAGO.map((m) => {
                const isSelected = medioPago === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMedioPago(m.id);
                      setErrorMsg('');
                    }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m.id === 'efectivo' && <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {m.id === 'nequi' && <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />}
                    {m.id === 'daviplata' && <Smartphone className="w-4 h-4 text-red-600 shrink-0" />}
                    {m.id === 'tarjeta' && <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />}
                    {m.id === 'transferencia' && <Building2 className="w-4 h-4 text-blue-600 shrink-0" />}
                    {m.id === 'credito' && <Clock className="w-4 h-4 text-amber-600 shrink-0" />}
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific payment options */}
          {medioPago === 'efectivo' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Efectivo Recibido</label>
                <button
                  type="button"
                  onClick={() => setMontoRecibido(total.toString())}
                  className="text-xs text-emerald-600 font-bold hover:underline"
                >
                  Pago Exacto
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">$</span>
                <input
                  type="number"
                  placeholder={total.toString()}
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Quick denomination chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {billetesSugeridos.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setMontoRecibido(b.toString())}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-400 rounded-lg text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    {formatCurrency(b)}
                  </button>
                ))}
              </div>

              {/* Cambio / Vueltas */}
              {recibidoNum >= total && recibidoNum > 0 && (
                <div className="p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase">Cambio / Vueltas a entregar:</span>
                  <span className="text-xl font-extrabold text-emerald-700">{formatCurrency(cambioVueltas)}</span>
                </div>
              )}
            </div>
          )}

          {/* Customer Selection (Optional or Mandatory for Fiado) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">
                Cliente {medioPago === 'credito' && <span className="text-rose-500">* Requerido para fiado</span>}
              </label>
            </div>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Cliente general / Mostrador</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.saldo_deuda > 0 ? `(Deuda actual: ${formatCurrency(c.saldo_deuda)})` : ''}
                </option>
              ))}
            </select>

            {selectedCliente && medioPago === 'credito' && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                Deuda actual: <strong>{formatCurrency(selectedCliente.saldo_deuda)}</strong>. Con esta venta quedará en:{' '}
                <strong>{formatCurrency(selectedCliente.saldo_deuda + total)}</strong>.
              </div>
            )}
          </div>

          {/* Discount & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Descuento ($)</label>
              <input
                type="number"
                min="0"
                value={descuento || ''}
                onChange={(e) => setDescuento(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Notas / Observación</label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Domicilio..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
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
    </div>
  );
};
