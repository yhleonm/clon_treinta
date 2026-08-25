import React, { useState } from 'react';
import {
  Store,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Phone,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const AuthPage: React.FC = () => {
  const { login, registerBusiness, demoLogin, loadDemoBusiness, usuarios, negocio } = useAppStore();

  const isDemoBusiness = negocio.id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState(
    isDemoBusiness ? 'jackeline@eltriunfo.com' : (usuarios[0]?.email || '')
  );
  const [loginPassword, setLoginPassword] = useState(
    isDemoBusiness ? '1234' : ((usuarios[0] as any)?.password || '')
  );
  const [loginError, setLoginError] = useState('');

  // Update default inputs when negocio changes
  React.useEffect(() => {
    if (isDemoBusiness) {
      setLoginIdentifier('jackeline@eltriunfo.com');
      setLoginPassword('1234');
    } else {
      setLoginIdentifier(usuarios[0]?.email || '');
      setLoginPassword((usuarios[0] as any)?.password || '');
    }
  }, [negocio.id, isDemoBusiness, usuarios]);

  // Register form state
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Por favor ingresa tu correo o celular');
      return;
    }

    const res = login(loginIdentifier, loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Credenciales incorrectas');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!businessName.trim() || !ownerName.trim() || !registerEmail.trim()) {
      setRegisterError('Por favor completa todos los campos requeridos');
      return;
    }

    const res = registerBusiness(
      businessName,
      ownerName,
      registerEmail,
      registerPassword
    );

    if (!res.success) {
      setRegisterError(res.error || 'Error al registrar negocio');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-900 flex flex-col lg:flex-row select-none">
      {/* LEFT COLUMN: BRAND HERO & PRESENTATION */}
      <div className="lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 lg:p-14 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-950/20">
            30
          </div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-tight leading-none">Treinta</h1>
            <p className="text-emerald-100 text-xs font-semibold mt-0.5">
              Gestión de Negocio Inteligente
            </p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="my-10 space-y-6 relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-bold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Multi-usuario y control de caja</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
            Control total de tus <span className="text-emerald-200">ventas</span>,{' '}
            <span className="text-amber-200">inventario</span> y balances.
          </h2>

          <ul className="space-y-3 text-sm text-emerald-50">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>Punto de venta (POS) rápido y cobros multimoneda.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>Inventario actualizado en tiempo real con alertas de stock.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>Balances financieros y control de fiados a clientes.</span>
            </li>
          </ul>
        </div>

        {/* Footer Note */}
        <div className="text-xs text-emerald-200/80 font-medium relative z-10">
          Diseñado para negocios en Colombia • Conectado a la nube
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN & REGISTRATION FORMS */}
      <div className="lg:w-1/2 bg-slate-950 p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-6">
          {/* Card Container */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Tab Switcher */}
            <div className="bg-slate-800/80 p-1 rounded-2xl flex items-center">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  tab === 'login'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  tab === 'register'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Crear mi Negocio
              </button>
            </div>

            {/* TAB 1: INICIAR SESIÓN */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Bienvenido de vuelta</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ingresa tus credenciales o accede como empleado
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Correo o Celular
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="admin@eltriunfo.com o 3123822341"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Contraseña / PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>Ingresar a mi Negocio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: CREAR NEGOCIO */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Registra tu Negocio</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Crea tu cuenta de propietario en 1 minuto
                  </p>
                </div>

                {registerError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{registerError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Nombre del Negocio *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Minimarket Don Pedro"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Tu Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Pedro Gómez"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="pedro@minimarket.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>Crear mi Negocio Gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* DEMO / QUICK ACCESS TILES */}
          <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>
                {isDemoBusiness
                  ? '⚡ Acceso Rápido (Negocio Demo):'
                  : '👥 Usuarios Registrados:'}
              </span>
              <span className="text-emerald-400 font-semibold truncate max-w-[180px]">
                {negocio.nombre}
              </span>
            </div>

            {isDemoBusiness ? (
              /* DEMO USERS (EL TRIUNFO) */
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => demoLogin('u-jackeline')}
                  className="p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-2xl text-left transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-white group-hover:text-emerald-400">
                      Jackeline
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      Admin
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Acceso total a balances y gastos</div>
                </button>

                <button
                  type="button"
                  onClick={() => demoLogin('u-manolo')}
                  className="p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-2xl text-left transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-white group-hover:text-sky-400">
                      Manolo
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                      Vendedor
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Solo ventas (POS) y catálogo</div>
                </button>
              </div>
            ) : (
              /* CUSTOM BUSINESS USERS */
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {usuarios.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        const pass = (u as any).password || '1234';
                        setLoginIdentifier(u.email);
                        setLoginPassword(pass);
                        login(u.email, pass);
                      }}
                      className="p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-2xl text-left transition group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-white group-hover:text-emerald-400 truncate">
                          {u.nombre}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold capitalize ${
                            u.rol === 'propietario' || u.rol === 'administrador'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-sky-500/20 text-sky-300'
                          }`}
                        >
                          {u.rol}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={loadDemoBusiness}
                    className="text-slate-400 hover:text-emerald-400 text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <span>🔄 Cargar Negocio Demo (El Triunfo)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('register')}
                    className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold transition"
                  >
                    + Registrar otro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
