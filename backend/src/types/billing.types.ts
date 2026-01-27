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
  is_system_type: boolean;
  can_have_subscription: boolean;
  can_have_team: boolean;
  category: UserTypeCategory; // NEW: Category field
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserTypeRequest {
  name: string;
  display_name: string;
  description?: string;
  category: UserTypeCategory; // NEW: Required category field
  can_have_subscription?: boolean;
  can_have_team?: boolean;
  sort_order?: number;
}

export interface UpdateUserTypeRequest {
  display_name?: string;
  description?: string;
  category?: UserTypeCategory; // NEW: Can update category
  can_have_subscription?: boolean;
  can_have_team?: boolean;
  sort_order?: number;
}

// ============================================================================
// Subscription Status (replaces billing_statuses table)
// ============================================================================

export type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'expired' | 'past_due' | 'paused';

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
// Subscription Types (with embedded limits and pricing tiers)
// ============================================================================

export type LimitKey =
  | 'max_properties'
  | 'max_rooms'
  | 'max_team_members'
  | 'max_bookings_per_month'
  | 'max_storage_mb'
  | string; // Allow custom limit keys

export interface SubscriptionType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  currency: string;
  trial_period_days: number | null;
  is_active: boolean;
  sort_order: number;
  limits: Record<string, number>; // JSONB limits embedded in subscription type

  // Multi-billing support
  billing_types: BillingTypesEnabled; // Which billing types are enabled
  pricing_tiers: PricingTiersEnhanced; // Detailed config per billing type

  // CMS fields for checkout page customization
  slug: string; // URL-friendly identifier for /plans/:slug
  custom_headline?: string | null; // Custom headline for checkout page
  custom_description?: string | null; // Detailed description for checkout
  custom_features?: string[] | null; // JSONB array of custom feature strings
  custom_cta_text?: string | null; // Custom CTA button text
  checkout_badge?: string | null; // Badge text (e.g., "Most Popular")
  checkout_accent_color?: string | null; // Hex color for branding

  created_at: string;
  updated_at: string;

  // NOTE: Legacy fields removed by migration 096:
  // - price_cents (use pricing_tiers.monthly.price_cents or pricing_tiers.annual.price_cents)
  // - billing_cycle_days (use pricing_tiers.monthly.billing_cycle_days)
  // - is_recurring (check billing_types.monthly or billing_types.annual)
  // - pricing (replaced by pricing_tiers)
}

export interface CreateSubscriptionTypeRequest {
  name: string;
  display_name: string;
  description?: string;
  currency?: string;
  trial_period_days?: number | null;
  is_active?: boolean;
  sort_order?: number;
  limits?: Record<string, number>; // Limits can be set on creation

  // Multi-billing support
  billing_types?: BillingTypesEnabled; // Which billing types to enable
  pricing_tiers?: PricingTiersEnhanced; // Config for each billing type
  // Alternative: Individual price inputs (UI convenience)
  monthly_price_cents?: number;
  annual_price_cents?: number;
  one_off_price_cents?: number;

  // CMS fields for checkout page customization
  slug: string; // Required: URL-friendly identifier
  custom_headline?: string;
  custom_description?: string;
  custom_features?: string[];
  custom_cta_text?: string;
  checkout_badge?: string;
  checkout_accent_color?: string;

  // Legacy fields (accepted for backward compatibility but ignored):
  billing_cycle_days?: number;
  is_recurring?: boolean;
  price_cents?: number;
  pricing?: Partial<PricingTiers>;
}

export interface UpdateSubscriptionTypeRequest {
  display_name?: string;
  description?: string;
  currency?: string;
  trial_period_days?: number | null;
  is_active?: boolean;
  sort_order?: number;
  limits?: Record<string, number>; // Limits can be updated

  // Multi-billing support
  billing_types?: BillingTypesEnabled; // Which billing types to enable
  pricing_tiers?: PricingTiersEnhanced; // Config for each billing type
  // Alternative: Individual price inputs (UI convenience)
  monthly_price_cents?: number;
  annual_price_cents?: number;
  one_off_price_cents?: number;

  // CMS fields for checkout page customization
  slug?: string; // URL-friendly identifier
  custom_headline?: string;
  custom_description?: string;
  custom_features?: string[];
  custom_cta_text?: string;
  checkout_badge?: string;
  checkout_accent_color?: string;

  // Legacy fields (accepted for backward compatibility but ignored):
  billing_cycle_days?: number;
  is_recurring?: boolean;
  price_cents?: number;
  pricing?: Partial<PricingTiers>;
}

// ============================================================================
// User Subscriptions (with status field instead of billing_status_id)
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
}

export interface CreateUserSubscriptionRequest {
  user_id: string;
  subscription_type_id: string;
  status?: SubscriptionStatus; // Defaults to 'active'
  expires_at?: string;
  trial_ends_at?: string;
}

