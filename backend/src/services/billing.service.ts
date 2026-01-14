import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import {
  UserType,
  SubscriptionType,
  UserSubscription,
  UserSubscriptionWithDetails,
  LimitCheckResult,
  UserBillingInfo,
  BillingOverview,
  CreateUserTypeRequest,
  UpdateUserTypeRequest,
  CreateSubscriptionTypeRequest,
  UpdateSubscriptionTypeRequest,
  CreateUserSubscriptionRequest,
  UpdateUserSubscriptionRequest,
  SubscriptionTypeListParams,
  UserSubscriptionListParams,
  UserSubscriptionListResponse,
  SubscriptionStatus,
  PermissionTemplate,
  CreatePermissionTemplateRequest,
  UpdatePermissionTemplateRequest,
  SubscriptionAccessStatus,
  PermissionCategory,
  PERMISSION_CATEGORIES,
  Permission,
  PricingTiersEnhanced,
  BillingTypesEnabled,
} from '../types/billing.types';

// ============================================================================
// USER TYPES (MEMBER TYPES)
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

  const { data: users } = await supabase
    .from('users')
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
// SUBSCRIPTION TYPES (with embedded JSONB limits)
// ============================================================================

/**
 * List all subscription types with embedded limits
 */
export const listSubscriptionTypes = async (
  params?: SubscriptionTypeListParams
): Promise<SubscriptionType[]> => {
  const supabase = getAdminClient();

  let query = supabase.from('subscription_types').select('*');

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

  // Ensure limits and pricing are always objects
  return (data || []).map((item: any) => ({
    ...item,
    limits: item.limits || {},
    pricing: item.pricing || { monthly: 0, annual: 0 },
  }));
};

/**
 * Get single subscription type by ID
 */
export const getSubscriptionType = async (id: string): Promise<SubscriptionType> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('subscription_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Subscription type not found');
  }

  return {
    ...data,
    limits: data.limits || {},
    pricing: data.pricing || { monthly: 0, annual: 0 },
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
  return { ...data, limits: data.limits || {}, pricing: data.pricing || { monthly: 0, annual: 0 } };
};

/**
 * Create a new subscription type with limits and enhanced billing support
 */
export const createSubscriptionType = async (
  input: CreateSubscriptionTypeRequest,
  actorId: string
): Promise<SubscriptionType> => {
  const supabase = getAdminClient();

  const existing = await getSubscriptionTypeByName(input.name);
  if (existing) {
    throw new AppError('CONFLICT', 'A subscription type with this name already exists');
  }

  // Validate at least one billing type is enabled (if billing_types is provided)
  if (input.billing_types) {
    const hasEnabled = Object.values(input.billing_types).some((v) => v === true);
    if (!hasEnabled) {
      throw new AppError('VALIDATION_ERROR', 'At least one billing type must be enabled');
    }
  }

  // Build default pricing from price_cents if pricing not provided (backward compatibility)
  const defaultPricing = {
    monthly: input.price_cents ?? 0,
    annual: (input.price_cents ?? 0) * 12,
  };

  // Build pricing_tiers from individual price inputs (UI convenience)
  const pricingTiers: PricingTiersEnhanced = {};
  if (input.billing_types?.monthly && input.monthly_price_cents !== undefined) {
    pricingTiers.monthly = {
      enabled: true,
      price_cents: input.monthly_price_cents,
      billing_cycle_days: 30,
      trial_period_days: input.trial_period_days ?? null,
    };
  }
  if (input.billing_types?.annual && input.annual_price_cents !== undefined) {
    pricingTiers.annual = {
      enabled: true,
      price_cents: input.annual_price_cents,
      billing_cycle_days: 365,
      trial_period_days: input.trial_period_days ?? null,
    };
  }
  if (input.billing_types?.one_off && input.one_off_price_cents !== undefined) {
    pricingTiers.one_off = {
      enabled: true,
      price_cents: input.one_off_price_cents,
    };
  }

  // Use provided pricing_tiers or build from individual inputs
  const finalPricingTiers = input.pricing_tiers || pricingTiers;

  // Default billing_types if not provided (for backward compatibility)
  const billingTypes: BillingTypesEnabled = input.billing_types || {
    monthly: input.is_recurring !== false && (!input.billing_cycle_days || input.billing_cycle_days === 30),
    annual: input.is_recurring !== false && input.billing_cycle_days === 365,
    one_off: input.is_recurring === false,
  };

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
      trial_period_days: input.trial_period_days ?? null,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 0,
      limits: input.limits || {},
      pricing: input.pricing ? { ...defaultPricing, ...input.pricing } : defaultPricing, // Legacy
      billing_types: billingTypes, // NEW
      pricing_tiers: finalPricingTiers, // NEW
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

  return {
    ...data,
    limits: data.limits || {},
    pricing: data.pricing || { monthly: 0, annual: 0 },
    billing_types: data.billing_types || { monthly: false, annual: false, one_off: false },
    pricing_tiers: data.pricing_tiers || {},
  };
};

