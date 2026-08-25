import React, { useState } from 'react';
import {
  Globe,
  Crown,
  QrCode,
  Share2,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  Copy,
  Store,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '@treinta/shared';

export const OnlineStorePage: React.FC = () => {
  const { negocio, productos } = useAppStore();
  const [isStoreActive, setIsStoreActive] = useState(true);
  const [copied, setCopied] = useState(false);

  const storeSlug = negocio.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const storeUrl = `https://mitienda.treinta.co/${storeSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-slate-50">
      {/* Top Header */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Sitio Web & Catálogo Virtual
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3 text-emerald-700 fill-emerald-700" />
                <span>Tienda Online Pro</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              Vende las 24/7 y recibe pedidos automáticamente en tu WhatsApp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-extrabold rounded-2xl shadow-sm transition"
          >
            <Copy className="w-4 h-4 text-slate-600" />
            <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
          </button>

          <button
            onClick={() => window.open(storeUrl, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-extrabold rounded-2xl shadow-sm transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ver Tienda en Vivo</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner with status and QR */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-black text-lg text-slate-900">{negocio.nombre}</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Catálogo Online Activo</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Tus clientes pueden consultar precios, fotos y existencias en tiempo real desde cualquier celular.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <div className="px-3.5 py-1.5 bg-slate-100 rounded-xl font-mono text-xs font-bold text-slate-800 select-all border border-slate-200">
                {storeUrl}
              </div>
            </div>
          </div>

          {/* QR Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shrink-0">
            <div className="w-20 h-20 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
              <QrCode className="w-16 h-16 text-slate-900" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-extrabold text-slate-900">Código QR del Negocio</div>
              <p className="text-slate-500 text-[11px]">Imprímelo y pégalo en tu mostrador</p>
              <button
                onClick={() => alert('Descargando imagen QR en alta resolución')}
                className="text-emerald-700 font-black hover:underline text-[11px]"
              >
                Descargar QR Imprimible
              </button>
            </div>
          </div>
        </div>

        {/* Live Mobile Store Simulator & Product Sync */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">
                Configuración de Pedidos por WhatsApp
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Número de WhatsApp para recibir pedidos
                  </label>
                  <input
                    type="text"
                    defaultValue={negocio.telefono || '+57 310 456 7890'}
                    className="w-full max-w-md px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mensaje de bienvenida automático
                  </label>
                  <input
                    type="text"
                    defaultValue="¡Hola! Quiero hacer el siguiente pedido desde tu catálogo online:"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Catalog Published Products count */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Productos Publicados en tu Catálogo ({productos.filter((p) => p.activo).length})
                </h3>
                <span className="text-xs font-bold text-emerald-700">100% Sincronizado</span>
              </div>
              <p className="text-xs text-slate-500">
                Cualquier cambio de precio o stock que hagas en el módulo de <strong>Inventario</strong> se refleja al instante en tu catálogo online.
              </p>
            </div>
          </div>

          {/* Mobile Mockup Preview */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 mb-3">
              <Smartphone className="w-4 h-4" />
              <span>Vista Previa Móvil</span>
            </div>

            {/* Phone Frame */}
            <div className="w-64 h-[440px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col overflow-hidden relative">
              {/* Phone speaker notch */}
              <div className="w-20 h-4 bg-slate-800 rounded-b-xl mx-auto mb-2 shrink-0" />

              {/* Mock Web Screen */}
              <div className="flex-1 bg-white rounded-2xl overflow-y-auto p-3 space-y-2 text-left">
                <div className="text-center pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs mx-auto mb-1">
                    30
                  </div>
                  <div className="font-extrabold text-[11px] text-slate-900">{negocio.nombre}</div>
                  <div className="text-[9px] text-emerald-600 font-bold">🟢 Abierto ahora</div>
                </div>

                <div className="text-[10px] font-black uppercase text-slate-400 pt-1">
                  Catálogo
                </div>

                <div className="space-y-1.5">
                  {productos.slice(0, 4).map((p) => (
                    <div key={p.id} className="p-1.5 bg-slate-50 rounded-xl flex items-center gap-2 border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                        t.
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="text-[10px] font-bold text-slate-800 truncate">{p.nombre}</div>
                        <div className="text-[10px] font-black text-emerald-700">{formatCurrency(p.precio_venta)}</div>
                      </div>
                      <button className="px-2 py-0.5 bg-slate-900 text-white rounded-lg text-[9px] font-black">
                        +
                      </button>
                    </div>
                  ))}
                </div>

                {/* WhatsApp Order Button mockup */}
                <div className="pt-2">
                  <div className="py-2 bg-emerald-500 text-white font-black text-[10px] rounded-xl text-center shadow-md">
                    Pedir por WhatsApp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
