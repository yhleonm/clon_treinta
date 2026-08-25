/**
 * Formatea un valor numérico a moneda (por defecto pesos colombianos COP)
 * @param amount - Valor numérico
 * @param currency - Código de moneda (ej: 'COP')
 * @returns Cadena formateada (ej: "$ 24.500")
 */
export function formatCurrency(amount?: number | null, currency: string = 'COP'): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const rounded = Math.round(safeAmount);
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);

  return formatted;
}

/**
 * Formatea una fecha ISO a formato amigable (ej: "25 Ago 2026, 02:30 PM")
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formatea una fecha solo día y mes (ej: "25 Ago")
 */
export function formatDateShort(isoString?: string | null): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

/**
 * Genera un número de folio correlativo único temporal o para ventas
 */
export function generateFolio(prefix: string = 'V'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(10 + Math.random() * 90);
  return `${prefix}-${timestamp}${random}`;
}