/**
 * Update a subscription type (including limits and enhanced billing)
 */
export const updateSubscriptionType = async (
  id: string,
  input: UpdateSubscriptionTypeRequest,
  actorId: string
): Promise<SubscriptionType> => {
  const supabase = getAdminClient();

  const current = await getSubscriptionType(id);

  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.display_name !== undefined) updateData.display_name = input.display_name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.billing_cycle_days !== undefined) updateData.billing_cycle_days = input.billing_cycle_days;
  if (input.is_recurring !== undefined) updateData.is_recurring = input.is_recurring;
  if (input.price_cents !== undefined) updateData.price_cents = input.price_cents;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.trial_period_days !== undefined) updateData.trial_period_days = input.trial_period_days;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
  if (input.limits !== undefined) updateData.limits = input.limits;
  if (input.pricing !== undefined) {
    // Merge with existing pricing to allow partial updates (legacy)
    updateData.pricing = { ...(current.pricing || {}), ...input.pricing };
  }

  // NEW: Handle billing_types updates
  if (input.billing_types !== undefined) {
    // Validate at least one billing type is enabled
    const hasEnabled = Object.values(input.billing_types).some((v) => v === true);
    if (!hasEnabled) {
      throw new AppError('VALIDATION_ERROR', 'At least one billing type must be enabled');
    }
    updateData.billing_types = input.billing_types;
  }

  // NEW: Handle pricing_tiers updates (either direct or from individual price inputs)
  if (input.pricing_tiers !== undefined) {
    updateData.pricing_tiers = input.pricing_tiers;
  } else if (
    input.monthly_price_cents !== undefined ||
    input.annual_price_cents !== undefined ||
    input.one_off_price_cents !== undefined
  ) {
    // Build pricing_tiers from individual price inputs (UI convenience)
    const currentPricingTiers = current.pricing_tiers || {};
    const newPricingTiers: PricingTiersEnhanced = { ...currentPricingTiers };

    if (input.monthly_price_cents !== undefined && input.billing_types?.monthly !== false) {
      newPricingTiers.monthly = {
        enabled: true,
        price_cents: input.monthly_price_cents,
        billing_cycle_days: 30,
        trial_period_days: input.trial_period_days ?? current.trial_period_days ?? null,
      };
    }
    if (input.annual_price_cents !== undefined && input.billing_types?.annual !== false) {
      newPricingTiers.annual = {
        enabled: true,
        price_cents: input.annual_price_cents,
        billing_cycle_days: 365,
        trial_period_days: input.trial_period_days ?? current.trial_period_days ?? null,
      };
    }
    if (input.one_off_price_cents !== undefined && input.billing_types?.one_off !== false) {
      newPricingTiers.one_off = {
        enabled: true,
        price_cents: input.one_off_price_cents,
      };
    }

    updateData.pricing_tiers = newPricingTiers;
  }

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

  return {
    ...data,
    limits: data.limits || {},
    pricing: data.pricing || { monthly: 0, annual: 0 },
    billing_types: data.billing_types || { monthly: false, annual: false, one_off: false },
    pricing_tiers: data.pricing_tiers || {},
  };
};

