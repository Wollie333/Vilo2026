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
    const token = extractToken(req);

    if (!token) {
      throw new AppError('UNAUTHORIZED', 'Authentication required');
    }

    const supabase = getAdminClient();

    // Verify the JWT and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired token');
    }

    // Attach user and token to request
    req.user = user;
    req.accessToken = token;

    next();
  } catch (error) {
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
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required');
    }

    const supabase = getAdminClient();

    // Get user profile with user type
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

      if (utPermsError) {
        throw new AppError('INTERNAL_ERROR', 'Failed to load user type permissions');
      }
      userTypePermissions = utPerms || [];
    }

    // NEW: Get subscription permissions (for customer category users)
    let subscriptionPermissions: any[] = [];
    if (profile.user_type?.category === 'customer') {
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

      if (subscription?.subscription_type_id) {
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

        subscriptionPermissions = (subPerms || []).map((sp: any) => sp.permission).filter(Boolean);
      }
    }

    // NEW: Get company team member permissions
    let teamPermissions: string[] = [];
    const { data: teamMemberships } = await supabase
      .from('company_team_members')
      .select('permissions')
      .eq('user_id', req.user.id)
      .eq('is_active', true);

    if (teamMemberships && teamMemberships.length > 0) {
      for (const membership of teamMemberships) {
        teamPermissions.push(...(membership.permissions || []));
      }
    }

    // Add subscription and team permissions to profile
    (profile as any).subscription_permissions = subscriptionPermissions;
    (profile as any).team_permissions = teamPermissions;

    // Get direct permission overrides (KEPT: for individual customization)
    const { data: directPermissions, error: permError } = await supabase
      .from('user_permissions')
      .select(`
        *,
        permission:permissions (*)
      `)
      .eq('user_id', req.user.id)
      .or('expires_at.is.null,expires_at.gt.now()');

    if (permError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to load user permissions');
    }

    // Get user properties
    const { data: userProperties, error: propError } = await supabase
      .from('user_properties')
      .select('*')
      .eq('user_id', req.user.id);

    if (propError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to load user properties');
    }

    // LEGACY: Get user roles (for backward compatibility during transition)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        *,
        role:roles (
          *,
          permissions:role_permissions (
            permission:permissions (*)
          )
        )
      `)
      .eq('user_id', req.user.id);

    // Build roles with permissions (LEGACY - for backward compatibility)
    const roles = (userRoles || []).map((ur: any) => ({
      ...ur.role,
      permissions: (ur.role?.permissions || []).map((rp: any) => rp.permission),
    }));

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

    // Update last active timestamp (fire and forget)
    supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .then(() => {});

    next();
  } catch (error) {
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
