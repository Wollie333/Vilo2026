import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

type PermissionResource =
  | 'users'
  | 'roles'
  | 'properties'
  | 'bookings'
  | 'guests'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'audit_logs';

type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

interface UsePermissionsReturn {
  can: (resource: PermissionResource, action: PermissionAction) => boolean;
  canAny: (
    permissions: Array<{ resource: PermissionResource; action: PermissionAction }>
  ) => boolean;
  canAll: (
    permissions: Array<{ resource: PermissionResource; action: PermissionAction }>
  ) => boolean;
  hasRole: (roleName: string) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  permissions: string[];
  roles: string[];
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user, hasPermission, hasRole, isSuperAdmin, isAdmin } = useAuth();

  const can = useCallback(
    (resource: PermissionResource, action: PermissionAction): boolean => {
      return hasPermission(resource, action);
    },
    [hasPermission]
  );

  const canAny = useCallback(
    (
      permissions: Array<{ resource: PermissionResource; action: PermissionAction }>
    ): boolean => {
      return permissions.some(({ resource, action }) => hasPermission(resource, action));
    },
    [hasPermission]
  );

  const canAll = useCallback(
    (
      permissions: Array<{ resource: PermissionResource; action: PermissionAction }>
    ): boolean => {
      return permissions.every(({ resource, action }) => hasPermission(resource, action));
    },
    [hasPermission]
  );

  const permissions = useMemo(() => {
    return user?.effectivePermissions || [];
  }, [user]);

  const roles = useMemo(() => {
    return user?.roles.map((r) => r.name) || [];
  }, [user]);

  return {
    can,
    canAny,
    canAll,
    hasRole,
    isSuperAdmin,
    isAdmin,
    permissions,
    roles,
  };
};
