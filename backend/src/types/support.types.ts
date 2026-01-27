/**
 * Support Ticket System Types
 * Types for support tickets, canned responses, and internal notes
 */

// ============================================================================
// ENUM TYPES
// ============================================================================

export type TicketStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketCategory = 'billing' | 'technical' | 'general' | 'feature_request';

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

export interface SupportTicketRow {
  id: string;
  conversation_id: string;
  ticket_number: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory | null;
  requester_id: string | null;
  assigned_to: string | null;
  assigned_at: Date | null;
  property_id: string | null;
  company_id: string | null;
  first_response_at: Date | null;
  resolved_at: Date | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  sla_due_at: Date | null;
  sla_breached: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SupportCannedResponseRow {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  usage_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SupportInternalNoteRow {
  id: string;
  ticket_id: string;
  author_id: string | null;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export interface SupportTicketWithRelations extends SupportTicketRow {
  requester?: {
    id: string;
    email: string;
    full_name: string;
  };
  assigned_agent?: {
    id: string;
    email: string;
    full_name: string;
  };
  property?: {
    id: string;
    name: string;
  };
  company?: {
    id: string;
    name: string;
  };
  conversation?: {
    id: string;
    message_count?: number;
    last_message_at?: Date;
  };
}

export interface SupportTicketWithContext extends SupportTicketWithRelations {
  customer_context?: {
    company?: {
      id: string;
      name: string;
      subscription_plan?: string;
      created_at: Date;
    };
    properties?: Array<{
      id: string;
      name: string;
      property_type: string;
    }>;
    recent_bookings?: Array<{
      id: string;
      booking_reference: string;
      check_in_date: Date;
      check_out_date: Date;
      total_amount: number;
      booking_status: string;
    }>;
    payment_summary?: {
      total_revenue: number;
      outstanding_balance: number;
      last_payment_date: Date | null;
    };
  };
  internal_notes?: SupportInternalNoteRow[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateTicketInput {
  subject: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  property_id?: string;
  initial_message: string; // First message content
}

export interface UpdateTicketInput {
  subject?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  resolution_notes?: string;
}

export interface AssignTicketInput {
  assigned_to: string; // Agent user ID
}

export interface ResolveTicketInput {
  resolution_notes: string;
}

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
  sortBy?: 'created_at' | 'updated_at' | 'sla_due_at' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface TicketListResponse {
  tickets: SupportTicketWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export interface CannedResponseListParams {
  category?: string;
  is_active?: boolean;
  search?: string;
}

export interface CreateInternalNoteInput {
  content: string;
}

// ============================================================================
// SLA CONFIGURATION
// ============================================================================

export interface SLAConfig {
  urgent: number; // hours
  high: number;
  normal: number;
  low: number;
}

export const DEFAULT_SLA_CONFIG: SLAConfig = {
  urgent: 4,
  high: 8,
  normal: 24,
  low: 48,
};

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface TicketStats {
  total: number;
  open: number;
  assigned: number;
  in_progress: number;
  waiting_on_customer: number;
  resolved: number;
  closed: number;
  sla_breached: number;
  avg_resolution_time_hours: number;
  avg_first_response_time_hours: number;
}

export interface AgentStats {
  agent_id: string;
  agent_name: string;
  assigned_tickets: number;
  resolved_tickets: number;
  avg_resolution_time_hours: number;
  sla_breach_count: number;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type SupportTicket = SupportTicketRow;
export type SupportCannedResponse = SupportCannedResponseRow;
export type SupportInternalNote = SupportInternalNoteRow;
