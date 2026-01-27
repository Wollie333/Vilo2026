// ============================================================================
// User Types (Member Types)
// ============================================================================

// NEW: User type category - distinguishes between SaaS team and customers
export type UserTypeCategory = 'saas' | 'customer';

export interface UserType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: UserTypeCategory; // NEW
  is_system_type: boolean;
  can_have_subscription: boolean;
  can_have_team: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserTypeData {
  name: string;
  display_name: string;
  description?: string;
  category: UserTypeCategory; // NEW - required
  can_have_subscription?: boolean;
  can_have_team?: boolean;
  sort_order?: number;
}

export interface UpdateUserTypeData {
  display_name?: string;
  description?: string;
  // Note: category cannot be changed after creation for data integrity
  can_have_subscription?: boolean;
  can_have_team?: boolean;
  sort_order?: number;
}

// ============================================================================
// Subscription Status (replaces billing_statuses table)
// ============================================================================

export type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'expired' | 'past_due' | 'paused';

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Active',
  trial: 'Trial',
  cancelled: 'Cancelled',
  expired: 'Expired',
  past_due: 'Past Due',
  paused: 'Paused',
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'green',
  trial: 'blue',
  cancelled: 'gray',
  expired: 'red',
  paused: 'yellow',
  past_due: 'yellow',
};

// ============================================================================
// Pricing Tiers (Enhanced for Multi-Billing Support)
// ============================================================================

export type BillingInterval = 'monthly' | 'annual';
export type BillingType = 'monthly' | 'annual' | 'one_off';

// Legacy pricing structure (kept for backward compatibility)
export interface PricingTiers {
  monthly: number;  // Price in cents for monthly billing
  annual: number;   // Price in cents for annual billing
}

// NEW: Individual billing type configuration
export interface BillingTypeConfig {
  enabled: boolean;
  price_cents: number;
  billing_cycle_days?: number; // Only for recurring types (monthly, annual)
  trial_period_days?: number | null;
  description?: string;
}

// NEW: Enhanced pricing tiers with full config per billing type
export interface PricingTiersEnhanced {
  monthly?: BillingTypeConfig;
  annual?: BillingTypeConfig;
  one_off?: BillingTypeConfig;
}

// NEW: Billing types enabled flags
export interface BillingTypesEnabled {
  monthly: boolean;
  annual: boolean;
  one_off: boolean;
}

// ============================================================================
// Subscription Types (with embedded JSONB limits and pricing tiers)
// ============================================================================

export type LimitKey =
  | 'max_properties'
  | 'max_rooms'
  | 'max_team_members'
  | 'max_bookings_per_month'
  | 'max_storage_mb'
  | string;

export interface SubscriptionType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  billing_cycle_days: number | null;
  is_recurring: boolean;
  price_cents: number; // Legacy field - use pricing instead
  currency: string;
  trial_period_days: number | null;
  is_active: boolean;
  sort_order: number;
  limits: Record<string, number>; // JSONB limits embedded in subscription type
  pricing: PricingTiers; // JSONB pricing tiers (monthly/annual) - LEGACY

  // NEW: Enhanced multi-billing support
  billing_types: BillingTypesEnabled; // Which billing types are enabled
  pricing_tiers: PricingTiersEnhanced; // Detailed config per billing type

  // NEW: CMS fields for checkout page customization
  slug: string; // URL-friendly identifier for /plans/:slug
  custom_headline?: string | null; // Custom headline for checkout page
  custom_description?: string | null; // Detailed description for checkout
  custom_features?: string[] | null; // JSONB array of custom feature strings
  custom_cta_text?: string | null; // Custom CTA button text
  checkout_badge?: string | null; // Badge text (e.g., "Most Popular")
  checkout_accent_color?: string | null; // Hex color for branding

  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionTypeData {
  name: string;
  display_name: string;
  description?: string;
  billing_cycle_days?: number;
  is_recurring?: boolean;
  price_cents?: number; // Legacy - use pricing instead
  currency?: string;
  trial_period_days?: number | null;
  is_active?: boolean;
  sort_order?: number;
  limits?: Record<string, number>; // Limits can be set on creation
  pricing?: Partial<PricingTiers>; // Pricing tiers can be set on creation - LEGACY

  // NEW: Multi-billing support
  billing_types?: BillingTypesEnabled; // Which billing types to enable
  pricing_tiers?: PricingTiersEnhanced; // Config for each billing type
  // Alternative: Individual price inputs (UI convenience)
  monthly_price_cents?: number;
  annual_price_cents?: number;
  one_off_price_cents?: number;

  // NEW: CMS fields for checkout page customization
  slug: string; // Required: URL-friendly identifier
  custom_headline?: string;
  custom_description?: string;
  custom_features?: string[];
  custom_cta_text?: string;
  checkout_badge?: string;
  checkout_accent_color?: string;
}

