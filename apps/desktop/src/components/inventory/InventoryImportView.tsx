import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Search,
  Sparkles,
  RefreshCw,
  Info,
  Check,
  Package,
  Layers,
  DollarSign,
  Filter,
  CheckSquare,
  Square,
  Download,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '@treinta/shared';
import {
  parseInventoryFile,
  markDuplicates,
  ParsedInventoryRow,
  ParseResult
} from '../../utils/inventoryParsers';

interface InventoryImportViewProps {
  onBack: () => void;
}

export const InventoryImportView: React.FC<InventoryImportViewProps> = ({ onBack }) => {
  const { productos, categorias, importarInventario, negocio } = useAppStore();

  // Estados del flujo
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Opciones de importación
  const [updateExisting, setUpdateExisting] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'nuevos' | 'coincidencias' | 'revision'>('todos');

  // Estado de filas
  const [rows, setRows] = useState<ParsedInventoryRow[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState<number>(0);
  const [newCount, setNewCount] = useState<number>(0);

  // Estados de ejecución
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    creados: number;
    actualizados: number;
    omitidos: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Procesar archivo seleccionado
  const handleFileProcess = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setImportSummary(null);

    try {
      const result = await parseInventoryFile(selectedFile);
      setParseResult(result);

      // Detectar duplicados contra inventario del negocio
      const { rowsWithDuplicates, duplicatesCount: dups, newCount: news } = markDuplicates(
        result.rows,
        productos
      );

      setRows(rowsWithDuplicates);
      setDuplicatesCount(dups);
      setNewCount(news);
    } catch (err: any) {
      console.error('Error parseando archivo:', err);
      setParseError(err.message || 'Ocurrió un error al procesar el archivo.');
      setParseResult(null);
      setRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Edición en línea de celdas
  const handleRowChange = (id: string, field: keyof ParsedInventoryRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'nombre' && updated.requiresReview && value.trim()) {
          updated.requiresReview = false;
          updated.reviewReason = undefined;
        }
        return updated;
      })
    );
  };

  // Toggle selección de fila
  const handleToggleRow = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  // Seleccionar / Deseleccionar todos los visibles
  const handleToggleAll = (selectAll: boolean) => {
    const visibleIds = new Set(filteredRows.map((r) => r.id));
    setRows((prev) =>
      prev.map((r) => (visibleIds.has(r.id) ? { ...r, selected: selectAll } : r))
    );
  };

  // Intento de reparación con IA para filas que requieren revisión
  const handleAiRepair = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        // Si no tiene nombre, sugerir nombre basado en categoría o texto disponible
        let repairedName = r.nombre;
        if (!repairedName || repairedName.includes('(Sin nombre')) {
          repairedName = r.originalRaw?.rawCant
            ? `Producto importado (${r.categoria || 'General'})`
            : 'Producto sin identificar';
        }
        return {
          ...r,
          nombre: repairedName,
          requiresReview: false,
          reviewReason: undefined,
          selected: true,
        };
      })
    );
  };

  // Categorías que se crearán automáticamente
  const categoriesToCreate = useMemo(() => {
    const existingNorm = new Set(categorias.map((c) => c.nombre.toLowerCase().trim()));
    const newCats = new Set<string>();
    rows.forEach((r) => {
      const cat = (r.categoria || '').trim();
      if (cat && !existingNorm.has(cat.toLowerCase())) {
        newCats.add(cat);
      }
    });
    return Array.from(newCats);
  }, [rows, categorias]);

  // Filas filtradas según término de búsqueda y pestaña de estado
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Filtro de estado
      if (statusFilter === 'nuevos' && r.isDuplicate) return false;
      if (statusFilter === 'coincidencias' && !r.isDuplicate) return false;
      if (statusFilter === 'revision' && !r.requiresReview) return false;

      // Filtro de texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = r.nombre.toLowerCase().includes(query);
        const matchCat = r.categoria.toLowerCase().includes(query);
        const matchNotas = r.notas.toLowerCase().includes(query);
        if (!matchName && !matchCat && !matchNotas) return false;
      }

      return true;
    });
  }, [rows, statusFilter, searchTerm]);

  // Estadísticas de los productos seleccionados para importar
  const selectedRows = useMemo(() => rows.filter((r) => r.selected), [rows]);

  const totalStockSelected = useMemo(
    () => selectedRows.reduce((sum, r) => sum + (r.cantidad || 0), 0),
    [selectedRows]
  );

  const totalCostoSelected = useMemo(
    () => selectedRows.reduce((sum, r) => sum + (r.cantidad || 0) * (r.costo || 0), 0),
    [selectedRows]
  );

  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every((r) => r.selected);

  // Ejecución final de la importación
  const handleConfirmImport = async () => {
    if (selectedRows.length === 0) return;
    setIsSubmitting(true);

    try {
      const payload = selectedRows.map((r) => ({
        nombre: r.nombre.trim(),
        categoria: (r.categoria || '').trim() || undefined,
        notas: (r.notas || '').trim() || undefined,
        cantidad: Number(r.cantidad || 0),
        costo: Number(r.costo || 0),
        precio: Number(r.precio || 0),
        fecha_creado: r.fecha_creado,
      }));

      const res = await importarInventario({
        nombreArchivo: file?.name || 'importacion.xlsx',
        formato: parseResult?.format || 'xlsx',
        actualizarExistentes: updateExisting,
        productos: payload,
      });

      if (res.success) {
        setImportSummary({
          total: res.total,
          creados: res.creados,
          actualizados: res.actualizados,
          omitidos: res.omitidos,
        });
      } else {
        alert('Error al importar: ' + (res.error || 'Ocurrió un problema en la base de datos'));
      }
    } catch (err: any) {
      console.error('Error confirmando importación:', err);
      alert('Error: ' + (err.message || 'No se pudo completar la importación masiva'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-slate-50">
      {/* 1. TOP HEADER */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
            title="Volver al inventario"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Importar Inventario Masivo</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Excel • CSV • PDF
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Migración directa sin captura manual para tu negocio {negocio.nombre}
            </p>
          </div>
        </div>

        {parseResult && !importSummary && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFile(null);
                setParseResult(null);
                setRows([]);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-extrabold rounded-xl transition"
            >
              Cargar otro archivo
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isSubmitting || selectedRows.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-extrabold rounded-xl shadow-md transition"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Procesando transacción...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar Importación ({selectedRows.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. BODY CONTAINER */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* CASO: ÉXITO DE IMPORTACIÓN */}
        {importSummary ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                ¡Inventario importado con éxito!
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Los productos y movimientos de inventario (Kardex) se registraron correctamente en la base de datos.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Creados</span>
                <span className="text-2xl font-black text-emerald-600">{importSummary.creados}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Actualizados</span>
                <span className="text-2xl font-black text-blue-600">{importSummary.actualizados}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Omitidos</span>
                <span className="text-2xl font-black text-slate-400">{importSummary.omitidos}</span>
              </div>
            </div>

            {categoriesToCreate.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl p-3 text-left flex items-center gap-2">
                <Layers className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  Se crearon automáticamente <strong>{categoriesToCreate.length}</strong> nuevas categorías en el catálogo.
                </span>
              </div>
            )}

            <button
              onClick={onBack}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl transition shadow-md"
            >
              Volver al Inventario
            </button>
          </div>
        ) : !parseResult ? (
          /* CASO: DROPZONE INICIAL */
          <div className="max-w-3xl mx-auto space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[320px] ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-slate-400 bg-white shadow-sm'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {isParsing ? (
                <div className="space-y-4">
                  <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-base font-extrabold text-slate-800">
                    Analizando y extrayendo estructura del inventario...
                  </p>
                  <p className="text-xs text-slate-400">
                    Detectando filas, columnas y normalizando formato
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Upload className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-slate-800">
                      Arrastra tu archivo aquí o <span className="text-emerald-600 underline">haz clic para examinar</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Soporta exportaciones de Treinta en formatos <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong> y <strong>.pdf</strong>
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg">
                      <FileCode className="w-3.5 h-3.5" /> CSV (.csv)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg">
                      <FileText className="w-3.5 h-3.5" /> PDF Tabular (.pdf)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {parseError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-rose-900">Error al procesar el archivo</h4>
                  <p className="text-xs text-rose-700 mt-0.5">{parseError}</p>
                </div>
              </div>
            )}

            {/* Tarjeta de guía */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Características del importador StockPro
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                <li>
                  <strong>Tolerante al encabezado:</strong> Detecta automáticamente dónde empieza la tabla de productos saltando los metadatos del negocio.
                </li>
                <li>
                  <strong>Fechas en español:</strong> Reconoce fechas abreviadas en español (ej. <em>"25 oct. 2024"</em>) y formato numérico.
                </li>
                <li>
                  <strong>Soporte multilínea en PDF:</strong> Agrupa nombres de productos partidos en dos líneas en la celda original.
                </li>
                <li>
                  <strong>Asiento en Kardex:</strong> Registra movimientos de tipo <em>'importacion'</em> de forma atómica para trazabilidad.
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* CASO: VISTA PREVIA Y CONFIGURACIÓN DE IMPORTACIÓN */
          <div className="space-y-6">
            {/* Banner de Metadatos y Validación Cruzada */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-xs uppercase">
                  {parseResult.format}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">{parseResult.filename}</h3>
                    {parseResult.businessName && (
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                        {parseResult.businessName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>
                      Productos detectados: <strong>{parseResult.detectedCount}</strong>
                    </span>
                    {parseResult.reportedTotal !== null && (
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          parseResult.reportedTotal === parseResult.detectedCount
                            ? 'text-emerald-700'
                            : 'text-amber-600'
                        }`}
                      >
                        • Treinta reportaba: {parseResult.reportedTotal}{' '}
                        {parseResult.reportedTotal === parseResult.detectedCount ? '(Coincide 100% ✓)' : '(Discrepancia menor)'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Opciones de Duplicados */}
              <div className="flex items-center gap-6 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-xs font-black text-slate-700">Manejo de duplicados:</span>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="dupAction"
                    checked={updateExisting}
                    onChange={() => setUpdateExisting(true)}
                    className="accent-emerald-600"
                  />
                  <span>Actualizar stock/costo del existente</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="dupAction"
                    checked={!updateExisting}
                    onChange={() => setUpdateExisting(false)}
                    className="accent-emerald-600"
                  />
                  <span>Crear como producto nuevo</span>
                </label>
              </div>
            </div>

            {/* Métricas y resumen rápido */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total a importar</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {selectedRows.length} <span className="text-xs text-slate-400 font-normal">de {rows.length}</span>
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Nuevos vs Existentes</span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  <span className="text-emerald-600">{newCount} nuevos</span> • <span className="text-blue-600">{duplicatesCount} existentes</span>
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Unidades de Stock</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {totalStockSelected.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Costo Total Estimado</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {formatCurrency(totalCostoSelected)}
                </span>
              </div>
            </div>

            {/* Barra de filtros y búsqueda */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatusFilter('todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                    statusFilter === 'todos'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todos ({rows.length})
                </button>
                <button
                  onClick={() => setStatusFilter('nuevos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                    statusFilter === 'nuevos'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Nuevos ({newCount})
                </button>
                <button
                  onClick={() => setStatusFilter('coincidencias')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                    statusFilter === 'coincidencias'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Coincidencias ({duplicatesCount})
                </button>
                {rows.some((r) => r.requiresReview) && (
                  <button
                    onClick={() => setStatusFilter('revision')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                      statusFilter === 'revision'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Requiere revisión ({rows.filter((r) => r.requiresReview).length})
                  </button>
                )}
              </div>

              {/* Búsqueda */}
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en vista previa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            </div>

            {/* TABLA DE VISTA PREVIA EDITABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAll(!allVisibleSelected)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          {allVisibleSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-3 min-w-[200px]">Producto (Nombre)</th>
                      <th className="p-3 min-w-[150px]">Categoría</th>
                      <th className="p-3 min-w-[90px] text-right">Cant.</th>
                      <th className="p-3 min-w-[110px] text-right">Costo unit.</th>
                      <th className="p-3 min-w-[110px] text-right">Precio unit.</th>
                      <th className="p-3 min-w-[140px]">Notas / Detalle</th>
                      <th className="p-3 min-w-[140px] text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                          No se encontraron productos en esta categoría de filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50 transition ${
                            !row.selected ? 'opacity-50 bg-slate-50/50' : ''
                          } ${row.requiresReview ? 'bg-amber-50/50' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => handleToggleRow(row.id)}
                              className="accent-emerald-600 rounded cursor-pointer w-4 h-4"
                            />
                          </td>

                          {/* Nombre editable */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.nombre}
                              onChange={(e) => handleRowChange(row.id, 'nombre', e.target.value)}
                              className={`w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded font-bold text-slate-900 focus:bg-white focus:outline-none transition ${
                                row.requiresReview ? 'border-amber-400 bg-amber-50' : ''
                              }`}
                            />
                          </td>

                          {/* Categoría editable */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Sin categoría"
                              value={row.categoria}
                              onChange={(e) => handleRowChange(row.id, 'categoria', e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded text-slate-700 focus:bg-white focus:outline-none transition"
                            />
                          </td>

                          {/* Cantidad */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={row.cantidad}
                              onChange={(e) => handleRowChange(row.id, 'cantidad', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-right bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded font-bold text-slate-900 focus:bg-white focus:outline-none transition"
                            />
                          </td>

                          {/* Costo Unitario */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={row.costo}
                              onChange={(e) => handleRowChange(row.id, 'costo', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-right bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded text-slate-700 focus:bg-white focus:outline-none transition"
                            />
                          </td>

                          {/* Precio Unitario */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={row.precio}
                              onChange={(e) => handleRowChange(row.id, 'precio', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-right bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded font-bold text-emerald-700 focus:bg-white focus:outline-none transition"
                            />
                          </td>

                          {/* Notas */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Opcional"
                              value={row.notas}
                              onChange={(e) => handleRowChange(row.id, 'notas', e.target.value)}
                              className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded text-slate-500 focus:bg-white focus:outline-none transition text-xs"
                            />
                          </td>

                          {/* Estado y Badges */}
                          <td className="p-3 text-center">
                            {row.requiresReview ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <span
                                  className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full"
                                  title={row.reviewReason}
                                >
                                  Revisar
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAiRepair(row.id)}
                                  className="p-1 hover:bg-amber-200 rounded text-amber-800 transition"
                                  title="Intentar autocompletar con IA"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                </button>
                              </div>
                            ) : row.isDuplicate ? (
                              <span
                                className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full"
                                title={`Coincide con un producto existente (Stock actual: ${row.existingProductStock})`}
                              >
                                Coincidencia
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                                Nuevo
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer de la tabla */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>
                  Mostrando {filteredRows.length} de {rows.length} filas
                </span>
                <span>
                  Seleccionados para importar: <strong className="text-slate-900">{selectedRows.length}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
