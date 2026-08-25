import React from 'react';
import {
  Tag,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Package,
  FileCheck,
  Users,
  Globe,
  UserCheck,
  Truck,
  Settings,
  LogOut,
  ChevronDown,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export type TabView =
  | 'pos'
  | 'balance'
  | 'inventory'
  | 'expenses'
  | 'credit'
  | 'contacts'
  | 'employees'
  | 'invoicing'
  | 'stats'
  | 'quotes'
  | 'store';

interface SidebarProps {
  currentTab: TabView;
  onSelectTab: (tab: TabView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { negocio, usuarioActual, logout } = useAppStore();

  const isAdmin = usuarioActual.rol === 'administrador' || usuarioActual.rol === 'propietario';

  return (
    <aside className="w-64 bg-white text-slate-800 flex flex-col justify-between shrink-0 h-screen select-none border-r border-slate-200 shadow-sm z-20">
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-sm">
            30
          </div>
          <span className="font-black text-xl text-slate-900 tracking-tight">Treinta</span>
        </div>

        {/* Business & Active User Selector Pill */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-inner">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                {usuarioActual.nombre ? usuarioActual.nombre.slice(0, 2).toUpperCase() : '30'}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs text-slate-900 truncate">
                    {usuarioActual.nombre}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                      usuarioActual.rol === 'vendedor'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {usuarioActual.rol}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
                  {negocio.nombre}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: GESTIONA TU NEGOCIO */}
        <div className="px-4 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Gestiona tu negocio
          </div>

          {/* 1. Vender */}
          <button
            onClick={() => onSelectTab('pos')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
              currentTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            <span>Vender</span>
          </button>

          {/* 2. Balance */}
          {isAdmin ? (
            <button
              onClick={() => onSelectTab('balance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                currentTab === 'balance'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Balance</span>
            </button>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2.5 text-slate-400 text-xs font-medium opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Balance</span>
              </div>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">🔒</span>
            </div>
          )}

          {/* 3. Facturación electrónica 👑 */}
          {isAdmin ? (
            <button
              onClick={() => onSelectTab('invoicing')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                currentTab === 'invoicing'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Facturación electrónica</span>
              </div>
              <Crown
                className={`w-3.5 h-3.5 ${
                  currentTab === 'invoicing'
                    ? 'text-amber-300 fill-amber-300'
                    : 'text-emerald-600 fill-emerald-600'
                }`}
              />
            </button>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2.5 text-slate-400 text-xs font-medium opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Facturación electrónica</span>
              </div>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">🔒</span>
            </div>
          )}

          {/* 4. Estadísticas 👑 */}
          {isAdmin ? (
            <button
              onClick={() => onSelectTab('stats')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                currentTab === 'stats'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Estadísticas</span>
              </div>
              <Crown
                className={`w-3.5 h-3.5 ${
                  currentTab === 'stats'
                    ? 'text-amber-300 fill-amber-300'
                    : 'text-emerald-600 fill-emerald-600'
                }`}
              />
            </button>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2.5 text-slate-400 text-xs font-medium opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Estadísticas</span>
              </div>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">🔒</span>
            </div>
          )}

          {/* 5. Inventario */}
          <button
            onClick={() => onSelectTab('inventory')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
              currentTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Inventario</span>
          </button>

          {/* 6. Cotizaciones 👑 */}
          <button
            onClick={() => onSelectTab('quotes')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
              currentTab === 'quotes'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>Cotizaciones</span>
            </div>
            <Crown
              className={`w-3.5 h-3.5 ${
                currentTab === 'quotes'
                  ? 'text-amber-300 fill-amber-300'
                  : 'text-emerald-600 fill-emerald-600'
              }`}
            />
          </button>

          {/* 7. Empleados 👑 */}
          {isAdmin ? (
            <button
              onClick={() => onSelectTab('employees')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
                currentTab === 'employees'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>Empleados</span>
              </div>
              <Crown
                className={`w-3.5 h-3.5 ${
                  currentTab === 'employees'
                    ? 'text-amber-300 fill-amber-300'
                    : 'text-emerald-600 fill-emerald-600'
                }`}
              />
            </button>
          ) : null}

          {/* 8. Sitio Web 👑 */}
          <button
            onClick={() => onSelectTab('store')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
              currentTab === 'store'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 shrink-0" />
              <span>Sitio Web</span>
            </div>
            <Crown
              className={`w-3.5 h-3.5 ${
                currentTab === 'store'
                  ? 'text-amber-300 fill-amber-300'
                  : 'text-emerald-600 fill-emerald-600'
              }`}
            />
          </button>
        </div>

        {/* SECTION 2: GESTIONA TUS CONTACTOS */}
        <div className="px-4 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Gestiona tus contactos
          </div>

          <button
            onClick={() => onSelectTab('contacts')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition ${
              currentTab === 'contacts'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Clientes</span>
            </div>
            <Crown
              className={`w-3.5 h-3.5 ${
                currentTab === 'contacts'
                  ? 'text-amber-300 fill-amber-300'
                  : 'text-emerald-600 fill-emerald-600'
              }`}
            />
          </button>

          <button
            onClick={() => onSelectTab('contacts')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 shrink-0" />
              <span>Proveedores</span>
            </div>
            <Crown className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
          </button>
        </div>
      </div>

      {/* FOOTER & LOGOUT */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
            30
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-slate-800">
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Configuración</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">v5.5.6</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
