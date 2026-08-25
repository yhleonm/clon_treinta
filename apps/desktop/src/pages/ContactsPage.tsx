import React, { useState } from 'react';
import { Users, Building2, Plus, Search, Phone, Mail, FileText, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '@treinta/shared';

export const ContactsPage: React.FC = () => {
  const { clientes, proveedores, agregarCliente, agregarProveedor } = useAppStore();

  const [tab, setTab] = useState<'clientes' | 'proveedores'>('clientes');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Client form
  const [clientNombre, setClientNombre] = useState('');
  const [clientTelefono, setClientTelefono] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientDocumento, setClientDocumento] = useState('');

  // Supplier form
  const [suppNombre, setSuppNombre] = useState('');
  const [suppContacto, setSuppContacto] = useState('');
  const [suppTelefono, setSuppTelefono] = useState('');
  const [suppNit, setSuppNit] = useState('');

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNombre) return;
    agregarCliente({
      nombre: clientNombre.trim(),
      telefono: clientTelefono.trim() || undefined,
      email: clientEmail.trim() || undefined,
      documento: clientDocumento.trim() || undefined,
      limite_credito: 100000,
    });
    setClientNombre('');
    setClientTelefono('');
    setClientEmail('');
    setClientDocumento('');
    setIsClientModalOpen(false);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppNombre) return;
    agregarProveedor({
      nombre: suppNombre.trim(),
      contacto: suppContacto.trim() || undefined,
      telefono: suppTelefono.trim() || undefined,
      nit: suppNit.trim() || undefined,
    });
    setSuppNombre('');
    setSuppContacto('');
    setSuppTelefono('');
    setSuppNit('');
    setIsSupplierModalOpen(false);
  };

  const filteredClientes = clientes.filter(
    (c) =>
      searchTerm === '' ||
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.telefono && c.telefono.includes(searchTerm)) ||
      (c.documento && c.documento.includes(searchTerm))
  );

  const filteredProveedores = proveedores.filter(
    (p) =>
      searchTerm === '' ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.contacto && p.contacto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.nit && p.nit.includes(searchTerm))
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5 select-none bg-slate-50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Directorio de Contactos</h2>
          <p className="text-xs text-slate-500">
            Administra tus clientes para fiados y proveedores de mercancía
          </p>
        </div>

        <button
          onClick={() => (tab === 'clientes' ? setIsClientModalOpen(true) : setIsSupplierModalOpen(true))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{tab === 'clientes' ? 'Nuevo Cliente' : 'Nuevo Proveedor'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('clientes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'clientes'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Clientes ({clientes.length})</span>
            </button>
            <button
              onClick={() => setTab('proveedores')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'proveedores'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Proveedores ({proveedores.length})</span>
            </button>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'clientes' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Teléfono / WhatsApp</th>
                  <th className="py-3 px-4">Documento / Cédula</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Saldo en Deuda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">{c.nombre}</td>
                    <td className="py-3 px-4 text-slate-600">{c.telefono || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{c.documento || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">{c.email || '-'}</td>
                    <td className="py-3 px-4 text-right font-black text-sm">
                      {c.saldo_deuda > 0 ? (
                        <span className="text-amber-600">{formatCurrency(c.saldo_deuda)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">$ 0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="py-3 px-4">Razón Social / Proveedor</th>
                  <th className="py-3 px-4">Contacto Asesor</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">NIT</th>
                  <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">{p.nombre}</td>
                    <td className="py-3 px-4 text-slate-600">{p.contacto || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{p.telefono || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{p.nit || '-'}</td>
                    <td className="py-3 px-4 text-right font-black text-sm">
                      {p.saldo_deuda > 0 ? (
                        <span className="text-rose-600">{formatCurrency(p.saldo_deuda)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">$ 0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">Agregar Nuevo Cliente</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddClient} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={clientNombre}
                  onChange={(e) => setClientNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+57 300 123 4567"
                  value={clientTelefono}
                  onChange={(e) => setClientTelefono(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Cédula / Doc</label>
                  <input
                    type="text"
                    placeholder="10203040"
                    value={clientDocumento}
                    onChange={(e) => setClientDocumento(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold bg-emerald-500 text-slate-950 rounded-xl">
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">Agregar Nuevo Proveedor</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora Central"
                  value={suppNombre}
                  onChange={(e) => setSuppNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contacto Asesor</label>
                  <input
                    type="text"
                    placeholder="Carlos Asesor"
                    value={suppContacto}
                    onChange={(e) => setSuppContacto(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+57 315 000 1122"
                    value={suppTelefono}
                    onChange={(e) => setSuppTelefono(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">NIT</label>
                <input
                  type="text"
                  placeholder="900.123.456-1"
                  value={suppNit}
                  onChange={(e) => setSuppNit(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold bg-emerald-500 text-slate-950 rounded-xl">
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
