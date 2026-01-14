import PDFDocument from 'pdfkit';
import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { logger } from '../utils/logger';
import { PDFTemplateHelpers, PDF_COLORS } from '../utils/pdf-templates';
import * as propertyService from './property.service';
import * as companyService from './company.service';
import type {
  Invoice,
  InvoiceSettings,
  UpdateInvoiceSettingsDTO,
  InvoiceListParams,
  InvoiceListResponse,
  InvoiceLineItem,
  InvoiceStatus,
} from '../types/invoice.types';
import type { BookingWithDetails } from '../types/booking.types';
import type { Express } from 'express';

// Extend Express.Multer.File type
type MulterFile = Express.Multer.File;

// ============================================================================
// INVOICE SETTINGS
// ============================================================================

/**
 * Get current invoice settings (global admin settings only)
 */
export const getInvoiceSettings = async (): Promise<InvoiceSettings> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('invoice_settings')
    .select('*')
    .is('company_id', null) // Only get global settings (company_id IS NULL)
    .single();

  if (error || !data) {
    // Return default settings if none exist
    return {
      id: '',
      company_id: null,
      company_name: 'Vilo',
      company_address: null,
      company_email: 'billing@vilo.app',
      company_phone: null,
      vat_number: null,
      registration_number: null,
      logo_url: null,
      footer_text: 'Thank you for your business!',
      invoice_prefix: 'INV',
      next_invoice_number: 1,
      currency: 'ZAR',
      bank_name: null,
      bank_account_number: null,
      bank_branch_code: null,
      bank_account_type: null,
      bank_account_holder: null,
      payment_terms: null,
      credit_note_prefix: null,
      credit_note_next_sequence: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data;
};

/**
 * Get invoice settings for a company with fallback to global settings
 * Implements fallback chain: Company settings → Global admin settings
 */
export const getInvoiceSettingsForCompany = async (
  companyId: string | null
): Promise<InvoiceSettings> => {
  const supabase = getAdminClient();

  // Step 1: Try to get company-specific settings if companyId provided
  if (companyId) {
    const { data: companySettings } = await supabase
      .from('invoice_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    if (companySettings) {
      logger.info('Using company-specific invoice settings', { companyId });
      return companySettings;
    }

    logger.info('No company-specific settings found, falling back to global settings', {
      companyId,
    });
  }

  // Step 2: Fall back to global admin settings
  const globalSettings = await getInvoiceSettings();

  return globalSettings;
};

/**
 * Update invoice settings (admin only)
 */
export const updateInvoiceSettings = async (
  input: UpdateInvoiceSettingsDTO,
  actorId: string
): Promise<InvoiceSettings> => {
  const supabase = getAdminClient();

  // Get current settings
  const currentSettings = await getInvoiceSettings();

  let result: InvoiceSettings;

  if (currentSettings.id) {
    // Update existing
    const { data, error } = await supabase
      .from('invoice_settings')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSettings.id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update invoice settings');
    }

    result = data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('invoice_settings')
      .insert({
        ...input,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError('INTERNAL_ERROR', 'Failed to create invoice settings');
    }

    result = data;
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'payment_integration.update',
    entity_type: 'payment_integration',
    entity_id: result.id,
    old_data: currentSettings as unknown as Record<string, unknown>,
    new_data: input as unknown as Record<string, unknown>,
  });

  return result;
};

/**
 * Upload invoice logo (admin only)
 */
