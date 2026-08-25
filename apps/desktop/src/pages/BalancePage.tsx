import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  HandCoins,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  formatCurrency,
  formatDateTime,
  formatDateShort,
  CuentaPorCobrar,
  CuentaPorPagar,
  MEDIOS_DE_PAGO,
} from '@treinta/shared';
import { AbonoModal } from '../components/credit/AbonoModal';

type BalanceTab = 'todos' | 'ingresos' | 'egresos' | 'por_cobrar' | 'por_pagar';

interface BalancePageProps {
  onOpenCashModal: () => void;
  onOpenExpenseModal: () => void;
}

export const BalancePage: React.FC<BalancePageProps> = ({
  onOpenCashModal,
  onOpenExpenseModal,
}) => {
  const {
    ventas,
    gastos,
    cuentasPorCobrar,
    cuentasPorPagar,
    abonosCxC,
    abonosCxP,
    cajaSesion,
    periodoBalance,
    setPeriodoBalance,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<BalanceTab>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCuenta, setSelectedCuenta] = useState<{
    tipo: 'cobrar' | 'pagar';
    cuenta: CuentaPorCobrar | CuentaPorPagar;
  } | null>(null);

  // Filtrado por Período
  const filterByDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (periodoBalance === 'hoy') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (periodoBalance === 'semana') {
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (periodoBalance === 'mes') {
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    return true; // 'todo'
  };

  // Filtrado de Ventas y Gastos
  const ventasFiltradas = useMemo(
    () => ventas.filter((v) => filterByDate(v.created_at)),
    [ventas, periodoBalance]
  );

  const gastosFiltrados = useMemo(
    () => gastos.filter((g) => filterByDate(g.fecha)),
    [gastos, periodoBalance]
  );

  // Cálculo de Métricas Resumen
  const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + g.valor, 0);
  const balanceNeto = totalVentas - totalGastos;

  const totalPorCobrar = cuentasPorCobrar
    .filter((c) => c.estado !== 'pagada')
    .reduce((sum, c) => sum + c.saldo_pendiente, 0);

  const totalPorPagar = cuentasPorPagar
    .filter((c) => c.estado !== 'pagada')
    .reduce((sum, c) => sum + c.saldo_pendiente, 0);

  // Construcción unificada de transacciones (Ingresos + Egresos)
  const transaccionesUnificadas = useMemo(() => {
    const lista: {
      id: string;
      tipo: 'ingreso' | 'egreso';
      concepto: string;
      subconcepto?: string;
      valor: number;
      medioPago: string;
      fecha: string;
      folio?: string;
    }[] = [];

    // Ventas
    ventasFiltradas.forEach((v) => {
      lista.push({
        id: v.id,
        tipo: 'ingreso',
        concepto: v.cliente ? `Venta a ${v.cliente.nombre}` : 'Venta de Mostrador',
        subconcepto: v.items?.map((i) => `${i.cantidad}x ${i.nombre_producto}`).join(', '),
        valor: v.total,
        medioPago: v.medio_pago,
        fecha: v.created_at,
        folio: v.numero_folio,
      });
    });

    // Gastos
    gastosFiltrados.forEach((g) => {
      lista.push({
        id: g.id,
        tipo: 'egreso',
        concepto: g.concepto,
        subconcepto: g.categoria + (g.proveedor ? ` • ${g.proveedor.nombre}` : ''),
        valor: g.valor,
        medioPago: g.medio_pago,
        fecha: g.fecha,
      });
    });

    // Ordenar cronológicamente descendente
    return lista.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [ventasFiltradas, gastosFiltrados]);

  // Filtrado por buscador y pestaña
  const transaccionesFiltradas = useMemo(() => {
    return transaccionesUnificadas.filter((t) => {
      const matchSearch =
        searchTerm === '' ||
        t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.subconcepto && t.subconcepto.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.folio && t.folio.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (activeTab === 'ingresos') return t.tipo === 'ingreso';
      if (activeTab === 'egresos') return t.tipo === 'egreso';
      return true; // 'todos'
    });
  }, [transaccionesUnificadas, searchTerm, activeTab]);

  const handleExportReport = () => {
    alert(
      `Reporte de Balance generado con éxito:\n\nPeríodo: ${periodoBalance.toUpperCase()}\nVentas Totales: ${formatCurrency(
        totalVentas
      )}\nGastos Totales: ${formatCurrency(
        totalGastos
      )}\nBalance Neto: ${formatCurrency(
        balanceNeto
      )}\nCuentas por Cobrar: ${formatCurrency(totalPorCobrar)}`
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5 select-none bg-slate-50">
      {/* TOP CONTROLS: PERIOD FILTER & REPORT ACTIONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Balance del Negocio</h2>
          <p className="text-xs text-slate-500">
            Monitoreo en tiempo real de ingresos, egresos y flujo de caja
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter Pills */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl">
            {(['hoy', 'semana', 'mes', 'todo'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodoBalance(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                  periodoBalance === p
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Esta Semana' : p === 'mes' ? 'Este Mes' : 'Todo'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Descargar Reporte</span>
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Balance Neto */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Balance Neto
            </span>
            <div
              className={`p-2 rounded-xl ${
                balanceNeto >= 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-2xl font-black ${
                balanceNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(balanceNeto)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Ventas menos gastos en el período
            </span>
          </div>
        </div>

        {/* Ventas Totales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ventas Totales
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(totalVentas)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {ventasFiltradas.length} transacciones registradas
            </span>
          </div>
        </div>

        {/* Gastos Totales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gastos Totales
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600">
              {formatCurrency(totalGastos)}
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">
              {gastosFiltrados.length} egresos en el período
            </span>
          </div>
        </div>

        {/* Cuentas por Cobrar (Fiados) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Por Cobrar (Fiados)
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600">
              {formatCurrency(totalPorCobrar)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Por pagar a prov: {formatCurrency(totalPorPagar)}
            </span>
          </div>
        </div>
      </div>

      {/* TRANSACTION TABS & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Tab Navigation & Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'todos'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos ({transaccionesUnificadas.length})
            </button>
            <button
              onClick={() => setActiveTab('ingresos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'ingresos'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Ingresos ({ventasFiltradas.length})
            </button>
            <button
              onClick={() => setActiveTab('egresos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'egresos'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Egresos ({gastosFiltrados.length})
            </button>
            <button
              onClick={() => setActiveTab('por_cobrar')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'por_cobrar'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Por Cobrar ({cuentasPorCobrar.filter((c) => c.estado !== 'pagada').length})
            </button>
            <button
              onClick={() => setActiveTab('por_pagar')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'por_pagar'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Por Pagar ({cuentasPorPagar.filter((c) => c.estado !== 'pagada').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por concepto o folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* TAB 1, 2, 3: TRANSACTIONS TABLE */}
        {['todos', 'ingresos', 'egresos'].includes(activeTab) && (
          <div className="flex-1 overflow-y-auto">
            {transaccionesFiltradas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Receipt className="w-10 h-10 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No hay transacciones registradas</p>
                <p className="text-xs text-slate-400">
                  Las ventas y gastos que registres en este período aparecerán aquí.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Concepto / Detalle</th>
                    <th className="py-3 px-4">Medio de Pago</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaccionesFiltradas.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                            t.tipo === 'ingreso'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {t.tipo === 'ingreso' ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{t.tipo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {t.concepto}
                          {t.folio && (
                            <span className="ml-2 font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              #{t.folio}
                            </span>
                          )}
                        </div>
                        {t.subconcepto && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {t.subconcepto}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="capitalize px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {t.medioPago}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(t.fecha)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-black text-sm ${
                            t.tipo === 'ingreso'
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {t.tipo === 'ingreso' ? '+' : '-'}
                          {formatCurrency(t.valor)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 4: POR COBRAR (CLIENTES FIADOS) */}
        {activeTab === 'por_cobrar' && (
          <div className="flex-1 overflow-y-auto">
            {cuentasPorCobrar.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">¡Al día! No tienes cuentas por cobrar pendientes</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Detalle / Origen</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4">Total Deuda</th>
                    <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cuentasPorCobrar.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {c.cliente?.nombre || 'Cliente'}
                        <div className="text-[11px] text-slate-400 font-normal">
                          {c.cliente?.telefono || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.notas || 'Venta a crédito'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatDateShort(c.fecha_vencimiento)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {formatCurrency(c.monto_total)}
                      </td>
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
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Pagado ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 5: POR PAGAR (PROVEEDORES) */}
        {activeTab === 'por_pagar' && (
          <div className="flex-1 overflow-y-auto">
            {cuentasPorPagar.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">¡Al día! No tienes cuentas por pagar pendientes</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Concepto / Gasto</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4">Total Factura</th>
                    <th className="py-3 px-4 text-right">Saldo a Pagar</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cuentasPorPagar.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {c.proveedor?.nombre || 'Proveedor'}
                        <div className="text-[11px] text-slate-400 font-normal">
                          {c.proveedor?.telefono || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.notas || c.gasto?.concepto || 'Compra a crédito'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatDateShort(c.fecha_vencimiento)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {formatCurrency(c.monto_total)}
                      </td>
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
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
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
        )}
      </div>

      {/* Global Abono Modal */}
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
