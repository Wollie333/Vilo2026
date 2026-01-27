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
  SubscriptionDisplayInfo,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
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

  // Ensure limits are always objects
  return (data || []).map((item: any) => ({
    ...item,
    limits: item.limits || {},
    // pricing: Removed legacy fallback - use pricing_tiers instead
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
    // pricing: Removed legacy fallback - use pricing_tiers instead
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
  return { ...data, limits: data.limits || {} }; // pricing: Removed legacy fallback
};

/**
 * Get subscription type by slug (for public /plans/:slug checkout pages)
 * Only returns active plans
 */
export const getSubscriptionTypeBySlug = async (slug: string): Promise<SubscriptionType> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('subscription_types')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true) // Only return active plans
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Subscription plan not found');
  }

  return {
    ...data,
    limits: data.limits || {},
    // pricing: Removed legacy fallback - use pricing_tiers instead
    custom_features: data.custom_features || [],
  };
};

/**
 * Create a new subscription type with limits and enhanced billing support
 */
export const createSubscriptionType = async (
  input: CreateSubscriptionTypeRequest,
  actorId: string
): Promise<SubscriptionType> => {
  const supabase = getAdminClient();

  console.log('🎯 [SERVICE] createSubscriptionType called');
  console.log('🎯 [SERVICE] Input data:', JSON.stringify(input, null, 2));
  console.log('🎯 [SERVICE] Actor ID:', actorId);

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

  console.log('🔧 [SERVICE] Built pricing_tiers:', JSON.stringify(pricingTiers, null, 2));

  // Use provided pricing_tiers or build from individual inputs
  const finalPricingTiers = input.pricing_tiers || pricingTiers;

  // Default billing_types if not provided (for backward compatibility)
  const billingTypes: BillingTypesEnabled = input.billing_types || {
    monthly: input.is_recurring !== false && (!input.billing_cycle_days || input.billing_cycle_days === 30),
    annual: input.is_recurring !== false && input.billing_cycle_days === 365,
    one_off: input.is_recurring === false,
  };

  console.log('🔧 [SERVICE] Final billing_types:', JSON.stringify(billingTypes, null, 2));
  console.log('🔧 [SERVICE] Final pricing_tiers:', JSON.stringify(finalPricingTiers, null, 2));

  const insertData = {
    name: input.name,
    display_name: input.display_name,
    description: input.description || null,
    currency: input.currency ?? 'USD',
    trial_period_days: input.trial_period_days ?? null,
    is_active: input.is_active ?? true,
    sort_order: input.sort_order ?? 0,
    limits: input.limits || {},
    billing_types: billingTypes,
    pricing_tiers: finalPricingTiers,
    // CMS fields for checkout page
    slug: input.slug,
    custom_headline: input.custom_headline || null,
    custom_description: input.custom_description || null,
    custom_features: input.custom_features || [],
    custom_cta_text: input.custom_cta_text || 'Get Started',
    checkout_badge: input.checkout_badge || null,
    checkout_accent_color: input.checkout_accent_color || null,
  };

  console.log('📤 [SERVICE] Inserting into database:', JSON.stringify(insertData, null, 2));

  const { data, error } = await supabase
    .from('subscription_types')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ [SERVICE] Database error:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to create subscription type: ${error.message}`);
  }

  if (!data) {
    console.error('❌ [SERVICE] No data returned from insert');
    throw new AppError('INTERNAL_ERROR', 'Failed to create subscription type: No data returned');
  }

  console.log('✅ [SERVICE] Database insert successful');
  console.log('📥 [SERVICE] Returned data:', JSON.stringify(data, null, 2));

  await createAuditLog({
    actor_id: actorId,
    action: 'user.created' as any,
    entity_type: 'user' as any,
    entity_id: data.id,
    new_data: { type: 'subscription_type', ...input },
  });

  const result = {
    ...data,
    limits: data.limits || {},
    billing_types: data.billing_types || { monthly: false, annual: false, one_off: false },
    pricing_tiers: data.pricing_tiers || {},
  };

  console.log('✅ [SERVICE] Returning final result:', JSON.stringify(result, null, 2));

  return result;
};

/**
 * Update a subscription type (including limits and enhanced billing)
 */
export const updateSubscriptionType = async (
  id: string,
  input: UpdateSubscriptionTypeRequest,
  actorId: string
): Promise<SubscriptionType> => {
  console.log('🔧 [BACKEND] updateSubscriptionType called');
  console.log('🔧 [BACKEND] ID:', id);
  console.log('🔧 [BACKEND] Actor ID:', actorId);
  console.log('🔧 [BACKEND] Input data:', JSON.stringify(input, null, 2));

  const supabase = getAdminClient();

  const current = await getSubscriptionType(id);
  console.log('🔧 [BACKEND] Current subscription loaded:', current.name);

  const updateData: any = { updated_at: new Date().toISOString() };

  // Basic fields
  if (input.display_name !== undefined) updateData.display_name = input.display_name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.trial_period_days !== undefined) updateData.trial_period_days = input.trial_period_days;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
  if (input.limits !== undefined) updateData.limits = input.limits;

  // CRITICAL: Handle billing_types updates (which billing options are enabled)
  if (input.billing_types !== undefined) {
    console.log('🔧 [BACKEND] billing_types received:', JSON.stringify(input.billing_types, null, 2));
    // Validate at least one billing type is enabled
    const hasEnabled = Object.values(input.billing_types).some((v) => v === true);
    if (!hasEnabled) {
      throw new AppError('VALIDATION_ERROR', 'At least one billing type must be enabled');
    }
    updateData.billing_types = input.billing_types;
    console.log('✅ [BACKEND] billing_types will be updated');
  } else {
    console.warn('⚠️ [BACKEND] billing_types NOT provided in update request - this may cause display issues!');
  }

  // NEW: Handle pricing_tiers updates (either direct or from individual price inputs)
  if (input.pricing_tiers !== undefined) {
    console.log('💰 [BACKEND] Updating pricing_tiers directly:', input.pricing_tiers);
    updateData.pricing_tiers = input.pricing_tiers;
  } else if (
    input.monthly_price_cents !== undefined ||
    input.annual_price_cents !== undefined ||
    input.one_off_price_cents !== undefined
  ) {
    console.log('💰 [BACKEND] Building pricing_tiers from individual inputs:', {
      monthly_price_cents: input.monthly_price_cents,
      annual_price_cents: input.annual_price_cents,
      one_off_price_cents: input.one_off_price_cents,
    });

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
      console.log('   ✓ Added monthly pricing:', newPricingTiers.monthly);
    }
    if (input.annual_price_cents !== undefined && input.billing_types?.annual !== false) {
      newPricingTiers.annual = {
        enabled: true,
        price_cents: input.annual_price_cents,
        billing_cycle_days: 365,
        trial_period_days: input.trial_period_days ?? current.trial_period_days ?? null,
      };
      console.log('   ✓ Added annual pricing:', newPricingTiers.annual);
    }
    if (input.one_off_price_cents !== undefined && input.billing_types?.one_off !== false) {
      newPricingTiers.one_off = {
        enabled: true,
        price_cents: input.one_off_price_cents,
      };
      console.log('   ✓ Added one-off pricing:', newPricingTiers.one_off);
    }

    updateData.pricing_tiers = newPricingTiers;
    console.log('💰 [BACKEND] Final pricing_tiers to save:', updateData.pricing_tiers);
  } else {
    console.log('⚠️ [BACKEND] No pricing data provided in update');
  }

  // CMS fields for checkout page customization
  // Always update these fields if they're present in the input (even if null)
  if (input.slug !== undefined && input.slug !== null) updateData.slug = input.slug;
  if ('custom_headline' in input) updateData.custom_headline = input.custom_headline;
  if ('custom_description' in input) updateData.custom_description = input.custom_description;
  if ('custom_features' in input) updateData.custom_features = input.custom_features;
  if ('custom_cta_text' in input) updateData.custom_cta_text = input.custom_cta_text;
  if ('checkout_badge' in input) updateData.checkout_badge = input.checkout_badge;
  if ('checkout_accent_color' in input) updateData.checkout_accent_color = input.checkout_accent_color;

  console.log('🔧 [BACKEND] CMS Fields in updateData:', {
    slug: updateData.slug,
    custom_headline: updateData.custom_headline,
    custom_description: updateData.custom_description,
    checkout_badge: updateData.checkout_badge,
    checkout_accent_color: updateData.checkout_accent_color,
  });

  console.log('🔧 [BACKEND] Full updateData being sent to Supabase:', JSON.stringify(updateData, null, 2));

  const { data, error } = await supabase
    .from('subscription_types')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ [BACKEND] Supabase update error:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to update subscription type: ${error.message}`);
  }

  if (!data) {
    console.error('❌ [BACKEND] No data returned from Supabase update');
    throw new AppError('INTERNAL_ERROR', 'Failed to update subscription type: No data returned');
  }

  console.log('✅ [BACKEND] Subscription updated successfully');
  console.log('✅ [BACKEND] Updated CMS fields:', {
    slug: data.slug,
    custom_headline: data.custom_headline,
    custom_description: data.custom_description,
    checkout_badge: data.checkout_badge,
    checkout_accent_color: data.checkout_accent_color,
  });

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
    // pricing: Removed - use pricing_tiers instead
    billing_types: data.billing_types || { monthly: false, annual: false, one_off: false },
    pricing_tiers: data.pricing_tiers || {},
  };
};

