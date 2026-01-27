// ============================================================================
// Invoice Types (Frontend)
// ============================================================================

/**
 * Invoice line item structure
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

/**
 * Invoice status
 */
export type InvoiceStatus = 'draft' | 'paid' | 'void';

/**
 * Invoice type discriminator
 * - subscription: SaaS platform billing users for subscriptions
 * - booking: Property owners billing guests for bookings
 */
export type InvoiceType = 'subscription' | 'booking';

/**
 * Invoice status labels
 */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  paid: 'Paid',
  void: 'Voided',
};

/**
 * Invoice status colors
 */
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'gray',
  paid: 'green',
  void: 'red',
};

/**
 * Invoice type labels
 */
export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  subscription: 'Subscription',
  booking: 'Booking',
};

/**
 * Base invoice properties shared by all invoice types
 */
export interface BaseInvoice {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;

  // Customer info (snapshot at time of invoice)
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_address: string | null;

  // Business info (snapshot at time of invoice)
  company_name: string;
  company_address: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_vat_number: string | null;
  company_registration_number: string | null;

  // Financial details
  subtotal_cents: number;
  tax_cents: number;
  tax_rate: number;
  total_cents: number;
  currency: string;

  // Payment info
  payment_method: string | null;
  payment_reference: string | null;
  payment_date: string | null;

  // Line items
  line_items: InvoiceLineItem[];

  // Status & PDF
  status: InvoiceStatus;
  pdf_url: string | null;
  pdf_generated_at: string | null;

  // Metadata
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined user data (for admin list)
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

/**
 * Subscription invoice (SaaS-to-User)
 * The SaaS platform bills a user for their subscription plan
 */
export interface SubscriptionInvoice extends BaseInvoice {
  invoice_type: 'subscription';
  user_id: string; // The payer (subscription owner)
  checkout_id: string;
  subscription_id: string | null;
  company_id: null; // Always null for subscription invoices (uses global settings)

  // Not applicable to subscription invoices
  booking_id: null;
  booking_reference: null;
  property_name: null;
}

/**
 * Booking invoice (User-to-Guest)
 * A property owner bills a guest for a booking
 */
export interface BookingInvoice extends BaseInvoice {
  invoice_type: 'booking';
  user_id: string; // The issuer (property owner)
  booking_id: string;
  booking_reference: string;
  property_name: string;
  company_id: string | null; // Property owner's company (or null for fallback to global)

  // Not applicable to booking invoices
  checkout_id: null;
  subscription_id: null;
}

/**
 * Invoice discriminated union
 * Use type guards to narrow the type
 */
export type Invoice = SubscriptionInvoice | BookingInvoice;

/**
 * Type guard to check if invoice is a subscription invoice
 */
export function isSubscriptionInvoice(invoice: Invoice): invoice is SubscriptionInvoice {
  return invoice.invoice_type === 'subscription';
}

/**
 * Type guard to check if invoice is a booking invoice
 */
export function isBookingInvoice(invoice: Invoice): invoice is BookingInvoice {
  return invoice.invoice_type === 'booking';
}

/**
 * Invoice settings (admin-configurable or per-company)
 */
export interface InvoiceSettings {
  id: string;

  // Company reference (NULL = global admin settings, UUID = company-specific settings)
  company_id: string | null;

  company_name: string;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  vat_number: string | null;
  registration_number: string | null;
  logo_url: string | null;
  footer_text: string | null;
  invoice_prefix: string;
  next_invoice_number: number;
  currency: string;

  // Bank details for EFT payments
  bank_name: string | null;
  bank_account_number: string | null;
  bank_branch_code: string | null;
  bank_account_type: string | null;
  bank_account_holder: string | null;
  payment_terms: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Company invoice settings response (with fallback indicator)
 */
export interface CompanyInvoiceSettingsResponse {
  settings: InvoiceSettings | null;
  is_using_global_fallback: boolean;
}

/**
 * Update invoice settings data
 */
export interface UpdateInvoiceSettingsData {
  company_name?: string;
  company_address?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  vat_number?: string | null;
  registration_number?: string | null;
  logo_url?: string | null;
  footer_text?: string | null;
  invoice_prefix?: string;
  currency?: string;

  // Bank details for EFT payments
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_branch_code?: string | null;
  bank_account_type?: string | null;
  bank_account_holder?: string | null;
  payment_terms?: string | null;
}

/**
 * Invoice list query params
 */
export interface InvoiceListParams {
  user_id?: string;
  status?: InvoiceStatus;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'invoice_number' | 'total_cents';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated invoice list response
 */
export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
