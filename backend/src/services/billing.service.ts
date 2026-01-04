import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import {
  UserType,
  BillingStatus,
  SubscriptionType,
  SubscriptionTypeWithLimits,
  SubscriptionLimit,
  UserSubscription,
  UserSubscriptionWithDetails,
  LimitCheckResult,
  UserBillingInfo,
  CreateUserTypeRequest,
  UpdateUserTypeRequest,
  CreateBillingStatusRequest,
  UpdateBillingStatusRequest,
  CreateSubscriptionTypeRequest,
  UpdateSubscriptionTypeRequest,
  CreateSubscriptionLimitRequest,
  UpdateSubscriptionLimitRequest,
  CreateUserSubscriptionRequest,
  UpdateUserSubscriptionRequest,
  SubscriptionTypeListParams,
  UserSubscriptionListParams,
  UserSubscriptionListResponse,
} from '../types/billing.types';

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * List all user types
 */
export const listUserTypes = async (): Promise<UserType[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('user_types')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch user types');
  }

  return data || [];
};

/**
 * Get single user type by ID
 */
export const getUserType = async (id: string): Promise<UserType> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('user_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'User type not found');
  }

  return data;
};

/**
 * Get user type by name
 */
export const getUserTypeByName = async (name: string): Promise<UserType | null> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('user_types')
    .select('*')
    .eq('name', name)
    .single();

  if (error) return null;
  return data;
};

/**
 * Create a new user type
 */
export const createUserType = async (
  input: CreateUserTypeRequest,
  actorId: string
): Promise<UserType> => {
  const supabase = getAdminClient();

  // Check for duplicate name
  const existing = await getUserTypeByName(input.name);
  if (existing) {
    throw new AppError('CONFLICT', 'A user type with this name already exists');
  }

  const { data, error } = await supabase
    .from('user_types')
    .insert({
      name: input.name,
      display_name: input.display_name,
      description: input.description || null,
      is_system_type: false,
      can_have_subscription: input.can_have_subscription ?? false,
      can_have_team: input.can_have_team ?? false,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create user type');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.created' as any,
    entity_type: 'user' as any,
    entity_id: data.id,
    new_data: { type: 'user_type', ...input },
  });

  return data;
};

/**
 * Update a user type
 */
export const updateUserType = async (
  id: string,
  input: UpdateUserTypeRequest,
  actorId: string
): Promise<UserType> => {
  const supabase = getAdminClient();

  const current = await getUserType(id);

  // Cannot update system type name
  if (current.is_system_type && input.display_name === undefined) {
    // Allow updating display name and other fields, but not deleting
  }

  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.display_name !== undefined) updateData.display_name = input.display_name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.can_have_subscription !== undefined) updateData.can_have_subscription = input.can_have_subscription;
  if (input.can_have_team !== undefined) updateData.can_have_team = input.can_have_team;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from('user_types')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update user type');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: { type: 'user_type', ...current },
    new_data: { type: 'user_type', ...input },
  });

  return data;
};

/**
 * Delete a user type
 */
export const deleteUserType = async (id: string, actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getUserType(id);

  if (current.is_system_type) {
    throw new AppError('FORBIDDEN', 'Cannot delete system user types');
  }

  // Check if any users have this type
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_type_id', id)
    .limit(1);

  if (users && users.length > 0) {
    throw new AppError('CONFLICT', 'Cannot delete user type that is assigned to users');
  }

  const { error } = await supabase
    .from('user_types')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete user type');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.deleted' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: { type: 'user_type', ...current },
  });
};

// ============================================================================
// BILLING STATUSES
// ============================================================================

/**
 * List all billing statuses
 */
export const listBillingStatuses = async (): Promise<BillingStatus[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('billing_statuses')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch billing statuses');
  }

  return data || [];
};

/**
 * Get single billing status by ID
 */
export const getBillingStatus = async (id: string): Promise<BillingStatus> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('billing_statuses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Billing status not found');
  }

  return data;
};

/**
 * Get billing status by name
 */
export const getBillingStatusByName = async (name: string): Promise<BillingStatus | null> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('billing_statuses')
    .select('*')
    .eq('name', name)
    .single();

  if (error) return null;
  return data;
};