export interface UpdateUserSubscriptionRequest {
  subscription_type_id?: string;
  status?: SubscriptionStatus;
  expires_at?: string;
  trial_ends_at?: string;
  is_active?: boolean;
}

export interface CancelSubscriptionRequest {
  cancellation_reason?: string;
}

// ============================================================================
// Limit Check Response
// ============================================================================

export interface LimitCheckResult {
  is_within_limit: boolean;
  limit_value: number;
  current_count: number;
  remaining: number;
}

// ============================================================================
// Aggregated Types for API Responses
// ============================================================================

export interface BillingOverview {
  userTypes: UserType[];
  subscriptionTypes: SubscriptionType[];
}

export interface UserBillingInfo {
  user_type: UserType | null;
  subscription: UserSubscriptionWithDetails | null;
  parent_user_id: string | null;
  is_team_member: boolean;
}

// ============================================================================
// List/Filter Params
// ============================================================================

export interface SubscriptionTypeListParams {
  is_active?: boolean;
  is_recurring?: boolean;
  sortBy?: 'sort_order' | 'name' | 'created_at';
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
// User Type Permissions
// ============================================================================

export interface UserTypePermission {
  id: string;
  user_type_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserTypePermissionWithDetails extends UserTypePermission {
  permission: {
    id: string;
    resource: string;
    action: string;
    description: string | null;
  };
}

export interface Permission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  description: string | null;
  created_at?: string;
  updated_at?: string;
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

export interface CreatePermissionTemplateRequest {
  name: string;
  display_name: string;
  description?: string;
  permission_ids: string[];
}

export interface UpdatePermissionTemplateRequest {
  display_name?: string;
  description?: string;
  permission_ids?: string[];
}

// ============================================================================
// Subscription Access Status (for paywall/read-only mode)
// ============================================================================

export type AccessMode = 'full' | 'readonly';

export interface SubscriptionAccessStatus {
  hasActiveSubscription: boolean;
  hasFullAccess: boolean;
  accessMode: AccessMode;
  subscriptionStatus: SubscriptionStatus | null;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  expiresAt: string | null;
  requiresPayment: boolean;
  message: string;
  // Pending checkout info
  hasPendingCheckout: boolean;
  pendingCheckoutId: string | null;
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

// ============================================================================
// SUBSCRIPTION UPGRADE REQUESTS
// ============================================================================

export type UpgradeRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export const UPGRADE_REQUEST_STATUS_LABELS: Record<UpgradeRequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

export const UPGRADE_REQUEST_STATUS_COLORS: Record<UpgradeRequestStatus, string> = {
  pending: 'yellow',
  accepted: 'green',
  declined: 'red',
  expired: 'gray',
};

export interface SubscriptionUpgradeRequest {
  id: string;
  user_id: string;
  current_subscription_id: string;
  requested_subscription_type_id: string;
  requested_by_admin_id: string;
  status: UpgradeRequestStatus;
  admin_notes: string | null;
  user_response_notes: string | null;
  requested_at: string;
  responded_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUpgradeRequestWithDetails extends SubscriptionUpgradeRequest {
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  current_subscription: UserSubscriptionWithDetails;
  requested_subscription_type: SubscriptionType;
  requested_by_admin: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface CreateUpgradeRequestInput {
  user_id: string;
  target_plan_id: string;
  admin_notes?: string;
}

export interface RespondToUpgradeInput {
  accepted: boolean;
  user_response_notes?: string;
}

export interface UpgradeRequestListParams {
  user_id?: string;
  status?: UpgradeRequestStatus;
  requested_by_admin_id?: string;
  page?: number;
  limit?: number;
}

export interface UpgradeRequestListResponse {
  requests: SubscriptionUpgradeRequestWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// SUBSCRIPTION DISPLAY INFO (for Admin UI)
// ============================================================================

export interface SubscriptionDisplayInfo {
  subscription: UserSubscriptionWithDetails;
  plan_name: string;
  plan_display_name: string;
  current_price_cents: number;
  current_price_formatted: string;
  billing_interval: 'monthly' | 'annual' | 'one_off' | null;
  billing_interval_label: string;
  next_billing_date: string | null;
  status: SubscriptionStatus;
  status_label: string;
  status_color: string;
  days_remaining: number | null;
  is_paused: boolean;
  is_cancelled: boolean;
  is_active: boolean;
  can_pause: boolean;
  can_cancel: boolean;
  can_resume: boolean;
  can_upgrade: boolean;
  paused_reason: string | null;
  paused_by_admin: { id: string; full_name: string } | null;
  cancelled_reason: string | null;
  cancelled_by_admin: { id: string; full_name: string } | null;
  access_end_date: string | null;
}