/**
 * Delete a subscription type
 */
export const deleteSubscriptionType = async (id: string, actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  console.log('🗑️ [DELETE] Starting subscription type deletion:', id);

  const current = await getSubscriptionType(id);
  console.log('🗑️ [DELETE] Current subscription type loaded:', current.name);

  // Check if subscription type is in use by active subscriptions
  const { data: subscriptions, error: checkError } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('subscription_type_id', id)
    .limit(1);

  if (checkError) {
    console.error('🗑️ [DELETE] Error checking subscriptions:', checkError);
    throw new AppError('INTERNAL_ERROR', `Failed to check subscription usage: ${checkError.message}`);
  }

  if (subscriptions && subscriptions.length > 0) {
    console.log('🗑️ [DELETE] Cannot delete - subscription type is in use by active subscriptions');
    throw new AppError('CONFLICT', 'Cannot delete subscription type that has active subscriptions');
  }

  console.log('🗑️ [DELETE] No active subscriptions found');

  // Check if subscription type is referenced by checkouts
  const { data: checkouts, error: checkoutError } = await supabase
    .from('checkouts')
    .select('id')
    .eq('subscription_type_id', id)
    .limit(1);

  if (checkoutError) {
    console.error('🗑️ [DELETE] Error checking checkouts:', checkoutError);
    throw new AppError('INTERNAL_ERROR', `Failed to check checkout usage: ${checkoutError.message}`);
  }

  if (checkouts && checkouts.length > 0) {
    console.log('🗑️ [DELETE] Cannot delete - subscription type is referenced by checkouts');
    throw new AppError(
      'CONFLICT',
      'Cannot delete subscription plan that has checkout history. To hide this plan from users, deactivate it instead by setting "Active" to off in the plan settings.'
    );
  }

  console.log('🗑️ [DELETE] No checkouts found, proceeding with deletion');

  // Delete related permissions first (even though CASCADE should handle this)
  const { error: permError } = await supabase
    .from('subscription_type_permissions')
    .delete()
    .eq('subscription_type_id', id);

  if (permError) {
    console.error('🗑️ [DELETE] Error deleting permissions:', permError);
    // Don't fail here - continue with deletion as CASCADE should handle it
  } else {
    console.log('🗑️ [DELETE] Permissions deleted successfully');
  }

  // Delete the subscription type
  const { error } = await supabase
    .from('subscription_types')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('🗑️ [DELETE] Error deleting subscription type:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to delete subscription type: ${error.message}`);
  }

  console.log('🗑️ [DELETE] Subscription type deleted successfully');

  await createAuditLog({
    actor_id: actorId,
    action: 'user.deleted' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: { type: 'subscription_type', ...current },
  });

  console.log('🗑️ [DELETE] Audit log created, deletion complete');
};

