import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import {
  getUserSubscription,
  getSubscriptionType,
  updateUserSubscription,
} from './billing.service';
import {
  SubscriptionUpgradeRequest,
  SubscriptionUpgradeRequestWithDetails,
  CreateUpgradeRequestInput,
  RespondToUpgradeInput,
  UpgradeRequestListParams,
  UpgradeRequestListResponse,
  UpgradeRequestStatus,
} from '../types/billing.types';

// ============================================================================
// CREATE UPGRADE REQUEST
// ============================================================================

/**
 * Create a new subscription upgrade request (admin-initiated)
 * Validates that target plan is higher-tier than current plan
 */
export const createUpgradeRequest = async (
  input: CreateUpgradeRequestInput,
  adminId: string
): Promise<SubscriptionUpgradeRequest> => {
  const supabase = getAdminClient();

  // 1. Get user's current subscription
  const currentSubscription = await getUserSubscription(input.user_id);

  // 2. Get current and target plan details
  const [currentPlan, targetPlan] = await Promise.all([
    getSubscriptionType(currentSubscription.subscription_type_id),
    getSubscriptionType(input.target_plan_id),
  ]);

  // 3. Validate target plan is active
  if (!targetPlan.is_active) {
    throw new AppError('VALIDATION_ERROR', 'Target plan is not available');
  }

  // 4. Validate upgrade is to higher-tier plan (check price)
  // Get the current billing interval to compare correct price tiers
  const currentPrice = getCurrentPlanPrice(currentPlan, currentSubscription);
  const targetPrice = getCurrentPlanPrice(targetPlan, currentSubscription);

  if (targetPrice <= currentPrice) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Can only upgrade to higher-tier plans. Target plan must have higher price than current plan.'
    );
  }

  // 5. Check if user already has a pending upgrade request
  const { data: existingRequest } = await supabase
    .from('subscription_upgrade_requests')
    .select('id')
    .eq('user_id', input.user_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingRequest) {
    throw new AppError(
      'VALIDATION_ERROR',
      'User already has a pending upgrade request'
    );
  }

  // 6. Create upgrade request (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from('subscription_upgrade_requests')
    .insert({
      user_id: input.user_id,
      current_subscription_id: currentSubscription.id,
      requested_subscription_type_id: input.target_plan_id,
      requested_by_admin_id: adminId,
      status: 'pending',
      admin_notes: input.admin_notes || null,
      requested_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create upgrade request');
  }

  // 7. Create audit log
  await createAuditLog({
    user_id: adminId,
    action: 'subscription_upgrade_requested',
    resource_type: 'subscription_upgrade_request',
    resource_id: data.id,
    details: {
      target_user_id: input.user_id,
      current_plan_id: currentSubscription.subscription_type_id,
      target_plan_id: input.target_plan_id,
      admin_notes: input.admin_notes,
    },
  });

  return data;
};

/**
 * Helper: Get current price based on subscription's billing interval
 */
function getCurrentPlanPrice(plan: any, subscription: any): number {
  const billingInterval = subscription.billing_interval || 'monthly';

  if (billingInterval === 'monthly') {
    return plan.pricing_tiers?.monthly?.price_cents || plan.price_cents || 0;
  } else if (billingInterval === 'annual') {
    return plan.pricing_tiers?.annual?.price_cents || plan.price_cents || 0;
  }

  return plan.price_cents || 0;
}

// ============================================================================
// RESPOND TO UPGRADE REQUEST
// ============================================================================

/**
 * User accepts or declines an upgrade request
 */
