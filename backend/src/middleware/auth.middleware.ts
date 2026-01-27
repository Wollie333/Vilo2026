import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { UserWithRoles } from '../types/user.types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userProfile?: UserWithRoles;
      accessToken?: string;
    }
  }
}

/**
 * Extract Bearer token from Authorization header
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Middleware to authenticate requests using Supabase JWT
 * Attaches user to request if valid token is provided
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔑 [AUTH] authenticate called');
    console.log('   Path:', req.path);

    const token = extractToken(req);
    console.log('   Has token:', !!token);

    if (!token) {
      console.log('   ❌ No token - UNAUTHORIZED');
      throw new AppError('UNAUTHORIZED', 'Authentication required');
    }

    const supabase = getAdminClient();

    // Verify the JWT and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log('   Supabase getUser error:', error);
    console.log('   User found:', !!user);

    if (error || !user) {
      console.log('   ❌ Invalid token - UNAUTHORIZED');
      throw new AppError('UNAUTHORIZED', 'Invalid or expired token');
    }

    // Attach user and token to request
    req.user = user;
    req.accessToken = token;
    console.log('   ✅ User authenticated:', user.email);

    next();
  } catch (error) {
    console.log('   ❌ Error in authenticate:', error);
    next(error);
  }
};

/**
 * Middleware to optionally authenticate - doesn't fail if no token
 * Useful for endpoints that have different behavior for authenticated users
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const supabase = getAdminClient();
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        req.user = user;
        req.accessToken = token;
      }
    }

    next();
  } catch {
    // Silently continue without auth for optional auth
    next();
  }
};

/**
 * Middleware to load full user profile with roles and permissions
 * Must be used after authenticate middleware
 *
 * NEW: Uses user_type_permissions instead of role-based permissions
 */
