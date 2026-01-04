import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { PermissionAction } from '../types/user.types';
import { isSuperAdmin } from './rbac.middleware';

/**
 * Resource types that can have permissions
 */
export type PermissionResource =
  | 'users'
  | 'roles'
  | 'properties'
  | 'bookings'
  | 'guests'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'audit_logs'
  | 'notifications';

/**
 * Format permission key from resource and action
 */
export const formatPermissionKey = (
  resource: PermissionResource,
  action: PermissionAction
): string => {
  return `${resource}:${action}`;
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  req: Request,
  resource: PermissionResource,
  action: PermissionAction
): boolean => {
  if (!req.userProfile) return false;

  // Super admin has all permissions
  if (isSuperAdmin(req)) return true;

  const key = formatPermissionKey(resource, action);

  // Check if permission exists in effective permissions
  // Also check for 'manage' which grants all actions
  const manageKey = formatPermissionKey(resource, 'manage');

  return (
    req.userProfile.effectivePermissions.includes(key) ||
    req.userProfile.effectivePermissions.includes(manageKey)
  );
};

/**
 * Middleware factory to require specific permission
 */
export const requirePermission = (
  resource: PermissionResource,
  action: PermissionAction
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      if (!hasPermission(req, resource, action)) {
        throw new AppError(
          'FORBIDDEN',
          `Permission denied: ${resource}:${action}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory to require any of the specified permissions
 */
export const requireAnyPermission = (
  permissions: Array<{ resource: PermissionResource; action: PermissionAction }>
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      const hasAny = permissions.some(({ resource, action }) =>
        hasPermission(req, resource, action)
      );

      if (!hasAny) {
        const permList = permissions
          .map(({ resource, action }) => `${resource}:${action}`)
          .join(', ');
        throw new AppError(
          'FORBIDDEN',
          `Requires one of the following permissions: ${permList}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory to require all of the specified permissions
 */
export const requireAllPermissions = (
  permissions: Array<{ resource: PermissionResource; action: PermissionAction }>
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      const missing = permissions.filter(
        ({ resource, action }) => !hasPermission(req, resource, action)
      );

      if (missing.length > 0) {
        const missingList = missing
          .map(({ resource, action }) => `${resource}:${action}`)
          .join(', ');
        throw new AppError(
          'FORBIDDEN',
          `Missing required permissions: ${missingList}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to require permission scoped to a specific property
 * User must have the permission AND be assigned to the property
 */
export const requirePropertyPermission = (
  resource: PermissionResource,
  action: PermissionAction
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userProfile) {
        throw new AppError('UNAUTHORIZED', 'Authentication required');
      }

      // Super admin bypasses all checks
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

      // Check if user has the required permission
      if (!hasPermission(req, resource, action)) {
        throw new AppError(
          'FORBIDDEN',
          `Permission denied: ${resource}:${action}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper to check multiple permissions at once
 */
export const checkPermissions = (
  req: Request,
  permissions: Array<{ resource: PermissionResource; action: PermissionAction }>
): Record<string, boolean> => {
  const result: Record<string, boolean> = {};

  for (const { resource, action } of permissions) {
    const key = formatPermissionKey(resource, action);
    result[key] = hasPermission(req, resource, action);
  }

  return result;
};
