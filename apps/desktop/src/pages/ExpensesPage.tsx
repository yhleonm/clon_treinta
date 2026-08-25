import React, { useState } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Receipt,
  Calendar,
  Building2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatDateTime } from '@treinta/shared';

interface ExpensesPageProps {
  onOpenExpenseModal: () => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  onOpenExpenseModal,
}) => {
  const { gastos, usuarioActual } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const totalGastos = gastos.reduce((sum, g) => sum + g.valor, 0);

  const filteredGastos = gastos.filter(
    (g) =>
      searchTerm === '' ||
      g.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.proveedor && g.proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5 select-none bg-slate-50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Gastos y Egresos</h2>
          <p className="text-xs text-slate-500">
            Control de salidas de dinero, compras de mercancía y servicios operativos
          </p>
        </div>

        {usuarioActual.rol !== 'empleado' && (
          <button
            onClick={onOpenExpenseModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Gasto</span>
          </button>
        )}
      </div>

      {/* KPI Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">
              Total Egresos Registrados
            </span>
            <div className="text-2xl font-black text-rose-600">
              {formatCurrency(totalGastos)}
            </div>
          </div>
        </div>

        <div className="text-right text-xs text-slate-500">
          <strong>{gastos.length}</strong> movimientos registrados
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por concepto o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredGastos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Receipt className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">No hay gastos registrados</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGastos.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      {g.concepto}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                        {g.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {g.proveedor ? (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {g.proveedor.nombre}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`capitalize px-2 py-0.5 rounded-lg font-bold text-[11px] ${
                          g.es_credito
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {g.es_credito ? 'Crédito (Por Pagar)' : g.medio_pago}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateTime(g.fecha)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 text-sm whitespace-nowrap">
                      -{formatCurrency(g.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