export const loadUserProfile = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('[AUTH] loadUserProfile started for user:', req.user?.id);

    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required');
    }

    const supabase = getAdminClient();
    console.log('[AUTH] Supabase client obtained');

    // Get user profile with user type
    console.log('[AUTH] Step 1: Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        *,
        user_type:user_types (
          id,
          name,
          display_name,
          description,
          category,
          is_system_type,
          can_have_subscription,
          can_have_team
        )
      `)
      .eq('id', req.user.id)
      .single();

    console.log('[AUTH] Step 1 complete. Profile:', profile?.email, 'User type:', profile?.user_type?.name);

    if (profileError || !profile) {
      throw new AppError('NOT_FOUND', 'User profile not found');
    }

    // Check if user is active
    if (profile.status !== 'active') {
      if (profile.status === 'pending') {
        throw new AppError('FORBIDDEN', 'Account is pending approval');
      }
      if (profile.status === 'suspended') {
        throw new AppError('FORBIDDEN', 'Account has been suspended');
      }
      if (profile.status === 'deactivated') {
        throw new AppError('FORBIDDEN', 'Account has been deactivated');
      }
    }

    // Get permissions from user_type_permissions (NEW: replaces role-based)
    console.log('[AUTH] Step 2: Fetching user type permissions...');
    let userTypePermissions: any[] = [];
    if (profile.user_type_id) {
      const { data: utPerms, error: utPermsError } = await supabase
        .from('user_type_permissions')
        .select(`
          permission:permissions (
            id,
            resource,
            action,
            description
          )
        `)
        .eq('user_type_id', profile.user_type_id);

      console.log('[AUTH] Step 2 complete. Permissions count:', utPerms?.length || 0);

      if (utPermsError) {
        throw new AppError('INTERNAL_ERROR', 'Failed to load user type permissions');
      }
      userTypePermissions = utPerms || [];
    } else {
      console.log('[AUTH] Step 2 skipped (no user_type_id)');
    }

    // NEW: Get subscription permissions (for customer category users)
    console.log('[AUTH] Step 3: Checking subscription permissions...');
    let subscriptionPermissions: any[] = [];
    if (profile.user_type?.category === 'customer') {
      console.log('[AUTH] Step 3a: Fetching user subscription...');
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_type_id,
          subscription_type:subscription_types (
            id,
            name
          )
        `)
        .eq('user_id', req.user.id)
        .eq('is_active', true)
        .in('status', ['active', 'trial'])
        .single();

      console.log('[AUTH] Step 3a complete. Subscription:', subscription?.subscription_type?.name || 'none');

      if (subscription?.subscription_type_id) {
        console.log('[AUTH] Step 3b: Fetching subscription permissions...');
        const { data: subPerms } = await supabase
          .from('subscription_type_permissions')
          .select(`
            permission:permissions (
              id,
              resource,
              action,
              description
            )
          `)
          .eq('subscription_type_id', subscription.subscription_type_id);

        console.log('[AUTH] Step 3b complete. Subscription permissions count:', subPerms?.length || 0);
        subscriptionPermissions = (subPerms || []).map((sp: any) => sp.permission).filter(Boolean);
      } else {
        console.log('[AUTH] Step 3b skipped (no active subscription)');
      }
    } else {
      console.log('[AUTH] Step 3 skipped (user_type category is not customer)');
    }

    // NEW: Get company team member permissions
    console.log('[AUTH] Step 4: Fetching company team member permissions...');
    let teamPermissions: string[] = [];
    const { data: teamMemberships } = await supabase
      .from('company_team_members')
      .select('permissions')
      .eq('user_id', req.user.id)
      .eq('is_active', true);

    console.log('[AUTH] Step 4 complete. Team memberships:', teamMemberships?.length || 0);

    if (teamMemberships && teamMemberships.length > 0) {
      for (const membership of teamMemberships) {
        teamPermissions.push(...(membership.permissions || []));
      }
    }

    // Add subscription and team permissions to profile
    (profile as any).subscription_permissions = subscriptionPermissions;
    (profile as any).team_permissions = teamPermissions;

    // Get direct permission overrides (KEPT: for individual customization)
    console.log('[AUTH] Step 5: Fetching direct permission overrides...');
    const { data: directPermissions, error: permError } = await supabase
      .from('user_permissions')
      .select(`
        *,
        permission:permissions (*)
      `)
      .eq('user_id', req.user.id)
      .or('expires_at.is.null,expires_at.gt.now()');

    console.log('[AUTH] Step 5 complete. Direct permissions:', directPermissions?.length || 0);

    if (permError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to load user permissions');
    }

    // Get user properties
    console.log('[AUTH] Step 6: Fetching user properties...');
    const { data: userProperties, error: propError } = await supabase
      .from('user_properties')
      .select('*')
      .eq('user_id', req.user.id);

    console.log('[AUTH] Step 6 complete. User properties:', userProperties?.length || 0);

    if (propError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to load user properties');
    }

    // LEGACY: Get user roles (for backward compatibility during transition)
    console.log('[AUTH] Step 7: Fetching legacy user roles...');
    const { data: userRoles } = await supabase
      .from('user_user_roles')
      .select(`
        *,
        role:user_roles (
          *
        )
      `)
      .eq('user_id', req.user.id);

    console.log('[AUTH] Step 7 complete. User roles:', userRoles?.length || 0);

    // Build roles with permissions (LEGACY - for backward compatibility)
    const roles = (userRoles || [])
      .map((ur: any) => ur.role)
      .filter(Boolean);

    // Calculate effective permissions (NEW: from user type + overrides + subscription)
    const effectivePermissions = calculateEffectivePermissionsFromUserType(
      userTypePermissions,
      directPermissions || [],
      roles, // Include legacy roles as fallback
      profile // NEW: Pass profile to check category and subscription
    );

    // Attach full profile to request
    req.userProfile = {
      ...profile,
      roles, // Keep for backward compatibility
      directPermissions: directPermissions || [],
      effectivePermissions,
      properties: userProperties || [],
    };

    console.log('[AUTH] All steps complete. User profile loaded successfully.');
    console.log('[AUTH] Effective permissions count:', effectivePermissions?.length || 0);

    // Update last active timestamp (fire and forget)
    supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .then(() => {});

    next();
  } catch (error) {
    console.error('[AUTH] loadUserProfile FAILED:', error);
    next(error);
  }
};

/**
 * Calculate effective permissions from roles and direct overrides
 * LEGACY: Kept for backward compatibility
 */
