// ============================================================================
// Credit Memo Types
// ============================================================================

// ============================================================================
// Credit Memo
// ============================================================================

export interface CreditMemoLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export interface CreditMemo {
  id: string;
  credit_memo_number: string;
  invoice_id?: string | null;
  refund_request_id?: string | null;
  booking_id?: string | null;
  user_id: string;

  // Customer snapshot
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_address?: string | null;

  // Company snapshot
  company_id?: string | null;
  company_name: string;
  company_address?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_vat_number?: string | null;
  company_registration_number?: string | null;

  // Financial (negative amounts for credits)
  subtotal_cents: number;
  tax_cents: number;
  tax_rate: number;
  total_cents: number;
  currency: string;

  // Original payment
  original_payment_method?: string | null;
  original_payment_reference?: string | null;
  original_payment_date?: string | null;

  // Refund details
  refund_method?: string | null;
  refund_reference?: string | null;
  refund_processed_at?: string | null;

  // Line items
  line_items: CreditMemoLineItem[];

  // Status
  status: 'draft' | 'issued' | 'void';

  // PDF
  pdf_url?: string | null;
  pdf_generated_at?: string | null;

  // Metadata
  notes?: string | null;
  reason?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  issued_by?: string | null;
  issued_at?: string | null;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface GenerateCreditMemoDTO {
  refund_request_id: string;
}

export interface VoidCreditMemoDTO {
  reason?: string;
}

// ============================================================================
// List Parameters & Response
// ============================================================================

export interface CreditMemoListParams {
  status?: 'draft' | 'issued' | 'void';
  property_id?: string;
  user_id?: string;
  booking_id?: string;
  invoice_id?: string;
  refund_request_id?: string;
  from_date?: string;
  to_date?: string;
  min_amount_cents?: number;
  max_amount_cents?: number;
  search?: string;
  sortBy?: 'created_at' | 'credit_memo_number' | 'total_cents';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreditMemoListResponse {
  credit_memos: CreditMemo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Download URL Response
// ============================================================================

export interface CreditMemoDownloadURLResponse {
  credit_memo_id: string;
  download_url: string;
  expires_at: string;
}
