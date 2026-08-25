import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Check, Shield } from 'lucide-react';
import { PermisosEmpleado, RolUsuario } from '@treinta/shared';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rol: RolUsuario;
  nombreEmpleado?: string;
  permisos: PermisosEmpleado;
  onSave: (nuevosPermisos: PermisosEmpleado) => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  rol,
  nombreEmpleado,
  permisos,
  onSave,
}) => {
  const [localPerms, setLocalPerms] = useState<PermisosEmpleado>(permisos);

  // Accordion open/close states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ventas: true,
    inventario: true,
    reportes: true,
    contactos: true,
    config: true,
    empleados: true,
  });

  useEffect(() => {
    setLocalPerms(permisos);
  }, [permisos, isOpen]);

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTogglePerm = (key: keyof PermisosEmpleado) => {
    setLocalPerms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleSectionAll = (keys: (keyof PermisosEmpleado)[], checked: boolean) => {
    setLocalPerms((prev) => {
      const updated = { ...prev };
      keys.forEach((k) => {
        updated[k] = checked;
      });
      return updated;
    });
  };

  const isSectionAllChecked = (keys: (keyof PermisosEmpleado)[]) => {
    return keys.every((k) => localPerms[k]);
  };

  const handleSave = () => {
    onSave(localPerms);
    onClose();
  };

  const rolTitle =
    rol === 'administrador'
      ? 'Permisos de Administrador'
      : rol === 'vendedor'
      ? 'Permisos de Vendedor'
      : 'Permisos de Empleado';

  const ventasKeys: (keyof PermisosEmpleado)[] = [
    'registrar_ventas_gastos',
    'editar_eliminar_ventas_gastos',
    'visualizar_movimientos',
    'ver_resumen_movimientos',
    'editar_precio_venta',
    'editar_fecha_venta',
  ];

  const inventarioKeys: (keyof PermisosEmpleado)[] = [
    'crear_productos',
    'editar_eliminar_productos',
    'ver_inventario',
    'permitir_conteo_inventario',
    'descargar_reporte_conteo',
    'ver_historial_stock',
  ];

  const reportesKeys: (keyof PermisosEmpleado)[] = [
    'descargar_reporte_inventario',
    'descargar_reporte_movimientos',
    'usar_filtros_balance',
    'ver_estadisticas',
  ];

  const contactosKeys: (keyof PermisosEmpleado)[] = [
    'crear_clientes_proveedores',
    'editar_eliminar_clientes_proveedores',
  ];

  const configKeys: (keyof PermisosEmpleado)[] = ['ver_info_negocio'];

  const empleadosKeys: (keyof PermisosEmpleado)[] = [
    'crear_empleados',
    'editar_eliminar_empleados',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">{rolTitle}</h3>
            {nombreEmpleado && (
              <p className="text-xs text-slate-500 font-medium">Empleado: {nombreEmpleado}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permissions Accordion Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* 1. VENTAS Y GASTOS */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="p-4 bg-slate-50/70 flex items-center justify-between border-b border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSectionAllChecked(ventasKeys)}
                  onChange={(e) => toggleSectionAll(ventasKeys, e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-extrabold text-sm text-slate-900">Ventas y gastos</span>
              </label>
              <button
                type="button"
                onClick={() => toggleSection('ventas')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {expandedSections.ventas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedSections.ventas && (
              <div className="p-4 space-y-3 text-xs text-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.registrar_ventas_gastos}
                    onChange={() => handleTogglePerm('registrar_ventas_gastos')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Registrar ventas y gastos</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.editar_eliminar_ventas_gastos}
                    onChange={() => handleTogglePerm('editar_eliminar_ventas_gastos')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Editar o eliminar ventas y gastos</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.visualizar_movimientos}
                    onChange={() => handleTogglePerm('visualizar_movimientos')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Visualizar movimientos (Ventas y Gastos)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.ver_resumen_movimientos}
                    onChange={() => handleTogglePerm('ver_resumen_movimientos')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ver resumen de movimientos (Total ventas, total gastos y balance)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.editar_precio_venta}
                    onChange={() => handleTogglePerm('editar_precio_venta')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Editar precio de venta</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.editar_fecha_venta}
                    onChange={() => handleTogglePerm('editar_fecha_venta')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Editar fecha de venta</span>
                </label>
              </div>
            )}
          </div>

          {/* 2. INVENTARIO */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="p-4 bg-slate-50/70 flex items-center justify-between border-b border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSectionAllChecked(inventarioKeys)}
                  onChange={(e) => toggleSectionAll(inventarioKeys, e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-extrabold text-sm text-slate-900">Inventario</span>
              </label>
              <button
                type="button"
                onClick={() => toggleSection('inventario')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {expandedSections.inventario ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedSections.inventario && (
              <div className="p-4 space-y-3 text-xs text-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.crear_productos}
                    onChange={() => handleTogglePerm('crear_productos')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Crear productos e ingredientes</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.editar_eliminar_productos}
                    onChange={() => handleTogglePerm('editar_eliminar_productos')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Editar o eliminar productos e ingredientes</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.ver_inventario}
                    onChange={() => handleTogglePerm('ver_inventario')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ver inventario</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.permitir_conteo_inventario}
                    onChange={() => handleTogglePerm('permitir_conteo_inventario')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Permitir conteo de inventario</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.descargar_reporte_conteo}
                    onChange={() => handleTogglePerm('descargar_reporte_conteo')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Descargar reporte de conteo</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.ver_historial_stock}
                    onChange={() => handleTogglePerm('ver_historial_stock')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ver historial de stock</span>
                </label>
              </div>
            )}
          </div>

          {/* 3. REPORTES */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="p-4 bg-slate-50/70 flex items-center justify-between border-b border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSectionAllChecked(reportesKeys)}
                  onChange={(e) => toggleSectionAll(reportesKeys, e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-extrabold text-sm text-slate-900">Reportes</span>
              </label>
              <button
                type="button"
                onClick={() => toggleSection('reportes')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {expandedSections.reportes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedSections.reportes && (
              <div className="p-4 space-y-3 text-xs text-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.descargar_reporte_inventario}
                    onChange={() => handleTogglePerm('descargar_reporte_inventario')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Descargar reporte de inventario</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.descargar_reporte_movimientos}
                    onChange={() => handleTogglePerm('descargar_reporte_movimientos')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Descargar reporte de movimientos</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.usar_filtros_balance}
                    onChange={() => handleTogglePerm('usar_filtros_balance')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Usar filtros en balance</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.ver_estadisticas}
                    onChange={() => handleTogglePerm('ver_estadisticas')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ver estadísticas</span>
                </label>
              </div>
            )}
          </div>

          {/* 4. CLIENTES Y PROVEEDORES */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="p-4 bg-slate-50/70 flex items-center justify-between border-b border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSectionAllChecked(contactosKeys)}
                  onChange={(e) => toggleSectionAll(contactosKeys, e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-extrabold text-sm text-slate-900">Clientes y proveedores</span>
              </label>
              <button
                type="button"
                onClick={() => toggleSection('contactos')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {expandedSections.contactos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedSections.contactos && (
              <div className="p-4 space-y-3 text-xs text-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.crear_clientes_proveedores}
                    onChange={() => handleTogglePerm('crear_clientes_proveedores')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Crear clientes y proveedores</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.editar_eliminar_clientes_proveedores}
                    onChange={() => handleTogglePerm('editar_eliminar_clientes_proveedores')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Editar o eliminar clientes y proveedores</span>
                </label>
              </div>
            )}
          </div>

          {/* 5. CONFIGURACIONES */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="p-4 bg-slate-50/70 flex items-center justify-between border-b border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSectionAllChecked(configKeys)}
                  onChange={(e) => toggleSectionAll(configKeys, e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-extrabold text-sm text-slate-900">Configuraciones</span>
              </label>
              <button
                type="button"
                onClick={() => toggleSection('config')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {expandedSections.config ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedSections.config && (
              <div className="p-4 space-y-3 text-xs text-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.ver_info_negocio}
                    onChange={() => handleTogglePerm('ver_info_negocio')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ver información del negocio</span>
                </label>
              </div>
            )}
          </div>

          {/* 6. EMPLEADOS */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="p-4 bg-slate-50/70 flex items-center justify-between border-b border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSectionAllChecked(empleadosKeys)}
                  onChange={(e) => toggleSectionAll(empleadosKeys, e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-extrabold text-sm text-slate-900">Empleados</span>
              </label>
              <button
                type="button"
                onClick={() => toggleSection('empleados')}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {expandedSections.empleados ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedSections.empleados && (
              <div className="p-4 space-y-3 text-xs text-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.crear_empleados}
                    onChange={() => handleTogglePerm('crear_empleados')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Crear empleados</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPerms.editar_eliminar_empleados}
                    onChange={() => handleTogglePerm('editar_eliminar_empleados')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Editar o eliminar empleados</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition"
          >
            Modificar permisos
          </button>
        </div>
      </div>
    </div>
  );
};