export const uploadInvoiceLogo = async (
  file: MulterFile,
  actorId: string
): Promise<string> => {
  const supabase = getAdminClient();

  // Get current settings
  const currentSettings = await getInvoiceSettings();

  // Delete old logo if exists
  if (currentSettings.logo_url) {
    try {
      // Extract filename from URL
      const urlParts = currentSettings.logo_url.split('/invoice-logos/');
      if (urlParts.length > 1) {
        const oldPath = urlParts[1].split('?')[0]; // Remove query params
        await supabase.storage.from('invoice-logos').remove([oldPath]);
      }
    } catch {
      // Ignore deletion errors - file may not exist
    }
  }

  // Generate unique filename
  const ext = file.originalname.split('.').pop() || 'png';
  const filename = `logo_${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('invoice-logos')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    logger.error('Failed to upload invoice logo', { error: uploadError });
    throw new AppError('INTERNAL_ERROR', 'Failed to upload logo');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('invoice-logos')
    .getPublicUrl(filename);

  const logoUrl = urlData.publicUrl;

  // Update settings with new logo URL
  if (currentSettings.id) {
    await supabase
      .from('invoice_settings')
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSettings.id);
  } else {
    // Create settings if doesn't exist
    await supabase
      .from('invoice_settings')
      .insert({
        logo_url: logoUrl,
      });
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'invoice_settings.updated',
    entity_type: 'invoice_settings',
    entity_id: currentSettings.id || 'new',
    old_data: { logo_url: currentSettings.logo_url },
    new_data: { logo_url: logoUrl },
  });

  return logoUrl;
};

/**
 * Delete invoice logo (admin only)
 */
export const deleteInvoiceLogo = async (actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  // Get current settings
  const currentSettings = await getInvoiceSettings();

  if (!currentSettings.logo_url) {
    return; // No logo to delete
  }

  // Delete from storage
  try {
    const urlParts = currentSettings.logo_url.split('/invoice-logos/');
    if (urlParts.length > 1) {
      const oldPath = urlParts[1].split('?')[0];
      await supabase.storage.from('invoice-logos').remove([oldPath]);
    }
  } catch {
    // Ignore deletion errors
  }

  // Update settings to remove logo URL
  if (currentSettings.id) {
    await supabase
      .from('invoice_settings')
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSettings.id);
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'invoice_settings.updated',
    entity_type: 'invoice_settings',
    entity_id: currentSettings.id || 'unknown',
    old_data: { logo_url: currentSettings.logo_url },
    new_data: { logo_url: null },
  });
};

// ============================================================================
// INVOICE NUMBER GENERATION
// ============================================================================

/**
 * Generate next invoice number with format: PREFIX-YYYYMM-NNNN
 * Supports per-company invoice numbering with fallback to global settings
 *
 * @param companyId - Company ID for company-specific numbering (null for global)
 */
export const generateInvoiceNumber = async (
  companyId: string | null = null
): Promise<string> => {
  const supabase = getAdminClient();

  // Get settings for company (with fallback to global)
  const settings = await getInvoiceSettingsForCompany(companyId);

  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sequenceNum = String(settings.next_invoice_number).padStart(4, '0');

  const invoiceNumber = `${settings.invoice_prefix}-${yearMonth}-${sequenceNum}`;

  // Increment the counter atomically
  if (settings.id) {
    await supabase
      .from('invoice_settings')
      .update({
        next_invoice_number: settings.next_invoice_number + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id);

    logger.info('Generated invoice number', {
      invoiceNumber,
      companyId: settings.company_id,
      isGlobal: settings.company_id === null,
    });
  }

  return invoiceNumber;
};

// ============================================================================
// INVOICE GENERATION
// ============================================================================

/**
 * Generate invoice from completed checkout
 */
export const generateInvoice = async (checkoutId: string): Promise<Invoice> => {
  const supabase = getAdminClient();

  // Get checkout with details
  const { data: checkout, error: checkoutError } = await supabase
    .from('checkouts')
    .select(`
      *,
      subscription_type:subscription_types (id, name, display_name, description, pricing, currency),
      user:users (id, email, full_name)
    `)
    .eq('id', checkoutId)
    .single();

  if (checkoutError || !checkout) {
    throw new AppError('NOT_FOUND', 'Checkout not found');
  }

  if (checkout.status !== 'completed') {
    throw new AppError('BAD_REQUEST', 'Cannot generate invoice for incomplete checkout');
  }

  // Check if invoice already exists for this checkout
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id, invoice_number')
    .eq('checkout_id', checkoutId)
    .single();

  if (existingInvoice) {
    // Return existing invoice
    const invoice = await getInvoice(existingInvoice.id);
    return invoice;
  }

  // Get global settings (subscription invoices always use global settings)
  const settings = await getInvoiceSettings();

  // Generate invoice number (using global settings for subscription invoices)
  const invoiceNumber = await generateInvoiceNumber(null);

  // Get subscription for linking
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', checkout.user_id)
    .eq('is_active', true)
    .single();

  // Build line items
  const subscriptionType = checkout.subscription_type as {
    display_name: string;
    description?: string;
  };
  const billingInterval = checkout.billing_interval === 'annual' ? 'Annual' : 'Monthly';

  const lineItems: InvoiceLineItem[] = [
    {
      description: `${subscriptionType.display_name} - ${billingInterval} Subscription`,
      quantity: 1,
      unit_price_cents: checkout.amount_cents,
      total_cents: checkout.amount_cents,
    },
  ];

  // Create invoice record
  const user = checkout.user as { email: string; full_name?: string };

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      user_id: checkout.user_id,
      company_id: null, // Subscription invoices use global settings
      checkout_id: checkoutId,
      subscription_id: subscription?.id || null,
      customer_name: user.full_name || user.email,
      customer_email: user.email,
      customer_address: null,
      company_name: settings.company_name,
      company_address: settings.company_address,
      company_email: settings.company_email,
      company_phone: settings.company_phone,
      company_vat_number: settings.vat_number,
      company_registration_number: settings.registration_number,
      subtotal_cents: checkout.amount_cents,
      tax_cents: 0, // No VAT calculation for now
      tax_rate: 0,
      total_cents: checkout.amount_cents,
      currency: checkout.currency,
      payment_method: checkout.payment_provider,
      payment_reference: checkout.payment_reference,
      payment_date: checkout.completed_at,
      line_items: lineItems,
      status: 'paid' as InvoiceStatus,
      notes: null,
    })
    .select()
    .single();

  if (invoiceError || !invoice) {
    logger.error('Failed to create invoice', { checkoutId, error: invoiceError });
    throw new AppError('INTERNAL_ERROR', 'Failed to create invoice');
  }

  // Generate PDF asynchronously (don't wait)
  generateInvoicePDF(invoice.id).catch((err) => {
    logger.error('Failed to generate invoice PDF', { invoiceId: invoice.id, error: err });
  });

  await createAuditLog({
    actor_id: checkout.user_id,
    action: 'checkout.completed',
    entity_type: 'checkout',
    entity_id: invoice.id,
    new_data: {
      invoice_number: invoiceNumber,
      checkout_id: checkoutId,
      amount_cents: checkout.amount_cents,
    },
  });

  return invoice;
};

// ============================================================================
// BOOKING INVOICE GENERATION
// ============================================================================

/**
 * Generate invoice from a booking
 */
export const generateBookingInvoice = async (
  booking: BookingWithDetails,
  propertyOwnerId: string
): Promise<Invoice> => {
  const supabase = getAdminClient();

  // Check if invoice already exists for this booking
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id, invoice_number')
    .eq('booking_id', booking.id)
    .single();

  if (existingInvoice) {
    // Return existing invoice
    const invoice = await getInvoice(existingInvoice.id);
    return invoice;
  }

  // Get property and company information
  const property = await propertyService.getPropertyById(booking.property_id, propertyOwnerId);
  const companyId = property.company_id || null;

  // Get invoice settings for company (with automatic fallback to global settings)
  const settings = await getInvoiceSettingsForCompany(companyId);

  // If property has a company, prefer company details over invoice settings
  let companyName: string = settings.company_name;
  let companyAddress: string | null = settings.company_address;
  let companyEmail: string | null = settings.company_email;
  let companyPhone: string | null = settings.company_phone;
  let companyVatNumber: string | null = settings.vat_number;
  let companyRegistrationNumber: string | null = settings.registration_number;

  if (companyId) {
    // Get company details to override settings if available
    try {
      const company = await companyService.getCompanyById(companyId, propertyOwnerId);

      // Build company address string
      const fullAddress = [
        company.address_street,
        company.address_city,
        company.address_state,
        company.address_postal_code,
        company.address_country,
      ]
        .filter(Boolean)
        .join(', ');

      // Override with company details (if they exist)
      companyName = company.display_name || company.name;
      companyAddress = fullAddress || companyAddress;
      companyEmail = company.contact_email || companyEmail;
      companyPhone = company.contact_phone || companyPhone;
      companyVatNumber = company.vat_number || companyVatNumber;
      companyRegistrationNumber = company.registration_number || companyRegistrationNumber;

      logger.info('Using company details for booking invoice', {
        companyId,
        bookingId: booking.id,
      });
    } catch (error) {
      logger.warn('Failed to fetch company details, using invoice settings only', {
        companyId,
        error,
      });
    }
  } else {
    logger.info('Property has no company, using global invoice settings', {
      propertyId: property.id,
      bookingId: booking.id,
    });
  }

  // Generate invoice number (per-company numbering)
  const invoiceNumber = await generateInvoiceNumber(companyId);

  // Build line items from booking rooms and addons
  const lineItems: InvoiceLineItem[] = [];

  // Add room line items
  for (const room of booking.rooms || []) {
    lineItems.push({
      description: `${room.room_name} - ${booking.total_nights} night${booking.total_nights !== 1 ? 's' : ''} (${formatDateShort(booking.check_in_date)} - ${formatDateShort(booking.check_out_date)})`,
      quantity: 1,
      unit_price_cents: Math.round(room.room_subtotal * 100),
      total_cents: Math.round(room.room_subtotal * 100),
    });
  }

  // Add addon line items
  for (const addon of booking.addons || []) {
    lineItems.push({
      description: addon.addon_name,
      quantity: addon.quantity,
      unit_price_cents: Math.round(addon.unit_price * 100),
      total_cents: Math.round(addon.addon_total * 100),
    });
  }

  // Add discount if applicable
  if (booking.discount_amount && booking.discount_amount > 0) {
    lineItems.push({
      description: `Discount${booking.coupon_code ? ` (${booking.coupon_code})` : ''}`,
      quantity: 1,
      unit_price_cents: -Math.round(booking.discount_amount * 100),
      total_cents: -Math.round(booking.discount_amount * 100),
    });
  }

  // Calculate totals in cents
  const subtotalCents = Math.round(booking.subtotal * 100);
  const totalCents = Math.round(booking.total_amount * 100);

  // Create invoice record
  const { data: invoice, error: invoiceError} = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      user_id: propertyOwnerId,
      booking_id: booking.id,
      customer_name: booking.guest_name,
      customer_email: booking.guest_email,
      customer_phone: booking.guest_phone,
      customer_address: null,
      company_id: companyId,
      company_name: companyName,
      company_address: companyAddress,
      company_email: companyEmail,
      company_phone: companyPhone,
      company_vat_number: companyVatNumber,
      company_registration_number: companyRegistrationNumber,
      subtotal_cents: subtotalCents,
      tax_cents: 0,
      tax_rate: 0,
      total_cents: totalCents,
      currency: booking.currency,
      payment_method: booking.payment_method,
      payment_reference: booking.payment_reference,
      payment_date: booking.payment_received_at,
      line_items: lineItems,
      status: booking.payment_status === 'paid' ? 'paid' as InvoiceStatus : 'draft' as InvoiceStatus,
      notes: booking.special_requests,
      booking_reference: booking.booking_reference,
      property_name: booking.property_name,
    })
    .select()
    .single();

  if (invoiceError || !invoice) {
    logger.error('Failed to create booking invoice', { bookingId: booking.id, error: invoiceError });
    throw new AppError('INTERNAL_ERROR', 'Failed to create invoice');
  }

  // Generate PDF asynchronously (don't wait)
  generateInvoicePDF(invoice.id).catch((err) => {
    logger.error('Failed to generate booking invoice PDF', { invoiceId: invoice.id, error: err });
  });

  await createAuditLog({
    actor_id: propertyOwnerId,
    action: 'invoice.created',
    entity_type: 'invoice',
    entity_id: invoice.id,
    new_data: {
      invoice_number: invoiceNumber,
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      total_cents: totalCents,
    },
  });

  logger.info('Booking invoice created', {
    invoiceId: invoice.id,
    invoiceNumber,
    bookingId: booking.id,
    bookingReference: booking.booking_reference,
  });

  return invoice;
};

/**
 * Manually generate invoice for a paid booking
 * (Used to retry failed auto-generation or generate for existing paid bookings)
 */
export const manuallyGenerateBookingInvoice = async (
  bookingId: string,
  userId: string
): Promise<Invoice> => {
  const supabase = getAdminClient();

  // Get booking with full details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      *,
      property:properties!inner(id, name, company_id, owner_id),
      rooms:booking_rooms(
        room_id,
        unit_number,
        guest_count,
        room_subtotal,
        room:rooms(id, name, price_per_night)
      ),
      addons:booking_addons(
        addon_id,
        quantity,
        unit_price,
        total_price,
        addon:addons(id, name)
      ),
      payments:booking_payments(
        id,
        amount,
        payment_method,
        payment_date,
        payment_reference
      )
    `)
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    logger.error('Booking not found for manual invoice generation', { bookingId, error: bookingError });
    throw new AppError('NOT_FOUND', `Booking ${bookingId} not found`);
  }

  // Verify user has access to this booking's property
  const propertyOwnerId = booking.property.owner_id;
  if (propertyOwnerId !== userId) {
    // For admin, we could add role check here, but for now require ownership
    throw new AppError('FORBIDDEN', 'You do not have access to this booking');
  }

  // Verify booking is paid
  if (booking.payment_status !== 'paid') {
    throw new AppError(
      'BAD_REQUEST',
      `Booking ${booking.booking_reference} is not fully paid. Payment status: ${booking.payment_status}`
    );
  }

  // Verify invoice doesn't already exist
  if (booking.invoice_id) {
    logger.warn('Invoice already exists for booking', {
      bookingId,
      invoiceId: booking.invoice_id,
    });
    // Return existing invoice instead of creating duplicate
    const existingInvoice = await getInvoice(booking.invoice_id);
    return existingInvoice;
  }

  // Transform booking data to match BookingWithDetails type
  const bookingWithDetails: BookingWithDetails = {
    ...booking,
    property_id: booking.property.id,
    property_name: booking.property.name,
    rooms: booking.rooms?.map((br: any) => ({
      room_id: br.room_id,
      room_name: br.room?.name || 'Unknown Room',
      unit_number: br.unit_number,
      guest_count: br.guest_count,
      room_subtotal: br.room_subtotal,
      price_per_night: br.room?.price_per_night || 0,
    })) || [],
    addons: booking.addons?.map((ba: any) => ({
      addon_id: ba.addon_id,
      addon_name: ba.addon?.name || 'Unknown Add-on',
      quantity: ba.quantity,
      unit_price: ba.unit_price,
      total_price: ba.total_price,
    })) || [],
    payments: booking.payments || [],
  };

  // Generate invoice
  logger.info('Manually generating invoice for paid booking', {
    bookingId,
    bookingReference: booking.booking_reference,
    userId,
  });

  try {
    const invoice = await generateBookingInvoice(bookingWithDetails, propertyOwnerId);

    // Update booking with invoice reference
    await supabase
      .from('bookings')
      .update({
        invoice_id: invoice.id,
        invoice_generated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    // Create audit log
    await createAuditLog({
      user_id: userId,
      action: 'invoice.manually_generated',
      entity_type: 'invoice',
      entity_id: invoice.id,
      new_data: {
        booking_id: bookingId,
        booking_reference: booking.booking_reference,
        invoice_number: invoice.invoice_number,
        generated_by: 'manual_endpoint',
      },
    });

    logger.info('Manual invoice generation successful', {
      bookingId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
    });

    return invoice;
  } catch (error) {
    logger.error('Manual invoice generation failed', {
      bookingId,
      bookingReference: booking.booking_reference,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Helper: Format date short
 */
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// PDF GENERATION
// ============================================================================

/**
 * Generate PDF for invoice and upload to storage
 */
export const generateInvoicePDF = async (invoiceId: string): Promise<string> => {
  const supabase = getAdminClient();

  // Get invoice
  const invoice = await getInvoice(invoiceId);

  // Get settings for company (with fallback to global)
  const settings = await getInvoiceSettingsForCompany(invoice.company_id || null);

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

  // --- PDF Content (Professional Template) ---

  let yPos = 50;

  // Document title and metadata (right side) - Draw FIRST to avoid overlap
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor(PDF_COLORS.BLACK)
    .text('INVOICE', 400, yPos, { align: 'right' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Invoice #: ${invoice.invoice_number}`, 400, yPos + 25, { align: 'right' })
    .text(`Date: ${PDFTemplateHelpers.formatDate(invoice.created_at)}`, 400, yPos + 40, { align: 'right' });

  if (invoice.payment_date) {
    doc.text(`Payment Date: ${PDFTemplateHelpers.formatDate(invoice.payment_date)}`, 400, yPos + 55, {
      align: 'right',
    });
  }

  // Status badge removed - payment date already indicates paid status

  // Header with company info (left side) - limit width to avoid overlapping with right side
  const headerStartY = yPos;
  yPos = PDFTemplateHelpers.drawHeader(
    doc,
    {
      companyName: invoice.company_name,
      address: invoice.company_address,
      email: invoice.company_email,
      phone: invoice.company_phone,
      vatNumber: invoice.company_vat_number,
      regNumber: invoice.company_registration_number,
    },
    headerStartY
  );

  // Ensure we have enough space before FROM/TO section
  yPos = Math.max(yPos, 170);  // Increased from 160 for better spacing

  // FROM/TO section (modern boxed layout)
  yPos = PDFTemplateHelpers.drawFromToSection(
    doc,
    {
      title: 'FROM',
      name: invoice.company_name,
      address: invoice.company_address,
      email: invoice.company_email,
      phone: invoice.company_phone,
      vatNumber: invoice.company_vat_number,
    },
    {
      title: 'TO',
      name: invoice.customer_name,
      email: invoice.customer_email,
      phone: invoice.customer_phone,
      address: invoice.customer_address,
    },
    yPos
  );

  yPos += 10;  // Extra spacing after FROM/TO boxes

  // Line items table
  yPos = PDFTemplateHelpers.drawTable(
    doc,
    ['Description', 'Qty', 'Unit Price', 'Total'],
    invoice.line_items.map((item: any) => [
      item.description,
      item.quantity.toString(),
      PDFTemplateHelpers.formatCurrency(item.unit_price_cents, invoice.currency),
      PDFTemplateHelpers.formatCurrency(item.total_cents, invoice.currency),
    ]),
    yPos,
    [250, 60, 90, 95]
  );

  yPos += 25;  // Reduced from 30 (table already has spacing)

  // Financial summary
  yPos = PDFTemplateHelpers.drawFinancialSummary(
    doc,
    {
      subtotal: invoice.subtotal_cents,
      tax: invoice.tax_cents,
      taxRate: invoice.tax_rate,
      total: invoice.total_cents,
      currency: invoice.currency,
    },
    yPos
  );

  yPos += 35;  // Increased from 30 for better separation

  // Payment info (if paid)
  if (invoice.payment_method || invoice.payment_reference) {
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(PDF_COLORS.BLACK)
      .text('Payment Information:', 50, yPos);
    yPos += 15;

    doc.font('Helvetica');
    if (invoice.payment_method) {
      doc.text(`Method: ${formatPaymentMethod(invoice.payment_method)}`, 50, yPos);
      yPos += 12;
    }
    if (invoice.payment_reference) {
      doc.text(`Reference: ${invoice.payment_reference}`, 50, yPos);
      yPos += 12;
    }

    yPos += 20;
  }

  // Bank details section (if configured)
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

  // Footer (with "Powered by Vilo")
  const footerText = settings.footer_text || 'Thank you for your business!';
  PDFTemplateHelpers.drawFooter(doc, footerText);

  // Status badge removed - payment date already indicates paid status

  // Finalize
  doc.end();

  // Wait for PDF generation
  const pdfBuffer = await pdfPromise;

  // Upload to Supabase Storage
  const filePath = `${invoice.user_id}/${invoice.invoice_number}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    logger.error('Failed to upload invoice PDF', { invoiceId, error: uploadError });
    throw new AppError('INTERNAL_ERROR', 'Failed to upload invoice PDF');
  }

  // Get public URL (for storage, not direct access)
  const pdfUrl = filePath;

  // Update invoice with PDF info
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      pdf_url: pdfUrl,
      pdf_generated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);

  if (updateError) {
    logger.error('Failed to update invoice with PDF URL', { invoiceId, error: updateError });
  }

  return pdfUrl;
};

/**
 * Helper: Draw table row
 */
function drawTableRow(
  doc: PDFKit.PDFDocument,
  y: number,
  x: number,
  colWidths: number[],
  values: string[]
): void {
  let currentX = x;
  for (let i = 0; i < values.length; i++) {
    const align = i === 0 ? 'left' : 'right';
    doc.text(values[i], currentX, y, { width: colWidths[i], align });
    currentX += colWidths[i];
  }
}

/**
 * Helper: Format date
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Helper: Format currency
 */
function formatCurrency(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Helper: Format payment method
 */
function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    paystack: 'Paystack',
    paypal: 'PayPal',
    eft: 'Bank Transfer (EFT)',
  };
  return methods[method] || method;
}

// ============================================================================
// INVOICE RETRIEVAL
// ============================================================================

/**
 * Get invoice by ID
 */
export const getInvoice = async (id: string, userId?: string): Promise<Invoice> => {
  const supabase = getAdminClient();

  let query = supabase.from('invoices').select('*').eq('id', id);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Invoice not found');
  }

  return data;
};

/**
 * List user's invoices
 */
export const listUserInvoices = async (
  userId: string,
  params: InvoiceListParams = {}
): Promise<InvoiceListResponse> => {
  const supabase = getAdminClient();

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('invoices')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.from_date) {
    query = query.gte('created_at', params.from_date);
  }
  if (params.to_date) {
    query = query.lte('created_at', params.to_date);
  }

  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch invoices');
  }

  const total = count || 0;

  return {
    invoices: data || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * List all invoices (admin)
 */
export const listAllInvoices = async (
  params: InvoiceListParams = {}
): Promise<InvoiceListResponse> => {
  const supabase = getAdminClient();

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('invoices')
    .select(`
      *,
      user:users (id, email, full_name)
    `, { count: 'exact' });

  if (params.user_id) {
    query = query.eq('user_id', params.user_id);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.from_date) {
    query = query.gte('created_at', params.from_date);
  }
  if (params.to_date) {
    query = query.lte('created_at', params.to_date);
  }

  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch invoices');
  }

  const total = count || 0;

  return {
    invoices: data || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ============================================================================
// INVOICE DOWNLOAD
// ============================================================================

/**
 * Get signed download URL for invoice PDF
 */
export const getInvoiceDownloadUrl = async (
  invoiceId: string,
  userId?: string
): Promise<string> => {
  const supabase = getAdminClient();

  // Get invoice (with ownership check if userId provided)
  const invoice = await getInvoice(invoiceId, userId);

  if (!invoice.pdf_url) {
    // Generate PDF if not yet generated
    await generateInvoicePDF(invoiceId);
    // Refetch invoice
    const updatedInvoice = await getInvoice(invoiceId);
    if (!updatedInvoice.pdf_url) {
      throw new AppError('INTERNAL_ERROR', 'Failed to generate invoice PDF');
    }
    invoice.pdf_url = updatedInvoice.pdf_url;
  }

  // Create signed URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from('invoices')
    .createSignedUrl(invoice.pdf_url, 3600);

  if (error || !data?.signedUrl) {
    throw new AppError('INTERNAL_ERROR', 'Failed to generate download URL');
  }

  return data.signedUrl;
};

// ============================================================================
// INVOICE MANAGEMENT
// ============================================================================

/**
 * Void an invoice (admin only)
 */
export const voidInvoice = async (invoiceId: string, actorId: string): Promise<Invoice> => {
  const supabase = getAdminClient();

  const invoice = await getInvoice(invoiceId);

  if (invoice.status === 'void') {
    return invoice;
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({
      status: 'void',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to void invoice');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'subscription.cancelled',
    entity_type: 'subscription',
    entity_id: invoiceId,
    old_data: { status: invoice.status },
    new_data: { status: 'void' },
  });

  return data;
};

/**
 * Regenerate PDF for invoice (admin)
 */
export const regenerateInvoicePDF = async (
  invoiceId: string,
  actorId: string
): Promise<string> => {
  const pdfUrl = await generateInvoicePDF(invoiceId);

  await createAuditLog({
    actor_id: actorId,
    action: 'subscription.updated',
    entity_type: 'subscription',
    entity_id: invoiceId,
    new_data: { action: 'pdf_regenerated', pdf_url: pdfUrl },
  });

  return pdfUrl;
};