/**
 * Delete a subscription type
 */
export const deleteSubscriptionType = async (id: string, actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getSubscriptionType(id);

  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('subscription_type_id', id)
    .limit(1);

  if (subscriptions && subscriptions.length > 0) {
    throw new AppError('CONFLICT', 'Cannot delete subscription type that is in use');
  }

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
// USER SUBSCRIPTIONS (with status field)
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
      subscription_type:subscription_types (*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  const subscriptionType = data.subscription_type as SubscriptionType;

  return {
    id: data.id,
    user_id: data.user_id,
    subscription_type_id: data.subscription_type_id,
    status: (data.status || 'active') as SubscriptionStatus,
    started_at: data.started_at,
    expires_at: data.expires_at,
    trial_ends_at: data.trial_ends_at,
    is_active: data.is_active,
    cancelled_at: data.cancelled_at,
    cancellation_reason: data.cancellation_reason,
    created_at: data.created_at,
    updated_at: data.updated_at,
    subscription_type: { ...subscriptionType, limits: subscriptionType.limits || {} },
    limits: subscriptionType.limits || {},
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

  const existing = await getUserSubscription(input.user_id);
  if (existing) {
    throw new AppError('CONFLICT', 'User already has an active subscription');
  }

  await getSubscriptionType(input.subscription_type_id);

  // Use status field directly (per migration 020)
  const status = input.status || 'active';

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: input.user_id,
      subscription_type_id: input.subscription_type_id,
      status,
      started_at: new Date().toISOString(),
      expires_at: input.expires_at || null,
      trial_ends_at: input.trial_ends_at || null,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('=== CREATE SUBSCRIPTION ERROR ===');
    console.error('Error:', error);
    console.error('Input:', JSON.stringify(input, null, 2));
    throw new AppError('INTERNAL_ERROR', `Failed to create user subscription: ${error?.message || 'Unknown error'}`);
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
  if (input.status !== undefined) updateData.status = input.status;
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
      status: 'cancelled' as SubscriptionStatus,
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

// ============================================================================
// SUBSCRIPTION ACCESS STATUS (for paywall/read-only mode)
// ============================================================================

/**
 * Check if user has a pending (unprocessed) checkout
 */
const getPendingCheckout = async (userId: string): Promise<{ id: string } | null> => {
  const supabase = getAdminClient();

  const { data } = await supabase
    .from('checkouts')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data || null;
};

/**
 * Get subscription access status for a user
 * Used to determine if user has full access or should be in read-only mode
 */
export const getSubscriptionAccessStatus = async (userId: string): Promise<SubscriptionAccessStatus> => {
  const subscription = await getUserSubscription(userId);
  const pendingCheckout = await getPendingCheckout(userId);
  const now = new Date();

  // No subscription at all
  if (!subscription) {
    // Check for pending checkout
    if (pendingCheckout) {
      return {
        hasActiveSubscription: false,
        hasFullAccess: false,
        accessMode: 'readonly',
        subscriptionStatus: null,
        trialDaysRemaining: null,
        trialEndsAt: null,
        expiresAt: null,
        requiresPayment: false,
        message: 'Your payment is pending. As soon as your payment is approved, your account will be active. We\'ll let you know.',
        hasPendingCheckout: true,
        pendingCheckoutId: pendingCheckout.id,
      };
    }

    return {
      hasActiveSubscription: false,
      hasFullAccess: false,
      accessMode: 'readonly',
      subscriptionStatus: null,
      trialDaysRemaining: null,
      trialEndsAt: null,
      expiresAt: null,
      requiresPayment: true,
      message: 'Complete payment to unlock all features',
      hasPendingCheckout: false,
      pendingCheckoutId: null,
    };
  }

  const { status, trial_ends_at, expires_at } = subscription;
  const trialEndsAt = trial_ends_at ? new Date(trial_ends_at) : null;
  const expiresAt = expires_at ? new Date(expires_at) : null;

  // Calculate trial days remaining if applicable
  let trialDaysRemaining: number | null = null;
  if (trialEndsAt && status === 'trial') {
    const diffMs = trialEndsAt.getTime() - now.getTime();
    trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Active paid subscription - full access
  if (status === 'active') {
    return {
      hasActiveSubscription: true,
      hasFullAccess: true,
      accessMode: 'full',
      subscriptionStatus: status,
      trialDaysRemaining: null,
      trialEndsAt: trial_ends_at,
      expiresAt: expires_at,
      requiresPayment: false,
      message: '',
      hasPendingCheckout: false,
      pendingCheckoutId: null,
    };
  }

  // Trial subscription
  if (status === 'trial') {
    const trialExpired = trialEndsAt ? now >= trialEndsAt : false;

    if (!trialExpired) {
      // Active trial - full access with countdown
      return {
        hasActiveSubscription: true,
        hasFullAccess: true,
        accessMode: 'full',
        subscriptionStatus: status,
        trialDaysRemaining,
        trialEndsAt: trial_ends_at,
        expiresAt: expires_at,
        requiresPayment: false,
        message: trialDaysRemaining !== null && trialDaysRemaining <= 7
          ? `Your trial ends in ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''}. Subscribe now to keep full access.`
          : '',
        hasPendingCheckout: false,
        pendingCheckoutId: null,
      };
    } else {
      // Trial expired - read-only mode
      return {
        hasActiveSubscription: false,
        hasFullAccess: false,
        accessMode: 'readonly',
        subscriptionStatus: status,
        trialDaysRemaining: 0,
        trialEndsAt: trial_ends_at,
        expiresAt: expires_at,
        requiresPayment: true,
        message: 'Your trial has expired. Subscribe now to continue using all features.',
        hasPendingCheckout: false,
        pendingCheckoutId: null,
      };
    }
  }

  // Cancelled subscription - check if still within paid period
  if (status === 'cancelled') {
    const stillValid = expiresAt ? now < expiresAt : false;
    if (stillValid) {
      const daysRemaining = expiresAt
        ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      return {
        hasActiveSubscription: true,
        hasFullAccess: true,
        accessMode: 'full',
        subscriptionStatus: status,
        trialDaysRemaining: null,
        trialEndsAt: trial_ends_at,
        expiresAt: expires_at,
        requiresPayment: false,
        message: `Your subscription was cancelled. Access ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
        hasPendingCheckout: false,
        pendingCheckoutId: null,
      };
    }
  }

  // Expired, past_due, or cancelled (after expiry) - read-only mode
  const messageMap: Record<string, string> = {
    expired: 'Your subscription has expired. Renew now to continue using all features.',
    past_due: 'Your payment is past due. Please update your payment method to continue.',
    cancelled: 'Your subscription has ended. Subscribe again to unlock all features.',
  };

  return {
    hasActiveSubscription: false,
    hasFullAccess: false,
    accessMode: 'readonly',
    subscriptionStatus: status,
    trialDaysRemaining: null,
    trialEndsAt: trial_ends_at,
    expiresAt: expires_at,
    requiresPayment: true,
    message: messageMap[status] || 'Complete payment to unlock all features',
    hasPendingCheckout: false,
    pendingCheckoutId: null,
  };
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
      user:users (id, email, full_name)
    `, { count: 'exact' });

  if (params.status) {
    query = query.eq('status', params.status);
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

  const subscriptionsWithLimits: UserSubscriptionWithDetails[] = (data || []).map((sub: any) => {
    const subscriptionType = sub.subscription_type as SubscriptionType;
    return {
      id: sub.id,
      user_id: sub.user_id,
      subscription_type_id: sub.subscription_type_id,
      status: sub.status as SubscriptionStatus,
      started_at: sub.started_at,
      expires_at: sub.expires_at,
      trial_ends_at: sub.trial_ends_at,
      is_active: sub.is_active,
      cancelled_at: sub.cancelled_at,
      cancellation_reason: sub.cancellation_reason,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
      subscription_type: { ...subscriptionType, limits: subscriptionType.limits || {} },
      limits: subscriptionType.limits || {},
    };
  });

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
    .from('users')
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
    .from('users')
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

  await getUserType(userTypeId);

  const { error } = await supabase
    .from('users')
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

/**
 * Get billing overview for admin
 */
export const getBillingOverview = async (): Promise<BillingOverview> => {
  const userTypes = await listUserTypes();
  const subscriptionTypes = await listSubscriptionTypes();

  return {
    userTypes,
    subscriptionTypes,
  };
};

// ============================================================================
// USER TYPE PERMISSIONS
// ============================================================================

/**
 * List all available permissions
 */
export const listPermissions = async (): Promise<any[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('resource', { ascending: true })
    .order('action', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch permissions');
  }

  return data || [];
};

/**
 * Get all permissions grouped by category (for subscription plan editor)
 */
export const getPermissionsByCategory = async (): Promise<PermissionCategory[]> => {
  const supabase = getAdminClient();

  // Fetch all permissions
  const { data: permissions, error } = await supabase
    .from('permissions')
    .select('*')
    .order('resource', { ascending: true })
    .order('action', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch permissions');
  }

  // Group permissions by category
  const categories: PermissionCategory[] = Object.entries(PERMISSION_CATEGORIES).map(
    ([categoryId, categoryConfig]) => {
      // Filter permissions that belong to this category's resources
      const categoryPermissions = (permissions || []).filter((p: Permission) =>
        categoryConfig.resources.includes(p.resource)
      );

      return {
        id: categoryId,
        name: categoryId,
        display_name: categoryConfig.display_name,
        description: categoryConfig.description,
        color: categoryConfig.color,
        icon: categoryConfig.icon,
        permissions: categoryPermissions,
      };
    }
  );

  // Filter out empty categories
  return categories.filter((c) => c.permissions.length > 0);
};

/**
 * Get permissions assigned to a user type
 */
export const getUserTypePermissions = async (userTypeId: string): Promise<any[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('user_type_permissions')
    .select(`
      id,
      user_type_id,
      permission_id,
      created_at,
      permission:permissions (
        id,
        resource,
        action,
        description
      )
    `)
    .eq('user_type_id', userTypeId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch user type permissions');
  }

  return data || [];
};

/**
 * Get permission strings for a user type (e.g., ["users:read", "bookings:create"])
 */
export const getPermissionStringsForUserType = async (userTypeId: string): Promise<string[]> => {
  const permissions = await getUserTypePermissions(userTypeId);
  return permissions.map((p: any) => `${p.permission.resource}:${p.permission.action}`);
};

/**
 * Assign a permission to a user type
 */
export const assignPermissionToUserType = async (
  userTypeId: string,
  permissionId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  await getUserType(userTypeId);

  const { error } = await supabase
    .from('user_type_permissions')
    .insert({
      user_type_id: userTypeId,
      permission_id: permissionId,
    });

  if (error) {
    if (error.code === '23505') {
      return; // Already assigned
    }
    throw new AppError('INTERNAL_ERROR', 'Failed to assign permission to user type');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user_type.permission_assigned',
    entity_type: 'user_type',
    entity_id: userTypeId,
    new_data: { permission_id: permissionId },
  });
};

/**
 * Remove a permission from a user type
 */
export const removePermissionFromUserType = async (
  userTypeId: string,
  permissionId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('user_type_permissions')
    .delete()
    .eq('user_type_id', userTypeId)
    .eq('permission_id', permissionId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to remove permission from user type');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user_type.permission_removed',
    entity_type: 'user_type',
    entity_id: userTypeId,
    old_data: { permission_id: permissionId },
  });
};

/**
 * Bulk update permissions for a user type
 */
export const updateUserTypePermissions = async (
  userTypeId: string,
  permissionIds: string[],
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  await getUserType(userTypeId);

  const currentPermissions = await getUserTypePermissions(userTypeId);
  const currentPermissionIds = currentPermissions.map((p: any) => p.permission_id);

  const { error: deleteError } = await supabase
    .from('user_type_permissions')
    .delete()
    .eq('user_type_id', userTypeId);

  if (deleteError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update user type permissions');
  }

  if (permissionIds.length > 0) {
    const newPermissions = permissionIds.map((permissionId) => ({
      user_type_id: userTypeId,
      permission_id: permissionId,
    }));

    const { error: insertError } = await supabase
      .from('user_type_permissions')
      .insert(newPermissions);

    if (insertError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update user type permissions');
    }
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user_type.permissions_updated',
    entity_type: 'user_type',
    entity_id: userTypeId,
    old_data: { permission_ids: currentPermissionIds },
    new_data: { permission_ids: permissionIds },
  });
};

/**
 * Get a user type with its permissions
 */
export const getUserTypeWithPermissions = async (userTypeId: string): Promise<any> => {
  const userType = await getUserType(userTypeId);
  const permissionRows = await getUserTypePermissions(userTypeId);

  const permissions = permissionRows.map((p: any) => p.permission);

  return {
    ...userType,
    permissions,
  };
};

/**
 * Get all user types with their permissions
 */
export const listUserTypesWithPermissions = async (): Promise<any[]> => {
  const userTypes = await listUserTypes();

  const result = await Promise.all(
    userTypes.map(async (ut) => {
      const permissionRows = await getUserTypePermissions(ut.id);
      const permissions = permissionRows.map((p: any) => p.permission);
      return {
        ...ut,
        permissions,
      };
    })
  );

  return result;
};

// ============================================================================
// PERMISSION TEMPLATES
// ============================================================================

/**
 * List all permission templates
 */
export const listPermissionTemplates = async (): Promise<PermissionTemplate[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('permission_templates')
    .select('*')
    .order('is_system_template', { ascending: false })
    .order('display_name', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch permission templates');
  }

  return data || [];
};

/**
 * Get single permission template by ID
 */
export const getPermissionTemplate = async (id: string): Promise<PermissionTemplate> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('permission_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Permission template not found');
  }

  return data;
};

/**
 * Create a new permission template
 */
export const createPermissionTemplate = async (
  input: CreatePermissionTemplateRequest,
  actorId: string
): Promise<PermissionTemplate> => {
  const supabase = getAdminClient();

  // Validate name format
  if (!/^[a-z_]+$/.test(input.name)) {
    throw new AppError('VALIDATION_ERROR', 'Template name must contain only lowercase letters and underscores');
  }

  const { data, error } = await supabase
    .from('permission_templates')
    .insert({
      name: input.name,
      display_name: input.display_name,
      description: input.description || null,
      is_system_template: false, // User-created templates are never system templates
      permission_ids: input.permission_ids,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('CONFLICT', 'A template with this name already exists');
    }
    throw new AppError('INTERNAL_ERROR', 'Failed to create permission template');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'permission.granted',
    entity_type: 'permission',
    entity_id: data.id,
    new_data: { template_name: input.name, permission_count: input.permission_ids.length },
  });

  return data;
};

/**
 * Update a permission template
 */
export const updatePermissionTemplate = async (
  id: string,
  input: UpdatePermissionTemplateRequest,
  actorId: string
): Promise<PermissionTemplate> => {
  const supabase = getAdminClient();

  // Get existing template
  const existing = await getPermissionTemplate(id);

  // Prevent modifying system template name
  if (existing.is_system_template && input.display_name !== undefined) {
    // Allow display_name changes but not structural changes for system templates
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.display_name !== undefined) updateData.display_name = input.display_name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.permission_ids !== undefined) updateData.permission_ids = input.permission_ids;

  const { data, error } = await supabase
    .from('permission_templates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update permission template');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'permission.granted',
    entity_type: 'permission',
    entity_id: id,
    old_data: { permission_count: existing.permission_ids.length },
    new_data: { permission_count: data.permission_ids.length },
  });

  return data;
};