/**
 * Create a new billing status
 */
export const createBillingStatus = async (
  input: CreateBillingStatusRequest,
  actorId: string
): Promise<BillingStatus> => {
  const supabase = getAdminClient();

  const existing = await getBillingStatusByName(input.name);
  if (existing) {
    throw new AppError('CONFLICT', 'A billing status with this name already exists');
  }

  const { data, error } = await supabase
    .from('billing_statuses')
    .insert({
      name: input.name,
      display_name: input.display_name,
      description: input.description || null,
      is_system_status: false,
      color: input.color ?? 'default',
      feature_access_level: input.feature_access_level ?? 0,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create billing status');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.created' as any,
    entity_type: 'user' as any,
    entity_id: data.id,
    new_data: { type: 'billing_status', ...input },
  });

  return data;
};

/**
 * Update a billing status
 */
export const updateBillingStatus = async (
  id: string,
  input: UpdateBillingStatusRequest,
  actorId: string
): Promise<BillingStatus> => {
  const supabase = getAdminClient();

  const current = await getBillingStatus(id);

  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.display_name !== undefined) updateData.display_name = input.display_name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.feature_access_level !== undefined) updateData.feature_access_level = input.feature_access_level;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from('billing_statuses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update billing status');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: { type: 'billing_status', ...current },
    new_data: { type: 'billing_status', ...input },
  });

  return data;
};

/**
 * Delete a billing status
 */
export const deleteBillingStatus = async (id: string, actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getBillingStatus(id);

  if (current.is_system_status) {
    throw new AppError('FORBIDDEN', 'Cannot delete system billing statuses');
  }

  // Check if any subscriptions use this status
  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('billing_status_id', id)
    .limit(1);

  if (subscriptions && subscriptions.length > 0) {
    throw new AppError('CONFLICT', 'Cannot delete billing status that is in use');
  }

  const { error } = await supabase
    .from('billing_statuses')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete billing status');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.deleted' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: { type: 'billing_status', ...current },
  });
};

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

/**
 * List all subscription types
 */
export const listSubscriptionTypes = async (
  params?: SubscriptionTypeListParams
): Promise<SubscriptionTypeWithLimits[]> => {
  const supabase = getAdminClient();

  let query = supabase
    .from('subscription_types')
    .select(`
      *,
      limits:subscription_limits (*)
    `);

  if (params?.is_active !== undefined) {
    query = query.eq('is_active', params.is_active);
  }
  if (params?.is_recurring !== undefined) {
    query = query.eq('is_recurring', params.is_recurring);
  }

  const sortBy = params?.sortBy || 'sort_order';
  const sortOrder = params?.sortOrder || 'asc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch subscription types');
  }

  return (data || []).map((item: any) => ({
    ...item,
    limits: item.limits || [],
  }));
};

/**
 * Get single subscription type by ID
 */
