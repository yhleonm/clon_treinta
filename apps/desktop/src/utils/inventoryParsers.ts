import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de pdfjs para ejecución en navegador y vite
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ParsedInventoryRow {
  id: string;
  nombre: string;
  categoria: string;
  notas: string;
  cantidad: number;
  costo: number;
  precio: number;
  fecha_creado?: string;
  // Metadatos de interfaz y validación
  isDuplicate?: boolean;
  existingProductId?: string;
  existingProductStock?: number;
  duplicateAction?: 'actualizar' | 'crear_nuevo';
  requiresReview?: boolean;
  reviewReason?: string;
  selected: boolean;
  originalRaw?: any;
}

export interface ParseResult {
  filename: string;
  format: 'xlsx' | 'csv' | 'pdf';
  businessName?: string;
  reportedTotal?: number | null;
  detectedCount: number;
  rows: ParsedInventoryRow[];
  warnings: string[];
  errors: string[];
}

// ----------------------------------------------------------------------
// 1. NORMALIZADORES Y UTILIDADES
// ----------------------------------------------------------------------

const MESES_ES_MAP: Record<string, string> = {
  'ene': '01', 'enero': '01',
  'feb': '02', 'febrero': '02',
  'mar': '03', 'marzo': '03',
  'abr': '04', 'abril': '04',
  'may': '05', 'mayo': '05',
  'jun': '06', 'junio': '06',
  'jul': '07', 'julio': '07',
  'ago': '08', 'agosto': '08',
  'sep': '09', 'set': '09', 'septiembre': '09',
  'oct': '10', 'octubre': '10',
  'nov': '11', 'noviembre': '11',
  'dic': '12', 'diciembre': '12',
};

/**
 * Normaliza fechas en español (ej. "25 oct. 2024", "14 abr. 2025")
 * o numéricas ("25/10/2024", "2024-10-25") a formato ISO estándar YYYY-MM-DD
 */
