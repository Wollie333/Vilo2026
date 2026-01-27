import { api } from './api.service';

// ============================================================================
// TYPES
// ============================================================================

export interface SubscriptionDisplayInfo {
  subscription: any;
  plan_name: string;
  plan_display_name: string;
  current_price_cents: number;
  current_price_formatted: string;
  billing_interval: 'monthly' | 'annual' | 'one_off' | null;
  billing_interval_label: string;
  next_billing_date: string | null;
  status: string;
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

export interface UpgradeRequestInput {
  target_plan_id: string;
  admin_notes?: string;
}

export interface PauseSubscriptionInput {
  reason: string;
}

export interface CancelSubscriptionInput {
  reason: string;
}

// ============================================================================
// ADMIN SUBSCRIPTION SERVICE
// ============================================================================

/**
 * Get formatted subscription display information for admin UI
 */
export const getSubscriptionDisplay = async (
  userId: string
): Promise<SubscriptionDisplayInfo> => {
  const response = await api.get(`/admin/users/${userId}/subscription/display`);
  return response.data.subscription;
};

/**
 * Get available upgrade plans for a user (higher-tier only)
 */
export const getAvailableUpgradePlans = async (userId: string): Promise<any> => {
  const response = await api.get(`/admin/users/${userId}/available-upgrades`);
  return response.data;
};

/**
 * Request an upgrade for a user
 */
export const requestUpgrade = async (
  userId: string,
  input: UpgradeRequestInput
): Promise<any> => {
  const response = await api.post(`/admin/users/${userId}/subscription/upgrade`, input);
  return response.data;
};

/**
 * Pause a user's subscription
 */
export const pauseSubscription = async (
  userId: string,
  reason: string
): Promise<any> => {
  const response = await api.post(`/admin/users/${userId}/subscription/pause`, {
    reason,
  });
  return response.data;
};

/**
 * Cancel a user's subscription
 */
export const cancelSubscription = async (
  userId: string,
  reason: string
): Promise<any> => {
  const response = await api.post(`/admin/users/${userId}/subscription/cancel`, {
    reason,
  });
  return response.data;
};

/**
 * Reactivate a paused subscription
 */
export const reactivateSubscription = async (userId: string): Promise<any> => {
  const response = await api.post(`/admin/users/${userId}/subscription/reactivate`);
  return response.data;
};

/**
 * List all upgrade requests (admin view)
 */
export const listUpgradeRequests = async (params?: {
  user_id?: string;
  status?: string;
  requested_by_admin_id?: string;
  page?: number;
  limit?: number;
}): Promise<any> => {
  const response = await api.get('/admin/upgrade-requests', { params });
  return response.data;
};

export default {
  getSubscriptionDisplay,
  getAvailableUpgradePlans,
  requestUpgrade,
  pauseSubscription,
  cancelSubscription,
  reactivateSubscription,
  listUpgradeRequests,
};
