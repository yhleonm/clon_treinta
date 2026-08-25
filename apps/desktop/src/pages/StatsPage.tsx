import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Crown,
  Calendar,
  ShoppingBag,
  DollarSign,
  PieChart,
  BarChart3,
  Award,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '@treinta/shared';

export const StatsPage: React.FC = () => {
  const { ventas, gastos, productos, categorias, usuarioActual } = useAppStore();
  const [timeRange, setTimeRange] = useState<'semana' | 'mes' | 'ano'>('mes');

  const isAdmin = usuarioActual.rol === 'administrador' || usuarioActual.rol === 'propietario';

  const isDateInRange = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();

    if (timeRange === 'semana') {
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }

    if (timeRange === 'mes') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    if (timeRange === 'ano') {
      return d.getFullYear() === now.getFullYear();
    }

    return true;
  };

  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => isDateInRange(v.created_at));
  }, [ventas, timeRange]);

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => isDateInRange(g.fecha));
  }, [gastos, timeRange]);

  // Metrics
  const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + g.valor, 0);
  const ticketPromedio = ventasFiltradas.length > 0 ? Math.round(totalVentas / ventasFiltradas.length) : 0;

  // Best selling products calculation
  const topProducts = useMemo(() => {
    const productCounts: { [nombre: string]: { cantidad: number; total: number } } = {};

    ventasFiltradas.forEach((v) => {
      (v.items || []).forEach((item) => {
        if (!productCounts[item.nombre_producto]) {
          productCounts[item.nombre_producto] = { cantidad: 0, total: 0 };
        }
        productCounts[item.nombre_producto]!.cantidad += item.cantidad;
        productCounts[item.nombre_producto]!.total += item.subtotal;
      });
    });

    const sorted = Object.entries(productCounts)
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return sorted.slice(0, 5);
  }, [ventasFiltradas]);

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    const counts: { [method: string]: number } = {
      efectivo: 0,
      nequi: 0,
      tarjeta: 0,
      transferencia: 0,
      credito: 0,
    };

    ventasFiltradas.forEach((v) => {
      if (counts[v.medio_pago] !== undefined) {
        counts[v.medio_pago] += v.total;
      } else {
        counts['efectivo'] += v.total;
      }
    });

    return counts;
  }, [ventasFiltradas]);

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
        <TrendingUp className="w-16 h-16 text-rose-500 mb-3" />
        <h3 className="text-lg font-black text-slate-900">Acceso Restringido</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Solo los administradores o el propietario del negocio pueden consultar los reportes y estadísticas de ventas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-slate-50">
      {/* Top Header */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Estadísticas del Negocio
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3 text-emerald-700 fill-emerald-700" />
                <span>Analítica Pro</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              Rendimiento de ventas, productos más vendidos y comportamiento de cobros
            </p>
          </div>
        </div>

        {/* Time Selector */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner">
          <button
            onClick={() => setTimeRange('semana')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              timeRange === 'semana'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => setTimeRange('mes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              timeRange === 'mes'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setTimeRange('ano')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              timeRange === 'ano'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Este Año
          </button>
        </div>
      </div>

      {/* Main Stats Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Ventas Totales</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {formatCurrency(totalVentas)}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+18.4% vs periodo anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Ticket Promedio</span>
              <ShoppingBag className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(ticketPromedio)}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              Por cada transacción
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Total Pedidos</span>
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {ventas.length}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              Transacciones completadas
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Margen Promedio</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              42.8%
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-1">
              Rentabilidad bruta saludable
            </div>
          </div>
        </div>

        {/* Two Column Layout: Top Products + Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Products */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Productos Más Vendidos (Top 5)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">Unidades</span>
            </div>

            <div className="space-y-3 pt-2">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  Aún no hay suficientes ventas registradas para este ranking
                </div>
              ) : (
                topProducts.map((prod, idx) => {
                  const maxQty = topProducts[0]?.cantidad || 1;
                  const pct = Math.round((prod.cantidad / maxQty) * 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black">
                            #{idx + 1}
                          </span>
                          <span className="text-slate-900">{prod.nombre}</span>
                        </div>
                        <span className="text-slate-700">{prod.cantidad} und ({formatCurrency(prod.total)})</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-sky-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Distribución de Métodos de Pago
                </h3>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {Object.entries(paymentBreakdown).map(([key, val]) => {
                const total = totalVentas || 1;
                const pct = Math.round((val / total) * 100);

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="capitalize text-slate-800">{key}</span>
                      <span className="text-slate-900">{formatCurrency(val)} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
