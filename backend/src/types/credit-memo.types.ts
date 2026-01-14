// ============================================================================
// Credit Memo Types
// Types for credit memo (credit note) generation and management
// ============================================================================

// ============================================================================
// Credit Memo Status
// ============================================================================

export type CreditMemoStatus = 'draft' | 'issued' | 'void';

// ============================================================================
// Credit Memo Line Item
// Represents a single line item on a credit memo
// ============================================================================

export interface CreditMemoLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number; // Stored as negative for credits
  total_cents: number; // Stored as negative for credits
}

// ============================================================================
// Credit Memo
// Main credit memo entity - represents a credit note for a refund
// ============================================================================

export interface CreditMemo {
  id: string;
  credit_memo_number: string; // Format: CM-YYYYMM-NNNN

  // References
  invoice_id?: string | null;
  refund_request_id?: string | null;
  booking_id?: string | null;
  user_id: string;

  // Customer information (snapshot at time of credit memo generation)
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_address?: string | null;

  // Company information (snapshot)
  company_id?: string | null;
  company_name: string;
  company_address?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_vat_number?: string | null;
  company_registration_number?: string | null;

  // Financial details (all amounts stored as negative in cents)
  subtotal_cents: number; // Negative value
  tax_cents: number; // Negative value
  tax_rate: number;
  total_cents: number; // Negative value (credit amount)
  currency: string;

  // Original payment information
  original_payment_method?: string | null;
  original_payment_reference?: string | null;
  original_payment_date?: string | null;

  // Refund details
  refund_method?: string | null; // 'original_payment_method', 'bank_transfer', 'manual'
  refund_reference?: string | null;
  refund_processed_at?: string | null;

  // Line items
  line_items: CreditMemoLineItem[];

  // Status
  status: CreditMemoStatus;

  // PDF storage
  pdf_url?: string | null;
  pdf_generated_at?: string | null;

  // Metadata
  notes?: string | null;
  reason?: string | null; // Refund reason

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string | null;

  // Audit
  issued_by?: string | null;
  issued_at?: string | null;
}

// ============================================================================
// Credit Memo with Details
// Includes joined data for display purposes
// ============================================================================

export interface CreditMemoWithDetails extends CreditMemo {
  invoice?: {
    id: string;
    invoice_number: string;
    total_cents: number;
    status: string;
  };
  refund_request?: {
    id: string;
    requested_amount: number;
    approved_amount: number | null;
    refunded_amount: number;
    status: string;
  };
  booking?: {
    id: string;
    booking_reference: string;
    property_name?: string;
    guest_name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================================================
// DTOs - Generate Credit Memo
// ============================================================================

export interface GenerateCreditMemoDTO {
  refund_request_id: string;
}

export interface GenerateCreditMemoRequest {
  refund_request_id: string;
}

export interface GenerateCreditMemoResponse {
  credit_memo: CreditMemo;
  pdf_url?: string;
}

// ============================================================================
// DTOs - Regenerate PDF
// ============================================================================

export interface RegenerateCreditMemoPDFRequest {
  force?: boolean; // Force regeneration even if PDF already exists
}

export interface RegenerateCreditMemoPDFResponse {
  credit_memo_id: string;
  pdf_url: string;
  pdf_generated_at: string;
}

// ============================================================================
// DTOs - Void Credit Memo
// ============================================================================

export interface VoidCreditMemoRequest {
  reason?: string;
}

export interface VoidCreditMemoResponse {
  credit_memo: CreditMemo;
  voided_at: string;
  voided_by: string;
}

// ============================================================================
// List Parameters & Response
// ============================================================================

export interface CreditMemoListParams {
  // Filters
  status?: CreditMemoStatus | CreditMemoStatus[];
  property_id?: string;
  user_id?: string;
  booking_id?: string;
  invoice_id?: string;
  refund_request_id?: string;

  // Date ranges
  from_date?: string; // created_at >= from_date
  to_date?: string; // created_at <= to_date

  // Amount ranges (remember: credit memos have negative amounts)
  min_amount_cents?: number; // Absolute value comparison
  max_amount_cents?: number; // Absolute value comparison

  // Search
  search?: string; // Search by credit_memo_number, customer name, customer email

  // Sorting
  sortBy?: 'created_at' | 'credit_memo_number' | 'total_cents' | 'issued_at';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
}

export interface CreditMemoListResponse {
  credit_memos: CreditMemoWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Credit Memo Summary
// Summary statistics for credit memos
// ============================================================================

export interface CreditMemoSummary {
  total_count: number;
  total_credit_amount_cents: number; // Sum of all credit amounts (absolute value)
  currency: string;
  by_status: {
    draft: number;
    issued: number;
    void: number;
  };
  by_refund_method: {
    original_payment_method: number;
    bank_transfer: number;
    manual: number;
    [key: string]: number;
  };
}

// ============================================================================
// PDF Generation Options
// ============================================================================

export interface CreditMemoPDFOptions {
  include_logo?: boolean;
  include_footer?: boolean;
  include_page_numbers?: boolean;
  watermark?: string; // e.g., "CREDIT MEMO", "VOID"
}

// ============================================================================
// Credit Memo Number Format
// ============================================================================

export interface CreditMemoNumberFormat {
  prefix: string; // Default: 'CM'
  format: 'CM-YYYYMM-NNNN' | 'CM-YYYY-NNNN' | 'CM-NNNN';
  next_number: number;
}

// ============================================================================
// Download URL Response
// ============================================================================

export interface CreditMemoDownloadURLResponse {
  credit_memo_id: string;
  credit_memo_number: string;
  download_url: string; // Signed URL with expiry
  expires_at: string;
}
