// ============================================================================
// Refund Types
// ============================================================================

import type { PaymentMethod, RefundStatus, Booking } from './booking.types';

// Re-export for convenience
export type { RefundStatus } from './booking.types';

// ============================================================================
// Refund Breakdown
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
// Refund Request
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
  requested_by: string | null;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  gateway_refund_id: string | null;
  refund_breakdown?: RefundBreakdownItem[];
  suggested_amount?: number | null;
  cancellation_policy?: string | null;
  calculated_policy_amount?: number | null;
  credit_memo_id?: string | null;
  auto_process_failed?: boolean;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;

  // New fields from migration 045 - Comment system
  updated_by?: string | null;
  last_comment_at?: string | null;
  comment_count?: number;
  admin_attention_required?: boolean;

  // New field from migration 046 - Document system
  document_count?: number;
}

export interface RefundRequestWithDetails extends RefundRequest {
  booking?: Booking;
  credit_memo?: any; // Will be defined when we create credit-memo.types.ts
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

  // New populated relations from migration 045
  comments?: RefundComment[];
  status_history?: RefundStatusHistory[];
  latest_comment?: RefundComment;

  // New populated relations from migration 046
  documents?: RefundDocument[];
}

// ============================================================================
// Refund Calculation
// ============================================================================

export interface RefundCalculation {
  suggested_amount: number;
  policy: string;
  policy_amount: number;
  days_until_checkin: number;
  is_policy_eligible: boolean;
  breakdown?: {
    total_paid: number;
    total_refunded: number;
    available_for_refund: number;
  };
}

// ============================================================================
// Refund Status Response
// ============================================================================

export interface RefundStatusResponse {
  has_active_request: boolean;
  active_request?: RefundRequest;
  all_requests: RefundRequest[];
  total_refunded: number;
  available_for_refund: number;
  can_request_refund: boolean;
  reason?: string;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateRefundRequestDTO {
  requested_amount: number;
  reason: string;
}

export interface ApproveRefundDTO {
  approved_amount?: number;
  internal_notes?: string; // Admin-only notes (creates internal comment)
  customer_notes?: string; // Customer-facing notes (creates public comment)
  change_reason?: string;  // Reason for status change (added to status history)
}

export interface RejectRefundDTO {
  customer_notes: string; // Customer-facing reason for rejection (REQUIRED)
  internal_notes?: string; // Admin-only notes (optional)
  change_reason?: string;  // Reason for status change (added to status history)
}

export interface MarkManualRefundCompleteDTO {
  refund_reference: string;
  notes?: string;
}

// ============================================================================
// List Parameters & Response
// ============================================================================

export interface RefundListParams {
  status?: RefundStatus | RefundStatus[];
  property_id?: string;
  booking_id?: string;
  from_date?: string;
  to_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  sortBy?: 'created_at' | 'requested_amount' | 'approved_amount';
  sortOrder?: 'asc' | 'desc';
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
// Process Refund Result
// ============================================================================

export interface ProcessRefundResult {
  success: boolean;
  message?: string;
  refund_request?: RefundRequest;
  breakdown_results?: Array<{
    payment_id: string;
    method: PaymentMethod;
    success: boolean;
    gateway_refund_id?: string;
    error?: string;
  }>;
}

// ============================================================================
// Comment System (Migration 045)
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

export interface RefundStatusHistory {
  id: string;
  refund_request_id: string;
  from_status: RefundStatus | null; // null for initial creation
  to_status: RefundStatus;
  changed_by: string;
  changed_at: string;
  change_reason?: string | null; // Optional explanation for the status change
  metadata?: Record<string, any> | null; // Flexible field for additional context

  // Populated fields (from joins)
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
}

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
// Document System (Migration 046)
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
