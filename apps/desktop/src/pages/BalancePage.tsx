import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Receipt,
  FileText,
  FileSpreadsheet,
  Building2,
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

  // Navigation / View Modes
  const [viewMode, setViewMode] = useState<'treinta_detail' | 'transactions_list'>('treinta_detail');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0); // 0 = Hoy, 1 = Ayer, etc.
  const [periodoFiltro, setPeriodoFiltro] = useState<'dia' | 'semana' | 'mes' | 'todo'>('dia');

  // Accordion Expand/Collapse states
  const [isGananciaExpanded, setIsGananciaExpanded] = useState<boolean>(true);
  const [expandedMedios, setExpandedMedios] = useState<Record<string, boolean>>({
    efectivo: true,
    nequi: true,
    daviplata: false,
    tarjeta: false,
    transferencia: false,
    credito: false,
  });

  // Table Tabs & Modals
  const [activeTableTab, setActiveTableTab] = useState<'todos' | 'ingresos' | 'egresos' | 'por_cobrar' | 'por_pagar'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuenta, setSelectedCuenta] = useState<{
    tipo: 'cobrar' | 'pagar';
    cuenta: CuentaPorCobrar | CuentaPorPagar;
  } | null>(null);

  const toggleMedio = (id: string) => {
    setExpandedMedios((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate 4 dynamic recent day options for the top bar (e.g. 22 ago, 23 ago, 24 ago, 25 ago)
  const recentDays = useMemo(() => {
    const days = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
      days.push({ offset: i, date: d, label });
    }
    return days;
  }, []);

  // Filter Transactions by selected period / day
  const isDateInFilter = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();

    if (periodoFiltro === 'dia') {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - selectedDayOffset);
      return (
        d.getDate() === targetDate.getDate() &&
        d.getMonth() === targetDate.getMonth() &&
        d.getFullYear() === targetDate.getFullYear()
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
    [ventas, selectedDayOffset, periodoFiltro]
  );

  const gastosFiltrados = useMemo(
    () => gastos.filter((g) => isDateInFilter(g.fecha)),
    [gastos, selectedDayOffset, periodoFiltro]
  );

  const abonosCxCFiltrados = useMemo(
    () => abonosCxC.filter((a) => isDateInFilter(a.created_at)),
    [abonosCxC, selectedDayOffset, periodoFiltro]
  );

  const abonosCxPFiltrados = useMemo(
    () => abonosCxP.filter((a) => isDateInFilter(a.created_at)),
    [abonosCxP, selectedDayOffset, periodoFiltro]
  );

  // Totales
  const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
  const totalEgresos = gastosFiltrados.reduce((sum, g) => sum + g.valor, 0);
  const balanceTotal = totalIngresos - totalEgresos;

  // Costo total de productos vendidos en el período
  const costoTotalVentas = useMemo(() => {
    return ventasFiltradas.reduce((sum, v) => {
      const costoItems = (v.items || []).reduce(
        (subSum, item) => subSum + (item.costo_unitario || 0) * item.cantidad,
        0
      );
      return sum + costoItems;
    }, 0);
  }, [ventasFiltradas]);

  const gananciaEstimada = totalIngresos - costoTotalVentas;

  // Totales pendientes de cuentas
  const totalPorCobrar = cuentasPorCobrar
    .filter((c) => c.estado !== 'pagada')
    .reduce((sum, c) => sum + c.saldo_pendiente, 0);

  const totalPorPagar = cuentasPorPagar
    .filter((c) => c.estado !== 'pagada')
    .reduce((sum, c) => sum + c.saldo_pendiente, 0);

  // Desglose por Medio de Pago (Efectivo, Tarjeta, Transferencia, Nequi, Daviplata, Fiado)
  const mediosDePagoKeys: { id: MedioPago | 'otro'; label: string }[] = [
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'tarjeta', label: 'Tarjeta' },
    { id: 'transferencia', label: 'Transferencia bancaria' },
    { id: 'nequi', label: 'Nequi' },
    { id: 'daviplata', label: 'Daviplata' },
    { id: 'credito', label: 'Fiado (Por Cobrar)' },
  ];

  const desglosePorMedio = useMemo(() => {
    return mediosDePagoKeys.map((m) => {
      const vtas = ventasFiltradas
        .filter((v) => v.medio_pago === m.id)
        .reduce((sum, v) => sum + v.total, 0);

      const abonosRecibidos = abonosCxCFiltrados
        .filter((a) => a.medio_pago === m.id)
        .reduce((sum, a) => sum + a.monto, 0);

      const egresos = gastosFiltrados
        .filter((g) => g.medio_pago === m.id)
        .reduce((sum, g) => sum + g.valor, 0);

      const balanceMedio = vtas + abonosRecibidos - egresos;

      return {
        id: m.id,
        nombre: m.label,
        ventas: vtas,
        abonos: abonosRecibidos,
        gastos: egresos,
        balance: balanceMedio,
      };
    });
  }, [ventasFiltradas, abonosCxCFiltrados, gastosFiltrados]);

  // Transacciones Unificadas para la pestaña de tabla
  const transaccionesUnificadas = useMemo(() => {
    const list: {
      id: string;
      tipo: 'ingreso' | 'egreso';
      concepto: string;
      subconcepto?: string;
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
        subconcepto: v.items?.map((i) => `${i.cantidad}x ${i.nombre_producto}`).join(', '),
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
        subconcepto: g.categoria + (g.proveedor ? ` • ${g.proveedor.nombre}` : ''),
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
        (t.subconcepto && t.subconcepto.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.folio && t.folio.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;
      if (activeTableTab === 'ingresos') return t.tipo === 'ingreso';
      if (activeTableTab === 'egresos') return t.tipo === 'egreso';
      return true;
    });
  }, [transaccionesUnificadas, searchTerm, activeTableTab]);

  // Exportar a PDF
  const handleExportPDF = () => {
    const periodoNombre =
      periodoFiltro === 'dia'
        ? `Día ${recentDays.find((d) => d.offset === selectedDayOffset)?.label || 'Hoy'}`
        : periodoFiltro === 'semana'
        ? 'Últimos 7 Días'
        : periodoFiltro === 'mes'
        ? 'Este Mes'
        : 'Histórico Completo';

    exportBalanceToPDF({
      negocioNombre: negocio.nombre,
      documentoIdentidad: negocio.documento_identidad,
      periodoLabel: periodoNombre,
      fechaReporte: formatDateTime(new Date().toISOString()),
      totalVentas: totalIngresos,
      totalGastos: totalEgresos,
      balanceNeto: balanceTotal,
      costoVentas: costoTotalVentas,
      gananciaEstimada: gananciaEstimada,
      totalPorCobrar,
      totalPorPagar,
      desgloseMedios: desglosePorMedio,
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
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-slate-100">
      {/* 1. TOP GREEN BANNER (TREINTA EMERALD THEME) */}
      <div className="bg-emerald-600 text-white px-6 pt-4 pb-3 shadow-md shrink-0 border-b border-emerald-700">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <span>Detalle del balance</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-emerald-700/90 p-0.5 rounded-xl flex items-center text-xs font-bold border border-emerald-500/50">
              <button
                onClick={() => setViewMode('treinta_detail')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'treinta_detail'
                    ? 'bg-white text-slate-950 shadow-sm font-black'
                    : 'text-emerald-100 hover:bg-emerald-700'
                }`}
              >
                Vista Treinta
              </button>
              <button
                onClick={() => setViewMode('transactions_list')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'transactions_list'
                    ? 'bg-white text-slate-950 shadow-sm font-black'
                    : 'text-emerald-100 hover:bg-emerald-700'
                }`}
              >
                Tabla & Fiados
              </button>
            </div>

            {/* PDF Export Button */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition"
              title="Descargar reporte en formato PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {periodoFiltro === 'dia' ? (
              recentDays.map((d) => {
                const isSelected = selectedDayOffset === d.offset;
                return (
                  <button
                    key={d.offset}
                    onClick={() => setSelectedDayOffset(d.offset)}
                    className={`px-5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-150 ${
                      isSelected
                        ? 'bg-white text-emerald-950 shadow-md ring-1 ring-white/20'
                        : 'text-emerald-100 hover:bg-emerald-700/70'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })
            ) : (
              <span className="text-xs font-bold text-emerald-100 px-2">
                Filtro activo: {periodoFiltro.toUpperCase()}
              </span>
            )}
          </div>

          {/* Period selector dropdown */}
          <div className="flex items-center gap-1.5 bg-emerald-700/90 border border-emerald-500/60 rounded-xl px-2.5 py-1 text-xs font-bold text-white">
            <Calendar className="w-3.5 h-3.5 text-emerald-200" />
            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value as any)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-white"
            >
              <option value="dia" className="text-slate-900">Por Día</option>
              <option value="semana" className="text-slate-900">Últimos 7 Días</option>
              <option value="mes" className="text-slate-900">Este Mes</option>
              <option value="todo" className="text-slate-900">Histórico</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. MAIN BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
        {viewMode === 'treinta_detail' ? (
          /* ========================================================================= */
          /* VISTA DETALLE DEL BALANCE (IDÉNTICA A TREINTA - image.png y image copy.png) */
          /* ========================================================================= */
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* CARD 1: INGRESOS, EGRESOS & BALANCE */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Ingresos */}
                <div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    <span>Ingresos</span>
                  </div>
                  <div className="text-2xl font-black text-slate-950 tracking-tight">
                    {formatCurrency(totalIngresos)}
                  </div>
                </div>

                {/* Egresos */}
                <div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-1">
                    <ArrowDownLeft className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                    <span>Egresos</span>
                  </div>
                  <div className="text-2xl font-black text-rose-600 tracking-tight">
                    -{formatCurrency(totalEgresos)}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Balance</span>
                <span className="text-2xl font-extrabold text-[#00A86B]">
                  {formatCurrency(balanceTotal)}
                </span>
              </div>
            </div>

            {/* CARD 2: GANANCIA ESTIMADA (ACORDEÓN) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-3">
              <div
                onClick={() => setIsGananciaExpanded(!isGananciaExpanded)}
                className="flex items-center justify-between cursor-pointer"
              >
                <h3 className="font-extrabold text-base text-slate-900">Ganancia</h3>
                <button className="text-slate-500 hover:text-slate-900 p-1">
                  {isGananciaExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isGananciaExpanded && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Se calcula restando de tus ventas el costo que tienes registrado en los productos.
                  </p>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Ventas</span>
                      <span className="font-bold text-slate-900">{formatCurrency(totalIngresos)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Costo de productos que vendiste</span>
                      <span className="font-bold text-rose-600">-{formatCurrency(costoTotalVentas)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 uppercase">Ganancia estimada</span>
                    <span className="font-black text-xl text-slate-950">
                      {formatCurrency(gananciaEstimada)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CARDS 3..N: DESGLOSE POR MEDIO DE PAGO */}
            <div className="space-y-3 pt-2">
              <div className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Detalle por Forma de Pago
              </div>

              {desglosePorMedio.map((medio) => {
                const isExpanded = expandedMedios[medio.id] || false;

                return (
                  <div
                    key={medio.id}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 transition"
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => toggleMedio(medio.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-extrabold text-sm text-slate-900">
                        {medio.nombre}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-base text-slate-950">
                          {formatCurrency(medio.balance)}
                        </span>
                        <button className="text-slate-400 hover:text-slate-700">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Breakdown */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs animate-in fade-in duration-150">
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Ventas</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(medio.ventas)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Abonos</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(medio.abonos)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Gastos</span>
                          <span className="font-semibold text-rose-600">
                            {medio.gastos > 0 ? `-${formatCurrency(medio.gastos)}` : '$0'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold">
                          <span className="text-slate-900">Balance total registrado</span>
                          <span className="text-slate-950 text-sm font-black">{formatCurrency(medio.balance)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VISTA TABLA DE TRANSACCIONES & CUENTAS POR COBRAR/PAGAR */
          /* ========================================================================= */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-150">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setActiveTableTab('todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTableTab === 'todos'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({transaccionesUnificadas.length})
                </button>
                <button
                  onClick={() => setActiveTableTab('ingresos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTableTab === 'ingresos'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Ingresos ({ventasFiltradas.length})
                </button>
                <button
                  onClick={() => setActiveTableTab('egresos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTableTab === 'egresos'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Egresos ({gastosFiltrados.length})
                </button>
                <button
                  onClick={() => setActiveTableTab('por_cobrar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTableTab === 'por_cobrar'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Por Cobrar ({cuentasPorCobrar.filter((c) => c.estado !== 'pagada').length})
                </button>
                <button
                  onClick={() => setActiveTableTab('por_pagar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTableTab === 'por_pagar'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Por Pagar ({cuentasPorPagar.filter((c) => c.estado !== 'pagada').length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en transacciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Transactions Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {['todos', 'ingresos', 'egresos'].includes(activeTableTab) && (
                transaccionesFiltradas.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No hay transacciones registradas</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Concepto</th>
                        <th className="py-3 px-4">Medio</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transaccionesFiltradas.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                t.tipo === 'ingreso'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {t.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">{t.concepto}</span>
                            {t.folio && (
                              <span className="ml-2 font-mono text-[10px] text-slate-400">
                                #{t.folio}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 capitalize text-slate-600 font-medium">
                            {t.medioPago}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{formatDateTime(t.fecha)}</td>
                          <td className="py-3 px-4 text-right font-black text-sm">
                            <span
                              className={
                                t.tipo === 'ingreso' ? 'text-emerald-700' : 'text-rose-600'
                              }
                            >
                              {t.tipo === 'ingreso' ? '+' : '-'}
                              {formatCurrency(t.valor)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {/* Por Cobrar */}
              {activeTableTab === 'por_cobrar' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                      <th className="py-3 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cuentasPorCobrar.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.cliente?.nombre}</td>
                        <td className="py-3 px-4 text-slate-600">{formatCurrency(c.monto_total)}</td>
                        <td className="py-3 px-4 text-right font-black text-amber-600">
                          {formatCurrency(c.saldo_pendiente)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.saldo_pendiente > 0 ? (
                            <button
                              onClick={() => setSelectedCuenta({ tipo: 'cobrar', cuenta: c })}
                              className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
                            >
                              Abonar
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold">Pagado ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Por Pagar */}
              {activeTableTab === 'por_pagar' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                      <th className="py-3 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cuentasPorPagar.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.proveedor?.nombre}</td>
                        <td className="py-3 px-4 text-slate-600">{formatCurrency(c.monto_total)}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-600">
                          {formatCurrency(c.saldo_pendiente)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.saldo_pendiente > 0 ? (
                            <button
                              onClick={() => setSelectedCuenta({ tipo: 'pagar', cuenta: c })}
                              className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg text-xs"
                            >
                              Pagar Abono
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold">Saldado ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
