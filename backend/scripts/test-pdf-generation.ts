/**
 * PDF Generation Visual Testing Script
 *
 * Generates sample PDFs for invoices, receipts, and credit notes
 * to visually verify the new professional template design.
 *
 * Usage: npm run test-pdf OR ts-node backend/scripts/test-pdf-generation.ts
 */

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { PDFTemplateHelpers, PDF_COLORS } from '../src/utils/pdf-templates';

// ============================================================================
// Output Directory
// ============================================================================

const OUTPUT_DIR = path.join(__dirname, '../../test-output/pdfs');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================================
// Sample Data
// ============================================================================

const sampleInvoiceData = {
  // Company info (sender)
  company_name: 'Ocean View Resort',
  company_address: '123 Beach Road, Camps Bay, Cape Town, 8005',
  company_email: 'billing@oceanviewresort.co.za',
  company_phone: '+27 21 555 1234',
  company_vat_number: 'VAT: 4123456789',
  company_registration_number: 'REG: 2020/123456/07',

  // Customer info (receiver)
  customer_name: 'John Smith',
  customer_email: 'john.smith@example.com',
  customer_phone: '+27 82 555 9876',
  customer_address: '456 Main Street, Sandton, Johannesburg, 2196',

  // Document info
  invoice_number: 'INV-202601-0042',
  invoice_date: '2026-01-10',
  status: 'paid',

  // Booking details
  booking_reference: 'BOOK-20260115-ABC123',
  property_name: 'Ocean View Resort - Presidential Suite',
  checkin_date: '2026-01-15',
  checkout_date: '2026-01-20',

  // Financial details
  currency: 'ZAR',
  line_items: [
    {
      description: '5 nights - Presidential Suite (2 adults)',
      quantity: 5,
      unit_price_cents: 350000, // R 3,500.00
      total_cents: 1750000, // R 17,500.00
    },
    {
      description: 'Breakfast Package (2 guests x 5 days)',
      quantity: 10,
      unit_price_cents: 25000, // R 250.00
      total_cents: 250000, // R 2,500.00
    },
    {
      description: 'Airport Transfer (Round Trip)',
      quantity: 1,
      unit_price_cents: 80000, // R 800.00
      total_cents: 80000, // R 800.00
    },
  ],
  subtotal_cents: 2080000, // R 20,800.00
  tax_rate: 15,
  tax_cents: 312000, // R 3,120.00
  total_cents: 2392000, // R 23,920.00

  // Bank details
  bank_name: 'Standard Bank',
  bank_account_number: '1234567890',
  bank_branch_code: '051-001',
  bank_account_type: 'Current Account',
  bank_account_holder: 'Ocean View Resort (PTY) LTD',
  payment_terms: 'Payment due within 30 days of invoice date',
};

const sampleReceiptData = {
  // Reuse company and customer data
  ...sampleInvoiceData,

  // Receipt specific
  receipt_number: 'RCP-202601-0028',
  payment_date: '2026-01-10',
  payment_amount: 2392000, // R 23,920.00 (full payment)
  payment_method: 'card',
  transaction_reference: 'TXN-STRIPE-CH-7X8Y9Z',
  room_names: ['Presidential Suite'],
  total_nights: 5,
};

const sampleCreditNoteData = {
  // Reuse company and customer data
  ...sampleInvoiceData,

  // Credit note specific
  credit_note_number: 'CN-202601-0003',
  credit_note_date: '2026-01-12',
  invoice_number: 'INV-202601-0042',
  invoice_date: '2026-01-10',

  // Reason for credit
  reason: 'Guest requested early checkout due to family emergency. Refunding 2 unused nights.',
  credit_type: 'refund',

  // Credit amounts (negative values for refund)
  credit_line_items: [
    {
      description: '2 nights - Presidential Suite (Unused)',
      quantity: -2,
      unit_price_cents: 350000,
      total_cents: -700000, // -R 7,000.00
    },
    {
      description: 'Breakfast Package (2 guests x 2 days - Unused)',
      quantity: -4,
      unit_price_cents: 25000,
      total_cents: -100000, // -R 1,000.00
    },
  ],
  credit_subtotal_cents: 800000, // R 8,000.00
  credit_tax_cents: 120000, // R 1,200.00
  credit_total_cents: 920000, // R 9,200.00

  // Outstanding balance calculation
  original_invoice_total_cents: 2392000, // R 23,920.00
  outstanding_balance_cents: 1472000, // R 14,720.00 (original - credit)
};

