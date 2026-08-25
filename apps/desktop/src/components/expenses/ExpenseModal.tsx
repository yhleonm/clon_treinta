import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronRight,
  Info,
  CreditCard,
  Building2,
  Banknote,
  Sparkles,
  Crown,
  Package,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  CATEGORIAS_GASTO_DEFAULT,
  MedioPago,
  formatCurrency,
} from '@treinta/shared';
import {
  SelectSuppliesModal,
  GastoProductoItem,
} from './SelectSuppliesModal';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  const { registrarGasto, ajustarStock, proveedores } = useAppStore();

  const [estadoPago, setEstadoPago] = useState<'pagada' | 'en_deuda'>('pagada');
  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0] || ''
  );
  const [categoria, setCategoria] = useState<string>('Compra de productos e insumos');
  const [supplyItems, setSupplyItems] = useState<GastoProductoItem[]>([]);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [valor, setValor] = useState<string>('');
  const [nombreGasto, setNombreGasto] = useState<string>('');
  const [proveedorId, setProveedorId] = useState<string>('');
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');

  if (!isOpen) return null;

  const isCompraInsumos = categoria === 'Compra de productos e insumos';

  const handleSuppliesConfirmed = (
    items: GastoProductoItem[],
    totalCalculado: number
  ) => {
    setSupplyItems(items);
    setValor(totalCalculado.toString());

    // Auto-generate name if empty
    if (items.length > 0 && !nombreGasto) {
      if (items.length === 1) {
        setNombreGasto(`${items[0]!.cantidad} ${items[0]!.producto.nombre}`);
      } else {
        setNombreGasto(
          `Compra de ${items.length} productos (${items.map((i) => i.producto.nombre).slice(0, 2).join(', ')}...)`
        );
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = Number(valor) || 0;
    if (valorNum <= 0) return;

    const conceptoFinal =
      nombreGasto.trim() ||
      (supplyItems.length > 0
        ? `Compra de ${supplyItems.length} productos`
        : categoria);

    // 1. Register the expense (and accounts payable if en_deuda)
    registrarGasto({
      categoria,
      concepto: conceptoFinal,
      valor: valorNum,
      medioPago: estadoPago === 'en_deuda' ? 'credito' : medioPago,
      esCredito: estadoPago === 'en_deuda',
      proveedorId: proveedorId || null,
    });

    // 2. If supply items selected, automatically increment product inventory
    if (isCompraInsumos && supplyItems.length > 0) {
      supplyItems.forEach((item) => {
        ajustarStock(
          item.producto.id,
          item.cantidad,
          `Compra de insumo en gasto: ${conceptoFinal}`
        );
      });
    }

    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end select-none animate-in fade-in duration-150">
      {/* Slide-over Drawer Card */}
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div>
          <div className="p-6 pb-2 flex items-center justify-between border-b border-slate-100">
            <h3 className="text-xl font-black text-slate-900">Nuevo gasto</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-2 text-xs text-slate-400">
            Los campos marcados con asterisco (*) son obligatorios
          </div>

          {/* Form */}
          <form id="expense-form" onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Pagada / En Deuda Switcher */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
              <button
                type="button"
                onClick={() => setEstadoPago('pagada')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  estadoPago === 'pagada'
                    ? 'bg-[#10B981] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pagada
              </button>
              <button
                type="button"
                onClick={() => setEstadoPago('en_deuda')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  estadoPago === 'en_deuda'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                En deuda
              </button>
            </div>

            {/* Fecha del gasto */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Fecha del gasto*
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Categoría del gasto */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Categoría del gasto*
              </label>
              <select
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  if (e.target.value !== 'Compra de productos e insumos') {
                    setSupplyItems([]);
                  }
                }}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Compra de productos e insumos">
                  📦 Compra de productos e insumos
                </option>
                <option value="Servicios públicos">⚡ Servicios públicos</option>
                <option value="Arriendo">🏠 Arriendo</option>
                <option value="Nómina">👥 Nómina</option>
                <option value="Mantenimiento y Reparaciones">🛠️ Mantenimiento y Reparaciones</option>
                <option value="Transporte y Envíos">🚚 Transporte y Envíos</option>
                <option value="Marketing y Publicidad">📢 Marketing y Publicidad</option>
                <option value="Otros Gastos Operativos">📋 Otros Gastos Operativos</option>
              </select>
            </div>

            {/* If Compra de productos e insumos -> Supply Item Selection */}
            {isCompraInsumos && (
              <div className="space-y-3">
                {/* Blue Info Alert */}
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed font-semibold">
                  Agregaremos los productos seleccionados a tu{' '}
                  <span className="font-extrabold">inventario</span> automáticamente, al
                  crear el gasto.
                </div>

                {/* Supply Selector Tile */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold text-slate-700">
                      Productos comprados
                    </span>
                    {supplyItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSupplyItems([]);
                          setValor('');
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-rose-600 underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => setIsSupplyModalOpen(true)}
                    className="p-3.5 bg-white border border-slate-300 hover:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                        t.
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {supplyItems.length === 0
                          ? 'Selecciona los productos comprados'
                          : `${supplyItems.length} producto${
                              supplyItems.length > 1 ? 's' : ''
                            } seleccionado${supplyItems.length > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Valor */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Valor*
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {Number(valor) > 0 && (
                <div className="text-right text-xs font-black text-rose-600 mt-1">
                  Valor total = {formatCurrency(Number(valor))}
                </div>
              )}
            </div>

            {/* Nombre del gasto */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                ¿Quieres darle un nombre a este gasto?
              </label>
              <input
                type="text"
                placeholder="Ej. 6 Alpaca, Pago de luz..."
                value={nombreGasto}
                onChange={(e) => setNombreGasto(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                ¿Quién te vendió esto?
              </label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Selecciona un proveedor (opcional)</option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Medio de pago */}
            {estadoPago === 'pagada' && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-2">
                  ¿Cómo pagaste?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setMedioPago('efectivo')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition relative font-bold ${
                      medioPago === 'efectivo'
                        ? 'border-slate-900 bg-slate-50 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {medioPago === 'efectivo' && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                    )}
                    <Banknote className="w-5 h-5 text-slate-700" />
                    <span className="text-xs">Efectivo</span>
                  </div>

                  <div
                    onClick={() => setMedioPago('tarjeta')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition relative font-bold ${
                      medioPago === 'tarjeta'
                        ? 'border-slate-900 bg-slate-50 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {medioPago === 'tarjeta' && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                    )}
                    <CreditCard className="w-5 h-5 text-slate-700" />
                    <span className="text-xs">Tarjeta</span>
                  </div>

                  <div
                    onClick={() => setMedioPago('transferencia')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition relative font-bold ${
                      medioPago === 'transferencia'
                        ? 'border-slate-900 bg-slate-50 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {medioPago === 'transferencia' && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                    )}
                    <Building2 className="w-5 h-5 text-slate-700" />
                    <span className="text-xs">Transferencia</span>
                  </div>

                  <div
                    onClick={() => setMedioPago('nequi')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition relative font-bold ${
                      medioPago === 'nequi'
                        ? 'border-slate-900 bg-slate-50 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {medioPago === 'nequi' && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                    )}
                    <Layers className="w-5 h-5 text-slate-700" />
                    <span className="text-xs">Nequi / Otro</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Button */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <button
            type="submit"
            form="expense-form"
            className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-2xl font-black text-sm shadow-xl transition"
          >
            Crear gasto
          </button>
        </div>
      </div>

      {/* Select Supplies Modal */}
      {isSupplyModalOpen && (
        <SelectSuppliesModal
          isOpen={isSupplyModalOpen}
          onClose={() => setIsSupplyModalOpen(false)}
          initialItems={supplyItems}
          onConfirm={handleSuppliesConfirmed}
        />
      )}
    </div>,
    document.body
  );
};
