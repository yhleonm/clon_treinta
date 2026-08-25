import React, { useState } from 'react';
import {
  FileText,
  Crown,
  CheckCircle2,
  Download,
  Search,
  AlertCircle,
  Plus,
  Send,
  Building,
  QrCode,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatDateTime } from '@treinta/shared';

export const InvoicingPage: React.FC = () => {
  const { negocio, ventas } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Mock electronic invoices generated from real ventas
  const facturas = ventas.map((v, index) => ({
    id: `FE-${1000 + index}`,
    cufe: `a7f93e2b4c810d7e6f9a0c3b8d1e2f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e`,
    folio: v.numero_folio,
    fecha: v.created_at,
    cliente: v.cliente ? v.cliente.nombre : 'Consumidor Final (222222222222)',
    documento: v.cliente && v.cliente.documento ? v.cliente.documento : '222222222222',
    total: v.total,
    iva: Math.round(v.total * 0.19),
    subtotal: Math.round(v.total * 0.81),
    estado: 'aprobada' as const,
    medioPago: v.medio_pago,
  }));

  const filteredFacturas = facturas.filter(
    (f) =>
      f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.folio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-slate-50">
      {/* Top Header */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Facturación Electrónica
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3 text-emerald-700 fill-emerald-700" />
                <span>DIAN Habilitado</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              Emisión de comprobantes fiscales, CUFE y validación previa en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Generando nueva Factura Electrónica')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-extrabold rounded-2xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Factura Electrónica</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Certificate / Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  Resolución DIAN No. 187640000123
                </span>
                <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  ✓ Vigente
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Rango autorizado: <strong className="text-slate-800">FE-1000 a FE-50000</strong> • Vigencia hasta: <strong className="text-slate-800">31/Dic/2027</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500 font-bold">Proveedor Tecnológico</div>
              <div className="text-xs font-black text-slate-900">Treinta Pagos SAS (NIT: 901.458.789)</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-emerald-700">
              30
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número FE, cliente o folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-bold">
            Total facturas emitidas:{' '}
            <span className="text-slate-900 font-extrabold">{facturas.length}</span>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Comprobante</th>
                <th className="py-3.5 px-6">Cliente / Receptor</th>
                <th className="py-3.5 px-6 text-right">Subtotal</th>
                <th className="py-3.5 px-6 text-right">IVA (19%)</th>
                <th className="py-3.5 px-6 text-right">Total</th>
                <th className="py-3.5 px-6 text-center">Estado DIAN</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredFacturas.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition">
                  <td className="py-4 px-6">
                    <div className="font-black text-slate-900 text-sm">{f.id}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(f.fecha)}
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="font-extrabold text-slate-900">{f.cliente}</div>
                    <div className="text-[11px] text-slate-500">CC/NIT: {f.documento}</div>
                  </td>

                  <td className="py-4 px-6 text-right font-bold text-slate-700">
                    {formatCurrency(f.subtotal)}
                  </td>

                  <td className="py-4 px-6 text-right font-bold text-slate-600">
                    {formatCurrency(f.iva)}
                  </td>

                  <td className="py-4 px-6 text-right font-black text-slate-900 text-sm">
                    {formatCurrency(f.total)}
                  </td>

                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Aprobada DIAN</span>
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          alert(`Descargando representación gráfica PDF para ${f.id}`);
                        }}
                        className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setSelectedInvoice(f)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs shadow-sm transition"
                      >
                        Ver Detalle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                  FE
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Factura Electrónica #{selectedInvoice.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Folio de venta: {selectedInvoice.folio}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 hover:bg-slate-200/60 text-slate-500 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-400">
                  Código Único de Facturación Electrónica (CUFE)
                </div>
                <div className="font-mono text-[10px] text-slate-700 break-all">
                  {selectedInvoice.cufe}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400">Emisor</div>
                  <div className="font-extrabold text-slate-900">{negocio.nombre}</div>
                  <div className="text-[11px] text-slate-500">NIT: {negocio.documento_identidad || '901.458.789-1'}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400">Receptor</div>
                  <div className="font-extrabold text-slate-900">{selectedInvoice.cliente}</div>
                  <div className="text-[11px] text-slate-500">CC: {selectedInvoice.documento}</div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Gravado</span>
                  <span className="font-bold">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA (19%)</span>
                  <span className="font-bold">{formatCurrency(selectedInvoice.iva)}</span>
                </div>
                <div className="flex justify-between text-slate-900 text-sm font-black border-t border-slate-200 pt-2">
                  <span>Total Facturado</span>
                  <span className="text-emerald-700">{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-200/60 rounded-xl"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  alert('Descargando archivo XML + PDF firmado digitalmente');
                  setSelectedInvoice(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar XML y PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
