import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Trash2, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  Usuario,
  RolUsuario,
  PermisosEmpleado,
  PERMISOS_DEFAULT_ADMIN,
  PERMISOS_DEFAULT_VENDEDOR,
} from '@treinta/shared';
import { PermissionsModal } from './PermissionsModal';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Usuario | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
}) => {
  const { agregarEmpleado, editarEmpleado, eliminarEmpleado } = useAppStore();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<RolUsuario>('vendedor');
  const [permisos, setPermisos] = useState<PermisosEmpleado>(PERMISOS_DEFAULT_VENDEDOR);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  useEffect(() => {
    if (employeeToEdit) {
      setNombre(employeeToEdit.nombre);
      setTelefono(
        employeeToEdit.telefono ? employeeToEdit.telefono.replace('+57', '') : ''
      );
      setRol(employeeToEdit.rol);
      setPermisos(
        employeeToEdit.permisos ||
          (employeeToEdit.rol === 'administrador'
            ? PERMISOS_DEFAULT_ADMIN
            : PERMISOS_DEFAULT_VENDEDOR)
      );
    } else {
      setNombre('');
      setTelefono('');
      setRol('vendedor');
      setPermisos(PERMISOS_DEFAULT_VENDEDOR);
    }
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleRolChange = (newRol: RolUsuario) => {
    setRol(newRol);
    setPermisos(
      newRol === 'administrador' ? PERMISOS_DEFAULT_ADMIN : PERMISOS_DEFAULT_VENDEDOR
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const fullTelefono = telefono.trim()
      ? telefono.startsWith('+')
        ? telefono.trim()
        : `+57${telefono.trim()}`
      : undefined;

    if (employeeToEdit) {
      editarEmpleado(employeeToEdit.id, {
        nombre: nombre.trim(),
        telefono: fullTelefono,
        rol,
        permisos,
      });
    } else {
      agregarEmpleado({
        nombre: nombre.trim(),
        telefono: fullTelefono,
        rol,
        permisos,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (!employeeToEdit) return;
    if (window.confirm(`¿Estás seguro de eliminar a ${employeeToEdit.nombre}?`)) {
      eliminarEmpleado(employeeToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white border-b border-emerald-700">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-base">
              {employeeToEdit ? 'Editar empleado' : 'Crear empleado'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Nombre *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Manolo, Jackeline..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Número celular de tu empleado *
            </label>
            <div className="flex items-center bg-white border border-slate-300 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
              <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 select-none">
                <span>🇨🇴</span>
                <span>+57</span>
              </div>
              <input
                type="tel"
                placeholder="3123822341"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3.5 py-3 text-sm font-semibold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Rol *
            </label>
            <select
              value={rol}
              onChange={(e) => handleRolChange(e.target.value as RolUsuario)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="vendedor">Vendedor (Caja y Catálogo)</option>
              <option value="administrador">Administrador (Control Total)</option>
            </select>
          </div>

          {/* Granular Permissions Button */}
          <div
            onClick={() => setIsPermissionsOpen(true)}
            className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-100/70 transition"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-slate-900">Personalizar Permisos</div>
                <div className="text-[11px] text-slate-500">
                  Configura qué módulos puede ver y editar
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-700" />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-2xl font-black text-sm shadow-lg transition"
            >
              Confirmar
            </button>
          </div>

          {/* Delete Employee Option */}
          {employeeToEdit && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar empleado &gt;</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Permissions Modal */}
      <PermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        rol={rol}
        nombreEmpleado={nombre}
        permisos={permisos}
        onSave={(nuevos) => setPermisos(nuevos)}
      />
    </div>
  );
};
