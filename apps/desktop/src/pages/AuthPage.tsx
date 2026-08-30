import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  Package,
  KeyRound,
  Check,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  signUpNewBusiness,
  signInWithEmail,
  fetchUsuarioProfile,
  sendPasswordResetEmail,
  updateUserPassword,
  onAuthStateChange,
} from '../lib/supabase-auth';
import { isSupabaseConfigured } from '../lib/supabase';

export const AuthPage: React.FC = () => {
  const { login, registerBusiness, loadDemoBusiness, syncWithSupabase } = useAppStore();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Reset password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  // Detect recovery link in URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery')) {
        setTab('reset');
      }
    }

    const { data: authListener } = onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTab('reset');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Por favor ingresa tu correo o número de celular');
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('Por favor ingresa tu contraseña o PIN');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const signInResult = await signInWithEmail(loginIdentifier, loginPassword);
        if (!signInResult.success || !signInResult.userId) {
          // If Supabase sign in failed, check if user exists in local store fallback
          const localRes = login(loginIdentifier, loginPassword);
          if (localRes.success) {
            return;
          }
          throw new Error(signInResult.error || 'Error al iniciar sesión');
        }

        const profileResult = await fetchUsuarioProfile(signInResult.userId);
        if (!profileResult.success || !profileResult.data) {
          throw new Error(profileResult.error || 'Perfil de usuario no encontrado');
        }

        useAppStore.setState({
          isAuthenticated: true,
          negocio: profileResult.data.negocio,
          usuarioActual: profileResult.data.usuario,
          usuarios: [profileResult.data.usuario],
          categorias: [],
          productos: [],
          ventas: [],
          gastos: [],
          clientes: [],
          proveedores: [],
          cuentasPorCobrar: [],
          cuentasPorPagar: [],
          cajaSesion: null,
          historialCajas: [],
          movimientosInventario: []
        });

        // Perform bidirectional sync: pulls all remote data and pushes any local unsynced items
        await syncWithSupabase();
      } else {
        const res = login(loginIdentifier, loginPassword);
        if (!res.success) {
          setLoginError(res.error || 'Credenciales o PIN incorrectos');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!businessName.trim() || !ownerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setRegisterError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const signUpResult = await signUpNewBusiness(
          businessName,
          ownerName,
          registerEmail,
          registerPassword
        );

        if (!signUpResult.success) {
          throw new Error(signUpResult.error || 'Error al registrar el negocio');
        }

        const signInResult = await signInWithEmail(registerEmail, registerPassword);
        if (!signInResult.success || !signInResult.userId) {
          throw new Error(signInResult.error || 'Negocio registrado. Por favor inicia sesión.');
        }

        const profileResult = await fetchUsuarioProfile(signInResult.userId);
        if (!profileResult.success || !profileResult.data) {
          throw new Error(profileResult.error || 'Perfil de usuario no encontrado');
        }

        useAppStore.setState({
          isAuthenticated: true,
          negocio: profileResult.data.negocio,
          usuarioActual: profileResult.data.usuario,
          usuarios: [profileResult.data.usuario],
          categorias: [],
          productos: [],
          ventas: [],
          gastos: [],
          clientes: [],
          proveedores: [],
          cuentasPorCobrar: [],
          cuentasPorPagar: [],
          cajaSesion: null,
          historialCajas: [],
          movimientosInventario: []
        });

        await syncWithSupabase();
      } else {
        const res = registerBusiness(
          businessName,
          ownerName,
          registerEmail,
          registerPassword
        );

        if (!res.success) {
          setRegisterError(res.error || 'Error al registrar negocio');
        }
      }
    } catch (err: any) {
      setRegisterError(err.message || 'Error al registrar negocio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail.trim()) {
      setForgotError('Por favor ingresa tu correo electrónico registrado');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendPasswordResetEmail(forgotEmail.trim());
      if (!res.success) {
        throw new Error(res.error || 'No se pudo enviar el correo de recuperación');
      }
      setForgotSuccess('¡Enlace enviado con éxito! Revisa tu bandeja de entrada o spam.');
    } catch (err: any) {
      setForgotError(err.message || 'Error al solicitar restablecimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!newPassword.trim() || newPassword.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (!res.success) {
        throw new Error(res.error || 'Error al actualizar contraseña');
      }
      setResetSuccess('¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        setTab('login');
        setLoginPassword(newPassword);
        setResetSuccess('');
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Error al actualizar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col lg:flex-row overflow-y-auto">
      {/* LEFT COLUMN: BRAND HERO & PRESENTATION */}
      <div className="lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-6 sm:p-10 lg:p-14 flex flex-col justify-between text-white relative overflow-hidden shrink-0">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-black text-lg sm:text-xl shadow-xl shadow-emerald-950/20">
            SP
          </div>
          <div>
            <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight leading-none">StockPro</h1>
            <p className="text-emerald-100 text-xs font-semibold mt-0.5">
              Control de Stock y Gestión de Negocio
            </p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="my-6 lg:my-10 space-y-4 lg:space-y-6 relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-bold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sincronización Multi-dispositivo en Tiempo Real</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
            Control total de tus <span className="text-emerald-200">ventas</span>,{' '}
            <span className="text-amber-200">inventario</span> y balances.
          </h2>

          <ul className="hidden sm:flex flex-col space-y-3 text-sm text-emerald-50">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>Punto de venta (POS) rápido y cobros multimoneda.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>Inventario sincronizado entre tu celular y computador.</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>Balances financieros, control de caja y fiados a clientes.</span>
            </li>
          </ul>
        </div>

        {/* Footer Note */}
        <div className="hidden lg:block text-xs text-emerald-200/80 font-medium relative z-10">
          Diseñado para negocios en Colombia • Conectado a la nube
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN & REGISTRATION FORMS */}
      <div className="lg:w-1/2 flex-1 bg-slate-950 p-4 sm:p-8 lg:p-16 flex flex-col justify-center items-center overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto py-4">
          {/* Card Container */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
            {/* Tab Switcher */}
            {(tab === 'login' || tab === 'register') && (
              <div className="bg-slate-800/80 p-1 rounded-2xl flex items-center">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => { setTab('login'); setLoginError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                    tab === 'login'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => { setTab('register'); setRegisterError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                    tab === 'register'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Crear mi Negocio
                </button>
              </div>
            )}

            {/* TAB 1: INICIAR SESIÓN (PRODUCCIÓN) */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Bienvenido a StockPro</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ingresa con tu correo o número de celular registrado
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
                    Correo Electrónico o Celular *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="ej. usuario@correo.com o 3123822341"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase text-slate-400">
                      Contraseña o PIN *
                    </label>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setTab('forgot');
                        setForgotError('');
                        setForgotSuccess('');
                        setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                      }}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>{isLoading ? 'Cargando y sincronizando...' : 'Iniciar Sesión'}</span>
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      loadDemoBusiness();
                      setLoginIdentifier('jackeline@eltriunfo.com');
                      setLoginPassword('1234');
                    }}
                    className="text-slate-400 hover:text-emerald-400 text-[11px] font-bold transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>🔄 Cargar Demo (El Triunfo)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setTab('register')}
                    className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold disabled:opacity-50"
                  >
                    ¿No tienes cuenta? Regístrate
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: RECUPERAR CONTRASEÑA */}
            {tab === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-emerald-400">
                  <KeyRound className="w-5 h-5" />
                  <h3 className="text-lg font-extrabold text-white">Recuperar Contraseña</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro para restablecer tu contraseña.
                </p>

                {forgotError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-3.5 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                {!forgotSuccess && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                        Correo Electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email"
                          required
                          placeholder="usuario@correo.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>{isLoading ? 'Enviando correo...' : 'Enviar enlace de recuperación'}</span>
                      {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </>
                )}

                <div className="pt-3 border-t border-slate-800/80 text-center">
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setForgotError(''); setForgotSuccess(''); }}
                    className="text-slate-400 hover:text-white text-xs font-bold transition"
                  >
                    ← Volver a Iniciar Sesión
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: ESTABLECER NUEVA CONTRASEÑA TRAS LINK */}
            {tab === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Lock className="w-5 h-5" />
                  <h3 className="text-lg font-extrabold text-white">Nueva Contraseña</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Ingresa tu nueva contraseña para acceder a tu cuenta de StockPro.
                </p>

                {resetError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{resetError}</span>
                  </div>
                )}

                {resetSuccess && (
                  <div className="p-3.5 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Nueva Contraseña (mínimo 6 caracteres) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Actualizando contraseña...' : 'Actualizar Contraseña'}</span>
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="pt-3 border-t border-slate-800/80 text-center">
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-slate-400 hover:text-white text-xs font-bold transition"
                  >
                    ← Volver a Iniciar Sesión
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CREAR NEGOCIO */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Registra tu Negocio en StockPro</h3>
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
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span>{isLoading ? 'Creando negocio...' : 'Crear mi Negocio Gratis'}</span>
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
