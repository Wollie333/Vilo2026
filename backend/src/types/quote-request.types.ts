/**
 * Quote Request Types
 *
 * Type definitions for the quote request system that allows guests
 * to request custom quotes from property owners for special events,
 * long stays, or unique requirements.
 */

// ============================================================================
// Enums
// ============================================================================

export type QuoteRequestStatus =
  | 'pending'      // Just submitted, awaiting owner review
  | 'responded'    // Owner has responded (via chat or direct response)
  | 'converted'    // Converted to booking
  | 'declined'     // Owner declined the quote
  | 'expired';     // Auto-expired after X days

export type QuoteDateFlexibility =
  | 'exact'          // Specific dates required
  | 'flexible'       // Flexible within a range
  | 'very_flexible'; // Very flexible, open to suggestions

export type QuoteGroupType =
  | 'family'
  | 'friends'
  | 'business'
  | 'wedding'
  | 'corporate_event'
  | 'retreat'
  | 'conference'
  | 'celebration'
  | 'other';

// ============================================================================
// Database Model
// ============================================================================

/**
 * Quote Request (database row)
 */
export interface QuoteRequest {
  id: string;

  // Associations
  property_id: string;
  company_id: string;
  customer_id: string;
  user_id: string | null;
  conversation_id: string | null;
  booking_id: string | null;

  // Contact Information
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;

  // Date Requirements
  date_flexibility: QuoteDateFlexibility;
  preferred_check_in: string | null;       // ISO date string
  preferred_check_out: string | null;      // ISO date string
  flexible_date_start: string | null;      // ISO date string
  flexible_date_end: string | null;        // ISO date string
  nights_count: number | null;

  // Guest Requirements
  adults_count: number;
  children_count: number;
  group_size: number;
  group_type: QuoteGroupType;

  // Budget & Preferences
  budget_min: number | null;
  budget_max: number | null;
  currency: string;

  // Special Requirements
  special_requirements: string | null;
  event_type: string | null;
  event_description: string | null;
  preferred_room_types: string[];

  // Status Management
  status: QuoteRequestStatus;
  priority: number;

  // Response Tracking
  owner_response: string | null;
  responded_at: string | null;            // ISO timestamp
  responded_by: string | null;

  // Expiration
  expires_at: string | null;              // ISO timestamp

  // Metadata
  source: string;
  user_agent: string | null;
  referrer_url: string | null;

  // Timestamps
  created_at: string;                     // ISO timestamp
  updated_at: string;                     // ISO timestamp
}

/**
 * Quote Request with related entity details
 * Used for list and detail views
 */
export interface QuoteRequestWithDetails extends QuoteRequest {
  property: {
    id: string;
    name: string;
    slug: string;
    featured_image_url: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
  };
  customer: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    status: string;
  };
  conversation: {
    id: string;
    unread_count: number;
  } | null;
}

// ============================================================================
// Input Types (for API requests)
// ============================================================================

/**
 * Input for creating a new quote request (guest submission)
 */
export interface CreateQuoteRequestInput {
  property_id: string;

  // Guest info
  guest_name: string;
  guest_email: string;
  guest_phone?: string;

  // Date requirements
  date_flexibility: QuoteDateFlexibility;
  preferred_check_in?: string;            // ISO date string
  preferred_check_out?: string;           // ISO date string
  flexible_date_start?: string;           // ISO date string
  flexible_date_end?: string;             // ISO date string
  nights_count?: number;

  // Guest requirements
  adults_count: number;
  children_count?: number;
  group_type: QuoteGroupType;

  // Budget
  budget_min?: number;
  budget_max?: number;

  // Special requirements
  special_requirements?: string;
  event_type?: string;
  event_description?: string;
  preferred_room_types?: string[];

  // Metadata
  source?: string;
  user_agent?: string;
  referrer_url?: string;
}

/**
 * Input for updating a quote request (property owner)
 */
