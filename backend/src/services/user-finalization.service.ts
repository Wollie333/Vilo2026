import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';

/**
 * User Finalization Service
 *
 * Finalizes user setup after profile creation by:
 * - Ensuring user_type_id is set (defaults to 'free' customer type)
 * - Creating free subscription for customer users
 * - Assigning super_admin role for super_admin users
 * - Setting status to active
 *
 * This service is called after user creation in:
 * - Regular signup (auth.service.ts)
 * - Guest registration (auth.service.ts)
 * - Guest booking (booking-wizard.service.ts)
 * - Admin user creation (users.service.ts)
 */

interface FinalizeUserOptions {
  userId: string;
  userTypeId?: string; // Optional override - if not provided, defaults to 'free'
  skipSubscription?: boolean; // For admin-created users with custom subscriptions
  skipRoleAssignment?: boolean; // For special cases
}

/**
 * Finalizes user setup with subscription and role assignment
 *
 * @param options - Finalization options
 * @throws AppError if user not found or critical errors occur
 */
export const finalizeUserSetup = async (options: FinalizeUserOptions): Promise<void> => {
  const { userId, userTypeId, skipSubscription = false, skipRoleAssignment = false } = options;
  const supabase = getAdminClient();

  console.log('=== [USER_FINALIZATION] Starting for user:', userId);
  console.log('[USER_FINALIZATION] Options:', { userTypeId, skipSubscription, skipRoleAssignment });

  // ============================================================================
  // STEP 1: Get or Set user_type_id
  // ============================================================================

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, user_type_id, email, status, user_types:user_type_id(id, name, category, can_have_subscription)')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('[USER_FINALIZATION] User not found:', userError);
    throw new AppError('NOT_FOUND', 'User not found');
  }

  console.log('[USER_FINALIZATION] Current user state:', {
    email: user.email,
    status: user.status,
    user_type_id: user.user_type_id,
    user_type_name: user.user_types?.name
  });

  let finalUserTypeId = user.user_type_id || userTypeId;
  let userTypeName = user.user_types?.name;
  let userTypeCategory = user.user_types?.category;
  let canHaveSubscription = user.user_types?.can_have_subscription;

  // If no user_type_id, default to 'free' customer type
  if (!finalUserTypeId) {
    console.log('[USER_FINALIZATION] No user_type_id, assigning "free" customer type...');

    const { data: freeType, error: freeTypeError } = await supabase
      .from('user_types')
      .select('id, name, category, can_have_subscription')
      .eq('name', 'free')
      .eq('category', 'customer')
      .single();

    if (freeTypeError || !freeType) {
      console.error('[USER_FINALIZATION] Free user type not found:', freeTypeError);
      throw new AppError('INTERNAL_ERROR', 'Free user type not found in database');
    }

    finalUserTypeId = freeType.id;
    userTypeName = freeType.name;
    userTypeCategory = freeType.category;
    canHaveSubscription = freeType.can_have_subscription;

    // Update user with user_type_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ user_type_id: finalUserTypeId })
      .eq('id', userId);

    if (updateError) {
      console.error('[USER_FINALIZATION] Failed to set user_type_id:', updateError);
      throw new AppError('INTERNAL_ERROR', 'Failed to set user type');
    }

    console.log('[USER_FINALIZATION] ✅ Set user_type_id to:', finalUserTypeId, `(${userTypeName})`);
  } else {
    console.log('[USER_FINALIZATION] User type already set:', `${userTypeName} (${userTypeCategory})`);
  }

  // ============================================================================
  // STEP 2: Create Subscription for Customer Users
  // ============================================================================

  if (userTypeCategory === 'customer' && canHaveSubscription && !skipSubscription) {
    console.log('[USER_FINALIZATION] Customer user - checking subscription...');

    // Check if user already has an active subscription
    const { data: existingSub, error: subCheckError } = await supabase
      .from('user_subscriptions')
      .select('id, subscription_type_id, status')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (subCheckError) {
      console.error('[USER_FINALIZATION] Error checking subscription:', subCheckError);
      // Continue - subscription check failure shouldn't block user creation
    }

    if (existingSub) {
      console.log('[USER_FINALIZATION] ✅ Subscription already exists:', existingSub.id, `(status: ${existingSub.status})`);
    } else {
      console.log('[USER_FINALIZATION] No subscription found - creating free subscription...');

      // Get free subscription type
      const { data: freeTier, error: freeTierError } = await supabase
        .from('subscription_types')
        .select('id, name')
        .eq('name', 'free')
        .eq('is_active', true)
        .single();

      if (freeTierError || !freeTier) {
        console.error('[USER_FINALIZATION] Free subscription type not found:', freeTierError);
        throw new AppError('INTERNAL_ERROR', 'Free subscription type not found. Run migration 143.');
      }

      // Create free tier subscription
      const { data: newSub, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          subscription_type_id: freeTier.id,
          status: 'active',
          started_at: new Date().toISOString(),
          is_active: true,
        })
        .select('id')
        .single();

      if (subError) {
        console.error('[USER_FINALIZATION] Subscription creation failed:', subError);
        throw new AppError('INTERNAL_ERROR', `Failed to create subscription: ${subError.message}`);
      }

      console.log('[USER_FINALIZATION] ✅ Free tier subscription created:', newSub.id);
    }
  } else if (userTypeCategory === 'customer' && skipSubscription) {
    console.log('[USER_FINALIZATION] Customer user - subscription creation skipped (admin override)');
  } else if (userTypeCategory !== 'customer') {
    console.log('[USER_FINALIZATION] SaaS user - no subscription needed (permissions from user_type)');
  }

  // ============================================================================
  // STEP 3: Assign Role for Super Admin Users
  // ============================================================================

  if (userTypeName === 'super_admin' && !skipRoleAssignment) {
    console.log('[USER_FINALIZATION] Super admin user - checking role assignment...');

    // Check if user already has super_admin role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleCheckError) {
      console.error('[USER_FINALIZATION] Error checking role:', roleCheckError);
      // Continue - role check failure shouldn't block user creation
    }

    if (existingRole) {
      console.log('[USER_FINALIZATION] ✅ Role already assigned:', existingRole.id);
    } else {
      console.log('[USER_FINALIZATION] No role found - assigning super_admin role...');

      // Get super_admin role
      const { data: superAdminRole, error: roleError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', 'super_admin')
        .single();

      if (roleError || !superAdminRole) {
        console.warn('[USER_FINALIZATION] Super admin role not found in roles table:', roleError);
        console.warn('[USER_FINALIZATION] User will rely on user_type permissions only');
        // Don't throw - role is legacy system, not critical
      } else {
        const { data: newRole, error: roleInsertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: superAdminRole.id,
            property_id: null, // Global role, not property-specific
          })
          .select('id')
          .single();

        if (roleInsertError) {
          console.error('[USER_FINALIZATION] Role assignment failed:', roleInsertError);
          // Don't throw - role is legacy, user_type permissions are primary
          console.warn('[USER_FINALIZATION] Continuing without role assignment');
        } else {
          console.log('[USER_FINALIZATION] ✅ Super admin role assigned:', newRole.id);
        }
      }
    }
  } else if (userTypeName !== 'super_admin') {
    console.log('[USER_FINALIZATION] Not super admin - no role assignment needed');
  }

  // ============================================================================
  // STEP 4: Set Status to Active (if still pending)
  // ============================================================================

  const { data: currentUser } = await supabase
    .from('users')
    .select('status')
    .eq('id', userId)
    .single();

  if (currentUser?.status === 'pending') {
    console.log('[USER_FINALIZATION] Status is pending - setting to active...');

    const { error: statusError } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', userId);

    if (statusError) {
      console.error('[USER_FINALIZATION] Failed to set status:', statusError);
      // Don't throw - status update failure shouldn't block user creation
    } else {
      console.log('[USER_FINALIZATION] ✅ Status set to active');
    }
  } else {
    console.log('[USER_FINALIZATION] Status already:', currentUser?.status);
  }

  console.log('=== [USER_FINALIZATION] ✅ Complete for user:', userId);
};

/**
 * Checks if a user has an active subscription
 * Utility function for other services
 *
 * @param userId - User ID to check
 * @returns True if user has active subscription
 */
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('[USER_FINALIZATION] Error checking subscription:', error);
    return false;
  }

  return !!data;
};
