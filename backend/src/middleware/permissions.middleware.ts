import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { loadUserProfile } from './auth.middleware';

/**
 * Middleware to check if user has a specific permission
 * Usage: requirePermission('refunds', 'manage')
 *
 * Must be used after authenticate middleware
 * Automatically loads user profile if not already loaded
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Load user profile if not already loaded
      if (!req.userProfile) {
        await loadUserProfile(req, _res, () => {});
      }

      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      // Check if user has the required permission
      const requiredPermission = `${resource}:${action}`;
      const hasPermission = req.userProfile.effectivePermissions.includes(requiredPermission);

      if (!hasPermission) {
        throw new AppError(
          'FORBIDDEN',
          `You do not have permission to perform this action. Required: ${resource}:${action}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ANY of the specified permissions
 * Usage: requireAnyPermission([['refunds', 'manage'], ['refunds', 'view']])
 */
export const requireAnyPermission = (permissions: Array<[string, string]>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Load user profile if not already loaded
      if (!req.userProfile) {
        await loadUserProfile(req, _res, () => {});
      }

      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      // Check if user has ANY of the required permissions
      const hasPermission = permissions.some(([resource, action]) => {
        const requiredPermission = `${resource}:${action}`;
        return req.userProfile!.effectivePermissions.includes(requiredPermission);
      });

      if (!hasPermission) {
        const permStrings = permissions.map(([r, a]) => `${r}:${a}`).join(' or ');
        throw new AppError(
          'FORBIDDEN',
          `You do not have permission to perform this action. Required: ${permStrings}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ALL of the specified permissions
 * Usage: requireAllPermissions([['refunds', 'manage'], ['refunds', 'view']])
 */
export const requireAllPermissions = (permissions: Array<[string, string]>) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Load user profile if not already loaded
      if (!req.userProfile) {
        await loadUserProfile(req, _res, () => {});
      }

      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      // Check if user has ALL of the required permissions
      const missingPermissions = permissions.filter(([resource, action]) => {
        const requiredPermission = `${resource}:${action}`;
        return !req.userProfile!.effectivePermissions.includes(requiredPermission);
      });

      if (missingPermissions.length > 0) {
        const permStrings = missingPermissions.map(([r, a]) => `${r}:${a}`).join(', ');
        throw new AppError(
          'FORBIDDEN',
          `You do not have all required permissions. Missing: ${permStrings}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is a specific user type
 * Usage: requireUserType('super_admin')
 */
export const requireUserType = (userType: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Load user profile if not already loaded
      if (!req.userProfile) {
        await loadUserProfile(req, _res, () => {});
      }

      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      const currentUserType = req.userProfile.user_type?.name;

      if (currentUserType !== userType) {
        throw new AppError(
          'FORBIDDEN',
          `This action is restricted to ${userType} users only`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is ANY of the specified user types
 * Usage: requireAnyUserType(['super_admin', 'property_manager'])
 */
export const requireAnyUserType = (userTypes: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Load user profile if not already loaded
      if (!req.userProfile) {
        await loadUserProfile(req, _res, () => {});
      }

      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      const currentUserType = req.userProfile.user_type?.name;

      if (!currentUserType || !userTypes.includes(currentUserType)) {
        throw new AppError(
          'FORBIDDEN',
          `This action is restricted to: ${userTypes.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is super admin
 * Convenience function for requireUserType('super_admin')
 */
export const requireSuperAdmin = requireUserType('super_admin');

/**
 * Middleware to check if user is admin (super_admin or admin)
 * Convenience function for common admin check
 */
export const requireAdmin = requireAnyUserType(['super_admin', 'admin']);

/**
 * Middleware to check if user is property manager
 * Note: Using 'admin' user type since 'property_manager' doesn't exist
 */
export const requirePropertyManager = requireUserType('admin');