/**
 * Force delete a subscription type (deletes checkout history first)
 * WARNING: This is destructive and removes billing history
 */
export const forceDeleteSubscriptionType = async (id: string, actorId: string): Promise<void> => {
  const supabase = getAdminClient();

  console.log('💥 [FORCE DELETE] Starting force deletion:', id);

  const current = await getSubscriptionType(id);
  console.log('💥 [FORCE DELETE] Current subscription type loaded:', current.name);

  // Check if subscription type is in use by active subscriptions
  const { data: subscriptions, error: checkError } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('subscription_type_id', id)
    .limit(1);

  if (checkError) {
    console.error('💥 [FORCE DELETE] Error checking subscriptions:', checkError);
    throw new AppError('INTERNAL_ERROR', `Failed to check subscription usage: ${checkError.message}`);
  }

  if (subscriptions && subscriptions.length > 0) {
    console.log('💥 [FORCE DELETE] Cannot force delete - subscription type has active subscriptions');
    throw new AppError('CONFLICT', 'Cannot delete subscription type that has active subscriptions. Users must cancel their subscriptions first.');
  }

  console.log('💥 [FORCE DELETE] No active subscriptions found');

  // Count checkouts before deletion (for logging)
  const { count: checkoutCount } = await supabase
    .from('checkouts')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_type_id', id);

  console.log(`💥 [FORCE DELETE] Found ${checkoutCount || 0} checkout records to delete`);

  // Delete checkouts (billing history) - DESTRUCTIVE
  const { error: checkoutDeleteError } = await supabase
    .from('checkouts')
    .delete()
    .eq('subscription_type_id', id);

  if (checkoutDeleteError) {
    console.error('💥 [FORCE DELETE] Error deleting checkouts:', checkoutDeleteError);
    throw new AppError('INTERNAL_ERROR', `Failed to delete checkout records: ${checkoutDeleteError.message}`);
  }

  console.log(`💥 [FORCE DELETE] Deleted ${checkoutCount || 0} checkout records`);

  // Delete related permissions
  const { error: permError } = await supabase
    .from('subscription_type_permissions')
    .delete()
    .eq('subscription_type_id', id);

  if (permError) {
    console.error('💥 [FORCE DELETE] Error deleting permissions:', permError);
    // Don't fail here - continue with deletion
  } else {
    console.log('💥 [FORCE DELETE] Permissions deleted successfully');
  }

  // Delete the subscription type
  const { error } = await supabase
    .from('subscription_types')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('💥 [FORCE DELETE] Error deleting subscription type:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to delete subscription type: ${error.message}`);
  }

  console.log('💥 [FORCE DELETE] Subscription type deleted successfully');

  await createAuditLog({
    actor_id: actorId,
    action: 'user.deleted' as any,
    entity_type: 'user' as any,
    entity_id: id,
    old_data: {
      type: 'subscription_type',
      ...current,
      force_deleted: true,
      checkouts_deleted: checkoutCount || 0,
    },
  });

  console.log('💥 [FORCE DELETE] Audit log created, force deletion complete');
  console.log(`💥 [FORCE DELETE] SUMMARY: Deleted plan "${current.name}" and ${checkoutCount || 0} checkout records`);
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
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() instead of single() - more forgiving

  if (error) {
    logger.error('Error fetching user subscription', { userId, error: error.message });
    return null;
  }

  if (!data) {
    // No subscription found - this is normal, not an error
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

  // Check if user already has a subscription (for idempotency)
  const existing = await getUserSubscription(input.user_id);
  if (existing) {
    // If same plan, return existing subscription (idempotent - no error)
    if (existing.subscription_type_id === input.subscription_type_id) {
      logger.info('Subscription already exists with same plan - returning existing (idempotent)', {
        userId: input.user_id,
        subscriptionId: existing.id,
        planId: input.subscription_type_id,
      });
      return existing;
    }

    // Different plan - throw error (caller should use atomic replacement or delete first)
    logger.warn(
      `Attempted to create subscription for user ${input.user_id} who already has a different subscription ${existing.id}. ` +
      'Caller should delete existing subscriptions first or use atomic replacement.'
    );
    throw new AppError('CONFLICT', 'User already has an active subscription with a different plan. Delete existing subscription first or use atomic replacement.');
  }

  await getSubscriptionType(input.subscription_type_id);

  // Use status field directly (per migration 020)
  const status = input.status || 'active';

  try {
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

    if (error) {
      // Check if it's a unique constraint violation (race condition)
      if (error.code === '23505' && error.message?.includes('user_subscriptions_user_id_key')) {
        logger.warn('Caught duplicate key error - fetching existing subscription (race condition)', {
          userId: input.user_id,
          error: error.message,
        });

        // Fetch and return existing subscription instead of failing
        const existingAfterRace = await getUserSubscription(input.user_id);
        if (existingAfterRace) {
          logger.info('Returning existing subscription after race condition', {
            userId: input.user_id,
            subscriptionId: existingAfterRace.id,
          });
          return existingAfterRace;
        }

        // If we still can't find it, something is very wrong
        throw new AppError('INTERNAL_ERROR', 'Duplicate key error but subscription not found');
      }

      // Other errors
      throw error;
    }

    if (!data) {
      throw new AppError('INTERNAL_ERROR', 'Subscription insert returned no data');
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
  } catch (err: any) {
    console.error('=== CREATE SUBSCRIPTION ERROR ===');
    console.error('Error:', err);
    console.error('Input:', JSON.stringify(input, null, 2));

    // Re-throw AppError as-is
    if (err instanceof AppError) {
      throw err;
    }

    // Wrap other errors
    throw new AppError('INTERNAL_ERROR', `Failed to create user subscription: ${err?.message || 'Unknown error'}`);
  }
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

/**
 * Pause a user's subscription
 */
export const pauseUserSubscription = async (
  userId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getUserSubscription(userId);
  if (!current) {
    throw new AppError('NOT_FOUND', 'User subscription not found');
  }

  if (current.status === 'paused') {
    throw new AppError('BAD_REQUEST', 'Subscription is already paused');
  }

  if (current.status === 'cancelled') {
    throw new AppError('BAD_REQUEST', 'Cannot pause a cancelled subscription');
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      is_active: false,
      status: 'paused' as SubscriptionStatus,
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to pause subscription');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user',
    entity_id: userId,
    old_data: { type: 'user_subscription', status: current.status },
    new_data: { type: 'user_subscription_paused' },
  });
};

/**
 * Resume a paused user subscription
 */
export const resumeUserSubscription = async (
  userId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getUserSubscription(userId);
  if (!current) {
    throw new AppError('NOT_FOUND', 'User subscription not found');
  }

  if (current.status !== 'paused') {
    throw new AppError('BAD_REQUEST', 'Subscription is not paused');
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      is_active: true,
      status: 'active' as SubscriptionStatus,
      paused_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to resume subscription');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'user.updated' as any,
    entity_type: 'user',
    entity_id: userId,
    old_data: { type: 'user_subscription', status: 'paused' },
    new_data: { type: 'user_subscription_resumed', status: 'active' },
  });
};

// ============================================================================
// ADMIN-INITIATED SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Admin pauses a user's subscription with reason tracking
 * Billing stops immediately, user gets read-only access
 */
export const adminPauseSubscription = async (
  userId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getUserSubscription(userId);
  if (!current) {
    throw new AppError('NOT_FOUND', 'User subscription not found');
  }

  if (current.status === 'paused') {
    throw new AppError('BAD_REQUEST', 'Subscription is already paused');
  }

  if (current.status === 'cancelled') {
    throw new AppError('BAD_REQUEST', 'Cannot pause a cancelled subscription');
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      is_active: false,
      status: 'paused' as SubscriptionStatus,
      paused_at: new Date().toISOString(),
      paused_reason: reason,
      paused_by_admin_id: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to pause subscription');
  }

  await createAuditLog({
    actor_id: adminId,
    action: 'subscription.paused' as any,
    entity_type: 'user_subscription',
    entity_id: current.id,
    old_data: { status: current.status, is_active: current.is_active },
    new_data: { status: 'paused', is_active: false, reason, paused_by_admin_id: adminId },
  });
};

/**
 * Admin cancels a user's subscription with reason tracking
 * Billing stops immediately, user keeps access until end of billing period
 */
export const adminCancelSubscription = async (
  userId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getUserSubscription(userId);
  if (!current) {
    throw new AppError('NOT_FOUND', 'User subscription not found');
  }

  if (current.status === 'cancelled') {
    throw new AppError('BAD_REQUEST', 'Subscription is already cancelled');
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      is_active: false,
      status: 'cancelled' as SubscriptionStatus,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      cancelled_by_admin_id: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to cancel subscription');
  }

  await createAuditLog({
    actor_id: adminId,
    action: 'subscription.cancelled' as any,
    entity_type: 'user_subscription',
    entity_id: current.id,
    old_data: { status: current.status, is_active: current.is_active },
    new_data: { status: 'cancelled', is_active: false, reason, cancelled_by_admin_id: adminId },
  });
};

/**
 * Admin reactivates a paused subscription
 * Billing resumes, user gets full access
 */
export const adminReactivateSubscription = async (
  userId: string,
  adminId: string
): Promise<void> => {
  const supabase = getAdminClient();

  const current = await getUserSubscription(userId);
  if (!current) {
    throw new AppError('NOT_FOUND', 'User subscription not found');
  }

  if (current.status !== 'paused') {
    throw new AppError('BAD_REQUEST', 'Can only reactivate paused subscriptions');
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      is_active: true,
      status: 'active' as SubscriptionStatus,
      paused_at: null,
      paused_reason: null,
      paused_by_admin_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to reactivate subscription');
  }

  await createAuditLog({
    actor_id: adminId,
    action: 'subscription.reactivated' as any,
    entity_type: 'user_subscription',
    entity_id: current.id,
    old_data: { status: 'paused', is_active: false },
    new_data: { status: 'active', is_active: true },
  });
};

// ============================================================================
// SUBSCRIPTION DISPLAY INFO (for Admin UI)
// ============================================================================

/**
 * Get formatted subscription information for admin display
 * Returns all necessary data to display subscription details in admin UI
 */
export const getSubscriptionDisplayInfo = async (
  userId: string
): Promise<SubscriptionDisplayInfo> => {
  const supabase = getAdminClient();

  // Get subscription with details
  const subscription = await getUserSubscription(userId);
  const plan = subscription.subscription_type;

  // Determine billing interval (from subscription data or default to monthly)
  const billingInterval = (subscription as any).billing_interval || 'monthly';

  // Get current price based on billing interval
  let currentPriceCents = 0;
  if (billingInterval === 'monthly') {
    currentPriceCents = plan.pricing_tiers?.monthly?.price_cents || plan.price_cents || 0;
  } else if (billingInterval === 'annual') {
    currentPriceCents = plan.pricing_tiers?.annual?.price_cents || plan.price_cents || 0;
  } else if (billingInterval === 'one_off') {
    currentPriceCents = plan.pricing_tiers?.one_off?.price_cents || plan.price_cents || 0;
  }

  // Format price
  const currency = plan.currency || 'USD';
  const priceFormatted = `${currency} ${(currentPriceCents / 100).toFixed(2)}`;

  // Get billing interval label
  const intervalLabels: Record<string, string> = {
    monthly: 'Monthly',
    annual: 'Annual',
    one_off: 'One-time',
  };
  const billingIntervalLabel = intervalLabels[billingInterval] || 'Unknown';

  // Calculate next billing date
  let nextBillingDate: string | null = null;
  if (subscription.expires_at && subscription.status !== 'cancelled') {
    nextBillingDate = subscription.expires_at;
  }

  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (subscription.expires_at) {
    const expiryDate = new Date(subscription.expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Status labels and colors
  const statusLabel = SUBSCRIPTION_STATUS_LABELS[subscription.status];
  const statusColor = SUBSCRIPTION_STATUS_COLORS[subscription.status];

  // Action eligibility flags
  const isPaused = subscription.status === 'paused';
  const isCancelled = subscription.status === 'cancelled';
  const isActive = subscription.status === 'active' || subscription.status === 'trial';

  const canPause = isActive && !isCancelled;
  const canCancel = (isActive || isPaused) && !isCancelled;
  const canResume = isPaused;
  const canUpgrade = isActive || subscription.status === 'trial';

  // Get admin info if paused or cancelled by admin
  let pausedByAdmin: { id: string; full_name: string } | null = null;
  let cancelledByAdmin: { id: string; full_name: string } | null = null;

  if ((subscription as any).paused_by_admin_id) {
    const { data: adminData } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', (subscription as any).paused_by_admin_id)
      .single();
    if (adminData) {
      pausedByAdmin = adminData;
    }
  }

  if ((subscription as any).cancelled_by_admin_id) {
    const { data: adminData } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', (subscription as any).cancelled_by_admin_id)
      .single();
    if (adminData) {
      cancelledByAdmin = adminData;
    }
  }

  // Access end date (for cancelled subscriptions)
  const accessEndDate = isCancelled ? subscription.expires_at : null;

  return {
    subscription,
    plan_name: plan.name,
    plan_display_name: plan.display_name,
    current_price_cents: currentPriceCents,
    current_price_formatted: priceFormatted,
    billing_interval: billingInterval as 'monthly' | 'annual' | 'one_off',
    billing_interval_label: billingIntervalLabel,
    next_billing_date: nextBillingDate,
    status: subscription.status,
    status_label: statusLabel,
    status_color: statusColor,
    days_remaining: daysRemaining,
    is_paused: isPaused,
    is_cancelled: isCancelled,
    is_active: isActive,
    can_pause: canPause,
    can_cancel: canCancel,
    can_resume: canResume,
    can_upgrade: canUpgrade,
    paused_reason: (subscription as any).paused_reason || null,
    paused_by_admin: pausedByAdmin,
    cancelled_reason: subscription.cancellation_reason,
    cancelled_by_admin: cancelledByAdmin,
    access_end_date: accessEndDate,
  };
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

  // First, get the permission IDs
  const { data: junctionData, error: junctionError } = await supabase
    .from('subscription_type_permissions')
    .select('permission_id')
    .eq('subscription_type_id', subscriptionTypeId);

  if (junctionError) {
    console.error('Error fetching subscription type permission IDs:', junctionError);
    // Return empty array instead of throwing - permissions are optional
    return [];
  }

  if (!junctionData || junctionData.length === 0) {
    return [];
  }

  // Get the permission IDs
  const permissionIds = junctionData.map((item: any) => item.permission_id);

  // Now fetch the actual permissions
  const { data: permissions, error: permissionsError } = await supabase
    .from('permissions')
    .select('id, resource, action, description, category')
    .in('id', permissionIds);

  if (permissionsError) {
    console.error('Error fetching permissions:', permissionsError);
    // Return empty array instead of throwing
    return [];
  }

  return permissions || [];
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
