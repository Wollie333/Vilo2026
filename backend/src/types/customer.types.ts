/**
 * Customer Types
 *
 * Type definitions for the Customer CRM feature.
 * Customers are scoped by property_id to support:
 * - One customer record per property (separate lifecycle tracking)
 * - Guest can be customer of multiple properties with one user account
 * - Per-property customer stats and management
 * - Property-level data isolation
 *
 * Note: company_id is kept for convenience (derived from property)
 */

// ============================================================================
// ENUMS
// ============================================================================

export type CustomerSource =
  | 'booking'           // Created from booking
  | 'chat'              // Created from chat interaction
  | 'website_inquiry'   // Created from website form
  | 'manual'            // Manually created by owner
  | 'import'            // Imported from external source
  | 'referral';         // Referred by another customer

export type CustomerStatus =
  | 'lead'              // Inquired but no booking yet
  | 'active'            // Has upcoming or current booking
  | 'past_guest'        // Has completed booking(s)
  | 'inactive'          // No activity in 12+ months
  | 'blocked';          // Blocked by property owner

export type CustomerStatusMode = 'auto' | 'manual';

// ============================================================================
// MAIN CUSTOMER INTERFACE
// ============================================================================

export interface Customer {
  id: string;

  // Property association (CRITICAL: property-scoped)
  property_id: string;

  // Company association (kept for convenience, derived from property)
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
 * Customer with company and property details
 * Used when fetching customer data for display
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
  property_id?: string;  // Filter by specific property
  status?: CustomerStatus;
  source?: CustomerSource;
  search?: string;       // Search name or email
  page?: number;
  limit?: number;
  sortBy?: 'full_name' | 'email' | 'created_at' | 'total_bookings' | 'total_spent' | 'last_booking_date';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response for customer list endpoint
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
  company_id: string;        // Derived from property but required for validation
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

/**
 * Input for find-or-create operation (used by booking integration)
 */
export interface FindOrCreateCustomerInput {
  email: string;
  property_id: string;      // REQUIRED: Customer is property-scoped
  company_id: string;        // Derived from property
  source: CustomerSource;
  full_name?: string;
  phone?: string;
  user_id?: string;
}

// ============================================================================
// DATABASE ROW TYPES (from Supabase)
// ============================================================================

/**
 * Raw database row from customers table
 */
export interface CustomerRow {
  id: string;
  property_id: string;
  company_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  source: CustomerSource;
  first_booking_id: string | null;
  status: CustomerStatus;
  status_mode: CustomerStatusMode;
  total_bookings: number;
  total_spent: number;
  currency: string;
  first_booking_date: string | null;
  last_booking_date: string | null;
  last_booking_id: string | null;
  last_contact_date: string | null;
  tags: string[];
  notes: string | null;
  internal_notes: string | null;
  preferred_room_types: string[];
  special_requirements: string | null;
  marketing_consent: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}
