/**
 * Payment Receipt Service
 *
 * Handles generation of PDF receipts for booking payments.
 * Each payment generates a unique receipt with sequential numbering.
 */

import PDFDocument from 'pdfkit';
import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { PDFTemplateHelpers, PDF_COLORS, PDF_FONTS, PDF_LAYOUT, PDF_SPACING } from '../utils/pdf-templates';

/**
 * Payment data for receipt generation
 */
interface PaymentReceiptData {
  payment_id: string;
  booking_id: string;
  booking_reference: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_date: string;
  guest_name: string;
  guest_email: string;
  property_name: string;
  room_names: string[];
  checkin_date: string;
  checkout_date: string;
  total_nights: number;
  applied_to_milestone?: string | null;
  company_id: string;

  // Financial Breakdown (for accounting best practices)
  total_booking_amount: number;      // From booking.total_amount
  previous_payments_total: number;   // Sum of all previous payments
  balance_remaining: number;         // total_booking_amount - (previous + this payment)
  invoice_number?: string | null;    // Reference invoice if exists
  payment_number?: number;           // e.g., "Payment 2 of 3"
  total_payments_count?: number;     // Total expected payments
}

/**
 * Generate receipt number for a payment
 */
export const generateReceiptNumber = async (companyId: string): Promise<string> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc('generate_receipt_number', {
    p_company_id: companyId,
  });

  if (error || !data) {
    // Fallback to manual generation if function fails
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP-${timestamp}-${random}`;
  }

  return data;
};

/**
 * Generate PDF receipt for a payment
 */
export const generatePaymentReceipt = async (
  paymentData: PaymentReceiptData
): Promise<{ receiptNumber: string; receiptUrl: string }> => {
  const supabase = getAdminClient();

  // Generate receipt number
  const receiptNumber = await generateReceiptNumber(paymentData.company_id);

  // Get invoice settings for company info
  const { data: settings } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('company_id', paymentData.company_id)
    .single();

  const companyName = settings?.company_name || 'Vilo';
  const companyAddress = settings?.company_address || null;
  const companyEmail = settings?.company_email || 'info@vilo.app';
  const companyPhone = settings?.company_phone || null;
  const vatNumber = settings?.vat_number || null;

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  // Collect PDF chunks
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Wait for PDF to finish
  const pdfPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // --- PDF Content ---

  let yPos = 50;

  // Document title and metadata (right side) - Draw FIRST to avoid overlap
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor(PDF_COLORS.BLACK)
    .text('PAYMENT RECEIPT', 400, yPos, { align: 'right' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Receipt #: ${receiptNumber}`, 400, yPos + 25, { align: 'right' })
    .text(`Date: ${PDFTemplateHelpers.formatDate(paymentData.payment_date)}`, 400, yPos + 40, { align: 'right' });

  if (paymentData.invoice_number) {
    doc.text(`Invoice #: ${paymentData.invoice_number}`, 400, yPos + 55, { align: 'right' });
  }

  // Header with company info (left side)
  const headerStartY = yPos;
  yPos = PDFTemplateHelpers.drawHeader(
    doc,
    {
      companyName,
      address: companyAddress,
      email: companyEmail,
      phone: companyPhone,
      vatNumber,
      regNumber: settings?.registration_number || null,
    },
    headerStartY
  );

  // Ensure spacing before FROM/TO
  yPos = Math.max(yPos, 170);

  // Draw FROM/TO boxes
  const sender = {
    title: 'FROM',
    name: companyName,
    address: companyAddress,
    email: companyEmail,
    phone: companyPhone,
    vatNumber,
  };

  const receiver = {
    title: 'RECEIVED FROM',  // Shorter, cleaner
    name: paymentData.guest_name,
    email: paymentData.guest_email,
    phone: null,
    address: null,
  };

  yPos = PDFTemplateHelpers.drawFromToSection(doc, sender, receiver, yPos);

  yPos += PDF_SPACING.SECTION;  // Use constant (30px)

  // Booking details table (clean, modern layout)
  yPos = PDFTemplateHelpers.drawTable(
    doc,
    ['Booking Details', 'Information'],
    [
      ['Booking Reference', paymentData.booking_reference],
      ['Property', paymentData.property_name],
      ['Room(s)', paymentData.room_names.join(', ')],
      ['Check-in', PDFTemplateHelpers.formatDate(paymentData.checkin_date)],
      ['Check-out', PDFTemplateHelpers.formatDate(paymentData.checkout_date)],
      ['Total Nights', paymentData.total_nights.toString()],
    ],
    yPos,
    [200, 295]  // Column widths
  );

  yPos += PDF_SPACING.SECTION;

  // Payment Summary Section (with full financial breakdown)
  doc
    .fontSize(PDF_FONTS.HEADING_MEDIUM.size)
    .font(PDF_FONTS.HEADING_MEDIUM.font)
    .fillColor(PDF_COLORS.BLACK)
    .text('Payment Summary', PDF_LAYOUT.MARGIN, yPos);

  yPos += PDF_SPACING.PARAGRAPH;

  // Financial breakdown table (accounting best practice)
  const summaryRows: string[][] = [
    ['Total Booking Amount', PDFTemplateHelpers.formatCurrency(paymentData.total_booking_amount, paymentData.currency)],
  ];

  // Add previous payments if any
  if (paymentData.previous_payments_total > 0) {
    summaryRows.push([
      'Previous Payments',
      `(${PDFTemplateHelpers.formatCurrency(paymentData.previous_payments_total, paymentData.currency)})`,
    ]);
  }

  // This payment (with method and milestone if applicable)
  const thisPaymentLabel = `This Payment - ${formatPaymentMethod(paymentData.payment_method)}${
    paymentData.applied_to_milestone ? ` (${paymentData.applied_to_milestone})` : ''
  }`;
  summaryRows.push([
    thisPaymentLabel,
    `(${PDFTemplateHelpers.formatCurrency(paymentData.amount, paymentData.currency)})`,
  ]);

  // Balance remaining
  summaryRows.push([
    'Balance Remaining',
    PDFTemplateHelpers.formatCurrency(paymentData.balance_remaining, paymentData.currency),
  ]);

  yPos = PDFTemplateHelpers.drawTable(
    doc,
    ['Description', 'Amount'],
    summaryRows,
    yPos,
    [320, 175]  // Column widths
  );

  yPos += PDF_SPACING.SECTION;

  // Payment details box (clean, modern)
  doc
    .fontSize(PDF_FONTS.BODY_BOLD.size)
    .font(PDF_FONTS.BODY_BOLD.font)
    .fillColor(PDF_COLORS.BLACK)
    .text('Payment Details:', PDF_LAYOUT.MARGIN, yPos);

  yPos += PDF_SPACING.PARAGRAPH;

  doc
    .fontSize(PDF_FONTS.BODY.size)
    .font(PDF_FONTS.BODY.font);

  doc.text(`Date: ${PDFTemplateHelpers.formatDate(paymentData.payment_date)}`, PDF_LAYOUT.MARGIN + 20, yPos);
  yPos += PDF_SPACING.PARAGRAPH;

  doc.text(`Method: ${formatPaymentMethod(paymentData.payment_method)}`, PDF_LAYOUT.MARGIN + 20, yPos);
  yPos += PDF_SPACING.PARAGRAPH;

  doc.text(`Receipt Number: ${receiptNumber}`, PDF_LAYOUT.MARGIN + 20, yPos);
  yPos += PDF_SPACING.PARAGRAPH;

  if (paymentData.payment_number && paymentData.total_payments_count) {
    doc.text(`Payment ${paymentData.payment_number} of ${paymentData.total_payments_count}`, PDF_LAYOUT.MARGIN + 20, yPos);
    yPos += PDF_SPACING.PARAGRAPH;
  }

  yPos += PDF_SPACING.SECTION;

  // Thank you message with better spacing
  doc
    .fontSize(PDF_FONTS.BODY.size)
    .font(PDF_FONTS.BODY.font)
    .fillColor(PDF_COLORS.GRAY_MEDIUM);

  doc.text(
    'This receipt confirms payment received for the above booking. Please keep this for your records.',
    PDF_LAYOUT.MARGIN,
    yPos,
    {
      align: 'center',
      width: PDF_LAYOUT.CONTENT_WIDTH,
    }
  );

  yPos += PDF_SPACING.SECTION;

  // Draw bank details if available (with proper spacing)
  if (settings?.bank_name && settings?.bank_account_number) {
    yPos = PDFTemplateHelpers.drawBankDetailsSection(
      doc,
      {
        bankName: settings.bank_name,
        accountNumber: settings.bank_account_number,
        branchCode: settings.bank_branch_code || null,
        accountType: settings.bank_account_type || null,
        accountHolder: settings.bank_account_holder || null,
        reference: receiptNumber,
      },
      yPos
    );

    yPos += PDF_SPACING.SECTION;
  }

  // Draw footer (with Powered by Vilo)
  const footerText = settings?.footer_text || 'Thank you for your business!';
  yPos = PDFTemplateHelpers.drawFooter(doc, footerText);

  // Status badge removed - payment date already indicates paid status

  // Finalize
  doc.end();

  // Wait for PDF generation
  const pdfBuffer = await pdfPromise;

  // Upload to Supabase Storage
  const filePath = `receipts/${paymentData.company_id}/${receiptNumber}.pdf`;

  const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (uploadError) {
    logger.error('Failed to upload receipt PDF', { paymentId: paymentData.payment_id, error: uploadError });
    throw new AppError('Failed to upload receipt PDF', 500);
  }

  const receiptUrl = filePath;

  return { receiptNumber, receiptUrl };
};

/**
 * Get receipt URL from storage
 */
export const getReceiptDownloadUrl = async (receiptPath: string): Promise<string> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase.storage.from('receipts').createSignedUrl(receiptPath, 3600); // 1 hour

  if (error || !data) {
    throw new AppError('Failed to generate receipt download URL', 500);
  }

  return data.signedUrl;
};

// ============================================================================
// Utility Functions
// ============================================================================

function formatPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    cash: 'Cash',
    card: 'Credit/Debit Card',
    bank_transfer: 'Bank Transfer',
    eft: 'EFT',
    payfast: 'PayFast',
    stripe: 'Stripe',
    other: 'Other',
  };

  return methodMap[method] || method;
}
