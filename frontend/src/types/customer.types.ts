/**
 * Customer Types (Frontend)
 *
 * Type definitions for Customer CRM feature.
 * These match the backend API responses.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type CustomerSource =
  | 'booking'
  | 'chat'
  | 'website_inquiry'
  | 'manual'
  | 'import'
  | 'referral';

export type CustomerStatus =
  | 'lead'
  | 'active'
  | 'past_guest'
  | 'inactive'
  | 'blocked';

export type CustomerStatusMode = 'auto' | 'manual';

// ============================================================================
// MAIN CUSTOMER INTERFACE
// ============================================================================

export interface Customer {
  id: string;

  // Property association (CRITICAL: property-scoped)
  property_id: string;

  // Company association (derived from property)
  company_id: string;

  // Contact information
  email: string;
  full_name: string | null;
  phone: string | null;

  // Origin tracking
  source: CustomerSource;
  first_booking_id: string | null;

  // Customer lifecycle
  status: CustomerStatus;
  status_mode: CustomerStatusMode;

  // Booking statistics
  total_bookings: number;
  total_spent: number;
  currency: string;
  first_booking_date: string | null;
  last_booking_date: string | null;
  last_booking_id: string | null;

  // Engagement
  last_contact_date: string | null;

  // CRM fields
  tags: string[];
  notes: string | null;
  internal_notes: string | null;

  // Preferences
  preferred_room_types: string[];
  special_requirements: string | null;
  marketing_consent: boolean;

  // User relationship
  user_id: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXTENDED INTERFACES
// ============================================================================

/**
 * Customer with company and property details (returned by list/get endpoints)
 */
export interface CustomerWithCompany extends Customer {
  company: {
    id: string;
    name: string;
  };
  property: {
    id: string;
    name: string;
  };
}

// ============================================================================
// REQUEST / RESPONSE TYPES
// ============================================================================

/**
 * Parameters for listing customers
 */
export interface CustomerListParams {
  company_id?: string;
  property_id?: string;
  status?: CustomerStatus;
  source?: CustomerSource;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'full_name' | 'email' | 'created_at' | 'total_bookings' | 'total_spent' | 'last_booking_date';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response from list customers endpoint
 */
export interface CustomerListResponse {
  customers: CustomerWithCompany[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Input for creating a new customer
 */
export interface CreateCustomerInput {
  email: string;
  full_name?: string;
  phone?: string;
  property_id: string;      // REQUIRED: Customer is property-scoped
  company_id: string;        // Derived from property
  source: CustomerSource;
  status?: CustomerStatus;
  user_id?: string;
  notes?: string;
  tags?: string[];
  marketing_consent?: boolean;
}

/**
 * Input for updating a customer
 */
export interface UpdateCustomerInput {
  full_name?: string;
  phone?: string;
  status?: CustomerStatus;
  status_mode?: CustomerStatusMode;
  notes?: string;
  tags?: string[];
  internal_notes?: string;
  marketing_consent?: boolean;
  preferred_room_types?: string[];
  special_requirements?: string;
  last_contact_date?: string;
}

// ============================================================================
// UI HELPER TYPES
// ============================================================================

/**
 * Customer status badge colors
 */
export const CUSTOMER_STATUS_COLORS: Record<CustomerStatus, string> = {
  lead: 'gray',
  active: 'green',
  past_guest: 'blue',
  inactive: 'yellow',
  blocked: 'red',
};

/**
 * Customer status display labels
 */
export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  lead: 'Lead',
  active: 'Active',
  past_guest: 'Past Guest',
  inactive: 'Inactive',
  blocked: 'Blocked',
};

/**
 * Customer source display labels
 */
export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  booking: 'Booking',
  chat: 'Chat',
  website_inquiry: 'Website Inquiry',
  manual: 'Manual',
  import: 'Import',
  referral: 'Referral',
};

/**
 * Customer source badge colors
 */
export const CUSTOMER_SOURCE_COLORS: Record<CustomerSource, string> = {
  booking: 'blue',
  chat: 'purple',
  website_inquiry: 'green',
  manual: 'gray',
  import: 'yellow',
  referral: 'pink',
};
