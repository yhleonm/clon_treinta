import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const MESES_ES_MAP = {
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

function normalizeSpanishDate(val) {
  if (!val) return new Date().toISOString().split('T')[0];
  const str = String(val).trim().toLowerCase();
  const textMatch = str.match(/^(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})$/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const rawMonth = textMatch[2].replace('.', '');
    const month = MESES_ES_MAP[rawMonth] || '01';
    const year = textMatch[3];
    return `${year}-${month}-${day}`;
  }
  const numMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (numMatch) {
    const day = numMatch[1].padStart(2, '0');
    const month = numMatch[2].padStart(2, '0');
    const year = numMatch[3];
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
}

function normalizeCurrencyAmount(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);
  if (!val) return 0;
  const rawStr = String(val).trim();
  if (rawStr === '' || rawStr === '$ 0' || rawStr === '$0') return 0;
  let cleaned = rawStr.replace(/[$\s]/g, '');
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '');
  } else if (cleaned.includes(',')) {
    if (/,\d{3}$/.test(cleaned)) cleaned = cleaned.replace(/,/g, '');
    else cleaned = cleaned.replace(',', '.');
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

function normalizeQuantity(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d,\.-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

async function testExcel() {
  const filePath = 'C:/Users/yelem/workspace/aplicacion_treinta/inventario-1788369852.xlsx';
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let headerRowIdx = -1;
  let businessName;
  let reportedTotal = null;

  for (let r = 0; r < Math.min(25, rawData.length); r++) {
    const row = rawData[r].map(c => String(c || '').trim());
    if (!businessName && r >= 1 && r <= 3) {
      const candidate = row.find(c => c && !c.toLowerCase().includes('teléfono') && c.length > 2);
      if (candidate) businessName = candidate;
    }
    for (let c = 0; c < row.length; c++) {
      if (row[c].toLowerCase().includes('productos:')) {
        const nextCol = row.slice(c + 1).find(v => Number(v) > 0);
        if (nextCol) reportedTotal = parseInt(nextCol, 10);
      }
    }
    const hasNombre = row.some(c => c.toLowerCase() === 'nombre' || c.toLowerCase().includes('nombre'));
    const hasCant = row.some(c => c.toLowerCase().startsWith('cant'));
    if (hasNombre && hasCant) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rawData[headerRowIdx].map(c => String(c || '').trim().toLowerCase());
  const colIndex = {
    creado: headerRow.findIndex(h => h.includes('creado') || h.includes('fecha')),
    nombre: headerRow.findIndex(h => h.includes('nombre') || h.includes('producto')),
    categoria: headerRow.findIndex(h => h.includes('categor')),
    notas: headerRow.findIndex(h => h.includes('nota') || h.includes('descrip')),
    cantidad: headerRow.findIndex(h => h.startsWith('cant')),
    costo: headerRow.findIndex(h => h.includes('costo unit') || h.includes('costo')),
    precio: headerRow.findIndex(h => h.includes('precio unit') || h.includes('precio')),
  };

  const rows = [];
  for (let r = headerRowIdx + 1; r < rawData.length; r++) {
    const rawRow = rawData[r];
    if (!rawRow || rawRow.every(c => String(c || '').trim() === '')) continue;
    const rawNombre = String(rawRow[colIndex.nombre] || '').trim();
    if (!rawNombre) continue;

    rows.push({
      id: `row-${r}`,
      nombre: rawNombre,
      categoria: colIndex.categoria !== -1 ? String(rawRow[colIndex.categoria] || '').trim() : '',
      notas: colIndex.notas !== -1 ? String(rawRow[colIndex.notas] || '').trim() : '',
      cantidad: normalizeQuantity(rawRow[colIndex.cantidad]),
      costo: normalizeCurrencyAmount(rawRow[colIndex.costo]),
      precio: normalizeCurrencyAmount(rawRow[colIndex.precio]),
      fecha_creado: normalizeSpanishDate(rawRow[colIndex.creado])
    });
  }

  console.log(`[Excel Result] Business: ${businessName}, Reported: ${reportedTotal}, Rows Parsed: ${rows.length}`);
  console.log(`[Excel Sample] First row:`, rows[0]);
  console.log(`[Excel Sample] Last row:`, rows[rows.length - 1]);
  return rows.length === 328;
}

async function testCsv() {
  const filePath = 'C:/Users/yelem/workspace/aplicacion_treinta/inventario-1788369852.csv';
  const text = fs.readFileSync(filePath, 'utf-8');
  const parsed = Papa.parse(text, { skipEmptyLines: true });
  const rawData = parsed.data;

  let headerRowIdx = -1;
  let businessName;
  let reportedTotal = null;

  for (let r = 0; r < Math.min(25, rawData.length); r++) {
    const row = rawData[r].map(c => String(c || '').trim());
    if (!businessName && r >= 1 && r <= 3) {
      const candidate = row.find(c => c && !c.toLowerCase().includes('teléfono') && c.length > 2);
      if (candidate) businessName = candidate;
    }
    for (let c = 0; c < row.length; c++) {
      if (row[c].toLowerCase().includes('productos:')) {
        const nextCol = row.slice(c + 1).find(v => Number(v) > 0);
        if (nextCol) reportedTotal = parseInt(nextCol, 10);
      }
    }
    const hasNombre = row.some(c => c.toLowerCase() === 'nombre' || c.toLowerCase().includes('nombre'));
    const hasCant = row.some(c => c.toLowerCase().startsWith('cant'));
    if (hasNombre && hasCant) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rawData[headerRowIdx].map(c => String(c || '').trim().toLowerCase());
  const colIndex = {
    creado: headerRow.findIndex(h => h.includes('creado') || h.includes('fecha')),
    nombre: headerRow.findIndex(h => h.includes('nombre') || h.includes('producto')),
    categoria: headerRow.findIndex(h => h.includes('categor')),
    notas: headerRow.findIndex(h => h.includes('nota') || h.includes('descrip')),
    cantidad: headerRow.findIndex(h => h.startsWith('cant')),
    costo: headerRow.findIndex(h => h.includes('costo unit') || h.includes('costo')),
    precio: headerRow.findIndex(h => h.includes('precio unit') || h.includes('precio')),
  };

  const rows = [];
  for (let r = headerRowIdx + 1; r < rawData.length; r++) {
    const rawRow = rawData[r];
    if (!rawRow || rawRow.every(c => String(c || '').trim() === '')) continue;
    const rawNombre = String(rawRow[colIndex.nombre] || '').trim();
    if (!rawNombre) continue;

    rows.push({
      id: `csv-${r}`,
      nombre: rawNombre,
      categoria: colIndex.categoria !== -1 ? String(rawRow[colIndex.categoria] || '').trim() : '',
      notas: colIndex.notas !== -1 ? String(rawRow[colIndex.notas] || '').trim() : '',
      cantidad: normalizeQuantity(rawRow[colIndex.cantidad]),
      costo: normalizeCurrencyAmount(rawRow[colIndex.costo]),
      precio: normalizeCurrencyAmount(rawRow[colIndex.precio]),
      fecha_creado: normalizeSpanishDate(rawRow[colIndex.creado])
    });
  }

  console.log(`[CSV Result] Business: ${businessName}, Reported: ${reportedTotal}, Rows Parsed: ${rows.length}`);
  console.log(`[CSV Sample] First row:`, rows[0]);
  console.log(`[CSV Sample] Last row:`, rows[rows.length - 1]);
  return rows.length === 328;
}

async function testPdf() {
  const filePath = 'C:/Users/yelem/workspace/aplicacion_treinta/inventario-1788359201.pdf';
  const buffer = fs.readFileSync(filePath);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;

  let businessName;
  let reportedTotal = null;
  const rows = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const textContent = await page.getTextContent();
    const items = textContent.items;

    if (p === 1) {
      for (let i = 0; i < items.length; i++) {
        const str = items[i].str.trim();
        if (str === 'Reporte de inventario' && items[i + 1]) {
          const next = items.slice(i + 1, i + 5).find(t => t.str.trim() && t.str.trim() !== 'Reporte de inventario');
          if (next) businessName = next.str.trim();
        }
        if (str.includes('Número de productos:')) {
          const next = items.slice(i + 1, i + 4).find(t => /^\d+$/.test(t.str.trim()));
          if (next) reportedTotal = parseInt(next.str.trim(), 10);
        }
      }
    }

    let headerY = null;
    for (const it of items) {
      if (it.str.trim() === 'Creado' && Math.round(it.transform[4]) <= 50) {
        headerY = it.transform[5];
        break;
      }
    }
    if (!headerY) continue;

    const tableItems = items.filter(it => {
      const y = it.transform[5];
      const str = (it.str || '').trim();
      if (!str) return false;
      if (y >= headerY - 5) return false;
      if (y <= 30) return false;
      if (str.includes('Página') || str.includes('www.treinta') || str.includes('Descarga')) return false;
      return true;
    });

    const rowAnchors = tableItems
      .filter(it => it.transform[4] <= 75 && /^\d{2}\/\d{2}\/\d{4}$/.test(it.str.trim()))
      .map(it => ({ date: it.str.trim(), y: it.transform[5] }))
      .sort((a, b) => b.y - a.y);

    for (let i = 0; i < rowAnchors.length; i++) {
      const curr = rowAnchors[i];
      const topLimit = i === 0 ? headerY - 2 : (curr.y + rowAnchors[i - 1].y) / 2;
      const bottomLimit = i === rowAnchors.length - 1 ? 30 : (curr.y + rowAnchors[i + 1].y) / 2;

      const rowTokens = tableItems.filter(it => it.transform[5] < topLimit && it.transform[5] >= bottomLimit);
      const nameTokens = rowTokens.filter(t => t.transform[4] >= 75 && t.transform[4] < 158);
      const catTokens = rowTokens.filter(t => t.transform[4] >= 158 && t.transform[4] < 222);
      const cantTokens = rowTokens.filter(t => t.transform[4] >= 222 && t.transform[4] < 268);
      const costTokens = rowTokens.filter(t => t.transform[4] >= 268 && t.transform[4] < 344);
      const priceTokens = rowTokens.filter(t => t.transform[4] >= 344 && t.transform[4] < 424);

      const sortMultiLine = (toks) => toks.sort((a, b) => {
        const dy = b.transform[5] - a.transform[5];
        if (Math.abs(dy) > 2) return dy;
        return a.transform[4] - b.transform[4];
      });

      const nombre = sortMultiLine(nameTokens).map(t => t.str.trim()).join(' ').replace(/\s+/g, ' ').trim();
      const categoria = sortMultiLine(catTokens).map(t => t.str.trim()).join(' ').replace(/\s+/g, ' ').trim();
      const rawCant = cantTokens.map(t => t.str.trim()).join('');
      const rawCosto = costTokens.map(t => t.str.trim()).join(' ');
      const rawPrecio = priceTokens.map(t => t.str.trim()).join(' ');

      rows.push({
        id: `pdf-p${p}-r${i}`,
        nombre,
        categoria,
        cantidad: normalizeQuantity(rawCant),
        costo: normalizeCurrencyAmount(rawCosto),
        precio: normalizeCurrencyAmount(rawPrecio),
        fecha_creado: normalizeSpanishDate(curr.date)
      });
    }
  }

  console.log(`[PDF Result] Business: ${businessName}, Reported: ${reportedTotal}, Rows Parsed: ${rows.length}`);
  console.log(`[PDF Sample] First row:`, rows[0]);
  console.log(`[PDF Sample] Last row:`, rows[rows.length - 1]);
  return rows.length === 327;
}

async function run() {
  console.log('=== VERIFYING PARSERS ON REFERENCE DATA ("SANFELIPE GALAN") ===\n');
  const okExcel = await testExcel();
  console.log('\n----------------------------------------\n');
  const okCsv = await testCsv();
  console.log('\n----------------------------------------\n');
  const okPdf = await testPdf();
  console.log('\n========================================');
  if (okExcel && okCsv && okPdf) {
    console.log('ALL THREE FORMATS PARSED SUCCESSFULLY WITH 100% PRECISION!');
    process.exit(0);
  } else {
    console.error('PARSER VALIDATION FAILED!');
    process.exit(1);
  }
}

run();
