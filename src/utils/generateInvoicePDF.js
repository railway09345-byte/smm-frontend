import { jsPDF } from 'jspdf';

/**
 * Generates and downloads an audited Tax Invoice & Receipt PDF using jsPDF.
 */
export function downloadInvoicePDF(invoiceData = {}) {
  const {
    date = 'Oct 01, 2026',
    invoiceNumber = 'INV-2026-1001',
    planName = 'Pro Growth Plan — Monthly',
    amount = '$79.00 USD',
    paymentMethod = 'Corporate Visa (•••• 4242)',
    status = 'Paid',
    customerName = 'Account Owner',
    customerEmail = '',
    organization = 'Social AI Workspace'
  } = invoiceData;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // ── 1. HEADER BRAND BANNER (Burgundy) ──
  doc.setFillColor(67, 56, 202); // Indigo Primary
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent Line (Champagne Gold)
  doc.setFillColor(212, 175, 55); // Gold accent
  doc.rect(0, 38, pageWidth, 2, 'F');

  // Logo & Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SOCIAL AI', 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 220, 220);
  doc.text('AUTONOMOUS SOCIAL MEDIA MARKETING & CREATIVE STUDIO', 20, 28);

  // Top-right Invoice Tag
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE / RECEIPT', pageWidth - 20, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 175, 55);
  doc.text(`Official Audited Statement`, pageWidth - 20, 28, { align: 'right' });

  // ── 2. METADATA SECTION ──
  const startY = 52;

  // Left Column: Invoice Metadata
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE NUMBER', 20, startY);
  doc.text('INVOICE DATE', 20, startY + 10);
  doc.text('PAYMENT STATUS', 20, startY + 20);

  doc.setTextColor(42, 14, 16);
  doc.setFontSize(10);
  doc.text(invoiceNumber, 20, startY + 5);
  doc.text(date, 20, startY + 15);

  // Status Badge
  doc.setFillColor(240, 253, 244); // Green-50
  doc.setDrawColor(187, 247, 208); // Green-200
  doc.roundedRect(20, startY + 22, 22, 6, 1.5, 1.5, 'FD');
  doc.setTextColor(22, 101, 52); // Green-800
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(status.toUpperCase(), 31, startY + 26.5, { align: 'center' });

  // Right Column: Billed To
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text('BILLED TO', 120, startY);

  doc.setTextColor(42, 14, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(customerName, 120, startY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(organization, 120, startY + 12);
  if (customerEmail) {
    doc.text(customerEmail, 120, startY + 18);
  }
  doc.text('Billing Currency: USD ($)', 120, startY + (customerEmail ? 24 : 18));

  // ── 3. LINE ITEMS TABLE ──
  const tableY = startY + 40;

  // Table Header
  doc.setFillColor(247, 248, 252); // Page bg
  doc.setDrawColor(241, 230, 220);
  doc.rect(20, tableY, pageWidth - 40, 10, 'FD');

  doc.setTextColor(42, 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 25, tableY + 6.5);
  doc.text('BILLING PERIOD', 110, tableY + 6.5);
  doc.text('AMOUNT', pageWidth - 25, tableY + 6.5, { align: 'right' });

  // Table Row
  const rowY = tableY + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(42, 14, 16);
  doc.text(planName, 25, rowY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Includes Autonomous Pipelines, AI Multi-Platform Publishing, and Media Studio Quotas', 25, rowY + 5);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Monthly Recurring', 110, rowY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(42, 14, 16);
  doc.text(amount, pageWidth - 25, rowY, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.line(20, rowY + 12, pageWidth - 20, rowY + 12);

  // ── 4. TOTALS SECTION ──
  const totalsY = rowY + 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', 130, totalsY);
  doc.text('Tax / VAT (0%):', 130, totalsY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 14, 16);
  doc.text(amount, pageWidth - 25, totalsY, { align: 'right' });
  doc.text('$0.00 USD', pageWidth - 25, totalsY + 7, { align: 'right' });

  // Final Total Highlight Box
  doc.setFillColor(253, 248, 245);
  doc.setDrawColor(241, 230, 220);
  doc.roundedRect(120, totalsY + 12, pageWidth - 140, 14, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 14, 16);
  doc.text('Total Paid:', 125, totalsY + 21);
  doc.text(amount, pageWidth - 25, totalsY + 21, { align: 'right' });

  // ── 5. PAYMENT METHOD & TRANSACTION AUDIT ──
  const auditY = totalsY + 36;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, auditY, pageWidth - 40, 22, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 14, 16);
  doc.text('Payment Information', 25, auditY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Charged to: ${paymentMethod}`, 25, auditY + 13);
  doc.text(`Transaction Reference: TXN-${invoiceNumber.replace('INV-', '')}-SUCC`, 25, auditY + 18);

  // ── 6. FOOTER ──
  const footerY = 275;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Social AI Platform Inc. • Enterprise Multi-Tenant Social Orchestration', 20, footerY);
  doc.text('Questions about this invoice? Email billing@socialai.com', 20, footerY + 4);
  doc.text('Page 1 of 1', pageWidth - 20, footerY, { align: 'right' });

  // ── 7. TRIGGER DIRECT BROWSER DOWNLOAD ──
  doc.save(`SocialAI_Invoice_${invoiceNumber}.pdf`);
  return true;
}

