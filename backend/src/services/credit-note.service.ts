/**
 * Credit Note Service
 *
 * Handles creation, retrieval, and management of credit notes for refunds,
 * cancellations, and adjustments. Generates professional PDF documents.
 */

import PDFDocument from 'pdfkit';
import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { PDFTemplateHelpers, PDF_COLORS, PDF_LAYOUT } from '../utils/pdf-templates';
import type {
  CreditNote,
  CreateCreditNoteInput,
  CreditNoteListParams,
  CreditNoteListResponse,
} from '../types/credit-note.types';

/**
 * Generate credit note number using database function
 */
export const generateCreditNoteNumber = async (): Promise<string> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc('generate_credit_note_number');

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to generate credit note number');
  }

  return data;
};

/**
 * Create credit note for an invoice
 */
export const createCreditNote = async (
  input: CreateCreditNoteInput,
  actorId: string
): Promise<CreditNote> => {
  const supabase = getAdminClient();

  // Get original invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', input.invoice_id)
    .single();

  if (invoiceError || !invoice) {
    throw new AppError('NOT_FOUND', 'Invoice not found');
  }

  // Generate credit note number
  const creditNoteNumber = await generateCreditNoteNumber();

  // Calculate credit total
  const creditTaxCents = input.credit_tax_cents || 0;
  const creditTotalCents = input.credit_subtotal_cents + creditTaxCents;

  // Calculate outstanding balance
  const outstandingBalanceCents = invoice.total_cents - creditTotalCents;

  // Validate amounts
  if (creditTotalCents > invoice.total_cents) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Credit amount cannot exceed original invoice total'
    );
  }

  // Create credit note
  const { data: creditNote, error } = await supabase
    .from('credit_notes')
    .insert({
      credit_note_number: creditNoteNumber,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.created_at,
      booking_id: invoice.booking_id,
      user_id: invoice.user_id,

      // Company snapshot
      company_id: invoice.company_id || null,
      company_name: invoice.company_name,
      company_address: invoice.company_address,
      company_email: invoice.company_email,
      company_phone: invoice.company_phone,
      company_vat_number: invoice.company_vat_number,
      company_registration_number: invoice.company_registration_number,

      // Customer snapshot
      customer_name: invoice.customer_name,
      customer_email: invoice.customer_email,
      customer_phone: invoice.customer_phone,
      customer_address: invoice.customer_address,

      // Financial details
      credit_subtotal_cents: input.credit_subtotal_cents,
      credit_tax_cents: creditTaxCents,
      credit_tax_rate: input.credit_tax_rate || 0,
      credit_total_cents: creditTotalCents,
      currency: invoice.currency,

      // Balance calculation
      original_invoice_total_cents: invoice.total_cents,
      outstanding_balance_cents: outstandingBalanceCents,

      // Reason and type
      reason: input.reason,
      credit_type: input.credit_type,
      refund_request_id: input.refund_request_id || null,

      // Line items
      line_items: input.line_items,

      // Status
      status: 'issued',

      // Audit trail
      issued_by: actorId,
      issued_at: new Date().toISOString(),
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error || !creditNote) {
    logger.error('Failed to create credit note', { error, input });
    throw new AppError('INTERNAL_ERROR', 'Failed to create credit note');
  }

  // Generate PDF asynchronously (don't block response)
  generateCreditNotePDF(creditNote.id).catch((err) => {
    logger.error('Failed to generate credit note PDF', {
      creditNoteId: creditNote.id,
      error: err,
    });
  });

  return creditNote;
};

/**
 * Generate credit note PDF using professional template
 */