export interface UpdateQuoteRequestInput {
  status?: QuoteRequestStatus;
  priority?: number;
  owner_response?: string;
  expires_at?: string;                   // ISO timestamp
}

/**
 * Input for responding to a quote request (property owner)
 */
export interface RespondToQuoteRequest {
  response_message: string;
  suggested_dates?: {
    check_in: string;                    // ISO date string
    check_out: string;                   // ISO date string
  };
  estimated_price?: {
    amount: number;
    currency: string;
  };
}

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Parameters for listing quote requests
 */
export interface QuoteRequestListParams {
  property_id?: string;
  company_id?: string;
  status?: QuoteRequestStatus;
  group_type?: QuoteGroupType;
  search?: string;                       // Search in guest name/email
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'group_size' | 'budget_max' | 'expires_at';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Response Types (for API responses)
// ============================================================================

/**
 * Paginated list response
 */
export interface QuoteRequestListResponse {
  quote_requests: QuoteRequestWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    pending: number;
    responded: number;
    converted: number;
    conversion_rate: number;
  };
}

/**
 * Quote request statistics
 */
export interface QuoteRequestStats {
  total: number;
  by_status: Record<QuoteRequestStatus, number>;
  by_group_type: Record<QuoteGroupType, number>;
  average_group_size: number;
  average_budget: number;
  conversion_rate: number;
  average_response_time_hours: number;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Date info for display/notifications
 */
export interface QuoteDateInfo {
  flexibility: QuoteDateFlexibility;
  displayText: string;
  checkIn?: string;
  checkOut?: string;
  rangeStart?: string;
  rangeEnd?: string;
  nights?: number;
}

/**
 * Priority calculation factors
 */
export interface QuotePriorityFactors {
  hasHighBudget: boolean;     // budget_max >= threshold
  isLargeGroup: boolean;      // group_size >= threshold
  isSpecialEvent: boolean;    // wedding, corporate_event, conference
  priorityScore: number;      // 0-3
}

/**
 * Quote request status badge props
 */
export interface QuoteStatusBadge {
  status: QuoteRequestStatus;
  label: string;
  variant: 'default' | 'success' | 'warning' | 'error' | 'info';
  color: string;
}

/**
 * Group type display info
 */
export interface GroupTypeInfo {
  type: QuoteGroupType;
  label: string;
  icon: string;
  description: string;
}

// ============================================================================
// Constants/Mappings
// ============================================================================

/**
 * Status labels for display
 */
export const QUOTE_STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  pending: 'Pending Review',
  responded: 'Responded',
  converted: 'Converted to Booking',
  declined: 'Declined',
  expired: 'Expired',
};

/**
 * Group type labels for display
 */
export const GROUP_TYPE_LABELS: Record<QuoteGroupType, string> = {
  family: 'Family',
  friends: 'Friends',
  business: 'Business',
  wedding: 'Wedding',
  corporate_event: 'Corporate Event',
  retreat: 'Retreat',
  conference: 'Conference',
  celebration: 'Celebration',
  other: 'Other',
};

/**
 * Date flexibility labels for display
 */
export const DATE_FLEXIBILITY_LABELS: Record<QuoteDateFlexibility, string> = {
  exact: 'Exact Dates',
  flexible: 'Flexible',
  very_flexible: 'Very Flexible',
};

/**
 * Status color/variant mappings for UI
 */
export const QUOTE_STATUS_VARIANTS: Record<QuoteRequestStatus, QuoteStatusBadge> = {
  pending: {
    status: 'pending',
    label: 'Pending',
    variant: 'warning',
    color: 'orange',
  },
  responded: {
    status: 'responded',
    label: 'Responded',
    variant: 'info',
    color: 'blue',
  },
  converted: {
    status: 'converted',
    label: 'Converted',
    variant: 'success',
    color: 'green',
  },
  declined: {
    status: 'declined',
    label: 'Declined',
    variant: 'error',
    color: 'red',
  },
  expired: {
    status: 'expired',
    label: 'Expired',
    variant: 'default',
    color: 'gray',
  },
};
