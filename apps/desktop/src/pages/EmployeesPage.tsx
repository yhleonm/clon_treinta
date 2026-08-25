import React, { useState } from 'react';
import {
  Users,
  Phone,
  Edit3,
  CheckCircle2,
  Plus,
  Shield,
  Search,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Usuario } from '@treinta/shared';
import { EmployeeModal } from '../components/employees/EmployeeModal';

export const EmployeesPage: React.FC = () => {
  const { usuarios, usuarioActual } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Usuario | null>(null);

  const isAdmin = usuarioActual.rol === 'administrador' || usuarioActual.rol === 'propietario';

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
        <Shield className="w-16 h-16 text-rose-500 mb-3" />
        <h3 className="text-lg font-black text-slate-900">Acceso Restringido</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Solo los administradores o el propietario del negocio pueden gestionar los empleados y sus permisos.
        </p>
      </div>
    );
  }

  const filteredUsuarios = usuarios.filter(
    (u) =>
      searchTerm === '' ||
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.telefono && u.telefono.includes(searchTerm))
  );

  const handleEdit = (u: Usuario) => {
    setEmployeeToEdit(u);
    setIsEmployeeModalOpen(true);
  };

  const handleCreate = () => {
    setEmployeeToEdit(null);
    setIsEmployeeModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-slate-100">
      {/* Top Header */}
      <div className="bg-emerald-600 text-white px-6 py-4 shadow-sm shrink-0 border-b border-emerald-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold tracking-tight">Empleados</h2>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 hover:bg-emerald-50 text-xs font-extrabold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Crear empleado</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-xl mx-auto w-full flex flex-col justify-between">
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar empleado por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          {/* Employee Cards List */}
          <div className="space-y-3.5">
            {filteredUsuarios.map((u) => {
              const isAdmin = u.rol === 'administrador' || u.rol === 'propietario';

              return (
                <div
                  key={u.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3 hover:border-slate-300 transition"
                >
                  {/* Row 1: Name and Edit Button */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-slate-900">{u.nombre}</h3>
                    <button
                      onClick={() => handleEdit(u)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>

                  {/* Row 2: Phone */}
                  <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{u.telefono || '+573000000000'}</span>
                  </div>

                  {/* Row 3: Role Chip */}
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold capitalize ${
                        isAdmin
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {u.rol === 'administrador'
                        ? 'Administrador'
                        : u.rol === 'vendedor'
                        ? 'Vendedor'
                        : u.rol}
                    </span>
                  </div>

                  {/* Row 4: Status Indicator */}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span>{u.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Create Button */}
        <div className="pt-6 pb-2">
          <button
            onClick={handleCreate}
            className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-2xl font-black text-sm shadow-xl transition"
          >
            Crear empleado
          </button>
        </div>
      </div>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEmployeeToEdit(null);
        }}
        employeeToEdit={employeeToEdit}
      />
    </div>
  );
};