// ============================================================================
// PDF Generation Functions
// ============================================================================

/**
 * Generate test invoice PDF
 */
async function generateTestInvoice(): Promise<string> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const pdfPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  let yPos = 50;

  // Draw header
  yPos = PDFTemplateHelpers.drawHeader(
    doc,
    {
      companyName: sampleInvoiceData.company_name,
      address: sampleInvoiceData.company_address,
      email: sampleInvoiceData.company_email,
      phone: sampleInvoiceData.company_phone,
      vatNumber: sampleInvoiceData.company_vat_number,
      regNumber: sampleInvoiceData.company_registration_number,
      logoUrl: null,
      documentType: 'INVOICE',
      documentNumber: sampleInvoiceData.invoice_number,
      documentDate: PDFTemplateHelpers.formatDate(sampleInvoiceData.invoice_date),
    },
    yPos
  );

  yPos += 20;

  // Draw FROM/TO boxes
  const sender = {
    title: 'FROM',
    name: sampleInvoiceData.company_name,
    address: sampleInvoiceData.company_address,
    email: sampleInvoiceData.company_email,
    phone: sampleInvoiceData.company_phone,
    vatNumber: sampleInvoiceData.company_vat_number,
  };

  const receiver = {
    title: 'TO',
    name: sampleInvoiceData.customer_name,
    email: sampleInvoiceData.customer_email,
    phone: sampleInvoiceData.customer_phone,
    address: sampleInvoiceData.customer_address,
  };

  yPos = PDFTemplateHelpers.drawFromToSection(doc, sender, receiver, yPos);

  yPos += 20;

  // Booking details
  doc.fontSize(12).font('Helvetica-Bold').fillColor(PDF_COLORS.BLACK);
  doc.text('Booking Details:', 50, yPos);
  yPos += 20;

  doc.fontSize(10).font('Helvetica');
  doc.text(`Booking Reference: ${sampleInvoiceData.booking_reference}`, 50, yPos);
  yPos += 15;
  doc.text(`Property: ${sampleInvoiceData.property_name}`, 50, yPos);
  yPos += 15;
  doc.text(
    `Check-in: ${PDFTemplateHelpers.formatDate(sampleInvoiceData.checkin_date)} | Check-out: ${PDFTemplateHelpers.formatDate(sampleInvoiceData.checkout_date)}`,
    50,
    yPos
  );
  yPos += 30;

  // Line items table
  const headers = ['Description', 'Qty', 'Unit Price', 'Total'];
  const rows = sampleInvoiceData.line_items.map((item) => [
    item.description,
    item.quantity.toString(),
    PDFTemplateHelpers.formatCurrency(item.unit_price_cents, sampleInvoiceData.currency),
    PDFTemplateHelpers.formatCurrency(item.total_cents, sampleInvoiceData.currency),
  ]);
  const columnWidths = [260, 50, 90, 95];

  yPos = PDFTemplateHelpers.drawTable(doc, headers, rows, yPos, columnWidths);

  yPos += 20;

  // Financial summary
  yPos = PDFTemplateHelpers.drawFinancialSummary(
    doc,
    {
      subtotalCents: sampleInvoiceData.subtotal_cents,
      taxCents: sampleInvoiceData.tax_cents,
      taxRate: sampleInvoiceData.tax_rate,
      totalCents: sampleInvoiceData.total_cents,
      currency: sampleInvoiceData.currency,
    },
    yPos
  );

  yPos += 30;

  // Bank details section
  yPos = PDFTemplateHelpers.drawBankDetailsSection(
    doc,
    {
      bankName: sampleInvoiceData.bank_name,
      accountNumber: sampleInvoiceData.bank_account_number,
      branchCode: sampleInvoiceData.bank_branch_code,
      accountType: sampleInvoiceData.bank_account_type,
      accountHolder: sampleInvoiceData.bank_account_holder,
      reference: sampleInvoiceData.invoice_number,
      paymentTerms: sampleInvoiceData.payment_terms,
    },
    yPos
  );

  // Footer
  PDFTemplateHelpers.drawFooter(doc, 'Thank you for your business!');

  // Status badge
  PDFTemplateHelpers.drawStatusBadge(doc, sampleInvoiceData.status.toUpperCase(), 495, 50);

  doc.end();

  const pdfBuffer = await pdfPromise;
  const filename = `invoice_${Date.now()}.pdf`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, pdfBuffer);

  return filename;
}