function calculateEffectivePermissions(
  roles: any[],
  directPermissions: any[]
): string[] {
  const permissionSet = new Set<string>();
  const deniedSet = new Set<string>();

  // Collect permissions from roles (sorted by priority)
  const sortedRoles = [...roles].sort((a, b) => b.priority - a.priority);

  for (const role of sortedRoles) {
    for (const perm of role.permissions || []) {
      const key = `${perm.resource}:${perm.action}`;
      permissionSet.add(key);
    }
  }

  // Apply direct permission overrides
  for (const dp of directPermissions) {
    if (!dp.permission) continue;

    const key = `${dp.permission.resource}:${dp.permission.action}`;

    if (dp.override_type === 'grant') {
      permissionSet.add(key);
      deniedSet.delete(key);
    } else if (dp.override_type === 'deny') {
      deniedSet.add(key);
    }
  }

  // Remove denied permissions
  for (const denied of deniedSet) {
    permissionSet.delete(denied);
  }

  return Array.from(permissionSet);
}

/**
 * Calculate effective permissions with subscription-based resolution (UPDATED FOR SAVE POINT 5)
 *
 * NEW LOGIC:
 * - SaaS users (category = 'saas') → permissions from user_type_permissions
 * - Customer users (category = 'customer') with active subscription → permissions from subscription plan
 * - Customer users without subscription → NO base permissions (must subscribe)
 * - Direct overrides (grant/deny) apply to all users
 * - Company team members get property-scoped permissions
 *
 * Priority order:
 * 1. Direct DENY overrides (highest priority - always blocks)
 * 2. Direct GRANT overrides (adds permissions)
 * 3a. SaaS users → user_type_permissions
 * 3b. Customer users → subscription plan permissions (via active subscription)
 * 4. Company team member permissions (property-scoped)
 * 5. Legacy role permissions (fallback)
 */
function calculateEffectivePermissionsFromUserType(
  userTypePermissions: any[],
  directPermissions: any[],
  legacyRoles: any[] = [],
  profile: any = null // NEW: Need profile to check category and subscription
): string[] {
  const permissionSet = new Set<string>();
  const deniedSet = new Set<string>();

  // Get user type category from profile
  const userTypeCategory = profile?.user_type?.category as 'saas' | 'customer' | undefined;

  // BRANCH A: SaaS users → use user_type_permissions (current behavior)
  if (userTypeCategory === 'saas') {
    for (const utp of userTypePermissions) {
      if (utp.permission) {
        const key = `${utp.permission.resource}:${utp.permission.action}`;
        permissionSet.add(key);
      }
    }
  }

  // BRANCH B: Customer users → use subscription plan permissions
  else if (userTypeCategory === 'customer') {
    // Note: Subscription permissions should be loaded in the profile
    // If profile has subscription_permissions array, use it
    const subscriptionPermissions = profile?.subscription_permissions || [];
    for (const perm of subscriptionPermissions) {
      const key = `${perm.resource}:${perm.action}`;
      permissionSet.add(key);
    }

    // If no subscription permissions found, user has NO base permissions
    // (they need to subscribe to get permissions)
  }

  // BRANCH C: FALLBACK - No category or legacy user without user_type
  else {
    // 1. Try user type permissions first
    for (const utp of userTypePermissions) {
      if (utp.permission) {
        const key = `${utp.permission.resource}:${utp.permission.action}`;
        permissionSet.add(key);
      }
    }

    // 2. If no user type permissions, use legacy role permissions
    if (userTypePermissions.length === 0 && legacyRoles.length > 0) {
      const sortedRoles = [...legacyRoles].sort((a, b) => b.priority - a.priority);
      for (const role of sortedRoles) {
        for (const perm of role.permissions || []) {
          const key = `${perm.resource}:${perm.action}`;
          permissionSet.add(key);
        }
      }
    }
  }

  // BRANCH D: Company team member permissions (property-scoped)
  // Note: Team member permissions should be loaded in the profile
  const teamPermissions = profile?.team_permissions || [];
  for (const perm of teamPermissions) {
    permissionSet.add(perm); // Already in "resource:action" format
  }

  // Apply direct permission overrides (all users)
  for (const dp of directPermissions) {
    if (!dp.permission) continue;

    const key = `${dp.permission.resource}:${dp.permission.action}`;

    if (dp.override_type === 'grant') {
      permissionSet.add(key);
      deniedSet.delete(key);
    } else if (dp.override_type === 'deny') {
      deniedSet.add(key);
    }
  }

  // Remove denied permissions (DENY always wins)
  for (const denied of deniedSet) {
    permissionSet.delete(denied);
  }

  return Array.from(permissionSet);
}
