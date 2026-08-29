import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDateTime } from '@treinta/shared';

interface ExportBalancePdfParams {
  negocioNombre: string;
  documentoIdentidad?: string | null;
  periodoLabel: string;
  fechaReporte: string;
  totalVentas: number;
  totalGastos: number;
  balanceNeto: number;
  costoVentas: number;
  gananciaEstimada: number;
  totalPorCobrar: number;
  totalPorPagar: number;
  desgloseMedios: {
    nombre: string;
    ventas: number;
    abonos: number;
    gastos: number;
    balance: number;
  }[];
  transacciones: {
    tipo: string;
    concepto: string;
    medioPago: string;
    fecha: string;
    monto: number;
  }[];
}

export function exportBalanceToPDF(params: ExportBalancePdfParams) {
  const doc = new jsPDF();

  // Color Palette
  const primaryColor: [number, number, number] = [0, 168, 107]; // StockPro Emerald
  const darkColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const grayColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Header Banner
  doc.setFillColor(...primaryColor); // StockPro Emerald Header
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DEL BALANCE - REPORTE FINANCIERO', 14, 17);

  // 2. Business Information
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text(params.negocioNombre, 14, 36);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  if (params.documentoIdentidad) {
    doc.text(`NIT / Documento: ${params.documentoIdentidad}`, 14, 42);
  }
  doc.text(`Período Consultado: ${params.periodoLabel.toUpperCase()}`, 14, 47);
  doc.text(`Fecha de Emisión: ${params.fechaReporte}`, 14, 52);

  // 3. Resumen Ejecutivo (KPIs)
  autoTable(doc, {
    startY: 58,
    head: [['MÉTRICA FINANCIERA', 'VALOR (COP)']],
    body: [
      ['Ingresos Totales (Ventas)', formatCurrency(params.totalVentas)],
      ['Egresos Totales (Gastos)', `-${formatCurrency(params.totalGastos)}`],
      ['Balance Neto del Período', formatCurrency(params.balanceNeto)],
      ['Costo de Mercancía Vendida', `-${formatCurrency(params.costoVentas)}`],
      ['Ganancia Estimada Real', formatCurrency(params.gananciaEstimada)],
      ['Cuentas por Cobrar Pendientes (Clientes)', formatCurrency(params.totalPorCobrar)],
      ['Cuentas por Pagar Pendientes (Proveedores)', formatCurrency(params.totalPorPagar)],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: darkColor },
      1: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // 4. Desglose por Medios de Pago
  const lastY = (doc as any).lastAutoTable.finalY || 120;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Desglose por Medios de Pago', 14, lastY + 10);

  const bodyMedios = params.desgloseMedios.map((m) => [
    m.nombre,
    formatCurrency(m.ventas),
    formatCurrency(m.abonos),
    formatCurrency(m.gastos),
    formatCurrency(m.balance),
  ]);

  autoTable(doc, {
    startY: lastY + 14,
    head: [['Medio de Pago', 'Ventas', 'Abonos', 'Gastos', 'Balance Total']],
    body: bodyMedios,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // 5. Historial de Transacciones del Período
  const lastY2 = (doc as any).lastAutoTable.finalY || 180;

  if (lastY2 > 230) {
    doc.addPage();
  }

  const startYTrans = lastY2 > 230 ? 20 : lastY2 + 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Registro de Transacciones en el Período', 14, startYTrans);

  const bodyTrans = params.transacciones.slice(0, 30).map((t) => [
    t.tipo.toUpperCase(),
    t.concepto,
    t.medioPago,
    formatDateTime(t.fecha),
    t.tipo === 'ingreso' ? `+${formatCurrency(t.monto)}` : `-${formatCurrency(t.monto)}`,
  ]);

  autoTable(doc, {
    startY: startYTrans + 4,
    head: [['Tipo', 'Concepto', 'Medio', 'Fecha', 'Monto']],
    body: bodyTrans.length > 0 ? bodyTrans : [['-', 'No hay transacciones registradas', '-', '-', '$0']],
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // Footer page number
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - Generado por StockPro App`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // Save file
  const filename = `Reporte_Balance_${params.periodoLabel.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
}
