import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TrendingDown,
  Clock,
  Users,
  Shield,
  Store,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export type TabView =
  | 'pos'
  | 'balance'
  | 'inventory'
  | 'expenses'
  | 'credit'
  | 'contacts'
  | 'employees';

interface SidebarProps {
  currentTab: TabView;
  onSelectTab: (tab: TabView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { negocio, usuarioActual, cambiarRol } = useAppStore();

  const navItems: { id: TabView; label: string; icon: React.ReactNode; roles: string[] }[] = [
    { id: 'pos', label: 'Nueva Venta (POS)', icon: <ShoppingCart className="w-5 h-5" />, roles: ['propietario', 'administrador', 'vendedor', 'empleado'] },
    { id: 'balance', label: 'Balance General', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['propietario', 'administrador'] },
    { id: 'inventory', label: 'Inventario & Stock', icon: <Package className="w-5 h-5" />, roles: ['propietario', 'administrador', 'vendedor', 'empleado'] },
    { id: 'expenses', label: 'Gastos & Egresos', icon: <TrendingDown className="w-5 h-5" />, roles: ['propietario', 'administrador'] },
    { id: 'credit', label: 'Cuentas (Fiados)', icon: <Clock className="w-5 h-5" />, roles: ['propietario', 'administrador'] },
    { id: 'contacts', label: 'Clientes y Prov.', icon: <Users className="w-5 h-5" />, roles: ['propietario', 'administrador'] },
    { id: 'employees', label: 'Empleados & Roles', icon: <Shield className="w-5 h-5" />, roles: ['propietario', 'administrador'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 h-screen select-none border-r border-slate-800">
      {/* Brand & Business */}
      <div>
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-xl text-slate-950 shadow-md shadow-emerald-500/20">
              30
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-base leading-tight truncate text-white">Treinta App</h1>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <Store className="w-3 h-3" />
                <span className="truncate">{negocio.nombre}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Módulos del Negocio
          </div>
          {navItems.map((item) => {
            const hasAccess = item.roles.includes(usuarioActual.rol);
            const isActive = currentTab === item.id;

            if (!hasAccess) {
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-500 text-sm opacity-50 cursor-not-allowed"
                  title="Acceso restringido para el rol actual"
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  <Shield className="w-3.5 h-3.5 ml-auto text-slate-500" />
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User info & Role switcher */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 truncate">{usuarioActual.nombre}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {usuarioActual.rol}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Modo de Prueba de Rol:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => cambiarRol('propietario')}
              className={`text-[11px] py-1 rounded font-medium transition ${
                usuarioActual.rol === 'propietario'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              👑 Admin
            </button>
            <button
              onClick={() => {
                cambiarRol('empleado');
                if (['balance', 'expenses', 'credit', 'contacts'].includes(currentTab)) {
                  onSelectTab('pos');
                }
              }}
              className={`text-[11px] py-1 rounded font-medium transition ${
                usuarioActual.rol === 'empleado'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🧑‍💼 Empleado
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
