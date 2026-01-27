import { api } from './api.service';
import type {
  UserType,
  CreateUserTypeData,
  UpdateUserTypeData,
  SubscriptionType,
  CreateSubscriptionTypeData,
  UpdateSubscriptionTypeData,
  UserSubscriptionWithDetails,
  CreateUserSubscriptionData,
  UpdateUserSubscriptionData,
  UserSubscriptionListParams,
  UserSubscriptionListResponse,
  SubscriptionTypeListParams,
  LimitCheckResult,
  UserBillingInfo,
  BillingOverview,
  Permission,
  PermissionCategory,
  UserTypeWithPermissions,
  SubscriptionTypeWithPermissions, // NEW
  PermissionTemplate,
  PermissionTemplateWithPermissions,
  CreatePermissionTemplateData,
  UpdatePermissionTemplateData,
} from '@/types/billing.types';
import type { SubscriptionAccessStatus } from '@/types/subscription-access.types';

class BillingService {
  // ============================================================================
  // OVERVIEW
  // ============================================================================

  async getBillingOverview(): Promise<BillingOverview> {
    const response = await api.get<{ overview: BillingOverview }>('/billing/overview');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch billing overview');
    }
    return response.data.overview;
  }

  // ============================================================================
  // USER TYPES (MEMBER TYPES)
  // ============================================================================

  async listUserTypes(): Promise<UserType[]> {
    const response = await api.get<{ userTypes: UserType[] }>('/billing/user-types');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user types');
    }
    return response.data.userTypes;
  }

  async getUserType(id: string): Promise<UserType> {
    const response = await api.get<{ userType: UserType }>(`/billing/user-types/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user type');
    }
    return response.data.userType;
  }

  async createUserType(data: CreateUserTypeData): Promise<UserType> {
    const response = await api.post<{ userType: UserType }>('/billing/user-types', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create user type');
    }
    return response.data.userType;
  }

  async updateUserType(id: string, data: UpdateUserTypeData): Promise<UserType> {
    const response = await api.patch<{ userType: UserType }>(`/billing/user-types/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update user type');
    }
    return response.data.userType;
  }

  async deleteUserType(id: string): Promise<void> {
    const response = await api.delete(`/billing/user-types/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete user type');
    }
  }

  // ============================================================================
  // SUBSCRIPTION TYPES (with embedded JSONB limits)
  // ============================================================================

  async listSubscriptionTypes(params?: SubscriptionTypeListParams): Promise<SubscriptionType[]> {
    const queryParams = new URLSearchParams();
    if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active));
    if (params?.is_recurring !== undefined) queryParams.set('is_recurring', String(params.is_recurring));
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const url = `/billing/subscription-types${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<{ subscriptionTypes: SubscriptionType[] }>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription types');
    }
    return response.data.subscriptionTypes;
  }

  async getSubscriptionType(id: string): Promise<SubscriptionType> {
    const response = await api.get<{ subscriptionType: SubscriptionType }>(`/billing/subscription-types/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription type');
    }
    return response.data.subscriptionType;
  }

  async getSubscriptionTypeBySlug(slug: string): Promise<SubscriptionType> {
    const response = await api.get<{ subscriptionType: SubscriptionType }>(`/billing/subscription-types/slug/${slug}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription plan');
    }
    return response.data.subscriptionType;
  }

  async createSubscriptionType(data: CreateSubscriptionTypeData): Promise<SubscriptionType> {
    console.log('📤 [BILLING SERVICE] Sending create request');
    console.log('📤 [BILLING SERVICE] Data:', JSON.stringify(data, null, 2));

    const response = await api.post<{ subscriptionType: SubscriptionType }>('/billing/subscription-types', data);

    console.log('📥 [BILLING SERVICE] Response:', JSON.stringify(response, null, 2));

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create subscription type');
    }
    return response.data.subscriptionType;
  }

  async updateSubscriptionType(id: string, data: UpdateSubscriptionTypeData): Promise<SubscriptionType> {
    console.log('📤 API CALL: PATCH /billing/subscription-types/' + id);
    console.log('📤 Request Data:', JSON.stringify(data, null, 2));

    const response = await api.patch<{ subscriptionType: SubscriptionType }>(`/billing/subscription-types/${id}`, data);

    console.log('📥 API Response:', {
      success: response.success,
      hasData: !!response.data,
      error: response.error,
    });

    if (response.data?.subscriptionType) {
      console.log('📥 Updated Subscription:', {
        slug: response.data.subscriptionType.slug,
        custom_headline: response.data.subscriptionType.custom_headline,
        checkout_badge: response.data.subscriptionType.checkout_badge,
      });
    }

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update subscription type');
    }
    return response.data.subscriptionType;
  }

  async deleteSubscriptionType(id: string): Promise<void> {
    const response = await api.delete(`/billing/subscription-types/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete subscription type');
    }
  }

  /**
   * Force delete subscription type (deletes checkout history)
   * WARNING: This is destructive and removes billing history
   */
  async forceDeleteSubscriptionType(id: string): Promise<void> {
    const response = await api.delete(`/billing/subscription-types/${id}/force`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to force delete subscription type');
    }
  }

  // ============================================================================
  // USER SUBSCRIPTIONS (with status field)
  // ============================================================================

  async listUserSubscriptions(params?: UserSubscriptionListParams): Promise<UserSubscriptionListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.subscription_type_id) queryParams.set('subscription_type_id', params.subscription_type_id);
    if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active));
    if (params?.expires_before) queryParams.set('expires_before', params.expires_before);
    if (params?.expires_after) queryParams.set('expires_after', params.expires_after);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const url = `/billing/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<UserSubscriptionListResponse>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user subscriptions');
    }
    return response.data;
  }

  async getUserSubscription(userId: string): Promise<UserSubscriptionWithDetails | null> {
    const response = await api.get<{ subscription: UserSubscriptionWithDetails | null }>(`/billing/subscriptions/user/${userId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user subscription');
    }
    return response.data.subscription;
  }

  async createUserSubscription(data: CreateUserSubscriptionData): Promise<UserSubscriptionWithDetails> {
    const response = await api.post<{ subscription: UserSubscriptionWithDetails }>('/billing/subscriptions', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create user subscription');
    }
    return response.data.subscription;
  }

  async updateUserSubscription(userId: string, data: UpdateUserSubscriptionData): Promise<UserSubscriptionWithDetails> {
    const response = await api.patch<{ subscription: UserSubscriptionWithDetails }>(`/billing/subscriptions/user/${userId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update user subscription');
    }
    return response.data.subscription;
  }

  async cancelUserSubscription(userId: string, reason?: string): Promise<void> {
    const response = await api.post(`/billing/subscriptions/user/${userId}/cancel`, { cancellation_reason: reason });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to cancel subscription');
    }
  }

  async pauseUserSubscription(userId: string): Promise<void> {
    const response = await api.post(`/billing/subscriptions/user/${userId}/pause`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to pause subscription');
    }
  }

  async resumeUserSubscription(userId: string): Promise<void> {
    const response = await api.post(`/billing/subscriptions/user/${userId}/resume`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to resume subscription');
    }
  }

  // ============================================================================
  // USER BILLING INFO
  // ============================================================================

  /**
   * Get current user's billing info (for profile page)
   * No special permissions required
   */
  async getMyBillingInfo(): Promise<UserBillingInfo> {
    const response = await api.get<{ billingInfo: UserBillingInfo }>('/billing/my-billing');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch billing info');
    }
    return response.data.billingInfo;
  }

  /**
   * Get current user's subscription access status (for paywall/read-only mode)
   * No special permissions required
   */
  async getMySubscriptionAccess(): Promise<SubscriptionAccessStatus> {
    const response = await api.get<{ accessStatus: SubscriptionAccessStatus }>('/billing/my-subscription-access');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription access');
    }
    return response.data.accessStatus;
  }

  /**
   * Get billing info for a specific user (admin endpoint)
   * Requires users:read permission
   */
  async getUserBillingInfo(userId: string): Promise<UserBillingInfo> {
    const response = await api.get<{ billingInfo: UserBillingInfo }>(`/billing/users/${userId}/billing-info`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user billing info');
    }
    return response.data.billingInfo;
  }

  async assignUserType(userId: string, userTypeId: string): Promise<void> {
    const response = await api.post(`/billing/users/${userId}/user-type`, { user_type_id: userTypeId });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to assign user type');
    }
  }

  async checkUserLimit(userId: string, limitKey: string, currentCount: number = 0): Promise<LimitCheckResult> {
    const response = await api.post<{ limitCheck: LimitCheckResult }>(`/billing/users/${userId}/check-limit`, {
      limit_key: limitKey,
      current_count: currentCount,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check user limit');
    }
    return response.data.limitCheck;
  }

  // ============================================================================
  // USER UPGRADE REQUESTS
  // ============================================================================

  /**
   * Get current user's pending upgrade request (if any)
   * Returns null if no pending upgrade exists
   */
  async getPendingUpgrade(): Promise<any> {
    const response = await api.get<{ request: any }>('/billing/my-pending-upgrade');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch pending upgrade');
    }
    return response.data.request;
  }

  /**
   * Respond to an upgrade request (accept or decline)
   * @param requestId - The upgrade request ID
   * @param accepted - Whether to accept (true) or decline (false)
   * @param notes - Optional user response notes
   */
  async respondToUpgrade(requestId: string, accepted: boolean, notes?: string): Promise<any> {
    const response = await api.post<{ request: any }>(`/billing/upgrade-requests/${requestId}/respond`, {
      accepted,
      user_response_notes: notes,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to respond to upgrade request');
    }
    return response.data.request;
  }

  // ============================================================================
  // USER TYPE PERMISSIONS
  // ============================================================================

  async listPermissions(): Promise<Permission[]> {
    const response = await api.get<{ permissions: Permission[] }>('/billing/permissions');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch permissions');
    }
    return response.data.permissions;
  }

  /**
   * Get all permissions grouped by category (for subscription plan editor)
   */
  async getPermissionsByCategory(): Promise<PermissionCategory[]> {
    const response = await api.get<{ categories: PermissionCategory[] }>('/billing/permissions-by-category');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch permission categories');
    }
    return response.data.categories;
  }

  async listUserTypesWithPermissions(): Promise<UserTypeWithPermissions[]> {
    const response = await api.get<{ userTypes: UserTypeWithPermissions[] }>('/billing/user-types-with-permissions');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user types with permissions');
    }
    return response.data.userTypes;
  }

  async getUserTypePermissions(userTypeId: string): Promise<Permission[]> {
    const response = await api.get<{ permissions: Permission[] }>(`/billing/user-types/${userTypeId}/permissions`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user type permissions');
    }
    return response.data.permissions;
  }

  async updateUserTypePermissions(userTypeId: string, permissionIds: string[]): Promise<Permission[]> {
    const response = await api.put<{ permissions: Permission[] }>(`/billing/user-types/${userTypeId}/permissions`, {
      permission_ids: permissionIds,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update user type permissions');
    }
    return response.data.permissions;
  }

  async applyTemplateToUserType(userTypeId: string, templateId: string): Promise<Permission[]> {
    const response = await api.post<{ permissions: Permission[] }>(`/billing/user-types/${userTypeId}/apply-template`, {
      template_id: templateId,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to apply template to user type');
    }
    return response.data.permissions;
  }

  // ============================================================================
  // PERMISSION TEMPLATES
  // ============================================================================

  async listPermissionTemplates(): Promise<PermissionTemplate[]> {
    const response = await api.get<{ templates: PermissionTemplate[] }>('/billing/permission-templates');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch permission templates');
    }
    return response.data.templates;
  }

  async getPermissionTemplate(id: string): Promise<PermissionTemplateWithPermissions> {
    const response = await api.get<{ template: PermissionTemplateWithPermissions }>(`/billing/permission-templates/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch permission template');
    }
    return response.data.template;
  }

  async createPermissionTemplate(data: CreatePermissionTemplateData): Promise<PermissionTemplate> {
    const response = await api.post<{ template: PermissionTemplate }>('/billing/permission-templates', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create permission template');
    }
    return response.data.template;
  }

  async updatePermissionTemplate(id: string, data: UpdatePermissionTemplateData): Promise<PermissionTemplate> {
    const response = await api.patch<{ template: PermissionTemplate }>(`/billing/permission-templates/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update permission template');
    }
    return response.data.template;
  }

  async deletePermissionTemplate(id: string): Promise<void> {
    const response = await api.delete(`/billing/permission-templates/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete permission template');
    }
  }

  // ============================================================================
  // SUBSCRIPTION TYPE PERMISSIONS (NEW)
  // ============================================================================

  /**
   * Get permissions for a subscription type
   */
  async getSubscriptionTypePermissions(subscriptionTypeId: string): Promise<Permission[]> {
    const response = await api.get<{ permissions: Permission[] }>(
      `/billing/subscription-types/${subscriptionTypeId}/permissions`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription type permissions');
    }
    return response.data.permissions;
  }

  /**
   * Update permissions for a subscription type
   */
  async updateSubscriptionTypePermissions(
    subscriptionTypeId: string,
    permissionIds: string[]
  ): Promise<Permission[]> {
    const response = await api.put<{ permissions: Permission[] }>(
      `/billing/subscription-types/${subscriptionTypeId}/permissions`,
      { permission_ids: permissionIds }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update subscription type permissions');
    }
    return response.data.permissions;
  }

  /**
   * Get subscription type with permissions included
   */
  async getSubscriptionTypeWithPermissions(id: string): Promise<SubscriptionTypeWithPermissions> {
    const [subscriptionType, permissions] = await Promise.all([
      this.getSubscriptionType(id),
      this.getSubscriptionTypePermissions(id),
    ]);

    return {
      ...subscriptionType,
      permissions,
    };
  }
}

export const billingService = new BillingService();
