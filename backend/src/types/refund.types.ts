// ============================================================================
// Refund Types
// Comprehensive types for refund management system
// ============================================================================

import type { PaymentMethod, RefundStatus } from './booking.types';
import type { CreditMemo } from './credit-memo.types';

// ============================================================================
// Refund Breakdown Item
// Tracks individual refund transactions per payment method
// ============================================================================

export interface RefundBreakdownItem {
  payment_id: string;
  method: PaymentMethod;
  amount: number;
  gateway_refund_id?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'manual_pending';
  processed_at?: string | null;
  error_message?: string | null;
}

// ============================================================================
// Enhanced Refund Request
// Extends base RefundRequest from booking.types.ts with new fields
// ============================================================================

export interface RefundRequest {
  id: string;
  booking_id: string;
  requested_amount: number;
  approved_amount: number | null;
  refunded_amount: number;
  currency: string;
  status: RefundStatus;
  reason: string;

  // New fields from migration 044
  refund_breakdown?: RefundBreakdownItem[];
  suggested_amount?: number | null;
  cancellation_policy?: string | null;
  calculated_policy_amount?: number | null;
  credit_memo_id?: string | null;
  auto_process_failed?: boolean;
  failure_reason?: string | null;

  // User references
  requested_by: string | null;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;

  // Gateway reference (legacy - now in refund_breakdown)
  gateway_refund_id: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // New fields from migration 045 - Comment system
  updated_by?: string | null;
  last_comment_at?: string | null;
  comment_count?: number;
  admin_attention_required?: boolean;

  // New field from migration 046 - Document upload system
  document_count?: number;
}

// ============================================================================
// Refund Request with Details
// Includes joined data for display purposes
// ============================================================================

export interface RefundRequestWithDetails extends RefundRequest {
  booking?: {
    id: string;
    booking_reference: string;
    property_id: string;
    property_name?: string;
    guest_name: string;
    guest_email: string;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    amount_paid: number;
    total_refunded: number;
    payment_status: string;
    booking_status: string;
  };
  credit_memo?: CreditMemo;
  requested_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  reviewed_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  processed_by_user?: {
    id: string;
    name: string;
    email: string;
  };

  // New populated relations from migration 045
  comments?: RefundComment[];
  status_history?: RefundStatusHistory[];
  latest_comment?: RefundComment;

  // New populated relations from migration 046
  documents?: RefundDocument[];
}

// ============================================================================
// Refund Calculation Result
// Result from calculate_refund_amount() database function
// ============================================================================

export interface RefundCalculation {
  suggested_amount: number;
  policy: string; // 'flexible' | 'moderate' | 'strict' | 'non_refundable'
  policy_amount: number;
  days_until_checkin: number;
  is_policy_eligible: boolean;
}

// ============================================================================
// DTOs - Create Refund Request
// ============================================================================

export interface CreateRefundRequestDTO {
  requested_amount: number;
  reason: string;
}

export interface CreateRefundRequestRequest {
  requested_amount: number;
  reason: string;
}

// ============================================================================
// DTOs - Review Refund (Approve/Reject)
// ============================================================================

export interface ApproveRefundDTO {
  approved_amount?: number; // Optional override, defaults to requested_amount
  internal_notes?: string; // Admin-only notes (creates internal comment)
  customer_notes?: string; // Customer-facing notes (creates public comment)
  change_reason?: string; // Reason for status change (added to status history)
}

export interface RejectRefundDTO {
  customer_notes: string; // Customer-facing reason for rejection (REQUIRED)
  internal_notes?: string; // Admin-only notes (optional)
  change_reason?: string; // Reason for status change (added to status history)
}

export interface ReviewRefundRequest {
  status: 'approved' | 'rejected';
  approved_amount?: number;
  review_notes?: string;
}

// ============================================================================
// DTOs - Process Refund
// ============================================================================

export interface ProcessRefundRequest {
  manual_details?: {
    refund_reference?: string;
    notes?: string;
  };
}

export interface ProcessRefundResult {
  success: boolean;
  refund_request_id: string;
  status: RefundStatus;
  refund_breakdown: RefundBreakdownItem[];
  credit_memo_id?: string;
  errors?: Array<{
    payment_id: string;
    error: string;
  }>;
  message?: string;
}

// ============================================================================
// DTOs - Manual Refund Completion
// ============================================================================

export interface MarkManualRefundCompleteDTO {
  refund_reference: string;
  notes?: string;
}

export interface ManualRefundCompleteRequest {
  payment_id: string; // Which payment in refund_breakdown to mark complete
  refund_reference: string;
  notes?: string;
}

// ============================================================================
// DTOs - Retry Failed Refund
// ============================================================================

export interface RetryFailedRefundRequest {
  payment_ids?: string[]; // Optional: specific payments to retry, or all if omitted
}

export interface RetryFailedRefundResult {
  success: boolean;
  retried_count: number;
  succeeded_count: number;
  failed_count: number;
  refund_breakdown: RefundBreakdownItem[];
}

// ============================================================================
// List Parameters & Response
// ============================================================================