export function normalizeSpanishDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  const str = String(val).trim().toLowerCase();

  // Caso 1: Formato "25 oct. 2024" o "14 abr 2025"
  const textMatch = str.match(/^(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})$/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const rawMonth = textMatch[2].replace('.', '');
    const month = MESES_ES_MAP[rawMonth] || '01';
    const year = textMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Caso 2: Formato DD/MM/YYYY o DD-MM-YYYY
  const numMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (numMatch) {
    const day = numMatch[1].padStart(2, '0');
    const month = numMatch[2].padStart(2, '0');
    const year = numMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Caso 3: Formato YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Normaliza montos monetarios colombianos ($ 39.546.404 -> 39546404)
 * Soporta números planos, strings con símbolo $, puntos como separador de miles.
 */
export function normalizeCurrencyAmount(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.max(0, val);
  }
  if (!val) return 0;

  const rawStr = String(val).trim();
  if (rawStr === '' || rawStr === '$ 0' || rawStr === '$0') return 0;

  // Remover $, espacios y caracteres no numéricos
  // En formato colombiano, los puntos separan miles: 1.800 -> 1800, 39.546.404 -> 39546404
  let cleaned = rawStr.replace(/[$\s]/g, '');

  // Si tiene formato de comas y puntos:
  // e.g. "39.546.404,00" -> quitar puntos y reemplazar coma por punto
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.')) {
    // Si solo tiene puntos (ej. "39.546.404" o "1.800"): son separadores de miles
    cleaned = cleaned.replace(/\./g, '');
  } else if (cleaned.includes(',')) {
    // Si solo tiene coma y 3 dígitos después (ej "1,800"), tratar como miles
    if (/,\d{3}$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Decimal
      cleaned = cleaned.replace(',', '.');
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Normaliza cantidad numérica (ej. "39", 40, "0")
 */
export function normalizeQuantity(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.max(0, val);
  }
  if (!val) return 0;

  const cleaned = String(val).replace(/[^\d,\.-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

// ----------------------------------------------------------------------
// 2. PARSER DE EXCEL (.xlsx / .xls)
// ----------------------------------------------------------------------

export async function parseExcelFile(
  fileOrBuffer: File | ArrayBuffer,
  filename = 'inventario.xlsx'
): Promise<ParseResult> {
  const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertir a matriz bidimensional de filas
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  let headerRowIdx = -1;
  let businessName: string | undefined = undefined;
  let reportedTotal: number | null = null;
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Búsqueda dinámica del bloque de metadatos y fila de encabezados reales
  const scanLimit = Math.min(25, rawData.length);
  for (let r = 0; r < scanLimit; r++) {
    const row = rawData[r].map((cell) => String(cell || '').trim());
    const rowJoined = row.join(' ').toLowerCase();

    // Metadato: Nombre de negocio (habitualmente fila 2)
    if (!businessName && r >= 1 && r <= 3) {
      const candidate = row.find((c) => c && !c.toLowerCase().includes('teléfono') && c.length > 2);
      if (candidate) businessName = candidate;
    }

    // Metadato: Conteo reportado "Productos: 328"
    for (let c = 0; c < row.length; c++) {
      if (row[c].toLowerCase().includes('productos:')) {
        const nextCol = row.slice(c + 1).find((v) => Number(v) > 0);
        if (nextCol) reportedTotal = parseInt(nextCol, 10);
      }
    }

    // Detección tolerante de fila de encabezados: contiene "Nombre" y ("Cant." o "Cantidad")
    const hasNombre = row.some((c) => c.toLowerCase() === 'nombre' || c.toLowerCase().includes('nombre'));
    const hasCant = row.some((c) => c.toLowerCase().startsWith('cant'));

    if (hasNombre && hasCant) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(
      'No se encontró la fila de encabezados en el archivo Excel. Asegúrate de que contenga las columnas "Nombre" y "Cant.".'
    );
  }

  // 2. Mapeo dinámico de columnas por nombre
  const headerRow = rawData[headerRowIdx].map((c) => String(c || '').trim().toLowerCase());
  const colIndex = {
    creado: headerRow.findIndex((h) => h.includes('creado') || h.includes('fecha')),
    nombre: headerRow.findIndex((h) => h.includes('nombre') || h.includes('producto')),
    categoria: headerRow.findIndex((h) => h.includes('categor')),
    notas: headerRow.findIndex((h) => h.includes('nota') || h.includes('descrip')),
    cantidad: headerRow.findIndex((h) => h.startsWith('cant')),
    costo: headerRow.findIndex((h) => h.includes('costo unit') || h.includes('costo')),
    precio: headerRow.findIndex((h) => h.includes('precio unit') || h.includes('precio')),
  };

  if (colIndex.nombre === -1 || colIndex.cantidad === -1) {
    throw new Error('El archivo no contiene las columnas mínimas requeridas ("Nombre" y "Cant.").');
  }

  // 3. Extracción y parseo de filas de productos
  const rows: ParsedInventoryRow[] = [];
  for (let r = headerRowIdx + 1; r < rawData.length; r++) {
    const rawRow = rawData[r];
    if (!rawRow || rawRow.every((c) => String(c || '').trim() === '')) {
      continue; // Ignorar filas completamente vacías
    }

    const rawNombre = String(rawRow[colIndex.nombre] || '').trim();
    if (!rawNombre) {
      // Si la fila tiene datos numéricos pero no nombre, marcar para revisión
      if (rawRow.some((c) => c !== '')) {
        rows.push({
          id: `row-${r}`,
          nombre: '(Sin nombre detectado)',
          categoria: colIndex.categoria !== -1 ? String(rawRow[colIndex.categoria] || '').trim() : '',
          notas: colIndex.notas !== -1 ? String(rawRow[colIndex.notas] || '').trim() : '',
          cantidad: colIndex.cantidad !== -1 ? normalizeQuantity(rawRow[colIndex.cantidad]) : 0,
          costo: colIndex.costo !== -1 ? normalizeCurrencyAmount(rawRow[colIndex.costo]) : 0,
          precio: colIndex.precio !== -1 ? normalizeCurrencyAmount(rawRow[colIndex.precio]) : 0,
          fecha_creado: colIndex.creado !== -1 ? normalizeSpanishDate(rawRow[colIndex.creado]) : undefined,
          requiresReview: true,
          reviewReason: 'Falta el nombre del producto en la fila',
          selected: false,
          originalRaw: rawRow,
        });
      }
      continue;
    }

    const categoria = colIndex.categoria !== -1 ? String(rawRow[colIndex.categoria] || '').trim() : '';
    const notas = colIndex.notas !== -1 ? String(rawRow[colIndex.notas] || '').trim() : '';
    const cantidad = colIndex.cantidad !== -1 ? normalizeQuantity(rawRow[colIndex.cantidad]) : 0;
    const costo = colIndex.costo !== -1 ? normalizeCurrencyAmount(rawRow[colIndex.costo]) : 0;
    const precio = colIndex.precio !== -1 ? normalizeCurrencyAmount(rawRow[colIndex.precio]) : 0;
    const fecha = colIndex.creado !== -1 ? normalizeSpanishDate(rawRow[colIndex.creado]) : undefined;

    rows.push({
      id: `row-${r}`,
      nombre: rawNombre,
      categoria: categoria,
      notas: notas,
      cantidad: cantidad,
      costo: costo,
      precio: precio,
      fecha_creado: fecha,
      selected: true,
      originalRaw: rawRow,
    });
  }

  // 4. Validación cruzada con bloque de metadatos
  if (reportedTotal !== null && reportedTotal !== rows.length) {
    warnings.push(
      `El encabezado de Treinta reportaba ${reportedTotal} productos, pero se procesaron ${rows.length} filas válidas.`
    );
  }

  return {
    filename,
    format: 'xlsx',
    businessName,
    reportedTotal,
    detectedCount: rows.length,
    rows,
    warnings,
    errors,
  };
}

// ----------------------------------------------------------------------
// 3. PARSER DE CSV
// ----------------------------------------------------------------------

export async function parseCsvFile(
  fileOrText: File | string,
  filename = 'inventario.csv'
): Promise<ParseResult> {
  let text = '';
  if (fileOrText instanceof File) {
    try {
      // Intentar primero con UTF-8
      text = await fileOrText.text();
      // Si contiene caracteres de reemplazo extraños o corruptos, probar ISO-8859-1
      if (text.includes('\uFFFD')) {
        const buffer = await fileOrText.arrayBuffer();
        const decoder = new TextDecoder('iso-8859-1');
        text = decoder.decode(buffer);
      }
    } catch {
      text = await fileOrText.text();
    }
  } else {
    text = fileOrText;
  }

  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
  });

  const rawData = parsed.data;
  let headerRowIdx = -1;
  let businessName: string | undefined = undefined;
  let reportedTotal: number | null = null;
  const warnings: string[] = [];
  const errors: string[] = [];

  const scanLimit = Math.min(25, rawData.length);
  for (let r = 0; r < scanLimit; r++) {
    const row = rawData[r].map((cell) => String(cell || '').trim());

    if (!businessName && r >= 1 && r <= 3) {
      const candidate = row.find((c) => c && !c.toLowerCase().includes('teléfono') && c.length > 2);
      if (candidate) businessName = candidate;
    }

    for (let c = 0; c < row.length; c++) {
      if (row[c].toLowerCase().includes('productos:')) {
        const nextCol = row.slice(c + 1).find((v) => Number(v) > 0);
        if (nextCol) reportedTotal = parseInt(nextCol, 10);
      }
    }

    const hasNombre = row.some((c) => c.toLowerCase() === 'nombre' || c.toLowerCase().includes('nombre'));
    const hasCant = row.some((c) => c.toLowerCase().startsWith('cant'));

    if (hasNombre && hasCant) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(
      'No se encontró la fila de encabezados en el archivo CSV. Asegúrate de que contenga las columnas "Nombre" y "Cant.".'
    );
  }

  const headerRow = rawData[headerRowIdx].map((c) => String(c || '').trim().toLowerCase());
  const colIndex = {
    creado: headerRow.findIndex((h) => h.includes('creado') || h.includes('fecha')),
    nombre: headerRow.findIndex((h) => h.includes('nombre') || h.includes('producto')),
    categoria: headerRow.findIndex((h) => h.includes('categor')),
    notas: headerRow.findIndex((h) => h.includes('nota') || h.includes('descrip')),
    cantidad: headerRow.findIndex((h) => h.startsWith('cant')),
    costo: headerRow.findIndex((h) => h.includes('costo unit') || h.includes('costo')),
    precio: headerRow.findIndex((h) => h.includes('precio unit') || h.includes('precio')),
  };

  const rows: ParsedInventoryRow[] = [];
  for (let r = headerRowIdx + 1; r < rawData.length; r++) {
    const rawRow = rawData[r];
    if (!rawRow || rawRow.every((c) => String(c || '').trim() === '')) continue;

    const rawNombre = String(rawRow[colIndex.nombre] || '').trim();
    if (!rawNombre) {
      if (rawRow.some((c) => c !== '')) {
        rows.push({
          id: `csv-${r}`,
          nombre: '(Sin nombre detectado)',
          categoria: colIndex.categoria !== -1 ? String(rawRow[colIndex.categoria] || '').trim() : '',
          notas: colIndex.notas !== -1 ? String(rawRow[colIndex.notas] || '').trim() : '',
          cantidad: colIndex.cantidad !== -1 ? normalizeQuantity(rawRow[colIndex.cantidad]) : 0,
          costo: colIndex.costo !== -1 ? normalizeCurrencyAmount(rawRow[colIndex.costo]) : 0,
          precio: colIndex.precio !== -1 ? normalizeCurrencyAmount(rawRow[colIndex.precio]) : 0,
          fecha_creado: colIndex.creado !== -1 ? normalizeSpanishDate(rawRow[colIndex.creado]) : undefined,
          requiresReview: true,
          reviewReason: 'Falta el nombre del producto en la fila',
          selected: false,
          originalRaw: rawRow,
        });
      }
      continue;
    }

    const categoria = colIndex.categoria !== -1 ? String(rawRow[colIndex.categoria] || '').trim() : '';
    const notas = colIndex.notas !== -1 ? String(rawRow[colIndex.notas] || '').trim() : '';
    const cantidad = colIndex.cantidad !== -1 ? normalizeQuantity(rawRow[colIndex.cantidad]) : 0;
    const costo = colIndex.costo !== -1 ? normalizeCurrencyAmount(rawRow[colIndex.costo]) : 0;
    const precio = colIndex.precio !== -1 ? normalizeCurrencyAmount(rawRow[colIndex.precio]) : 0;
    const fecha = colIndex.creado !== -1 ? normalizeSpanishDate(rawRow[colIndex.creado]) : undefined;

    rows.push({
      id: `csv-${r}`,
      nombre: rawNombre,
      categoria: categoria,
      notas: notas,
      cantidad: cantidad,
      costo: costo,
      precio: precio,
      fecha_creado: fecha,
      selected: true,
      originalRaw: rawRow,
    });
  }

  if (reportedTotal !== null && reportedTotal !== rows.length) {
    warnings.push(
      `El encabezado de Treinta reportaba ${reportedTotal} productos, pero se procesaron ${rows.length} filas válidas.`
    );
  }

  return {
    filename,
    format: 'csv',
    businessName,
    reportedTotal,
    detectedCount: rows.length,
    rows,
    warnings,
    errors,
  };
}

// ----------------------------------------------------------------------
// 4. PARSER DE PDF (Basado en Coordenadas X/Y)
// ----------------------------------------------------------------------

export async function parsePdfFile(
  fileOrBuffer: File | ArrayBuffer,
  filename = 'inventario.pdf'
): Promise<ParseResult> {
  const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;

  let businessName: string | undefined = undefined;
  let reportedTotal: number | null = null;
  const warnings: string[] = [];
  const errors: string[] = [];
  const rows: ParsedInventoryRow[] = [];

  // Recorrer todas las páginas del PDF
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{
      str: string;
      transform: number[]; // [scaleX, skewY, skewX, scaleY, tx, ty]
    }>;

    // En la página 1, buscar metadatos de cabecera
    if (p === 1) {
      for (let i = 0; i < items.length; i++) {
        const str = items[i].str.trim();
        if (str === 'Reporte de inventario' && items[i + 1]) {
          const next = items.slice(i + 1, i + 5).find((t) => t.str.trim() && t.str.trim() !== 'Reporte de inventario');
          if (next) businessName = next.str.trim();
        }
        if (str.includes('Número de productos:')) {
          const next = items.slice(i + 1, i + 4).find((t) => /^\d+$/.test(t.str.trim()));
          if (next) reportedTotal = parseInt(next.str.trim(), 10);
        }
      }
    }

    // 1. Detectar la línea de encabezados de la tabla ("Creado", "Nombre", etc.)
    let headerY: number | null = null;
    for (const it of items) {
      if (it.str.trim() === 'Creado' && Math.round(it.transform[4]) <= 50) {
        headerY = it.transform[5];
        break;
      }
    }

    if (!headerY) continue; // Si no hay tabla en esta página

    // 2. Filtrar tokens pertenecientes al cuerpo de la tabla
    // Excluir encabezados de página, numeración "Página X de Y" y footer publicitario de Treinta
    const tableItems = items.filter((it) => {
      const y = it.transform[5];
      const str = (it.str || '').trim();
      if (!str) return false;
      if (y >= headerY - 5) return false; // En o por encima del encabezado
      if (y <= 30) return false; // Footer
      if (str.includes('Página') || str.includes('www.treinta') || str.includes('Descarga')) return false;
      return true;
    });

    // 3. Localizar los anclas de fila: fechas DD/MM/YYYY en la columna 0 (x <= 75)
    const rowAnchors = tableItems
      .filter((it) => it.transform[4] <= 75 && /^\d{2}\/\d{2}\/\d{4}$/.test(it.str.trim()))
      .map((it) => ({ date: it.str.trim(), y: it.transform[5] }))
      .sort((a, b) => b.y - a.y); // De arriba a abajo

    // 4. Para cada fila ancla, agrupar todos los tokens dentro de su franja vertical
    for (let i = 0; i < rowAnchors.length; i++) {
      const curr = rowAnchors[i];
      const topLimit = i === 0 ? headerY - 2 : (curr.y + rowAnchors[i - 1].y) / 2;
      const bottomLimit = i === rowAnchors.length - 1 ? 30 : (curr.y + rowAnchors[i + 1].y) / 2;

      const rowTokens = tableItems.filter((it) => it.transform[5] < topLimit && it.transform[5] >= bottomLimit);

      // Clasificar tokens por columna según coordenadas X:
      // Nombre: x en [75, 158]
      // Categoría: x en [158, 222]
      // Cantidad: x en [222, 268]
      // Costo: x en [268, 344]
      // Precio: x en [344, 424]
      const nameTokens = rowTokens.filter((t) => t.transform[4] >= 75 && t.transform[4] < 158);
      const catTokens = rowTokens.filter((t) => t.transform[4] >= 158 && t.transform[4] < 222);
      const cantTokens = rowTokens.filter((t) => t.transform[4] >= 222 && t.transform[4] < 268);
      const costTokens = rowTokens.filter((t) => t.transform[4] >= 268 && t.transform[4] < 344);
      const priceTokens = rowTokens.filter((t) => t.transform[4] >= 344 && t.transform[4] < 424);

      // Ordenar tokens de texto multilínea verticalmente (de arriba a abajo)
      const sortMultiLine = (toks: typeof tableItems) =>
        toks.sort((a, b) => {
          const dy = b.transform[5] - a.transform[5];
          if (Math.abs(dy) > 2) return dy;
          return a.transform[4] - b.transform[4];
        });

      // Ensamblar nombres y categorías que ocupan múltiples líneas en la celda
      const nombre = sortMultiLine(nameTokens)
        .map((t) => t.str.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const categoria = sortMultiLine(catTokens)
        .map((t) => t.str.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const rawCant = cantTokens.map((t) => t.str.trim()).join('');
      const rawCosto = costTokens.map((t) => t.str.trim()).join(' ');
      const rawPrecio = priceTokens.map((t) => t.str.trim()).join(' ');

      const cantidad = normalizeQuantity(rawCant);
      const costo = normalizeCurrencyAmount(rawCosto);
      const precio = normalizeCurrencyAmount(rawPrecio);
      const fecha = normalizeSpanishDate(curr.date);

      const isInvalid = !nombre;

      rows.push({
        id: `pdf-p${p}-r${i}`,
        nombre: nombre || '(Sin nombre detectado)',
        categoria: categoria,
        notas: '',
        cantidad: cantidad,
        costo: costo,
        precio: precio,
        fecha_creado: fecha,
        requiresReview: isInvalid,
        reviewReason: isInvalid ? 'No se pudo extraer el nombre del producto en el PDF' : undefined,
        selected: !isInvalid,
        originalRaw: { page: p, date: curr.date, rawCant, rawCosto, rawPrecio },
      });
    }
  }

  if (reportedTotal !== null && reportedTotal !== rows.length) {
    warnings.push(
      `El reporte PDF indicaba "Número de productos: ${reportedTotal}", y se extrajeron ${rows.length} productos.`
    );
  }

  return {
    filename,
    format: 'pdf',
    businessName,
    reportedTotal,
    detectedCount: rows.length,
    rows,
    warnings,
    errors,
  };
}

// ----------------------------------------------------------------------
// 5. DETECCIÓN AUTOMÁTICA DE FORMATO Y DISPATCHER
// ----------------------------------------------------------------------

export async function parseInventoryFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcelFile(file, file.name);
  } else if (ext === 'csv') {
    return parseCsvFile(file, file.name);
  } else if (ext === 'pdf') {
    return parsePdfFile(file, file.name);
  }

  // Fallback por tipo MIME
  if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
    return parseExcelFile(file, file.name);
  } else if (file.type.includes('csv') || file.type.includes('text/plain')) {
    return parseCsvFile(file, file.name);
  } else if (file.type.includes('pdf')) {
    return parsePdfFile(file, file.name);
  }

  throw new Error(
    `Formato no soportado (.${ext}). Por favor sube un archivo Excel (.xlsx, .xls), CSV (.csv) o PDF (.pdf).`
  );
}