export interface UpdateSubscriptionTypeData {
  display_name?: string;
  description?: string;
  billing_cycle_days?: number | null;
  is_recurring?: boolean;
  price_cents?: number; // Legacy - use pricing instead
  currency?: string;
  trial_period_days?: number | null;
  is_active?: boolean;
  sort_order?: number;
  limits?: Record<string, number>; // Limits can be updated
  pricing?: Partial<PricingTiers>; // Pricing tiers can be updated - LEGACY

  // NEW: Multi-billing support
  billing_types?: BillingTypesEnabled; // Which billing types to enable
  pricing_tiers?: PricingTiersEnhanced; // Config for each billing type
  // Alternative: Individual price inputs (UI convenience)
  monthly_price_cents?: number;
  annual_price_cents?: number;
  one_off_price_cents?: number;

  // NEW: CMS fields for checkout page customization
  slug?: string; // URL-friendly identifier
  custom_headline?: string;
  custom_description?: string;
  custom_features?: string[];
  custom_cta_text?: string;
  checkout_badge?: string;
  checkout_accent_color?: string;
}

// ============================================================================
// User Subscriptions (with status field)
// ============================================================================

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_type_id: string;
  status: SubscriptionStatus; // Replaces billing_status_id
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  is_active: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  paused_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionWithDetails extends UserSubscription {
  subscription_type: SubscriptionType;
  limits: Record<LimitKey, number>; // Convenience accessor for subscription_type.limits
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface CreateUserSubscriptionData {
  user_id: string;
  subscription_type_id: string;
  status?: SubscriptionStatus; // Defaults to 'active'
  expires_at?: string;
  trial_ends_at?: string;
}

export interface UpdateUserSubscriptionData {
  subscription_type_id?: string;
  status?: SubscriptionStatus;
  expires_at?: string | null;
  trial_ends_at?: string | null;
  is_active?: boolean;
}

// ============================================================================
// Limit Check
// ============================================================================

export interface LimitCheckResult {
  is_within_limit: boolean;
  limit_value: number;
  current_count: number;
  remaining: number;
}

// ============================================================================
// User Billing Info
// ============================================================================

export interface UserBillingInfo {
  user_type: UserType | null;
  subscription: UserSubscriptionWithDetails | null;
  parent_user_id: string | null;
  is_team_member: boolean;
}

// ============================================================================
// Billing Overview
// ============================================================================

export interface BillingOverview {
  userTypes: UserType[];
  subscriptionTypes: SubscriptionType[];
}

// ============================================================================
// List Params & Responses
// ============================================================================

export interface SubscriptionTypeListParams {
  is_active?: boolean;
  is_recurring?: boolean;
  sortBy?: 'sort_order' | 'name' | 'price_cents' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSubscriptionListParams {
  status?: SubscriptionStatus;
  subscription_type_id?: string;
  is_active?: boolean;
  expires_before?: string;
  expires_after?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'expires_at' | 'started_at';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSubscriptionListResponse {
  subscriptions: UserSubscriptionWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Common Limit Keys Display Info
// ============================================================================

export const LIMIT_KEY_LABELS: Record<string, string> = {
  max_properties: 'Properties',
  max_rooms: 'Rooms',
  max_team_members: 'Team Members',
  max_companies: 'Companies',
  max_bookings_per_month: 'Bookings per Month',
  max_storage_mb: 'Storage',
};

export const DEFAULT_LIMITS: Record<string, number> = {
  max_properties: 0,
  max_rooms: 0,
  max_team_members: 0,
  max_bookings_per_month: 0,
  max_storage_mb: 0,
};

// ============================================================================
// User Type Permissions
// ============================================================================

export interface Permission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserTypePermission {
  id: string;
  user_type_id: string;
  permission_id: string;
  created_at: string;
  permission: Permission;
}

export interface UserTypeWithPermissions extends UserType {
  permissions: Permission[];
}

// ============================================================================
// Subscription Type Permissions (NEW)
// ============================================================================

export interface SubscriptionTypePermission {
  id: string;
  subscription_type_id: string;
  permission_id: string;
  created_at: string;
}

export interface SubscriptionTypePermissionWithDetails extends SubscriptionTypePermission {
  permission: Permission;
}

export interface SubscriptionTypeWithPermissions extends SubscriptionType {
  permissions: Permission[];
}

// ============================================================================
// Permission Categories (for UI organization)
// ============================================================================

export interface PermissionCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: Permission[];
  color: string; // For UI color coding
  icon: string; // Icon identifier
}

export const PERMISSION_CATEGORIES: Record<string, {
  display_name: string;
  description: string;
  color: string;
  icon: string;
  resources: string[];
}> = {
  property_management: {
    display_name: 'Property Management',
    description: 'Properties, rooms, and add-ons',
    color: 'blue',
    icon: 'building',
    resources: ['properties', 'rooms', 'addons']
  },
  booking_operations: {
    display_name: 'Booking Operations',
    description: 'Bookings, checkout, and guests',
    color: 'green',
    icon: 'calendar',
    resources: ['bookings', 'checkout', 'guests']
  },
  financial_management: {
    display_name: 'Financial Management',
    description: 'Invoices, payments, refunds, and credits',
    color: 'purple',
    icon: 'currency-dollar',
    resources: ['invoices', 'refunds', 'credit_notes', 'credit_memos', 'payment_rules', 'payments']
  },
  marketing_sales: {
    display_name: 'Marketing & Sales',
    description: 'Promotions, reviews, and discovery',
    color: 'pink',
    icon: 'megaphone',
    resources: ['promotions', 'reviews', 'discovery', 'wishlist']
  },
  user_management: {
    display_name: 'User Management',
    description: 'Users, roles, and teams',
    color: 'orange',
    icon: 'users',
    resources: ['users', 'roles', 'companies']
  },
  communication: {
    display_name: 'Communication',
    description: 'Chat, notifications, and webhooks',
    color: 'cyan',
    icon: 'chat-bubble-left-right',
    resources: ['chat', 'notifications', 'webhooks']
  },
  system_admin: {
    display_name: 'System Administration',
    description: 'Settings, analytics, and audit logs',
    color: 'gray',
    icon: 'cog',
    resources: ['settings', 'analytics', 'reports', 'audit_logs', 'dashboard']
  },
  content_legal: {
    display_name: 'Content & Legal',
    description: 'Legal documents and locations',
    color: 'yellow',
    icon: 'document-text',
    resources: ['legal', 'locations', 'onboarding']
  }
};

// ============================================================================
// Permission Templates
// ============================================================================

export interface PermissionTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system_template: boolean;
  permission_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface PermissionTemplateWithPermissions extends PermissionTemplate {
  permissions: Permission[];
}

export interface CreatePermissionTemplateData {
  name: string;
  display_name: string;
  description?: string;
  permission_ids: string[];
}

export interface UpdatePermissionTemplateData {
  display_name?: string;
  description?: string;
  permission_ids?: string[];
}

// ============================================================================
// DEPRECATED TYPES (kept for backward compatibility during migration)
// These will be removed in a future version
// ============================================================================

/**
 * @deprecated Use SubscriptionStatus instead. Billing statuses are now stored
 * directly on user_subscriptions as a status field.
 */
export type BillingStatusColor = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * @deprecated Billing statuses are no longer a separate entity.
 * Use the status field on UserSubscription instead.
 */
export interface BillingStatus {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system_status: boolean;
  color: BillingStatusColor;
  feature_access_level: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated Subscription limits are now stored as JSONB on SubscriptionType.
 * Use SubscriptionType.limits instead.
 */
export interface SubscriptionLimit {
  id: string;
  subscription_type_id: string;
  limit_key: LimitKey;
  limit_value: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated Use SubscriptionType directly, which now includes limits.
 */
export interface SubscriptionTypeWithLimits extends Omit<SubscriptionType, 'limits'> {
  limits: SubscriptionLimit[];
}
