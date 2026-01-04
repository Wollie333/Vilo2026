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

export interface CreateUserTypeRequest {
  name: string;
  display_name: string;
  description?: string;
  can_have_subscription?: boolean;
  can_have_team?: boolean;
  sort_order?: number;
}

export interface UpdateUserTypeRequest {
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

export interface CreateBillingStatusRequest {
  name: string;
  display_name: string;
  description?: string;
  color?: BillingStatusColor;
  feature_access_level?: number;
  sort_order?: number;
}

export interface UpdateBillingStatusRequest {
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

export interface CreateSubscriptionTypeRequest {
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

export interface UpdateSubscriptionTypeRequest {
  display_name?: string;
  description?: string;
  billing_cycle_days?: number;
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
  | string; // Allow custom limit keys

export interface SubscriptionLimit {
  id: string;
  subscription_type_id: string;
  limit_key: LimitKey;
  limit_value: number; // -1 means unlimited
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionLimitRequest {
  subscription_type_id: string;
  limit_key: LimitKey;
  limit_value: number;
  description?: string;
}

export interface UpdateSubscriptionLimitRequest {
  limit_value?: number;
  description?: string;
}

export interface BulkUpdateLimitsRequest {
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
}

export interface CreateUserSubscriptionRequest {
  user_id: string;
  subscription_type_id: string;
  billing_status_id: string;
  expires_at?: string;
  trial_ends_at?: string;
}

export interface UpdateUserSubscriptionRequest {
  subscription_type_id?: string;
  billing_status_id?: string;
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
  user_types: UserType[];
  billing_statuses: BillingStatus[];
  subscription_types: SubscriptionTypeWithLimits[];
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
