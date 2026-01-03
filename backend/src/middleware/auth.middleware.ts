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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
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

    // Get user roles with permissions
    const { data: userRoles, error: rolesError } = await supabase
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

    if (rolesError) {
      throw new AppError('INTERNAL_ERROR', 'Failed to load user roles');
    }

    // Get direct permission overrides
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

    // Build roles with permissions
    const roles = (userRoles || []).map((ur: any) => ({
      ...ur.role,
      permissions: (ur.role?.permissions || []).map((rp: any) => rp.permission),
    }));

    // Calculate effective permissions
    const effectivePermissions = calculateEffectivePermissions(
      roles,
      directPermissions || []
    );

    // Attach full profile to request
    req.userProfile = {
      ...profile,
      roles,
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
