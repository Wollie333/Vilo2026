/**
 * Quote Request Types (Frontend)
 *
 * Type definitions for the quote request system frontend
 */

// ============================================================================
// Enums
// ============================================================================

export type QuoteRequestStatus =
  | 'pending'      // Just submitted, awaiting owner review
  | 'responded'    // Owner has responded
  | 'converted'    // Converted to booking
  | 'declined'     // Owner declined
  | 'expired';     // Auto-expired

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
// Main Interfaces
// ============================================================================

/**
 * Quote Request
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
  preferred_check_in: string | null;
  preferred_check_out: string | null;
  flexible_date_start: string | null;
  flexible_date_end: string | null;
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
  responded_at: string | null;
  responded_by: string | null;

  // Expiration
  expires_at: string | null;

  // Metadata
  source: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Quote Request with related details
 */
export interface QuoteRequestWithDetails extends QuoteRequest {
  property: {
    id: string;
    name: string;
    slug: string;
    featured_image_url: string | null;
    address_city: string | null;
    address_state: string | null;
    address_country: string | null;
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
// Input Types (for API calls)
// ============================================================================

/**
 * Create quote request input
 */
export interface CreateQuoteRequestInput {
  property_id: string;

  // Guest info
  guest_name: string;
  guest_email: string;
  guest_phone?: string;

  // Date requirements
  date_flexibility: QuoteDateFlexibility;
  preferred_check_in?: string;
  preferred_check_out?: string;
  flexible_date_start?: string;
  flexible_date_end?: string;
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
}

/**
 * Respond to quote input
 */
export interface RespondToQuoteInput {
  response_message: string;
  suggested_dates?: {
    check_in: string;
    check_out: string;
  };
  estimated_price?: {
    amount: number;
    currency: string;
  };
}

/**
 * Update quote status input
 */
export interface UpdateQuoteStatusInput {
  status?: QuoteRequestStatus;
  priority?: number;
  owner_response?: string;
  expires_at?: string;
}

// ============================================================================
// Response Types
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
 * Statistics
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
// UI State Types
// ============================================================================

/**
 * Form state for quote request wizard
 */
export interface QuoteRequestFormState {
  // Step 1: Guest Info
  guest_name: string;
  guest_email: string;
  guest_phone: string;

  // Step 2: Date Requirements
  date_flexibility: QuoteDateFlexibility;
  preferred_check_in: string;
  preferred_check_out: string;
  flexible_date_start: string;
  flexible_date_end: string;
  nights_count: number;

  // Step 3: Guest Requirements
  adults_count: number;
  children_count: number;
  group_type: QuoteGroupType;
  budget_min: string;
  budget_max: string;
  event_type: string;
  event_description: string;
  special_requirements: string;
}

/**
 * Form errors
 */
export interface QuoteRequestFormErrors {
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  date_flexibility?: string;
  preferred_check_in?: string;
  preferred_check_out?: string;
  flexible_date_start?: string;
  flexible_date_end?: string;
  nights_count?: string;
  adults_count?: string;
  children_count?: string;
  group_type?: string;
  budget_min?: string;
  budget_max?: string;
  event_type?: string;
  event_description?: string;
  special_requirements?: string;
}

// ============================================================================
// Constants/Options
// ============================================================================

/**
 * Date flexibility options for dropdown
 */
export const DATE_FLEXIBILITY_OPTIONS = [
  { value: 'exact' as QuoteDateFlexibility, label: 'Exact Dates', description: 'I have specific dates in mind' },
  { value: 'flexible' as QuoteDateFlexibility, label: 'Flexible', description: 'I have a date range' },
  { value: 'very_flexible' as QuoteDateFlexibility, label: 'Very Flexible', description: 'I\'m open to suggestions' },
] as const;

/**
 * Group type options for dropdown
 */
export const GROUP_TYPE_OPTIONS = [
  { value: 'family' as QuoteGroupType, label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'friends' as QuoteGroupType, label: 'Friends', icon: '👥' },
  { value: 'business' as QuoteGroupType, label: 'Business', icon: '💼' },
  { value: 'wedding' as QuoteGroupType, label: 'Wedding', icon: '💍' },
  { value: 'corporate_event' as QuoteGroupType, label: 'Corporate Event', icon: '🏢' },
  { value: 'retreat' as QuoteGroupType, label: 'Retreat', icon: '🧘' },
  { value: 'conference' as QuoteGroupType, label: 'Conference', icon: '📊' },
  { value: 'celebration' as QuoteGroupType, label: 'Celebration', icon: '🎉' },
  { value: 'other' as QuoteGroupType, label: 'Other', icon: '📝' },
] as const;

/**
 * Status badge colors
 */
export const STATUS_BADGE_COLORS: Record<QuoteRequestStatus, {
  bg: string;
  text: string;
  label: string;
}> = {
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-200',
    label: 'Pending',
  },
  responded: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-200',
    label: 'Responded',
  },
  converted: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-200',
    label: 'Converted',
  },
  declined: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-200',
    label: 'Declined',
  },
  expired: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-800 dark:text-gray-300',
    label: 'Expired',
  },
};

/**
 * Group type labels
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
 * Date flexibility labels
 */
export const DATE_FLEXIBILITY_LABELS: Record<QuoteDateFlexibility, string> = {
  exact: 'Exact Dates',
  flexible: 'Flexible',
  very_flexible: 'Very Flexible',
};
