import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Crown,
  SlidersHorizontal,
  FileSpreadsheet,
  Receipt,
  Building2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Store,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  formatCurrency,
  formatDateTime,
  formatDateShort,
  CuentaPorCobrar,
  CuentaPorPagar,
  MedioPago,
} from '@treinta/shared';
import { AbonoModal } from '../components/credit/AbonoModal';
import { exportBalanceToPDF } from '../utils/pdfExport';

interface BalancePageProps {
  onOpenCashModal: () => void;
  onOpenExpenseModal: () => void;
}

export const BalancePage: React.FC<BalancePageProps> = ({
  onOpenCashModal,
  onOpenExpenseModal,
}) => {
  const {
    negocio,
    ventas,
    gastos,
    cuentasPorCobrar,
    cuentasPorPagar,
    abonosCxC,
    abonosCxP,
    cajaSesion,
  } = useAppStore();

  // Mode: Transacciones vs Cierres de caja
  const [activeMainTab, setActiveMainTab] = useState<'transacciones' | 'cierres'>('transacciones');

  // Sub-tabs: Ingresos | Egresos | Por cobrar | Por pagar
  const [activeSubTab, setActiveSubTab] = useState<'ingresos' | 'egresos' | 'por_cobrar' | 'por_pagar'>('egresos');

  // Filter states
  const [periodoFiltro, setPeriodoFiltro] = useState<'dia' | 'semana' | 'mes' | 'todo'>('dia');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] || ''
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedCuenta, setSelectedCuenta] = useState<{
    tipo: 'cobrar' | 'pagar';
    cuenta: CuentaPorCobrar | CuentaPorPagar;
  } | null>(null);

  // Filter transactions by selected date / period
  const isDateInFilter = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();

    if (periodoFiltro === 'dia') {
      const [year, month, day] = selectedDate.split('-').map(Number);
      return (
        d.getFullYear() === year &&
        d.getMonth() + 1 === month &&
        d.getDate() === day
      );
    }

    if (periodoFiltro === 'semana') {
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }

    if (periodoFiltro === 'mes') {
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    return true; // 'todo'
  };

  const ventasFiltradas = useMemo(
    () => ventas.filter((v) => isDateInFilter(v.created_at)),
    [ventas, selectedDate, periodoFiltro]
  );

  const gastosFiltrados = useMemo(
    () => gastos.filter((g) => isDateInFilter(g.fecha)),
    [gastos, selectedDate, periodoFiltro]
  );

  const abonosCxCFiltrados = useMemo(
    () => abonosCxC.filter((a) => isDateInFilter(a.created_at)),
    [abonosCxC, selectedDate, periodoFiltro]
  );

  // Metrics
  const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + g.valor, 0);
  const balanceTotal = totalVentas - totalGastos;

  const costoTotalVentas = useMemo(() => {
    return ventasFiltradas.reduce((sum, v) => {
      const costoItems = (v.items || []).reduce(
        (subSum, item) => subSum + (item.costo_unitario || 0) * item.cantidad,
        0
      );
      return sum + costoItems;
    }, 0);
  }, [ventasFiltradas]);

  const gananciaEstimada = totalVentas - costoTotalVentas;

  // Unify Transactions
  const transaccionesUnificadas = useMemo(() => {
    const list: {
      id: string;
      tipo: 'ingreso' | 'egreso';
      concepto: string;
      valor: number;
      medioPago: string;
      fecha: string;
      folio?: string;
    }[] = [];

    ventasFiltradas.forEach((v) => {
      list.push({
        id: v.id,
        tipo: 'ingreso',
        concepto: v.cliente ? `Venta a ${v.cliente.nombre}` : 'Venta de Mostrador',
        valor: v.total,
        medioPago: v.medio_pago,
        fecha: v.created_at,
        folio: v.numero_folio,
      });
    });

    gastosFiltrados.forEach((g) => {
      list.push({
        id: g.id,
        tipo: 'egreso',
        concepto: g.concepto,
        valor: g.valor,
        medioPago: g.medio_pago,
        fecha: g.fecha,
      });
    });

    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [ventasFiltradas, gastosFiltrados]);

  const transaccionesFiltradas = useMemo(() => {
    return transaccionesUnificadas.filter((t) => {
      const matchSearch =
        searchTerm === '' ||
        t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.folio && t.folio.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;
      if (activeSubTab === 'ingresos') return t.tipo === 'ingreso';
      if (activeSubTab === 'egresos') return t.tipo === 'egreso';
      return true;
    });
  }, [transaccionesUnificadas, searchTerm, activeSubTab]);

  // PDF Export
  const handleExportPDF = () => {
    exportBalanceToPDF({
      negocioNombre: negocio.nombre,
      documentoIdentidad: negocio.documento_identidad,
      periodoLabel:
        periodoFiltro === 'dia'
          ? `Fecha: ${selectedDate}`
          : periodoFiltro === 'semana'
          ? 'Últimos 7 Días'
          : periodoFiltro === 'mes'
          ? 'Este Mes'
          : 'Histórico Completo',
      fechaReporte: formatDateTime(new Date().toISOString()),
      totalVentas: totalVentas,
      totalGastos: totalGastos,
      balanceNeto: balanceTotal,
      costoVentas: costoTotalVentas,
      gananciaEstimada: gananciaEstimada,
      totalPorCobrar: cuentasPorCobrar
        .filter((c) => c.estado !== 'pagada')
        .reduce((sum, c) => sum + c.saldo_pendiente, 0),
      totalPorPagar: cuentasPorPagar
        .filter((c) => c.estado !== 'pagada')
        .reduce((sum, c) => sum + c.saldo_pendiente, 0),
      desgloseMedios: [],
      transacciones: transaccionesUnificadas.map((t) => ({
        tipo: t.tipo,
        concepto: t.concepto,
        medioPago: t.medioPago,
        fecha: t.fecha,
        monto: t.valor,
      })),
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-slate-50">
      {/* 1. TOP HEADER (EXACT TREINTA BALANCE) */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Balance</h2>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Abrir caja */}
          <button
            onClick={onOpenCashModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-2xl shadow-sm transition"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{cajaSesion?.estado === 'abierta' ? 'Caja Abierta' : 'Abrir caja'}</span>
          </button>

          {/* Descargar reporte */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-extrabold rounded-2xl shadow-sm transition"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Descargar reporte</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN BODY */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Main Segment Switcher: Transacciones | Cierres de caja */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center max-w-2xl mx-auto shadow-inner">
          <button
            onClick={() => setActiveMainTab('transacciones')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeMainTab === 'transacciones'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transacciones
          </button>
          <button
            onClick={() => setActiveMainTab('cierres')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeMainTab === 'cierres'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cierres de caja
          </button>
        </div>

        {/* Filter Bar: Filtrar + Dropdown + DatePicker + Search */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-3xl border border-slate-200 shadow-sm">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtrar</span>
          </button>

          <div className="relative">
            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value as any)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-sm"
            >
              <option value="dia">Diario</option>
              <option value="semana">Semanal</option>
              <option value="mes">Mensual</option>
              <option value="todo">Histórico</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
            />
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* 3. THREE STAT CARDS (EXACT TREINTA LAYOUT) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Balance */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">Balance</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(balanceTotal)}
              </div>
            </div>
          </div>

          {/* Card 2: Ventas totales */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">Ventas totales</div>
              <div className="text-2xl font-black text-[#10B981] tracking-tight">
                {formatCurrency(totalVentas)}
              </div>
            </div>
          </div>

          {/* Card 3: Gastos totales */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">Gastos totales</div>
              <div className="text-2xl font-black text-rose-600 tracking-tight">
                {formatCurrency(totalGastos)}
              </div>
            </div>
          </div>
        </div>

        {/* 4. SUB-TABS: Ingresos | Egresos | Por cobrar | Por pagar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-around border-b border-slate-200 bg-white">
            <button
              onClick={() => setActiveSubTab('ingresos')}
              className={`py-4 px-6 text-sm font-extrabold transition-all relative ${
                activeSubTab === 'ingresos'
                  ? 'text-slate-950 border-b-2 border-slate-950'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ingresos ({ventasFiltradas.length})
            </button>

            <button
              onClick={() => setActiveSubTab('egresos')}
              className={`py-4 px-6 text-sm font-extrabold transition-all relative ${
                activeSubTab === 'egresos'
                  ? 'text-slate-950 border-b-2 border-slate-950'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Egresos ({gastosFiltrados.length})
            </button>

            <button
              onClick={() => setActiveSubTab('por_cobrar')}
              className={`py-4 px-6 text-sm font-extrabold transition-all relative ${
                activeSubTab === 'por_cobrar'
                  ? 'text-slate-950 border-b-2 border-slate-950'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Por cobrar ({cuentasPorCobrar.filter((c) => c.estado !== 'pagada').length})
            </button>

            <button
              onClick={() => setActiveSubTab('por_pagar')}
              className={`py-4 px-6 text-sm font-extrabold transition-all relative ${
                activeSubTab === 'por_pagar'
                  ? 'text-slate-950 border-b-2 border-slate-950'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Por pagar ({cuentasPorPagar.filter((c) => c.estado !== 'pagada').length})
            </button>
          </div>

          {/* Table Content */}
          <div className="p-2">
            {['ingresos', 'egresos'].includes(activeSubTab) && (
              transaccionesFiltradas.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-xs">No hay registros para este período</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/70 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-6">Concepto</th>
                      <th className="py-3.5 px-6 text-right">Valor</th>
                      <th className="py-3.5 px-6 text-center">Medio de pago</th>
                      <th className="py-3.5 px-6 text-right">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transaccionesFiltradas.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                t.tipo === 'ingreso'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {t.tipo === 'ingreso' ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <Receipt className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {t.concepto}
                              </span>
                              {t.folio && (
                                <span className="ml-2 font-mono text-[10px] text-slate-400">
                                  #{t.folio}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right font-black text-sm">
                          <span
                            className={
                              t.tipo === 'ingreso' ? 'text-[#10B981]' : 'text-slate-900'
                            }
                          >
                            {formatCurrency(t.valor)}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className="capitalize font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full text-[11px]">
                            {t.medioPago}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right text-slate-500 font-semibold text-xs">
                          {formatDateTime(t.fecha)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Sub-tab: Por Cobrar */}
            {activeSubTab === 'por_cobrar' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/70 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Cliente</th>
                    <th className="py-3.5 px-6 text-right">Total Fiado</th>
                    <th className="py-3.5 px-6 text-right">Saldo Pendiente</th>
                    <th className="py-3.5 px-6 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cuentasPorCobrar.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                        {c.cliente?.nombre}
                      </td>
                      <td className="py-4 px-6 text-right text-slate-600 font-bold">
                        {formatCurrency(c.monto_total)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-amber-600 text-sm">
                        {formatCurrency(c.saldo_pendiente)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {c.saldo_pendiente > 0 ? (
                          <button
                            onClick={() => setSelectedCuenta({ tipo: 'cobrar', cuenta: c })}
                            className="px-4 py-1.5 bg-[#10B981] hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-sm transition"
                          >
                            Registrar Abono
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-extrabold">Pagado ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Sub-tab: Por Pagar */}
            {activeSubTab === 'por_pagar' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/70 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Proveedor</th>
                    <th className="py-3.5 px-6 text-right">Total Deuda</th>
                    <th className="py-3.5 px-6 text-right">Saldo Pendiente</th>
                    <th className="py-3.5 px-6 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cuentasPorPagar.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                        {c.proveedor?.nombre}
                      </td>
                      <td className="py-4 px-6 text-right text-slate-600 font-bold">
                        {formatCurrency(c.monto_total)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-rose-600 text-sm">
                        {formatCurrency(c.saldo_pendiente)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {c.saldo_pendiente > 0 ? (
                          <button
                            onClick={() => setSelectedCuenta({ tipo: 'pagar', cuenta: c })}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs shadow-sm transition"
                          >
                            Pagar Abono
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-extrabold">Saldado ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Abono Modal */}
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
