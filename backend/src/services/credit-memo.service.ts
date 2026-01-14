import PDFDocument from 'pdfkit';
import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { logger } from '../utils/logger';
import { getInvoiceSettings } from './invoice.service';
import type {
  CreditMemo,
  CreditMemoWithDetails,
  CreditMemoLineItem,
  CreditMemoListParams,
  CreditMemoListResponse,
  CreditMemoDownloadURLResponse,
} from '../types/credit-memo.types';
import type { RefundRequest } from '../types/refund.types';

// ============================================================================
// CREDIT MEMO NUMBER GENERATION
// ============================================================================

/**
 * Generate next credit memo number
 * Format: CM-YYYYMM-NNNN
 */
export const generateCreditMemoNumber = async (): Promise<string> => {
  const supabase = getAdminClient();

  // Get current invoice settings (which now includes next_credit_memo_number)
  const settings = await getInvoiceSettings();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const sequence = String(settings.next_credit_memo_number || 1).padStart(4, '0');

  const creditMemoNumber = `CM-${year}${month}-${sequence}`;

  // Update next number in settings
  await supabase
    .from('invoice_settings')
    .update({
      next_credit_memo_number: (settings.next_credit_memo_number || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', settings.id);

  return creditMemoNumber;
};

// ============================================================================
// CREDIT MEMO GENERATION
// ============================================================================

/**
 * Generate credit memo from refund request
 */
export const generateCreditMemo = async (
  refundRequestId: string,
  userId: string
): Promise<CreditMemo> => {
  const supabase = getAdminClient();

  // Get refund request with booking details
  const { data: refundRequest, error: refundError } = await supabase
    .from('refund_requests')
    .select(
      `
      *,
      booking:bookings (
        id,
        booking_reference,
        property_id,
        guest_name,
        guest_email,
        guest_phone,
        total_amount,
        currency,
        invoice_id,
        amount_paid,
        property:properties (
          id,
          name,
          company_id
        )
      )
    `
    )
    .eq('id', refundRequestId)
    .single();

  if (refundError || !refundRequest) {
    throw new AppError('NOT_FOUND', 'Refund request not found');
  }

  if (refundRequest.status !== 'completed') {
    throw new AppError('VALIDATION_ERROR', 'Can only generate credit memo for completed refunds');
  }

  const booking = refundRequest.booking as any;

  // Get company details
  let companyDetails: any = {};
  if (booking.property?.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', booking.property.company_id)
      .single();
    companyDetails = company || {};
  }

  // Get original invoice if exists
  let originalInvoice: any = null;
  if (booking.invoice_id) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', booking.invoice_id)
      .single();
    originalInvoice = invoice;
  }

  // Generate credit memo number
  const creditMemoNumber = await generateCreditMemoNumber();

  // Build line items from refund breakdown
  const lineItems: CreditMemoLineItem[] = [];
  const refundBreakdown = refundRequest.refund_breakdown as any[] || [];

  for (const item of refundBreakdown) {
    if (item.status === 'completed') {
      lineItems.push({
        description: `Refund via ${item.method}`,
        quantity: 1,
        unit_price_cents: -Math.abs(Math.round(item.amount * 100)), // Negative value
        total_cents: -Math.abs(Math.round(item.amount * 100)), // Negative value
      });
    }
  }

  // Calculate totals (negative values for credit)
  const subtotal_cents = lineItems.reduce((sum, item) => sum + item.total_cents, 0);
  const tax_cents = 0; // No tax on refunds typically
  const total_cents = subtotal_cents + tax_cents;

  // Determine refund method and reference
  const firstCompletedItem = refundBreakdown.find(item => item.status === 'completed');
  const refundMethod = firstCompletedItem?.method || 'manual';
  const refundReference = firstCompletedItem?.gateway_refund_id || refundRequest.id;

  // Create credit memo
  const { data: creditMemo, error: createError } = await supabase
    .from('credit_memos')
    .insert({
      credit_memo_number: creditMemoNumber,
      invoice_id: booking.invoice_id,
      refund_request_id: refundRequestId,
      booking_id: refundRequest.booking_id,
      user_id: booking.guest_id || userId,

      // Customer snapshot
      customer_name: booking.guest_name,
      customer_email: booking.guest_email,
      customer_phone: booking.guest_phone || null,
      customer_address: null,

      // Company snapshot
      company_id: booking.property?.company_id || null,
      company_name: companyDetails.name || booking.property?.name || 'Vilo',
      company_address: companyDetails.address || null,
      company_email: companyDetails.email || null,
      company_phone: companyDetails.phone || null,
      company_vat_number: companyDetails.vat_number || null,
      company_registration_number: companyDetails.registration_number || null,

      // Financial (negative amounts)
      subtotal_cents,
      tax_cents,
      tax_rate: 0,
      total_cents,
      currency: refundRequest.currency,

      // Original payment info
      original_payment_method: refundMethod,
      original_payment_reference: refundReference,
      original_payment_date: refundRequest.processed_at,

      // Refund details
      refund_method: refundMethod,
      refund_reference: refundReference,
      refund_processed_at: refundRequest.processed_at,

      // Line items
      line_items: lineItems,

      // Status
      status: 'draft',

      // Metadata
      notes: null,
      reason: refundRequest.reason,

      // Audit
      created_by: userId,
    })
    .select()
    .single();

  if (createError || !creditMemo) {
    logger.error('Error creating credit memo:', createError);
    throw new AppError('INTERNAL_ERROR', 'Failed to create credit memo');
  }

  // Generate PDF asynchronously
  try {
    await generateCreditMemoPDF(creditMemo.id);

    // Update status to issued
    await supabase
      .from('credit_memos')
      .update({
        status: 'issued',
        issued_by: userId,
        issued_at: new Date().toISOString(),
      })
      .eq('id', creditMemo.id);
  } catch (pdfError) {
    logger.error('Error generating credit memo PDF:', pdfError);
    // Don't fail the whole operation if PDF generation fails
  }

  // Link credit memo to refund request
  await supabase
    .from('refund_requests')
    .update({
      credit_memo_id: creditMemo.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', refundRequestId);

  // Create audit log
  await createAuditLog(
    'credit_memo.generated',
    'credit_memos',
    creditMemo.id,
    userId,
    null,
    creditMemo
  );

  logger.info(`Credit memo ${creditMemoNumber} generated for refund ${refundRequestId}`);

  return creditMemo as CreditMemo;
};

// ============================================================================
// PDF GENERATION
// ============================================================================

/**
 * Generate PDF for credit memo
 */
export const generateCreditMemoPDF = async (creditMemoId: string): Promise<string> => {
  const supabase = getAdminClient();

  // Get credit memo
  const { data: creditMemo, error: fetchError } = await supabase
    .from('credit_memos')
    .select('*')
    .eq('id', creditMemoId)
    .single();

  if (fetchError || !creditMemo) {
    throw new AppError('NOT_FOUND', 'Credit memo not found');
  }

  // Create PDF document
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Generate PDF content
  await new Promise((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);

    // Header - Company Info
    doc
      .fontSize(20)
      .fillColor('#dc2626') // Red for credit memo
      .text('CREDIT MEMO', 50, 50);

    doc
      .fontSize(10)
      .fillColor('#000000')
      .text(creditMemo.credit_memo_number, 50, 75);

    if (creditMemo.company_name) {
      doc
        .fontSize(12)
        .text(creditMemo.company_name, 350, 50, { align: 'right' });
    }

    if (creditMemo.company_address) {
      doc
        .fontSize(9)
        .fillColor('#666666')
        .text(creditMemo.company_address, 350, 70, { align: 'right', width: 200 });
    }

    if (creditMemo.company_email) {
      doc.text(creditMemo.company_email, 350, 100, { align: 'right' });
    }

    if (creditMemo.company_vat_number) {
      doc.text(`VAT: ${creditMemo.company_vat_number}`, 350, 115, { align: 'right' });
    }

    // Customer Info
    doc
      .fontSize(10)
      .fillColor('#000000')
      .text('REFUND TO:', 50, 150);

    doc
      .fontSize(11)
      .text(creditMemo.customer_name, 50, 165);

    doc
      .fontSize(9)
      .fillColor('#666666')
      .text(creditMemo.customer_email, 50, 180);

    if (creditMemo.customer_phone) {
      doc.text(creditMemo.customer_phone, 50, 195);
    }

    // Refund Details
    doc
      .fontSize(9)
      .fillColor('#000000')
      .text(`Issued: ${new Date(creditMemo.created_at).toLocaleDateString()}`, 350, 150, {
        align: 'right',
      });

    if (creditMemo.refund_processed_at) {
      doc.text(
        `Processed: ${new Date(creditMemo.refund_processed_at).toLocaleDateString()}`,
        350,
        165,
        { align: 'right' }
      );
    }

    if (creditMemo.refund_reference) {
      doc.text(`Ref: ${creditMemo.refund_reference}`, 350, 180, { align: 'right' });
    }

    // Line items table
    const tableTop = 250;
    doc
      .fontSize(10)
      .fillColor('#000000')
      .text('Description', 50, tableTop)
      .text('Qty', 300, tableTop, { width: 50, align: 'right' })
      .text('Amount', 400, tableTop, { width: 150, align: 'right' });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Line items
    let yPosition = tableTop + 30;
    const lineItems = creditMemo.line_items as CreditMemoLineItem[];

    for (const item of lineItems) {
      doc
        .fontSize(9)
        .fillColor('#000000')
        .text(item.description, 50, yPosition, { width: 240 })
        .text(item.quantity.toString(), 300, yPosition, { width: 50, align: 'right' })
        .fillColor('#dc2626') // Red for credit amounts
        .text(
          `${creditMemo.currency} ${(Math.abs(item.total_cents) / 100).toFixed(2)}`,
          400,
          yPosition,
          { width: 150, align: 'right' }
        );

      yPosition += 25;
    }

    // Totals
    yPosition += 20;
    doc
      .moveTo(350, yPosition)
      .lineTo(550, yPosition)
      .stroke();

    yPosition += 15;

    doc
      .fontSize(11)
      .fillColor('#000000')
      .text('TOTAL CREDIT:', 350, yPosition)
      .fillColor('#dc2626')
      .fontSize(14)
      .text(
        `${creditMemo.currency} ${(Math.abs(creditMemo.total_cents) / 100).toFixed(2)}`,
        400,
        yPosition,
        { width: 150, align: 'right' }
      );

    // Reason/Notes
    if (creditMemo.reason) {
      yPosition += 50;
      doc
        .fontSize(10)
        .fillColor('#000000')
        .text('Reason for Refund:', 50, yPosition);

      doc
        .fontSize(9)
        .fillColor('#666666')
        .text(creditMemo.reason, 50, yPosition + 15, { width: 500 });
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor('#999999')
        .text(
        'This credit memo represents a refund issued against your original booking.',
        50,
        750,
        { align: 'center', width: 500 }
      );

    doc.end();
  });

  const pdfBuffer = Buffer.concat(chunks);

  // Upload to Supabase Storage
  const fileName = `${creditMemo.credit_memo_number}.pdf`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('credit_memos')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    logger.error('Error uploading credit memo PDF:', uploadError);
    throw new AppError('INTERNAL_ERROR', 'Failed to upload PDF');
  }

  const { data: urlData } = supabase.storage.from('credit_memos').getPublicUrl(fileName);

  const pdfUrl = urlData.publicUrl;

  // Update credit memo with PDF URL
  await supabase
    .from('credit_memos')
    .update({
      pdf_url: pdfUrl,
      pdf_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', creditMemoId);

  logger.info(`Credit memo PDF generated: ${fileName}`);

  return pdfUrl;
};

// ============================================================================
// RETRIEVAL & LISTING
// ============================================================================

/**
 * Get credit memo by ID
 */
export const getCreditMemo = async (
  id: string,
  userId?: string
): Promise<CreditMemo> => {
  const supabase = getAdminClient();

  const { data: creditMemo, error } = await supabase
    .from('credit_memos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !creditMemo) {
    throw new AppError('NOT_FOUND', 'Credit memo not found');
  }

  // TODO: Add RLS check if userId provided

  return creditMemo as CreditMemo;
};

/**
 * List credit memos with filters
 */
export const listCreditMemos = async (
  params: CreditMemoListParams,
  userId?: string
): Promise<CreditMemoListResponse> => {
  const supabase = getAdminClient();

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase.from('credit_memos').select('*', { count: 'exact' });

  // Apply filters
  if (params.status) {
    if (Array.isArray(params.status)) {
      query = query.in('status', params.status);
    } else {
      query = query.eq('status', params.status);
    }
  }

  if (params.user_id) {
    query = query.eq('user_id', params.user_id);
  }

  if (params.booking_id) {
    query = query.eq('booking_id', params.booking_id);
  }

  if (params.invoice_id) {
    query = query.eq('invoice_id', params.invoice_id);
  }

  if (params.refund_request_id) {
    query = query.eq('refund_request_id', params.refund_request_id);
  }

  if (params.from_date) {
    query = query.gte('created_at', params.from_date);
  }

  if (params.to_date) {
    query = query.lte('created_at', params.to_date);
  }

  // Sorting
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    logger.error('Error listing credit memos:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to list credit memos');
  }

  return {
    credit_memos: (data || []) as unknown as CreditMemoWithDetails[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

/**
 * Get signed download URL for credit memo PDF
 */
export const getCreditMemoDownloadUrl = async (
  id: string,
  userId?: string
): Promise<CreditMemoDownloadURLResponse> => {
  const creditMemo = await getCreditMemo(id, userId);

  if (!creditMemo.pdf_url) {
    throw new AppError('NOT_FOUND', 'PDF not yet generated for this credit memo');
  }

  const supabase = getAdminClient();

  // Generate signed URL (1 hour expiry)
  const fileName = creditMemo.pdf_url.split('/').pop() || '';
  const { data, error } = await supabase.storage
    .from('credit_memos')
    .createSignedUrl(fileName, 3600); // 1 hour

  if (error || !data) {
    logger.error('Error creating signed URL:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to generate download URL');
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  return {
    credit_memo_id: creditMemo.id,
    credit_memo_number: creditMemo.credit_memo_number,
    download_url: data.signedUrl,
    expires_at: expiresAt.toISOString(),
  };
};

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

/**
 * Void a credit memo
 */
export const voidCreditMemo = async (
  id: string,
  userId: string,
  reason?: string
): Promise<CreditMemo> => {
  const supabase = getAdminClient();

  // Get credit memo
  const creditMemo = await getCreditMemo(id);

  if (creditMemo.status === 'void') {
    throw new AppError('VALIDATION_ERROR', 'Credit memo is already voided');
  }

  // Update status to void
  const { data: updated, error } = await supabase
    .from('credit_memos')
    .update({
      status: 'void',
      notes: reason || creditMemo.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) {
    logger.error('Error voiding credit memo:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to void credit memo');
  }

  // Create audit log
  await createAuditLog('credit_memo.voided', 'credit_memos', id, userId, creditMemo, updated);

  logger.info(`Credit memo ${creditMemo.credit_memo_number} voided by ${userId}`);

  return updated as CreditMemo;
};

/**
 * Regenerate PDF for credit memo
 */
export const regenerateCreditMemoPDF = async (id: string, userId: string): Promise<string> => {
  const supabase = getAdminClient();

  // Generate new PDF
  const pdfUrl = await generateCreditMemoPDF(id);

  // Create audit log
  await createAuditLog('credit_memo.pdf_regenerated', 'credit_memos', id, userId, null, {
    pdf_url: pdfUrl,
  });

  logger.info(`Credit memo PDF regenerated for ${id}`);

  return pdfUrl;
};