/**
 * Generate test receipt PDF
 */
async function generateTestReceipt(): Promise<string> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const pdfPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  let yPos = 50;

  // Draw header
  yPos = PDFTemplateHelpers.drawHeader(
    doc,
    {
      companyName: sampleReceiptData.company_name,
      address: sampleReceiptData.company_address,
      email: sampleReceiptData.company_email,
      phone: sampleReceiptData.company_phone,
      vatNumber: sampleReceiptData.company_vat_number,
      regNumber: sampleReceiptData.company_registration_number,
      logoUrl: null,
      documentType: 'RECEIPT',
      documentNumber: sampleReceiptData.receipt_number,
      documentDate: PDFTemplateHelpers.formatDate(sampleReceiptData.payment_date),
    },
    yPos
  );

  yPos += 20;

  // Draw FROM/TO boxes
  const sender = {
    title: 'FROM',
    name: sampleReceiptData.company_name,
    address: sampleReceiptData.company_address,
    email: sampleReceiptData.company_email,
    phone: sampleReceiptData.company_phone,
    vatNumber: sampleReceiptData.company_vat_number,
  };

  const receiver = {
    title: 'TO (RECEIVED FROM)',
    name: sampleReceiptData.customer_name,
    email: sampleReceiptData.customer_email,
    phone: sampleReceiptData.customer_phone,
    address: null,
  };

  yPos = PDFTemplateHelpers.drawFromToSection(doc, sender, receiver, yPos);

  yPos += 20;

  // Booking details
  doc.fontSize(12).font('Helvetica-Bold').fillColor(PDF_COLORS.BLACK);
  doc.text('Booking Details:', 50, yPos);
  yPos += 20;

  doc.fontSize(10).font('Helvetica');
  doc.text(`Booking Reference: ${sampleReceiptData.booking_reference}`, 50, yPos);
  yPos += 15;
  doc.text(`Property: ${sampleReceiptData.property_name}`, 50, yPos);
  yPos += 15;
  doc.text(`Room(s): ${sampleReceiptData.room_names.join(', ')}`, 50, yPos);
  yPos += 15;
  doc.text(
    `Check-in: ${PDFTemplateHelpers.formatDate(sampleReceiptData.checkin_date)} | Check-out: ${PDFTemplateHelpers.formatDate(sampleReceiptData.checkout_date)}`,
    50,
    yPos
  );
  yPos += 15;
  doc.text(`Total Nights: ${sampleReceiptData.total_nights}`, 50, yPos);
  yPos += 30;

  // Payment information box
  const boxHeight = 110;
  doc
    .rect(50, yPos, 495, boxHeight)
    .fillAndStroke(PDF_COLORS.GRAY_BG, PDF_COLORS.GRAY_LIGHT)
    .fill(PDF_COLORS.BLACK);

  doc.fontSize(14).font('Helvetica-Bold');
  doc.text('PAYMENT RECEIVED', 65, yPos + 15);

  doc.fontSize(11).font('Helvetica');
  const detailsY = yPos + 40;

  doc.text(`Amount Paid:`, 65, detailsY);
  doc.font('Helvetica-Bold').text(
    PDFTemplateHelpers.formatCurrency(sampleReceiptData.payment_amount, sampleReceiptData.currency),
    200,
    detailsY
  );

  doc.font('Helvetica').text(`Payment Method:`, 65, detailsY + 18);
  doc.text('Credit/Debit Card', 200, detailsY + 18);

  doc.text(`Transaction Ref:`, 65, detailsY + 36);
  doc.text(sampleReceiptData.transaction_reference, 200, detailsY + 36);

  yPos += boxHeight + 30;

  // Thank you message
  doc.font('Helvetica').fontSize(10).fillColor(PDF_COLORS.GRAY_MEDIUM);
  doc.text(
    'This receipt confirms payment received for the above booking. Please keep this for your records.',
    50,
    yPos,
    {
      align: 'center',
      width: 495,
    }
  );

  yPos += 40;

  // Bank details section
  yPos = PDFTemplateHelpers.drawBankDetailsSection(
    doc,
    {
      bankName: sampleReceiptData.bank_name,
      accountNumber: sampleReceiptData.bank_account_number,
      branchCode: sampleReceiptData.bank_branch_code,
      accountType: sampleReceiptData.bank_account_type,
      accountHolder: sampleReceiptData.bank_account_holder,
      reference: sampleReceiptData.receipt_number,
    },
    yPos
  );

  // Footer
  PDFTemplateHelpers.drawFooter(doc, 'Thank you for your business!');

  // Status badge
  PDFTemplateHelpers.drawStatusBadge(doc, 'PAID', 495, 50);

  doc.end();

  const pdfBuffer = await pdfPromise;
  const filename = `receipt_${Date.now()}.pdf`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, pdfBuffer);

  return filename;
}