export interface RefundListParams {
  // Filters
  status?: RefundStatus | RefundStatus[];
  property_id?: string;
  booking_id?: string;
  requested_by?: string;
  reviewed_by?: string;

  // Date ranges
  from_date?: string; // requested_at >= from_date
  to_date?: string; // requested_at <= to_date

  // Amount ranges
  min_amount?: number;
  max_amount?: number;

  // Search
  search?: string; // Search by booking reference, guest name, guest email

  // Sorting
  sortBy?: 'created_at' | 'requested_at' | 'requested_amount' | 'approved_amount' | 'refunded_amount';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
}

export interface RefundListResponse {
  refunds: RefundRequestWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Refund Status Summary
// Summary of refunds for a booking
// ============================================================================

export interface RefundStatusSummary {
  booking_id: string;
  total_paid: number;
  total_refunded: number;
  available_for_refund: number;
  refund_status: 'none' | 'partial' | 'full';
  active_refund_requests: number;
  pending_refund_requests: RefundRequest[];
  completed_refund_requests: RefundRequest[];
}

// ============================================================================
// Gateway Refund Responses
// API responses from payment gateways
// ============================================================================

export interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    refund_reference: string;
    transaction_reference: string;
    amount: number;
    currency: string;
    status: string; // 'pending' | 'processing' | 'processed'
    refunded_by?: string;
    refunded_at?: string;
    created_at: string;
  };
}

export interface PayPalRefundResponse {
  id: string; // Refund ID
  status: 'CANCELLED' | 'PENDING' | 'COMPLETED';
  amount: {
    currency_code: string;
    value: string;
  };
  note_to_payer?: string;
  seller_payable_breakdown?: {
    gross_amount: {
      currency_code: string;
      value: string;
    };
    paypal_fee: {
      currency_code: string;
      value: string;
    };
    net_amount: {
      currency_code: string;
      value: string;
    };
  };
  invoice_id?: string;
  create_time: string;
  update_time: string;
}

export interface GatewayRefundError {
  code: string;
  message: string;
  details?: any;
}

// ============================================================================
// Refund Eligibility Check
// ============================================================================

export interface RefundEligibilityResult {
  eligible: boolean;
  reason?: string;
  available_for_refund?: number;
  existing_active_requests?: RefundRequest[];
}

// ============================================================================
// Refund Comment System (Migration 045)
// Two-way commenting between users and admins
// ============================================================================

export interface RefundComment {
  id: string;
  refund_request_id: string;
  user_id: string;
  comment_text: string; // 1-2000 characters enforced by CHECK constraint
  is_internal: boolean; // true = admin-only, false = visible to guest
  created_at: string;
  updated_at: string;

  // Future chat integration (nullable for now)
  chat_message_id?: string | null;

  // Populated fields (from joins)
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    user_type: string;
    profile_picture_url?: string | null;
  };
}

export interface CreateRefundCommentRequest {
  comment_text: string; // 1-2000 characters
  is_internal?: boolean; // Defaults to false for guests, can be true for admins
}

// ============================================================================
// Refund Status History (Migration 045)
// Complete audit trail of all refund status changes
// ============================================================================

export interface RefundStatusHistory {
  id: string;
  refund_request_id: string;
  from_status: RefundStatus | null; // null for initial creation
  to_status: RefundStatus;
  changed_by: string;
  changed_at: string;
  change_reason?: string | null; // Optional note about why status changed
  metadata?: Record<string, any> | null; // Flexible field for additional context

  // Populated fields (from joins)
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
}

// ============================================================================
// Refund Activity Feed (Migration 045)
// Unified timeline of status changes and comments
// ============================================================================

export interface RefundActivity {
  refund_request_id: string;
  activity_type: 'status_change' | 'comment';
  activity_at: string;
  actor_name: string; // User who performed the action
  actor_role: string; // User type (admin, guest, etc.)
  activity_description: string; // Status change "requested → approved" or comment text
  additional_info?: string | null; // Change reason for status changes
  is_internal: boolean; // For filtering internal activities from guests
}

// ============================================================================
// Refund Document System (Migration 046)
// Supporting documents uploaded by guests for refund requests
// ============================================================================

export type RefundDocumentType = 'receipt' | 'proof_of_cancellation' | 'bank_statement' | 'other';

export interface RefundDocument {
  id: string;
  refund_request_id: string;
  uploaded_by: string;
  file_name: string;
  file_size: number; // In bytes, max 10MB (10485760)
  file_type: string; // MIME type: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/jpg'
  storage_path: string; // Path in Supabase Storage
  document_type: RefundDocumentType;
  description?: string | null;
  uploaded_at: string;
  is_verified: boolean; // Admin can mark documents as verified
  verified_by?: string | null;
  verified_at?: string | null;

  // Populated fields (from joins)
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
}

export interface UploadRefundDocumentDTO {
  document_type: RefundDocumentType;
  description?: string;
}

export interface VerifyDocumentDTO {
  is_verified: boolean;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  PaymentMethod,
  RefundStatus,
} from './booking.types';
