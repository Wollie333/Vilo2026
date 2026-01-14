// ============================================================================
// Company Types
// ============================================================================

export interface Company {
  id: string;
  user_id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  default_currency: string;
  // Address fields
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  // Tax/Legal
  vat_number: string | null;
  registration_number: string | null;
  // Social Media
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  // Status
  is_active: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CompanyWithPropertyCount extends Company {
  property_count: number;
}

// ============================================================================
// Create/Update DTOs
// ============================================================================

export interface CreateCompanyData {
  name: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  default_currency?: string;
  // Address fields
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  // Tax/Legal
  vat_number?: string;
  registration_number?: string;
  // Social Media
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
}

export interface UpdateCompanyData {
  name?: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  default_currency?: string;
  // Address fields
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  // Tax/Legal
  vat_number?: string;
  registration_number?: string;
  // Social Media
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  // Status
  is_active?: boolean;
}

// ============================================================================
// List/Filter Params
// ============================================================================

export interface CompanyListParams {
  is_active?: boolean;
  search?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CompanyListResponse {
  companies: CompanyWithPropertyCount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Limit Info
// ============================================================================

export interface CompanyLimitInfo {
  current_count: number;
  max_allowed: number;
  is_unlimited: boolean;
  can_create: boolean;
  remaining: number;
}
