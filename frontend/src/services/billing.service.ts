import { api } from './api.service';
import type {
  UserType,
  CreateUserTypeData,
  UpdateUserTypeData,
  BillingStatus,
  CreateBillingStatusData,
  UpdateBillingStatusData,
  SubscriptionTypeWithLimits,
  CreateSubscriptionTypeData,
  UpdateSubscriptionTypeData,
  SubscriptionLimit,
  CreateSubscriptionLimitData,
  UpdateSubscriptionLimitData,
  BulkUpdateLimitsData,
  UserSubscriptionWithDetails,
  CreateUserSubscriptionData,
  UpdateUserSubscriptionData,
  UserSubscriptionListParams,
  UserSubscriptionListResponse,
  SubscriptionTypeListParams,
  LimitCheckResult,
  UserBillingInfo,
  BillingOverview,
} from '@/types/billing.types';

class BillingService {
  // ============================================================================
  // OVERVIEW
  // ============================================================================

  async getBillingOverview(): Promise<BillingOverview> {
    const response = await api.get<{ overview: BillingOverview }>('/api/billing/overview');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch billing overview');
    }
    return response.data.overview;
  }

  // ============================================================================
  // USER TYPES
  // ============================================================================

  async listUserTypes(): Promise<UserType[]> {
    const response = await api.get<{ userTypes: UserType[] }>('/api/billing/user-types');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user types');
    }
    return response.data.userTypes;
  }

  async getUserType(id: string): Promise<UserType> {
    const response = await api.get<{ userType: UserType }>(`/api/billing/user-types/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user type');
    }
    return response.data.userType;
  }

  async createUserType(data: CreateUserTypeData): Promise<UserType> {
    const response = await api.post<{ userType: UserType }>('/api/billing/user-types', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create user type');
    }
    return response.data.userType;
  }

  async updateUserType(id: string, data: UpdateUserTypeData): Promise<UserType> {
    const response = await api.patch<{ userType: UserType }>(`/api/billing/user-types/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update user type');
    }
    return response.data.userType;
  }

  async deleteUserType(id: string): Promise<void> {
    const response = await api.delete(`/api/billing/user-types/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete user type');
    }
  }

  // ============================================================================
  // BILLING STATUSES
  // ============================================================================

  async listBillingStatuses(): Promise<BillingStatus[]> {
    const response = await api.get<{ billingStatuses: BillingStatus[] }>('/api/billing/statuses');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch billing statuses');
    }
    return response.data.billingStatuses;
  }

  async getBillingStatus(id: string): Promise<BillingStatus> {
    const response = await api.get<{ billingStatus: BillingStatus }>(`/api/billing/statuses/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch billing status');
    }
    return response.data.billingStatus;
  }

  async createBillingStatus(data: CreateBillingStatusData): Promise<BillingStatus> {
    const response = await api.post<{ billingStatus: BillingStatus }>('/api/billing/statuses', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create billing status');
    }
    return response.data.billingStatus;
  }

  async updateBillingStatus(id: string, data: UpdateBillingStatusData): Promise<BillingStatus> {
    const response = await api.patch<{ billingStatus: BillingStatus }>(`/api/billing/statuses/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update billing status');
    }
    return response.data.billingStatus;
  }

  async deleteBillingStatus(id: string): Promise<void> {
    const response = await api.delete(`/api/billing/statuses/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete billing status');
    }
  }

  // ============================================================================
  // SUBSCRIPTION TYPES
  // ============================================================================

  async listSubscriptionTypes(params?: SubscriptionTypeListParams): Promise<SubscriptionTypeWithLimits[]> {
    const queryParams = new URLSearchParams();
    if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active));
    if (params?.is_recurring !== undefined) queryParams.set('is_recurring', String(params.is_recurring));
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const url = `/api/billing/subscription-types${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<{ subscriptionTypes: SubscriptionTypeWithLimits[] }>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription types');
    }
    return response.data.subscriptionTypes;
  }

  async getSubscriptionType(id: string): Promise<SubscriptionTypeWithLimits> {
    const response = await api.get<{ subscriptionType: SubscriptionTypeWithLimits }>(`/api/billing/subscription-types/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription type');
    }
    return response.data.subscriptionType;
  }

  async createSubscriptionType(data: CreateSubscriptionTypeData): Promise<SubscriptionTypeWithLimits> {
    const response = await api.post<{ subscriptionType: SubscriptionTypeWithLimits }>('/api/billing/subscription-types', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create subscription type');
    }
    return response.data.subscriptionType;
  }

  async updateSubscriptionType(id: string, data: UpdateSubscriptionTypeData): Promise<SubscriptionTypeWithLimits> {
    const response = await api.patch<{ subscriptionType: SubscriptionTypeWithLimits }>(`/api/billing/subscription-types/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update subscription type');
    }
    return response.data.subscriptionType;
  }

  async deleteSubscriptionType(id: string): Promise<void> {
    const response = await api.delete(`/api/billing/subscription-types/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete subscription type');
    }
  }

  // ============================================================================
  // SUBSCRIPTION LIMITS
  // ============================================================================

  async getSubscriptionLimits(subscriptionTypeId: string): Promise<SubscriptionLimit[]> {
    const response = await api.get<{ limits: SubscriptionLimit[] }>(`/api/billing/subscription-types/${subscriptionTypeId}/limits`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription limits');
    }
    return response.data.limits;
  }

  async createSubscriptionLimit(data: CreateSubscriptionLimitData): Promise<SubscriptionLimit> {
    const response = await api.post<{ limit: SubscriptionLimit }>('/api/billing/limits', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create subscription limit');
    }
    return response.data.limit;
  }

  async updateSubscriptionLimit(id: string, data: UpdateSubscriptionLimitData): Promise<SubscriptionLimit> {
    const response = await api.patch<{ limit: SubscriptionLimit }>(`/api/billing/limits/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update subscription limit');
    }
    return response.data.limit;
  }

  async deleteSubscriptionLimit(id: string): Promise<void> {
    const response = await api.delete(`/api/billing/limits/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete subscription limit');
    }
  }

  async bulkUpdateLimits(subscriptionTypeId: string, data: BulkUpdateLimitsData): Promise<SubscriptionLimit[]> {
    const response = await api.put<{ limits: SubscriptionLimit[] }>(`/api/billing/subscription-types/${subscriptionTypeId}/limits`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update subscription limits');
    }
    return response.data.limits;
  }

  // ============================================================================
  // USER SUBSCRIPTIONS
  // ============================================================================

  async listUserSubscriptions(params?: UserSubscriptionListParams): Promise<UserSubscriptionListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.billing_status_id) queryParams.set('billing_status_id', params.billing_status_id);
    if (params?.subscription_type_id) queryParams.set('subscription_type_id', params.subscription_type_id);
    if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active));
    if (params?.expires_before) queryParams.set('expires_before', params.expires_before);
    if (params?.expires_after) queryParams.set('expires_after', params.expires_after);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const url = `/api/billing/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<UserSubscriptionListResponse>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user subscriptions');
    }
    return response.data;
  }

  async getUserSubscription(userId: string): Promise<UserSubscriptionWithDetails | null> {
    const response = await api.get<{ subscription: UserSubscriptionWithDetails | null }>(`/api/billing/subscriptions/user/${userId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user subscription');
    }
    return response.data.subscription;
  }

  async createUserSubscription(data: CreateUserSubscriptionData): Promise<UserSubscriptionWithDetails> {
    const response = await api.post<{ subscription: UserSubscriptionWithDetails }>('/api/billing/subscriptions', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create user subscription');
    }
    return response.data.subscription;
  }

  async updateUserSubscription(userId: string, data: UpdateUserSubscriptionData): Promise<UserSubscriptionWithDetails> {
    const response = await api.patch<{ subscription: UserSubscriptionWithDetails }>(`/api/billing/subscriptions/user/${userId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update user subscription');
    }
    return response.data.subscription;
  }

  async cancelUserSubscription(userId: string, reason?: string): Promise<void> {
    const response = await api.post(`/api/billing/subscriptions/user/${userId}/cancel`, { cancellation_reason: reason });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to cancel subscription');
    }
  }

  // ============================================================================
  // USER BILLING INFO
  // ============================================================================

  async getUserBillingInfo(userId: string): Promise<UserBillingInfo> {
    const response = await api.get<{ billingInfo: UserBillingInfo }>(`/api/billing/users/${userId}/billing-info`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user billing info');
    }
    return response.data.billingInfo;
  }

  async assignUserType(userId: string, userTypeId: string): Promise<void> {
    const response = await api.post(`/api/billing/users/${userId}/user-type`, { user_type_id: userTypeId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to assign user type');
    }
  }

  async checkUserLimit(userId: string, limitKey: string, currentCount: number = 0): Promise<LimitCheckResult> {
    const response = await api.post<{ limitCheck: LimitCheckResult }>(`/api/billing/users/${userId}/check-limit`, {
      limit_key: limitKey,
      current_count: currentCount,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check user limit');
    }
    return response.data.limitCheck;
  }
}

export const billingService = new BillingService();
