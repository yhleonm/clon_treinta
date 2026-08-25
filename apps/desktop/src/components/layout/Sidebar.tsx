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
  LogOut,
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
  const { negocio, usuarioActual, logout } = useAppStore();

  const isAdmin = usuarioActual.rol === 'administrador' || usuarioActual.rol === 'propietario';

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
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-500 text-sm opacity-40 cursor-not-allowed"
                  title="Acceso restringido para tu rol actual"
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  <Shield className="w-3.5 h-3.5 ml-auto text-slate-600" />
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

      {/* User profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <div className="text-xs font-bold text-slate-200 truncate">{usuarioActual.nombre}</div>
              <div className="text-[10px] text-slate-400 truncate">{usuarioActual.email}</div>
            </div>
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-extrabold tracking-wide border ${
                isAdmin
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              }`}
            >
              {usuarioActual.rol}
            </span>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl bg-slate-700/70 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-600/50 hover:border-rose-800/50 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
