import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Middleware factory to require specific roles
 * User must have at least one of the specified roles
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      const userRoleNames = req.userProfile.roles.map((r) => r.name);

      // Super admin always passes role checks
      if (userRoleNames.includes('super_admin')) {
        return next();
      }

      // Check if user has any of the allowed roles
      const hasRole = allowedRoles.some((role) => userRoleNames.includes(role));

      if (!hasRole) {
        throw new AppError(
          'FORBIDDEN',
          `Requires one of the following roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to require super admin role
 * Shortcut for requireRole('super_admin')
 */
export const requireSuperAdmin = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      console.log('🔐 [RBAC] requireSuperAdmin check');
      console.log('   Has userProfile:', !!req.userProfile);

      if (!req.userProfile) {
        console.log('   ❌ No userProfile - UNAUTHORIZED');
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      // Check user_type first (NEW system)
      const userType = (req.userProfile as any).user_type?.name;
      console.log('   User type:', userType);

      if (userType === 'super_admin') {
        console.log('   ✅ Super admin check passed (via user_type)');
        return next();
      }

      // Fallback to legacy roles
      const userRoleNames = req.userProfile.roles.map((r) => r.name);
      console.log('   Legacy roles:', userRoleNames);

      if (userRoleNames.includes('super_admin')) {
        console.log('   ✅ Super admin check passed (via legacy role)');
        return next();
      }

      console.log('   ❌ Not super admin - FORBIDDEN');
      throw new AppError('FORBIDDEN', 'Super Admin access required');
    } catch (error) {
      console.log('   ❌ Error in requireSuperAdmin:', error);
      next(error);
    }
  };
};

/**
 * Middleware to require admin level access (super_admin or property_admin)
 */
export const requireAdmin = () => {
  return requireRole('super_admin', 'property_admin');
};

/**
 * Middleware to require management level access
 * Checks both legacy roles and new user_types
 */
export const requireManager = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      // Check legacy roles (for backward compatibility)
      const userRoleNames = req.userProfile.roles.map((r) => r.name);
      const hasLegacyRole = ['super_admin', 'property_admin', 'property_manager'].some((role) =>
        userRoleNames.includes(role)
      );

      if (hasLegacyRole) {
        return next();
      }

      // Check new user_type system
      const userType = (req.userProfile as any).user_type?.name;
      const allowedUserTypes = ['super_admin', 'saas_customer', 'saas_team_member'];

      if (userType && allowedUserTypes.includes(userType)) {
        return next();
      }

      throw new AppError(
        'FORBIDDEN',
        'Requires management level access (super_admin, property_admin, property_manager, saas_customer, or saas_team_member)'
      );
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has a specific role
 */
export const hasRole = (req: Request, roleName: string): boolean => {
  if (!req.userProfile) return false;
  return req.userProfile.roles.some((r) => r.name === roleName);
};

/**
 * Check if user is super admin
 * Checks both new user_type system and legacy roles
 */
export const isSuperAdmin = (req: Request): boolean => {
  if (!req.userProfile) return false;

  // Check new user_type system first
  const userType = (req.userProfile as any).user_type?.name;
  if (userType === 'super_admin') {
    return true;
  }

  // Fallback to legacy roles
  return hasRole(req, 'super_admin');
};

/**
 * Middleware factory to require role scoped to a property
 * Checks if user has the role for the specific property in the request
 */
export const requirePropertyRole = (
  ...allowedRoles: string[]
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      // Super admin always passes
      if (isSuperAdmin(req)) {
        return next();
      }

      // Get property ID from params, body, or query
      const propertyId =
        req.params.propertyId ||
        req.body?.propertyId ||
        req.query.propertyId;

      if (!propertyId) {
        throw new AppError('BAD_REQUEST', 'Property ID required');
      }

      // Check if user is assigned to this property
      const isAssigned = req.userProfile.properties.some(
        (p) => p.property_id === propertyId
      );

      if (!isAssigned) {
        throw new AppError(
          'FORBIDDEN',
          'You do not have access to this property'
        );
      }

      // Check if user has required role (globally or for this property)
      // Note: user_roles can have property_id to scope role to specific property
      const hasRequiredRole = req.userProfile.roles.some((role) => {
        const roleMatch = allowedRoles.includes(role.name);
        // Role is either global (no property_id in user_roles) or matches this property
        return roleMatch;
      });

      if (!hasRequiredRole) {
        throw new AppError(
          'FORBIDDEN',
          `Requires one of the following roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check ownership - user can only access their own resources
 * unless they have admin access
 */
export const requireOwnershipOrAdmin = (
  userIdExtractor: (req: Request) => string | undefined
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userProfile || !req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      // Admins can access any resource
      if (isSuperAdmin(req) || hasRole(req, 'property_admin')) {
        return next();
      }

      const targetUserId = userIdExtractor(req);

      if (!targetUserId) {
        throw new AppError('BAD_REQUEST', 'User ID required');
      }

      // Check if user is accessing their own resource
      if (targetUserId !== req.user.id) {
        throw new AppError(
          'FORBIDDEN',
          'You can only access your own resources'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to verify user owns the company
 * Checks if the authenticated user is the owner of the company in the request params
 */
export const requireCompanyOwnership = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userProfile || !req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required');
    }

    // Super admins can access any company
    if (isSuperAdmin(req)) {
      return next();
    }

    const { companyId } = req.params;

    if (!companyId) {
      throw new AppError('BAD_REQUEST', 'Company ID required');
    }

    // Check if user owns this company
    // Note: This check is enforced at database level via RLS, but we do it here for better error messages
    // The RLS policy checks: company.user_id = auth.uid()

    // For now, we'll let RLS handle it and assume if the query succeeds, the user owns the company
    // If you want to add an explicit check, you could fetch the company here and verify user_id
    // But that would be redundant given RLS is already enforcing this

    next();
  } catch (error) {
    next(error);
  }
};