/**
 * Generate test credit note PDF
 */
async function generateTestCreditNote(): Promise<string> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const pdfPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  let yPos = 50;

  // Draw header
  yPos = PDFTemplateHelpers.drawHeader(
    doc,
    {
      companyName: sampleCreditNoteData.company_name,
      address: sampleCreditNoteData.company_address,
      email: sampleCreditNoteData.company_email,
      phone: sampleCreditNoteData.company_phone,
      vatNumber: sampleCreditNoteData.company_vat_number,
      regNumber: sampleCreditNoteData.company_registration_number,
      logoUrl: null,
      documentType: 'CREDIT NOTE',
      documentNumber: sampleCreditNoteData.credit_note_number,
      documentDate: PDFTemplateHelpers.formatDate(sampleCreditNoteData.credit_note_date),
    },
    yPos
  );

  yPos += 20;

  // Draw FROM/TO boxes
  const sender = {
    title: 'FROM',
    name: sampleCreditNoteData.company_name,
    address: sampleCreditNoteData.company_address,
    email: sampleCreditNoteData.company_email,
    phone: sampleCreditNoteData.company_phone,
    vatNumber: sampleCreditNoteData.company_vat_number,
  };

  const receiver = {
    title: 'TO',
    name: sampleCreditNoteData.customer_name,
    email: sampleCreditNoteData.customer_email,
    phone: sampleCreditNoteData.customer_phone,
    address: sampleCreditNoteData.customer_address,
  };

  yPos = PDFTemplateHelpers.drawFromToSection(doc, sender, receiver, yPos);

  yPos += 20;

  // Original invoice reference box
  doc
    .rect(50, yPos, 495, 50)
    .fillAndStroke(PDF_COLORS.GRAY_BG, PDF_COLORS.GRAY_LIGHT)
    .fill(PDF_COLORS.BLACK);

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Reference to Original Invoice:', 65, yPos + 12);
  doc.font('Helvetica');
  doc.text(
    `${sampleCreditNoteData.invoice_number} dated ${PDFTemplateHelpers.formatDate(sampleCreditNoteData.invoice_date)}`,
    65,
    yPos + 28
  );

  yPos += 70;

  // Reason for credit
  doc.fontSize(10).font('Helvetica-Bold').fillColor(PDF_COLORS.BLACK);
  doc.text('Reason for Credit:', 50, yPos);
  yPos += 18;
  doc.fontSize(10).font('Helvetica').fillColor(PDF_COLORS.GRAY_DARK);
  doc.text(sampleCreditNoteData.reason, 50, yPos, { width: 495 });
  yPos += 40;

  // Credit line items table
  const headers = ['Description', 'Qty', 'Unit Price', 'Credit Amount'];
  const rows = sampleCreditNoteData.credit_line_items.map((item) => [
    item.description,
    item.quantity.toString(),
    PDFTemplateHelpers.formatCurrency(item.unit_price_cents, sampleCreditNoteData.currency),
    PDFTemplateHelpers.formatCurrency(item.total_cents, sampleCreditNoteData.currency),
  ]);
  const columnWidths = [260, 50, 90, 95];

  yPos = PDFTemplateHelpers.drawTable(doc, headers, rows, yPos, columnWidths);

  yPos += 20;

  // Financial summary
  yPos = PDFTemplateHelpers.drawFinancialSummary(
    doc,
    {
      subtotalCents: sampleCreditNoteData.credit_subtotal_cents,
      taxCents: sampleCreditNoteData.credit_tax_cents,
      taxRate: sampleCreditNoteData.tax_rate,
      totalCents: sampleCreditNoteData.credit_total_cents,
      currency: sampleCreditNoteData.currency,
      label: 'Credit',
    },
    yPos
  );

  yPos += 30;

  // Outstanding balance box (highlighted)
  const balanceBoxWidth = 250;
  const balanceBoxHeight = 100;
  const balanceBoxX = 545 - balanceBoxWidth - 50; // Right aligned

  doc
    .rect(balanceBoxX, yPos, balanceBoxWidth, balanceBoxHeight)
    .fillAndStroke(PDF_COLORS.YELLOW_BG, PDF_COLORS.YELLOW_BORDER)
    .fill(PDF_COLORS.BLACK);

  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('Outstanding Balance', balanceBoxX + 15, yPos + 15);

  doc.fontSize(10).font('Helvetica');
  const balanceY = yPos + 35;

  doc.text('Original Invoice Total:', balanceBoxX + 15, balanceY);
  doc.text(
    PDFTemplateHelpers.formatCurrency(
      sampleCreditNoteData.original_invoice_total_cents,
      sampleCreditNoteData.currency
    ),
    balanceBoxX + 150,
    balanceY,
    { align: 'right' }
  );

  doc.text('Less: Credit Amount:', balanceBoxX + 15, balanceY + 18);
  doc.text(
    `-${PDFTemplateHelpers.formatCurrency(sampleCreditNoteData.credit_total_cents, sampleCreditNoteData.currency)}`,
    balanceBoxX + 150,
    balanceY + 18,
    { align: 'right' }
  );

  PDFTemplateHelpers.drawHLine(doc, balanceBoxX + 15, balanceY + 36, balanceBoxWidth - 30);

  doc.font('Helvetica-Bold');
  doc.text('Outstanding Balance:', balanceBoxX + 15, balanceY + 46);
  doc.text(
    PDFTemplateHelpers.formatCurrency(
      sampleCreditNoteData.outstanding_balance_cents,
      sampleCreditNoteData.currency
    ),
    balanceBoxX + 150,
    balanceY + 46,
    { align: 'right' }
  );

  // Footer
  PDFTemplateHelpers.drawFooter(
    doc,
    'This credit note has been issued for the amount stated above. Thank you for your business!'
  );

  // Status badge
  PDFTemplateHelpers.drawStatusBadge(doc, 'ISSUED', 495, 50);

  doc.end();

  const pdfBuffer = await pdfPromise;
  const filename = `credit_note_${Date.now()}.pdf`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, pdfBuffer);

  return filename;
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests() {
  console.log('\n🎨 PDF Template Visual Testing\n');
  console.log('=' .repeat(60));

  try {
    // Generate invoice
    console.log('\n📄 Generating test invoice...');
    const invoiceFile = await generateTestInvoice();
    console.log(`   ✅ Invoice generated: ${invoiceFile}`);

    // Wait a bit to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate receipt
    console.log('\n🧾 Generating test receipt...');
    const receiptFile = await generateTestReceipt();
    console.log(`   ✅ Receipt generated: ${receiptFile}`);

    // Wait a bit to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate credit note
    console.log('\n💳 Generating test credit note...');
    const creditNoteFile = await generateTestCreditNote();
    console.log(`   ✅ Credit note generated: ${creditNoteFile}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ All PDFs generated successfully!');
    console.log(`\n📁 Output directory: ${OUTPUT_DIR}\n`);
    console.log('👀 Visual Checklist:');
    console.log('   [ ] FROM/TO boxes are properly aligned');
    console.log('   [ ] Colors match professional corporate theme (black/white/gray)');
    console.log('   [ ] Bank details section displays correctly');
    console.log('   [ ] Footer shows "Powered by Vilo"');
    console.log('   [ ] Status badges are visible and colored correctly');
    console.log('   [ ] Credit note shows outstanding balance calculation');
    console.log('   [ ] Tables are properly formatted');
    console.log('   [ ] Text does not overflow or get cut off');
    console.log('   [ ] Line spacing and margins look professional\n');
  } catch (error) {
    console.error('\n❌ Error generating PDFs:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
