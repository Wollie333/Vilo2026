/**
 * Credit Note Types
 */

export type CreditNoteStatus = 'draft' | 'issued' | 'void';

export type CreditNoteType = 'refund' | 'cancellation' | 'adjustment' | 'error_correction';

export interface CreditNoteLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export interface CreditNote {
  id: string;
  credit_note_number: string;

  // Original invoice reference
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;

  // Customer/booking refs
  booking_id: string | null;
  user_id: string;

  // Sender information (company)
  company_id: string | null;
  company_name: string;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_vat_number: string | null;
  company_registration_number: string | null;

  // Receiver information (customer)
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;

  // Credit amounts (all in cents for precision)
  credit_subtotal_cents: number;
  credit_tax_cents: number;
  credit_tax_rate: number;
  credit_total_cents: number;
  currency: string;

  // Outstanding balance calculation
  original_invoice_total_cents: number;
  outstanding_balance_cents: number;

  // Reason for credit
  reason: string;
  credit_type: CreditNoteType;

  // Link to refund request
  refund_request_id: string | null;

  // Line items (negative amounts for credits)
  line_items: CreditNoteLineItem[];

  // Status
  status: CreditNoteStatus;

  // PDF storage
  pdf_url: string | null;
  pdf_generated_at: string | null;

  // Approval/audit trail
  issued_by: string | null;
  issued_at: string;

  // Additional notes
  notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateCreditNoteInput {
  invoice_id: string;
  credit_subtotal_cents: number;
  credit_tax_cents?: number;
  credit_tax_rate?: number;
  credit_total_cents: number;
  reason: string;
  credit_type: CreditNoteType;
  line_items: CreditNoteLineItem[];
  notes?: string;
  refund_request_id?: string;
}

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

export interface CreditNoteListResponse {
  credit_notes: CreditNote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
