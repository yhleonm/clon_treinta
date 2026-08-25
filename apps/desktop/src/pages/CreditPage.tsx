import React, { useState } from 'react';
import {
  Clock,
  HandCoins,
  Search,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Building2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  formatCurrency,
  formatDateShort,
  CuentaPorCobrar,
  CuentaPorPagar,
} from '@treinta/shared';
import { AbonoModal } from '../components/credit/AbonoModal';

export const CreditPage: React.FC = () => {
  const { cuentasPorCobrar, cuentasPorPagar } = useAppStore();

  const [tab, setTab] = useState<'cobrar' | 'pagar'>('cobrar');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuenta, setSelectedCuenta] = useState<{
    tipo: 'cobrar' | 'pagar';
    cuenta: CuentaPorCobrar | CuentaPorPagar;
  } | null>(null);

  const totalPorCobrar = cuentasPorCobrar
    .filter((c) => c.estado !== 'pagada')
    .reduce((sum, c) => sum + c.saldo_pendiente, 0);

  const totalPorPagar = cuentasPorPagar
    .filter((c) => c.estado !== 'pagada')
    .reduce((sum, c) => sum + c.saldo_pendiente, 0);

  const filteredCxC = cuentasPorCobrar.filter(
    (c) =>
      searchTerm === '' ||
      (c.cliente && c.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notas && c.notas.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCxP = cuentasPorPagar.filter(
    (c) =>
      searchTerm === '' ||
      (c.proveedor && c.proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notas && c.notas.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5 select-none bg-slate-50">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Cuentas y Fiados</h2>
          <p className="text-xs text-slate-500">
            Control de deudas de clientes (por cobrar) y compromisos con proveedores (por pagar)
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
        <div
          onClick={() => setTab('cobrar')}
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition ${
            tab === 'cobrar'
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-500/20'
              : 'bg-white text-slate-900 border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase ${tab === 'cobrar' ? 'text-amber-100' : 'text-slate-500'}`}>
              Por Cobrar (Fiado a Clientes)
            </span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black mt-2">{formatCurrency(totalPorCobrar)}</div>
        </div>

        <div
          onClick={() => setTab('pagar')}
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition ${
            tab === 'pagar'
              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-600/20'
              : 'bg-white text-slate-900 border-slate-200 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase ${tab === 'pagar' ? 'text-blue-100' : 'text-slate-500'}`}>
              Por Pagar (Deudas a Proveedores)
            </span>
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black mt-2">{formatCurrency(totalPorPagar)}</div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('cobrar')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'cobrar'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Clientes por Cobrar ({cuentasPorCobrar.length})
            </button>
            <button
              onClick={() => setTab('pagar')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'pagar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Proveedores por Pagar ({cuentasPorPagar.length})
            </button>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por contacto o nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'cobrar' ? (
            filteredCxC.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No hay cuentas por cobrar</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Detalle</th>
                    <th className="py-3 px-4">Vence</th>
                    <th className="py-3 px-4">Total Original</th>
                    <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCxC.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {c.cliente?.nombre || 'Cliente'}
                        </div>
                        <div className="text-[11px] text-slate-400">{c.cliente?.telefono}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.notas}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDateShort(c.fecha_vencimiento)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{formatCurrency(c.monto_total)}</td>
                      <td className="py-3 px-4 text-right font-black text-amber-600 text-sm">
                        {formatCurrency(c.saldo_pendiente)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.saldo_pendiente > 0 ? (
                          <button
                            onClick={() => setSelectedCuenta({ tipo: 'cobrar', cuenta: c })}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition"
                          >
                            Abonar
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                            Saldado ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : filteredCxP.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No hay cuentas por pagar pendientes</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Detalle</th>
                  <th className="py-3 px-4">Vence</th>
                  <th className="py-3 px-4">Total Factura</th>
                  <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCxP.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {c.proveedor?.nombre || 'Proveedor'}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.proveedor?.telefono}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.notas}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDateShort(c.fecha_vencimiento)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{formatCurrency(c.monto_total)}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                      {formatCurrency(c.saldo_pendiente)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.saldo_pendiente > 0 ? (
                        <button
                          onClick={() => setSelectedCuenta({ tipo: 'pagar', cuenta: c })}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
                        >
                          Pagar Abono
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          Saldado ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedCuenta && (
        <AbonoModal
          isOpen={Boolean(selectedCuenta)}
          onClose={() => setSelectedCuenta(null)}
          tipo={selectedCuenta.tipo}
          cuenta={selectedCuenta.cuenta}
        />
      )}
    </div>
  );
};