export const getSubscriptionType = async (id: string): Promise<SubscriptionTypeWithLimits> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('subscription_types')
    .select(`
      *,
      limits:subscription_limits (*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Subscription type not found');
  }

  return {
    ...data,
    limits: data.limits || [],
  };
};

/**
 * Get subscription type by name
 */
export const getSubscriptionTypeByName = async (name: string): Promise<SubscriptionType | null> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('subscription_types')
    .select('*')
    .eq('name', name)
    .single();

  if (error) return null;
  return data;
};

/**
 * Create a new subscription type
 */
export const createSubscriptionType = async (
  input: CreateSubscriptionTypeRequest,
  actorId: string
): Promise<SubscriptionTypeWithLimits> => {
  const supabase = getAdminClient();

  const existing = await getSubscriptionTypeByName(input.name);
  if (existing) {
    throw new AppError('CONFLICT', 'A subscription type with this name already exists');
  }

  const { data, error } = await supabase
    .from('subscription_types')
    .insert({
      name: input.name,
      display_name: input.display_name,
      description: input.description || null,
      billing_cycle_days: input.billing_cycle_days ?? null,
      is_recurring: input.is_recurring ?? true,
      price_cents: input.price_cents ?? 0,
      currency: input.currency ?? 'USD',
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create subscription type');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.created' as any,
    entity_type: 'user' as any,
    entity_id: data.id,
    new_data: { type: 'subscription_type', ...input },
  });

  return { ...data, limits: [] };
};

/**
 * Update a subscription type
 */
export const updateSubscriptionType = async (
  id: string,
  input: UpdateSubscriptionTypeRequest,
  actorId: string
): Promise<SubscriptionTypeWithLimits> => {
  const supabase = getAdminClient();

  const current = await getSubscriptionType(id);

  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.display_name !== undefined) updateData.display_name = input.display_name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.billing_cycle_days !== undefined) updateData.billing_cycle_days = input.billing_cycle_days;
  if (input.is_recurring !== undefined) updateData.is_recurring = input.is_recurring;
  if (input.price_cents !== undefined) updateData.price_cents = input.price_cents;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from('subscription_types')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update subscription type');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: { type: 'subscription_type', ...current },
    new_data: { type: 'subscription_type', ...input },
  });

  return getSubscriptionType(id);
};

/**
 * Delete a subscription type
 */
export const deleteSubscriptionType = async (id: string, actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getSubscriptionType(id);

  // Check if any subscriptions use this type
  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('subscription_type_id', id)
    .limit(1);

  if (subscriptions && subscriptions.length > 0) {
    throw new AppError('CONFLICT', 'Cannot delete subscription type that is in use');
  }

  // Delete limits first (cascade should handle this, but be explicit)
  await supabase
    .from('subscription_limits')
    .delete()
    .eq('subscription_type_id', id);

  const { error } = await supabase
    .from('subscription_types')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete subscription type');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.deleted' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: { type: 'subscription_type', ...current },
  });
};

// ============================================================================
// SUBSCRIPTION LIMITS
// ============================================================================

/**
 * Get limits for a subscription type
 */
export const getSubscriptionLimits = async (subscriptionTypeId: string): Promise<SubscriptionLimit[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('subscription_limits')
    .select('*')
    .eq('subscription_type_id', subscriptionTypeId)
    .order('limit_key', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch subscription limits');
  }

  return data || [];
};

/**
 * Create a subscription limit
 */
export const createSubscriptionLimit = async (
  input: CreateSubscriptionLimitRequest,
  actorId: string
): Promise<SubscriptionLimit> => {
  const supabase = getAdminClient();

  // Verify subscription type exists
  await getSubscriptionType(input.subscription_type_id);

  const { data, error } = await supabase
    .from('subscription_limits')
    .insert({
      subscription_type_id: input.subscription_type_id,
      limit_key: input.limit_key,
      limit_value: input.limit_value,
      description: input.description || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('CONFLICT', 'A limit with this key already exists for this subscription type');
    }
    throw new AppError('INTERNAL_ERROR', 'Failed to create subscription limit');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.created' as any,
    entity_type: 'user' as any,
    entity_id: data.id,
    new_data: { type: 'subscription_limit', ...input },
  });

  return data;
};

/**
 * Update a subscription limit
 */
export const updateSubscriptionLimit = async (
  id: string,
  input: UpdateSubscriptionLimitRequest,
  actorId: string
): Promise<SubscriptionLimit> => {
  const supabase = getAdminClient();

  const { data: current, error: fetchError } = await supabase
    .from('subscription_limits')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    throw new AppError('NOT_FOUND', 'Subscription limit not found');
  }

  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.limit_value !== undefined) updateData.limit_value = input.limit_value;
  if (input.description !== undefined) updateData.description = input.description;

  const { data, error } = await supabase
    .from('subscription_limits')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update subscription limit');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: { type: 'subscription_limit', ...current },
    new_data: { type: 'subscription_limit', ...input },
  });

  return data;
};

/**
 * Delete a subscription limit
 */
export const deleteSubscriptionLimit = async (id: string, actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  const { data: current, error: fetchError } = await supabase
    .from('subscription_limits')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !current) {
    throw new AppError('NOT_FOUND', 'Subscription limit not found');
  }

  const { error } = await supabase
    .from('subscription_limits')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete subscription limit');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.deleted' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: { type: 'subscription_limit', ...current },
  });
};

/**
 * Bulk update limits for a subscription type
 */
export const bulkUpdateLimits = async (
  subscriptionTypeId: string,
  limits: { limit_key: string; limit_value: number; description?: string }[],
  actorId: string
): Promise<SubscriptionLimit[]> => {
  const supabase = getAdminClient();

  // Verify subscription type exists
  await getSubscriptionType(subscriptionTypeId);

  // Get current limits
  const currentLimits = await getSubscriptionLimits(subscriptionTypeId);

  // Upsert each limit
  for (const limit of limits) {
    const existing = currentLimits.find((l) => l.limit_key === limit.limit_key);

    if (existing) {
      await supabase
        .from('subscription_limits')
        .update({
          limit_value: limit.limit_value,
          description: limit.description ?? existing.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('subscription_limits')
        .insert({
          subscription_type_id: subscriptionTypeId,
          limit_key: limit.limit_key,
          limit_value: limit.limit_value,
          description: limit.description || null,
        });
    }
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user' as any,
    entity_id: subscriptionTypeId,
    new_data: { type: 'subscription_limits_bulk', limits },
  });

  return getSubscriptionLimits(subscriptionTypeId);
};

// ============================================================================
// USER SUBSCRIPTIONS
// ============================================================================

/**
 * Get user's active subscription
 */
export const getUserSubscription = async (userId: string): Promise<UserSubscriptionWithDetails | null> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      subscription_type:subscription_types (*),
      billing_status:billing_statuses (*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  // Get limits as a map
  const limits = await getSubscriptionLimits(data.subscription_type_id);
  const limitsMap: Record<string, number> = {};
  for (const limit of limits) {
    limitsMap[limit.limit_key] = limit.limit_value;
  }

  return {
    ...data,
    subscription_type: data.subscription_type,
    billing_status: data.billing_status,
    limits: limitsMap,
  };
};

/**
 * Create a user subscription
 */
export const createUserSubscription = async (
  input: CreateUserSubscriptionRequest,
  actorId: string
): Promise<UserSubscriptionWithDetails> => {
  const supabase = getAdminClient();

  // Check if user already has an active subscription
  const existing = await getUserSubscription(input.user_id);
  if (existing) {
    throw new AppError('CONFLICT', 'User already has an active subscription');
  }

  // Verify subscription type and billing status exist
  await getSubscriptionType(input.subscription_type_id);
  await getBillingStatus(input.billing_status_id);

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: input.user_id,
      subscription_type_id: input.subscription_type_id,
      billing_status_id: input.billing_status_id,
      started_at: new Date().toISOString(),
      expires_at: input.expires_at || null,
      trial_ends_at: input.trial_ends_at || null,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create user subscription');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user',
    entity_id: input.user_id,
    new_data: { type: 'user_subscription', ...input },
  });

  const result = await getUserSubscription(input.user_id);
  if (!result) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch created subscription');
  }
  return result;
};

/**
 * Update a user subscription
 */
export const updateUserSubscription = async (
  userId: string,
  input: UpdateUserSubscriptionRequest,
  actorId: string
): Promise<UserSubscriptionWithDetails> => {
  const supabase = getAdminClient();

  const current = await getUserSubscription(userId);
  if (!current) {
    throw new AppError('NOT_FOUND', 'User subscription not found');
  }

  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.subscription_type_id !== undefined) {
    await getSubscriptionType(input.subscription_type_id);
    updateData.subscription_type_id = input.subscription_type_id;
  }
  if (input.billing_status_id !== undefined) {
    await getBillingStatus(input.billing_status_id);
    updateData.billing_status_id = input.billing_status_id;
  }
  if (input.expires_at !== undefined) updateData.expires_at = input.expires_at;
  if (input.trial_ends_at !== undefined) updateData.trial_ends_at = input.trial_ends_at;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { error } = await supabase
    .from('user_subscriptions')
    .update(updateData)
    .eq('id', current.id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update user subscription');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user',
    entity_id: userId,
    old_data: { type: 'user_subscription', ...current },
    new_data: { type: 'user_subscription', ...input },
  });

  const result = await getUserSubscription(userId);
  if (!result) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch updated subscription');
  }
  return result;
};

/**
 * Cancel a user subscription
 */
export const cancelUserSubscription = async (
  userId: string,
  reason: string | undefined,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getUserSubscription(userId);
  if (!current) {
    throw new AppError('NOT_FOUND', 'User subscription not found');
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      is_active: false,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to cancel subscription');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user',
    entity_id: userId,
    old_data: { type: 'user_subscription', ...current },
    new_data: { type: 'user_subscription_cancelled', reason },
  });
};

/**
 * List user subscriptions with filters
 */
export const listUserSubscriptions = async (
  params: UserSubscriptionListParams
): Promise<UserSubscriptionListResponse> => {
  const supabase = getAdminClient();

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('user_subscriptions')
    .select(`
      *,
      subscription_type:subscription_types (*),
      billing_status:billing_statuses (*),
      user:user_profiles (id, email, full_name)
    `, { count: 'exact' });

  if (params.billing_status_id) {
    query = query.eq('billing_status_id', params.billing_status_id);
  }
  if (params.subscription_type_id) {
    query = query.eq('subscription_type_id', params.subscription_type_id);
  }
  if (params.is_active !== undefined) {
    query = query.eq('is_active', params.is_active);
  }
  if (params.expires_before) {
    query = query.lt('expires_at', params.expires_before);
  }
  if (params.expires_after) {
    query = query.gt('expires_at', params.expires_after);
  }

  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch user subscriptions');
  }

  const total = count || 0;

  // Get limits for each subscription type
  const subscriptionsWithLimits: UserSubscriptionWithDetails[] = await Promise.all(
    (data || []).map(async (sub: any) => {
      const limits = await getSubscriptionLimits(sub.subscription_type_id);
      const limitsMap: Record<string, number> = {};
      for (const limit of limits) {
        limitsMap[limit.limit_key] = limit.limit_value;
      }
      return {
        ...sub,
        limits: limitsMap,
      };
    })
  );

  return {
    subscriptions: subscriptionsWithLimits,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ============================================================================
// LIMIT CHECKING
// ============================================================================

/**
 * Check if user is within a specific limit
 */
export const checkUserLimit = async (
  userId: string,
  limitKey: string,
  currentCount: number
): Promise<LimitCheckResult> => {
  const supabase = getAdminClient();

  // Check if user is a team member (use parent's subscription)
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('parent_user_id')
    .eq('id', userId)
    .single();

  const effectiveUserId = userProfile?.parent_user_id || userId;

  const subscription = await getUserSubscription(effectiveUserId);

  if (!subscription) {
    return {
      is_within_limit: false,
      limit_value: 0,
      current_count: currentCount,
      remaining: 0,
    };
  }

  const limitValue = subscription.limits[limitKey] ?? 0;

  if (limitValue === -1) {
    // -1 means unlimited
    return {
      is_within_limit: true,
      limit_value: -1,
      current_count: currentCount,
      remaining: -1,
    };
  }

  return {
    is_within_limit: currentCount < limitValue,
    limit_value: limitValue,
    current_count: currentCount,
    remaining: Math.max(0, limitValue - currentCount),
  };
};

// ============================================================================
// USER BILLING INFO
// ============================================================================

/**
 * Get complete billing info for a user
 */
export const getUserBillingInfo = async (userId: string): Promise<UserBillingInfo> => {
  const supabase = getAdminClient();

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_type_id, parent_user_id')
    .eq('id', userId)
    .single();

  let userType: UserType | null = null;
  if (userProfile?.user_type_id) {
    userType = await getUserType(userProfile.user_type_id);
  }

  const subscription = await getUserSubscription(userId);

  return {
    user_type: userType,
    subscription,
    parent_user_id: userProfile?.parent_user_id || null,
    is_team_member: !!userProfile?.parent_user_id,
  };
};

/**
 * Assign user type to a user
 */
export const assignUserType = async (
  userId: string,
  userTypeId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify user type exists
  await getUserType(userTypeId);

  const { error } = await supabase
    .from('user_profiles')
    .update({
      user_type_id: userTypeId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to assign user type');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user',
    entity_id: userId,
    new_data: { type: 'user_type_assignment', user_type_id: userTypeId },
  });
};