/**
 * Delete a permission template
 */
export const deletePermissionTemplate = async (id: string, actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  // Get existing template
  const existing = await getPermissionTemplate(id);

  // Prevent deleting system templates
  if (existing.is_system_template) {
    throw new AppError('FORBIDDEN', 'Cannot delete system permission templates');
  }

  const { error } = await supabase
    .from('permission_templates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete permission template');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'permission.removed',
    entity_type: 'permission',
    entity_id: id,
    old_data: { template_name: existing.name },
  });
};

/**
 * Apply a permission template to a user type
 */
export const applyTemplateToUserType = async (
  userTypeId: string,
  templateId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify user type exists
  await getUserType(userTypeId);

  // Get template
  const template = await getPermissionTemplate(templateId);

  // Clear existing permissions for this user type
  const { error: deleteError } = await supabase
    .from('user_type_permissions')
    .delete()
    .eq('user_type_id', userTypeId);

  if (deleteError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to clear existing permissions');
  }

  // Insert new permissions from template
  if (template.permission_ids.length > 0) {
    const newPermissions = template.permission_ids.map((permissionId) => ({
      user_type_id: userTypeId,
      permission_id: permissionId,
    }));

    const { error: insertError } = await supabase
      .from('user_type_permissions')
      .insert(newPermissions);

    if (insertError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to apply template permissions');
    }
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user_type.permissions_updated',
    entity_type: 'user_type',
    entity_id: userTypeId,
    new_data: { template_applied: template.name, permission_count: template.permission_ids.length },
  });
};