export const generateCreditNotePDF = async (creditNoteId: string): Promise<string> => {
  const supabase = getAdminClient();

  // Get credit note
  const { data: creditNote, error } = await supabase
    .from('credit_notes')
    .select('*')
    .eq('id', creditNoteId)
    .single();

  if (error || !creditNote) {
    throw new AppError('NOT_FOUND', 'Credit note not found');
  }

  // Get invoice settings for bank details
  const { data: settings } = await supabase
    .from('invoice_settings')
    .select('*')
    .limit(1)
    .single();

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: PDF_LAYOUT.MARGIN,
  });

  // Collect PDF chunks
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Wait for PDF to finish
  const pdfPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // --- PDF CONTENT ---

  let yPos = PDF_LAYOUT.MARGIN;

  // Header with company info
  yPos = PDFTemplateHelpers.drawHeader(
    doc,
    {
      companyName: creditNote.company_name,
      address: creditNote.company_address,
      email: creditNote.company_email,
      phone: creditNote.company_phone,
      vatNumber: creditNote.company_vat_number,
      regNumber: creditNote.company_registration_number,
    },
    yPos
  );

  // Document title and metadata (right side)
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor(PDF_COLORS.RED)
    .text('CREDIT NOTE', 400, PDF_LAYOUT.MARGIN, { align: 'right' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(PDF_COLORS.BLACK)
    .text(`Credit Note #: ${creditNote.credit_note_number}`, 400, PDF_LAYOUT.MARGIN + 25, {
      align: 'right',
    })
    .text(`Date: ${PDFTemplateHelpers.formatDate(creditNote.issued_at)}`, 400, PDF_LAYOUT.MARGIN + 40, {
      align: 'right',
    })
    .text(
      `Reference Invoice: ${creditNote.invoice_number}`,
      400,
      PDF_LAYOUT.MARGIN + 55,
      { align: 'right' }
    )
    .text(
      `Invoice Date: ${PDFTemplateHelpers.formatDate(creditNote.invoice_date)}`,
      400,
      PDF_LAYOUT.MARGIN + 70,
      { align: 'right' }
    );

  yPos = 160;

  // FROM/TO section
  yPos = PDFTemplateHelpers.drawFromToSection(
    doc,
    {
      title: 'FROM',
      name: creditNote.company_name,
      address: creditNote.company_address,
      email: creditNote.company_email,
      phone: creditNote.company_phone,
      vatNumber: creditNote.company_vat_number,
    },
    {
      title: 'TO',
      name: creditNote.customer_name,
      email: creditNote.customer_email,
      phone: creditNote.customer_phone,
      address: creditNote.customer_address,
    },
    yPos
  );

  // Reason for credit (highlighted box)
  doc
    .rect(PDF_LAYOUT.MARGIN, yPos, PDF_LAYOUT.CONTENT_WIDTH, 50)
    .fillAndStroke(PDF_COLORS.GRAY_BG, PDF_COLORS.GRAY_LIGHT)
    .fill(PDF_COLORS.BLACK);

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Reason for Credit:', PDF_LAYOUT.MARGIN + 10, yPos + 10);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(creditNote.reason, PDF_LAYOUT.MARGIN + 10, yPos + 28, {
      width: PDF_LAYOUT.CONTENT_WIDTH - 20,
    });

  yPos += 70;

  // Line items table
  yPos = PDFTemplateHelpers.drawTable(
    doc,
    ['Description', 'Qty', 'Unit Price', 'Total'],
    creditNote.line_items.map((item: any) => [
      item.description,
      item.quantity.toString(),
      PDFTemplateHelpers.formatCurrency(item.unit_price_cents, creditNote.currency),
      PDFTemplateHelpers.formatCurrency(item.total_cents, creditNote.currency),
    ]),
    yPos,
    [250, 60, 90, 95]
  );

  yPos += 30;

  // Financial summary
  yPos = PDFTemplateHelpers.drawFinancialSummary(
    doc,
    {
      subtotal: creditNote.credit_subtotal_cents,
      tax: creditNote.credit_tax_cents,
      taxRate: creditNote.credit_tax_rate,
      total: creditNote.credit_total_cents,
      currency: creditNote.currency,
    },
    yPos
  );

  yPos += 30;

  // OUTSTANDING BALANCE BOX (highlighted)
  const balanceBoxWidth = 245;
  const balanceBoxHeight = 80;
  const balanceBoxX = PDF_LAYOUT.MARGIN + PDF_LAYOUT.CONTENT_WIDTH - balanceBoxWidth;

  doc
    .rect(balanceBoxX, yPos, balanceBoxWidth, balanceBoxHeight)
    .fillAndStroke(PDF_COLORS.YELLOW_BG, PDF_COLORS.YELLOW_BORDER)
    .fill(PDF_COLORS.BLACK);

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Outstanding Balance', balanceBoxX + 10, yPos + 10);

  doc.fontSize(10).font('Helvetica');

  // Original invoice total
  doc.text('Original Invoice Total:', balanceBoxX + 10, yPos + 30);
  doc.text(
    PDFTemplateHelpers.formatCurrency(
      creditNote.original_invoice_total_cents,
      creditNote.currency
    ),
    balanceBoxX + 160,
    yPos + 30,
    { align: 'right', width: 75 }
  );

  // Less: Credit amount
  doc.text('Less: Credit Amount:', balanceBoxX + 10, yPos + 45);
  doc.text(
    PDFTemplateHelpers.formatCurrency(-creditNote.credit_total_cents, creditNote.currency),
    balanceBoxX + 160,
    yPos + 45,
    { align: 'right', width: 75 }
  );

  // Divider line
  PDFTemplateHelpers.drawHLine(
    doc,
    yPos + 58,
    balanceBoxX + 10,
    balanceBoxX + balanceBoxWidth - 10,
    PDF_COLORS.GRAY_DARK
  );

  // Outstanding balance (bold)
  doc.font('Helvetica-Bold');
  doc.text('Outstanding Balance:', balanceBoxX + 10, yPos + 62);
  doc.text(
    PDFTemplateHelpers.formatCurrency(
      creditNote.outstanding_balance_cents,
      creditNote.currency
    ),
    balanceBoxX + 160,
    yPos + 62,
    { align: 'right', width: 75 }
  );

  yPos += balanceBoxHeight + 30;

  // Bank details (if configured)
  if (settings?.bank_name || settings?.payment_terms) {
    yPos = PDFTemplateHelpers.drawBankDetailsSection(
      doc,
      {
        paymentTerms: settings.payment_terms,
        bankName: settings.bank_name,
        accountNumber: settings.bank_account_number,
        branchCode: settings.bank_branch_code,
        accountType: settings.bank_account_type,
        accountHolder: settings.bank_account_holder,
      },
      yPos
    );
  }

  // Footer
  const footerText = `This credit note has been issued against invoice ${creditNote.invoice_number}. Please contact us if you have any questions.`;
  PDFTemplateHelpers.drawFooter(doc, footerText);

  // Status badge
  PDFTemplateHelpers.drawStatusBadge(doc, creditNote.status, 500, PDF_LAYOUT.MARGIN);

  // Finalize PDF
  doc.end();

  // Wait for PDF generation
  const pdfBuffer = await pdfPromise;

  // Upload to Supabase Storage
  const filePath = `credit-notes/${creditNote.user_id}/${creditNote.credit_note_number}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    logger.error('Failed to upload credit note PDF', {
      creditNoteId,
      error: uploadError,
    });
    throw new AppError('INTERNAL_ERROR', 'Failed to upload credit note PDF');
  }

  // Update credit note with PDF info
  const { error: updateError } = await supabase
    .from('credit_notes')
    .update({
      pdf_url: filePath,
      pdf_generated_at: new Date().toISOString(),
    })
    .eq('id', creditNoteId);

  if (updateError) {
    logger.error('Failed to update credit note with PDF URL', {
      creditNoteId,
      error: updateError,
    });
  }

  return filePath;
};

/**
 * Get credit note by ID
 */
export const getCreditNote = async (creditNoteId: string): Promise<CreditNote> => {
  const supabase = getAdminClient();

  const { data: creditNote, error } = await supabase
    .from('credit_notes')
    .select('*')
    .eq('id', creditNoteId)
    .single();

  if (error || !creditNote) {
    throw new AppError('NOT_FOUND', 'Credit note not found');
  }

  return creditNote;
};

/**
 * List credit notes with filters and pagination
 */
export const listCreditNotes = async (
  params: CreditNoteListParams
): Promise<CreditNoteListResponse> => {
  const supabase = getAdminClient();

  const {
    user_id,
    invoice_id,
    status,
    from_date,
    to_date,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  // Build query
  let query = supabase.from('credit_notes').select('*', { count: 'exact' });

  // Apply filters
  if (user_id) {
    query = query.eq('user_id', user_id);
  }

  if (invoice_id) {
    query = query.eq('invoice_id', invoice_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (from_date) {
    query = query.gte('created_at', from_date);
  }

  if (to_date) {
    query = query.lte('created_at', to_date);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // Execute query
  const { data: creditNotes, error, count } = await query;

  if (error) {
    logger.error('Failed to list credit notes', { error, params });
    throw new AppError('INTERNAL_ERROR', 'Failed to list credit notes');
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    creditNotes: creditNotes || [],
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Get credit note download URL (signed URL)
 */
export const getCreditNoteDownloadUrl = async (creditNoteId: string): Promise<string> => {
  const supabase = getAdminClient();

  // Get credit note
  const creditNote = await getCreditNote(creditNoteId);

  if (!creditNote.pdf_url) {
    throw new AppError('NOT_FOUND', 'Credit note PDF not generated yet');
  }

  // Generate signed URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from('invoices')
    .createSignedUrl(creditNote.pdf_url, 3600);

  if (error || !data) {
    logger.error('Failed to generate credit note download URL', {
      creditNoteId,
      error,
    });
    throw new AppError('INTERNAL_ERROR', 'Failed to generate download URL');
  }

  return data.signedUrl;
};

/**
 * Void credit note
 */
export const voidCreditNote = async (
  creditNoteId: string,
  actorId: string
): Promise<CreditNote> => {
  const supabase = getAdminClient();

  // Check if credit note exists
  await getCreditNote(creditNoteId);

  // Update status to void
  const { data: creditNote, error } = await supabase
    .from('credit_notes')
    .update({
      status: 'void',
      updated_at: new Date().toISOString(),
    })
    .eq('id', creditNoteId)
    .select()
    .single();

  if (error || !creditNote) {
    logger.error('Failed to void credit note', { creditNoteId, error });
    throw new AppError('INTERNAL_ERROR', 'Failed to void credit note');
  }

  return creditNote;
};
