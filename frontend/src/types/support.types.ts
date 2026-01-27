/**
 * Support Types
 * Type definitions for support ticket system
 */

// ============================================================================
// ENUMS
// ============================================================================

export type TicketStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketCategory =
  | 'billing'
  | 'technical'
  | 'general'
  | 'feature_request'
  | 'bug_report';

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface SupportTicket {
  id: string;
  conversation_id: string;
  ticket_number: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory | null;

  // Parties
  requester_id: string;
  assigned_to: string | null;
  assigned_at: string | null;

  // Customer Context
  property_id: string | null;
  company_id: string | null;

  // Resolution Tracking
  first_response_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;

  // SLA Tracking
  sla_due_at: string | null;
  sla_breached: boolean;

  created_at: string;
  updated_at: string;

  // Relations
  requester?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  assigned_agent?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

export interface SupportCannedResponse {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  usage_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportInternalNote {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

// ============================================================================
// CUSTOMER CONTEXT
// ============================================================================

export interface CustomerContext {
  company?: {
    id: string;
    name: string;
    display_name: string | null;
    created_at: string;
  };
  properties: Array<{
    id: string;
    name: string;
    property_type: string;
    is_active: boolean;
  }>;
  recent_bookings: Array<{
    id: string;
    booking_reference: string;
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    booking_status: string;
    property_name: string;
  }>;
  payment_summary: {
    total_bookings: number;
    total_revenue: number;
    outstanding_balance: number;
    last_payment_date: string | null;
  };
}

export interface SupportTicketWithContext extends SupportTicket {
  customer_context: CustomerContext | null;
  internal_notes: SupportInternalNote[];
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateTicketInput {
  subject: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  initial_message: string;
  property_id?: string;
}

export interface UpdateTicketInput {
  subject?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  status?: TicketStatus;
}

export interface AssignTicketInput {
  agent_id: string | null;
}

export interface ResolveTicketInput {
  resolution_notes: string;
}

export interface AddInternalNoteInput {
  content: string;
}

export interface CreateCannedResponseInput {
  title: string;
  content: string;
  category?: string;
  shortcut?: string;
}

export interface UpdateCannedResponseInput {
  title?: string;
  content?: string;
  category?: string;
  shortcut?: string;
  is_active?: boolean;
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

export interface TicketListParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  requester_id?: string;
  company_id?: string;
  sla_breached?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'priority' | 'sla_due_at';
  sortOrder?: 'asc' | 'desc';
}

export interface CannedResponseListParams {
  category?: string;
  is_active?: boolean;
  search?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface TicketListResponse {
  tickets: SupportTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TicketStatsResponse {
  total_tickets: number;
  open_tickets: number;
  assigned_tickets: number;
  resolved_tickets: number;
  breached_sla: number;
  avg_resolution_time_hours: number;
  avg_first_response_time_hours: number;
  by_priority: Record<TicketPriority, number>;
  by_category: Record<string, number>;
}
