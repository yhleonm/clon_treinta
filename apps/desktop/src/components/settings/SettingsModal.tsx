import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  User,
  Lock,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { negocio, usuarioActual, actualizarNegocio, actualizarPerfilUsuario } = useAppStore();

  const isAdmin = usuarioActual?.rol === 'administrador' || usuarioActual?.rol === 'propietario';

  const [activeTab, setActiveTab] = useState<'negocio' | 'perfil' | 'preferencias'>('negocio');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Negocio form state
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [nit, setNit] = useState('');
  const [telefonoNegocio, setTelefonoNegocio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [simboloMoneda, setSimboloMoneda] = useState('$');
  const [alertasStock, setAlertasStock] = useState(true);
  const [permitirStockNegativo, setPermitirStockNegativo] = useState(true);

  // Perfil form state
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [emailUsuario, setEmailUsuario] = useState('');
  const [telefonoUsuario, setTelefonoUsuario] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNombreNegocio(negocio.nombre || '');
      setNit(negocio.documento_identidad || '');
      setTelefonoNegocio(negocio.telefono || '');
      setDireccion(negocio.direccion || '');
      setMoneda(negocio.moneda || 'COP');
      setSimboloMoneda(negocio.simbolo_moneda || '$');
      setAlertasStock(negocio.configuraciones?.alertas_stock ?? true);
      setPermitirStockNegativo(negocio.configuraciones?.permitir_stock_negativo ?? true);

      setNombreUsuario(usuarioActual.nombre || '');
      setEmailUsuario(usuarioActual.email || '');
      setTelefonoUsuario(usuarioActual.telefono || '');
      setNewPassword((usuarioActual as any).password || '');
      setConfirmPassword((usuarioActual as any).password || '');

      setSuccessMessage('');
      setErrorMessage('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, negocio, usuarioActual]);

  if (!isOpen) return null;

  const handleSaveNegocio = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!nombreNegocio.trim()) {
      setErrorMessage('El nombre del negocio no puede estar vacío.');
      return;
    }

    actualizarNegocio({
      nombre: nombreNegocio.trim(),
      documento_identidad: nit.trim() || undefined,
      telefono: telefonoNegocio.trim() || undefined,
      direccion: direccion.trim() || undefined,
      moneda: moneda.trim() || 'COP',
      simbolo_moneda: simboloMoneda.trim() || '$',
      configuraciones: {
        alertas_stock: alertasStock,
        permitir_stock_negativo: permitirStockNegativo,
      },
    });

    setSuccessMessage('¡Datos del negocio actualizados correctamente!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSavePerfil = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!nombreUsuario.trim()) {
      setErrorMessage('El nombre no puede estar vacío.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    actualizarPerfilUsuario({
      nombre: nombreUsuario.trim(),
      email: emailUsuario.trim().toLowerCase(),
      telefono: telefonoUsuario.trim() || null,
      password: newPassword.trim() || undefined,
    });

    setSuccessMessage('¡Perfil y contraseña actualizados correctamente!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white border-b border-emerald-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black">
              ⚙️
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Configuración</h3>
              <p className="text-emerald-100 text-xs mt-0.5">{negocio.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('negocio'); setSuccessMessage(''); setErrorMessage(''); }}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'negocio'
                ? 'border-emerald-600 text-emerald-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Datos del Negocio</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('perfil'); setSuccessMessage(''); setErrorMessage(''); }}
            className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'perfil'
                ? 'border-emerald-600 text-emerald-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mi Perfil y Contraseña</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => { setActiveTab('preferencias'); setSuccessMessage(''); setErrorMessage(''); }}
              className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'preferencias'
                  ? 'border-emerald-600 text-emerald-600 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Preferencias</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: DATOS DEL NEGOCIO */}
          {activeTab === 'negocio' && (
            <form onSubmit={handleSaveNegocio} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Nombre del Negocio *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={nombreNegocio}
                      onChange={(e) => setNombreNegocio(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    NIT / Documento Identidad
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="901.458.789-1"
                      value={nit}
                      onChange={(e) => setNit(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Teléfono del Negocio
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="+57 310 456 7890"
                      value={telefonoNegocio}
                      onChange={(e) => setTelefonoNegocio(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Dirección Física
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cra. 45 # 26-10"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Moneda Principal
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={moneda}
                      onChange={(e) => {
                        setMoneda(e.target.value);
                        setSimboloMoneda(e.target.value === 'EUR' ? '€' : '$');
                      }}
                      disabled={!isAdmin}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                    >
                      <option value="COP">COP ($) - Peso Colombiano</option>
                      <option value="USD">USD ($) - Dólar Estadounidense</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="MXN">MXN ($) - Peso Mexicano</option>
                    </select>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-black text-xs shadow-md transition flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios del Negocio</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: MI PERFIL Y CONTRASEÑA */}
          {activeTab === 'perfil' && (
            <form onSubmit={handleSavePerfil} className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                  {usuarioActual.nombre ? usuarioActual.nombre.slice(0, 2).toUpperCase() : '30'}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{usuarioActual.nombre}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold uppercase">
                    {usuarioActual.rol}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Tu Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={nombreUsuario}
                      onChange={(e) => setNombreUsuario(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={emailUsuario}
                      onChange={(e) => setEmailUsuario(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Número Celular
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="3123822341"
                      value={telefonoUsuario}
                      onChange={(e) => setTelefonoUsuario(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cambiar Contraseña / PIN */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Actualizar Contraseña o PIN de Acceso</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Nueva Contraseña o PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 4 dígitos"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                      Confirmar Contraseña o PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl font-black text-xs shadow-md transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Mi Perfil</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PREFERENCIAS (ADMIN) */}
          {activeTab === 'preferencias' && isAdmin && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">Alertas de Stock Bajo</div>
                    <div className="text-[11px] text-slate-500 font-semibold">
                      Muestra avisos visuales en el POS cuando un producto tenga 5 o menos unidades.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={alertasStock}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAlertasStock(val);
                    actualizarNegocio({
                      configuraciones: {
                        alertas_stock: val,
                        permitir_stock_negativo: permitirStockNegativo,
                      },
                    });
                    setSuccessMessage('Preferencia actualizada');
                    setTimeout(() => setSuccessMessage(''), 2000);
                  }}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-100 text-sky-800">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">Permitir Ventas con Stock en 0 / Negativo</div>
                    <div className="text-[11px] text-slate-500 font-semibold">
                      Permite registrar ventas rápidas en mostrador incluso si no se ha registrado la entrada de inventario.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permitirStockNegativo}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setPermitirStockNegativo(val);
                    actualizarNegocio({
                      configuraciones: {
                        alertas_stock: alertasStock,
                        permitir_stock_negativo: val,
                      },
                    });
                    setSuccessMessage('Preferencia actualizada');
                    setTimeout(() => setSuccessMessage(''), 2000);
                  }}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