// ----------------------------------------------------------------------
// 6. DETECCIÓN DE DUPLICADOS CONTRA PRODUCTOS EXISTENTES
// ----------------------------------------------------------------------

export function markDuplicates(
  rows: ParsedInventoryRow[],
  existingProducts: Array<{ id: string; nombre: string; stock_actual: number }>
): {
  rowsWithDuplicates: ParsedInventoryRow[];
  duplicatesCount: number;
  newCount: number;
} {
  const existingMap = new Map<string, { id: string; nombre: string; stock_actual: number }>();
  for (const p of existingProducts) {
    const norm = p.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    existingMap.set(norm, p);
  }

  let duplicatesCount = 0;
  let newCount = 0;

  const rowsWithDuplicates = rows.map((row) => {
    const normName = row.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const match = existingMap.get(normName);
    if (match) {
      duplicatesCount++;
      return {
        ...row,
        isDuplicate: true,
        existingProductId: match.id,
        existingProductStock: match.stock_actual,
        duplicateAction: (row.duplicateAction || 'actualizar') as 'actualizar' | 'crear_nuevo',
      };
    } else {
      newCount++;
      return {
        ...row,
        isDuplicate: false,
      };
    }
  });

  return {
    rowsWithDuplicates,
    duplicatesCount,
    newCount,
  };
}