export const respondToUpgradeRequest = async (
  requestId: string,
  userId: string,
  input: RespondToUpgradeInput
): Promise<SubscriptionUpgradeRequest> => {
  const supabase = getAdminClient();

  // 1. Get the upgrade request
  const { data: request, error: fetchError } = await supabase
    .from('subscription_upgrade_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new AppError('NOT_FOUND', 'Upgrade request not found');
  }

  // 2. Validate user owns this request
  if (request.user_id !== userId) {
    throw new AppError('FORBIDDEN', 'Not authorized to respond to this request');
  }

  // 3. Validate request is still pending
  if (request.status !== 'pending') {
    throw new AppError('VALIDATION_ERROR', `Request is already ${request.status}`);
  }

  // 4. Check if request has expired
  if (new Date(request.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from('subscription_upgrade_requests')
      .update({ status: 'expired' })
      .eq('id', requestId);

    throw new AppError('VALIDATION_ERROR', 'This upgrade request has expired');
  }

  // 5. Update request with user's response
  const newStatus: UpgradeRequestStatus = input.accepted ? 'accepted' : 'declined';

  const { data, error } = await supabase
    .from('subscription_upgrade_requests')
    .update({
      status: newStatus,
      user_response_notes: input.user_response_notes || null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update upgrade request');
  }

  // 6. Create audit log
  await createAuditLog({
    user_id: userId,
    action: `subscription_upgrade_${newStatus}`,
    resource_type: 'subscription_upgrade_request',
    resource_id: requestId,
    details: {
      status: newStatus,
      user_response_notes: input.user_response_notes,
    },
  });

  return data;
};

// ============================================================================
// PROCESS UPGRADE REQUEST (Execute the upgrade)
// ============================================================================

/**
 * Process an accepted upgrade request (called on next billing cycle)
 * This should be called by a cron job or billing cycle processor
 */
export const processUpgradeRequest = async (
  requestId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // 1. Get the upgrade request
  const { data: request, error: fetchError } = await supabase
    .from('subscription_upgrade_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new AppError('NOT_FOUND', 'Upgrade request not found');
  }

  // 2. Validate request is accepted
  if (request.status !== 'accepted') {
    throw new AppError(
      'VALIDATION_ERROR',
      'Can only process accepted upgrade requests'
    );
  }

  // 3. Update user's subscription to new plan
  await updateUserSubscription(request.user_id, {
    subscription_type_id: request.requested_subscription_type_id,
  }, request.requested_by_admin_id);

  // 4. Create audit log
  await createAuditLog({
    user_id: request.requested_by_admin_id,
    action: 'subscription_upgrade_processed',
    resource_type: 'subscription_upgrade_request',
    resource_id: requestId,
    details: {
      user_id: request.user_id,
      new_subscription_type_id: request.requested_subscription_type_id,
    },
  });
};

// ============================================================================
// GET USER'S PENDING UPGRADE
// ============================================================================

/**
 * Check if user has a pending upgrade request
 */
export const getUserPendingUpgrade = async (
  userId: string
): Promise<SubscriptionUpgradeRequestWithDetails | null> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('subscription_upgrade_requests')
    .select(`
      *,
      user:users!user_id (
        id,
        full_name,
        email
      ),
      current_subscription:user_subscriptions!current_subscription_id (
        *,
        subscription_type:subscription_types (*)
      ),
      requested_subscription_type:subscription_types!requested_subscription_type_id (*),
      requested_by_admin:users!requested_by_admin_id (
        id,
        full_name,
        email
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch pending upgrade');
  }

  // Check if expired
  if (data && new Date(data.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from('subscription_upgrade_requests')
      .update({ status: 'expired' })
      .eq('id', data.id);

    return null;
  }

  return data;
};

// ============================================================================
// LIST UPGRADE REQUESTS (Admin)
// ============================================================================

/**
 * List upgrade requests with filtering
 */
export const listUpgradeRequests = async (
  params: UpgradeRequestListParams = {}
): Promise<UpgradeRequestListResponse> => {
  const supabase = getAdminClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('subscription_upgrade_requests')
    .select(`
      *,
      user:users!user_id (
        id,
        full_name,
        email
      ),
      current_subscription:user_subscriptions!current_subscription_id (
        *,
        subscription_type:subscription_types (*)
      ),
      requested_subscription_type:subscription_types!requested_subscription_type_id (*),
      requested_by_admin:users!requested_by_admin_id (
        id,
        full_name,
        email
      )
    `, { count: 'exact' });

  // Apply filters
  if (params.user_id) {
    query = query.eq('user_id', params.user_id);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.requested_by_admin_id) {
    query = query.eq('requested_by_admin_id', params.requested_by_admin_id);
  }

  // Pagination
  query = query
    .order('requested_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch upgrade requests');
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    requests: (data || []) as SubscriptionUpgradeRequestWithDetails[],
    total,
    page,
    limit,
    totalPages,
  };
};

// ============================================================================
// EXPIRE OLD REQUESTS (Cleanup Job)
// ============================================================================

/**
 * Mark expired requests as expired (to be run as scheduled task)
 */
export const expireOldRequests = async (): Promise<number> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('subscription_upgrade_requests')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to expire old requests');
  }

  return data?.length || 0;
};