/**
 * Get permission template with resolved permissions
 */
export const getPermissionTemplateWithPermissions = async (id: string): Promise<any> => {
  const supabase = getAdminClient();

  const template = await getPermissionTemplate(id);

  // Fetch the actual permission objects
  if (template.permission_ids.length === 0) {
    return { ...template, permissions: [] };
  }

  const { data: permissions, error } = await supabase
    .from('permissions')
    .select('*')
    .in('id', template.permission_ids)
    .order('resource')
    .order('action');

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch template permissions');
  }

  return {
    ...template,
    permissions: permissions || [],
  };
};

// ============================================================================
// SUBSCRIPTION TYPE PERMISSIONS (NEW)
// ============================================================================

/**
 * Get permissions for a subscription type
 */
export const getSubscriptionTypePermissions = async (subscriptionTypeId: string): Promise<Permission[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('subscription_type_permissions')
    .select(`
      permission:permissions (
        id,
        resource,
        action,
        description,
        category
      )
    `)
    .eq('subscription_type_id', subscriptionTypeId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch subscription type permissions');
  }

  return (data || [])
    .map((item: any) => item.permission)
    .filter(Boolean) as Permission[];
};

/**
 * Update permissions for a subscription type
 */
export const updateSubscriptionTypePermissions = async (
  subscriptionTypeId: string,
  permissionIds: string[],
  actorId?: string
): Promise<Permission[]> => {
  const supabase = getAdminClient();

  // Verify subscription type exists
  await getSubscriptionType(subscriptionTypeId);

  // Delete existing permissions
  const { error: deleteError } = await supabase
    .from('subscription_type_permissions')
    .delete()
    .eq('subscription_type_id', subscriptionTypeId);

  if (deleteError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to clear existing permissions');
  }

  // Insert new permissions (if any)
  if (permissionIds.length > 0) {
    const inserts = permissionIds.map((permissionId) => ({
      subscription_type_id: subscriptionTypeId,
      permission_id: permissionId,
    }));

    const { error: insertError } = await supabase
      .from('subscription_type_permissions')
      .insert(inserts);

    if (insertError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to assign permissions');
    }
  }

  if (actorId) {
    await createAuditLog({
      actor_id: actorId,
      action: 'user_type.permissions_updated', // Using existing audit action type
      entity_type: 'subscription_type',
      entity_id: subscriptionTypeId,
      new_data: { permission_count: permissionIds.length },
    });
  }

  // Return updated permissions
  return getSubscriptionTypePermissions(subscriptionTypeId);
};

/**
 * Get subscription type with permissions included
 */
export const getSubscriptionTypeWithPermissions = async (id: string): Promise<any> => {
  const [subscriptionType, permissions] = await Promise.all([
    getSubscriptionType(id),
    getSubscriptionTypePermissions(id),
  ]);

  return {
    ...subscriptionType,
    permissions,
  };
};
