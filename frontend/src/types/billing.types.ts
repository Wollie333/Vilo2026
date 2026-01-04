// ============================================================================
// User Types
// ============================================================================

export interface UserType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
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
  can_have_subscription?: boolean;
  can_have_team?: boolean;
  sort_order?: number;
}

export interface UpdateUserTypeData {
  display_name?: string;
  description?: string;
  can_have_subscription?: boolean;
  can_have_team?: boolean;
  sort_order?: number;
}

// ============================================================================
// Billing Statuses
// ============================================================================

export type BillingStatusColor = 'default' | 'success' | 'warning' | 'error' | 'info';

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

export interface CreateBillingStatusData {
  name: string;
  display_name: string;
  description?: string;
  color?: BillingStatusColor;
  feature_access_level?: number;
  sort_order?: number;
}

export interface UpdateBillingStatusData {
  display_name?: string;
  description?: string;
  color?: BillingStatusColor;
  feature_access_level?: number;
  sort_order?: number;
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface SubscriptionType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  billing_cycle_days: number | null;
  is_recurring: boolean;
  price_cents: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTypeWithLimits extends SubscriptionType {
  limits: SubscriptionLimit[];
}

export interface CreateSubscriptionTypeData {
  name: string;
  display_name: string;
  description?: string;
  billing_cycle_days?: number;
  is_recurring?: boolean;
  price_cents?: number;
  currency?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateSubscriptionTypeData {
  display_name?: string;
  description?: string;
  billing_cycle_days?: number | null;
  is_recurring?: boolean;
  price_cents?: number;
  currency?: string;
  is_active?: boolean;
  sort_order?: number;
}

// ============================================================================
// Subscription Limits
// ============================================================================

export type LimitKey =
  | 'max_properties'
  | 'max_rooms'
  | 'max_team_members'
  | 'max_bookings_per_month'
  | 'max_storage_mb'
  | string;

export interface SubscriptionLimit {
  id: string;
  subscription_type_id: string;
  limit_key: LimitKey;
  limit_value: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionLimitData {
  subscription_type_id: string;
  limit_key: LimitKey;
  limit_value: number;
  description?: string;
}

export interface UpdateSubscriptionLimitData {
  limit_value?: number;
  description?: string;
}

export interface BulkUpdateLimitsData {
  limits: {
    limit_key: LimitKey;
    limit_value: number;
    description?: string;
  }[];
}

// ============================================================================
// User Subscriptions
// ============================================================================

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_type_id: string;
  billing_status_id: string;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  is_active: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionWithDetails extends UserSubscription {
  subscription_type: SubscriptionType;
  billing_status: BillingStatus;
  limits: Record<LimitKey, number>;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface CreateUserSubscriptionData {
  user_id: string;
  subscription_type_id: string;
  billing_status_id: string;
  expires_at?: string;
  trial_ends_at?: string;
}

export interface UpdateUserSubscriptionData {
  subscription_type_id?: string;
  billing_status_id?: string;
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
  billingStatuses: BillingStatus[];
  subscriptionTypes: SubscriptionTypeWithLimits[];
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
  billing_status_id?: string;
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
  max_properties: 'Max Properties',
  max_rooms: 'Max Rooms',
  max_team_members: 'Max Team Members',
  max_bookings_per_month: 'Max Bookings/Month',
  max_storage_mb: 'Storage (MB)',
};

export const BILLING_STATUS_COLORS: Record<BillingStatusColor, string> = {
  default: 'gray',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  info: 'blue',
};
