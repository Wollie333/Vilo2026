// ============================================================================
// Credit Note Types
// ============================================================================

/**
 * Credit note line item structure
 */
export interface CreditNoteLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number; // Negative for credits
  total_cents: number;      // Negative for credits
}

/**
 * Credit note type
 */
export type CreditNoteType = 'refund' | 'cancellation' | 'adjustment' | 'error_correction';

/**
 * Credit note status
 */
export type CreditNoteStatus = 'draft' | 'issued' | 'void';

/**
 * Credit note entity
 */
export interface CreditNote {
  id: string;
  credit_note_number: string;

  // Original invoice reference
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;

  // Booking/user refs
  booking_id: string | null;
  user_id: string;

  // Sender information (snapshot)
  company_id: string | null;
  company_name: string;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_vat_number: string | null;
  company_registration_number: string | null;

  // Receiver information (snapshot)
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;

  // Credit amounts (in cents)
  credit_subtotal_cents: number;
  credit_tax_cents: number;
  credit_tax_rate: number;
  credit_total_cents: number;
  currency: string;

  // Outstanding balance calculation
  original_invoice_total_cents: number;
  outstanding_balance_cents: number;

  // Reason and type
  reason: string;
  credit_type: CreditNoteType;
  refund_request_id: string | null;

  // Line items
  line_items: CreditNoteLineItem[];

  // Status and PDF
  status: CreditNoteStatus;
  pdf_url: string | null;
  pdf_generated_at: string | null;

  // Audit trail
  issued_by: string | null;
  issued_at: string;
  notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Create credit note input DTO
 */
export interface CreateCreditNoteInput {
  invoice_id: string;
  credit_subtotal_cents: number;
  credit_tax_cents?: number;
  credit_tax_rate?: number;
  reason: string;
  credit_type: CreditNoteType;
  refund_request_id?: string;
  line_items: CreditNoteLineItem[];
  notes?: string;
}

/**
 * Credit note list query params
 */
export interface CreditNoteListParams {
  user_id?: string;
  invoice_id?: string;
  status?: CreditNoteStatus;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'credit_note_number' | 'credit_total_cents';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated credit note list response
 */
export interface CreditNoteListResponse {
  creditNotes: CreditNote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
