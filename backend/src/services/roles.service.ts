import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { Role, RoleWithPermissions, Permission } from '../types/user.types';

/**
 * List all roles
 */
export const listRoles = async (): Promise<RoleWithPermissions[]> => {
  const supabase = getAdminClient();

  const { data: roles, error } = await supabase
    .from('roles')
    .select(`
      *,
      permissions:role_permissions (
        permission:permissions (*)
      )
    `)
    .order('priority', { ascending: false });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch roles');
  }

  return (roles || []).map((role: any) => ({
    ...role,
    permissions: (role.permissions || []).map((rp: any) => rp.permission),
  }));
};

/**
 * Get single role by ID
 */
export const getRole = async (roleId: string): Promise<RoleWithPermissions> => {
  const supabase = getAdminClient();

  const { data: role, error } = await supabase
    .from('roles')
    .select(`
      *,
      permissions:role_permissions (
        permission:permissions (*)
      )
    `)
    .eq('id', roleId)
    .single();

  if (error || !role) {
    throw new AppError('NOT_FOUND', 'Role not found');
  }

  return {
    ...role,
    permissions: (role.permissions || []).map((rp: any) => rp.permission),
  };
};

/**
 * List all permissions
 */
export const listPermissions = async (): Promise<Permission[]> => {
  const supabase = getAdminClient();

  const { data: permissions, error } = await supabase
    .from('permissions')
    .select('*')
    .order('resource')
    .order('action');

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch permissions');
  }

  return permissions || [];
};

/**
 * Create a new role
 */
export const createRole = async (
  data: {
    name: string;
    displayName: string;
    description?: string;
    priority?: number;
    permissionIds?: string[];
  },
  actorId: string
): Promise<RoleWithPermissions> => {
  const supabase = getAdminClient();

  // Check for duplicate name
  const { data: existing } = await supabase
    .from('roles')
    .select('id')
    .eq('name', data.name)
    .single();

  if (existing) {
    throw new AppError('CONFLICT', 'A role with this name already exists');
  }

  // Create role
  const { data: role, error: createError } = await supabase
    .from('roles')
    .insert({
      name: data.name,
      display_name: data.displayName,
      description: data.description || null,
      priority: data.priority || 100,
      is_system_role: false,
    })
    .select()
    .single();

  if (createError || !role) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create role');
  }

  // Assign permissions if provided
  if (data.permissionIds && data.permissionIds.length > 0) {
    const rolePermissions = data.permissionIds.map((permissionId) => ({
      role_id: role.id,
      permission_id: permissionId,
    }));

    const { error: permError } = await supabase
      .from('role_permissions')
      .insert(rolePermissions);

    if (permError) {
      // Cleanup: delete role if permission assignment fails
      await supabase.from('roles').delete().eq('id', role.id);
      throw new AppError('INTERNAL_ERROR', 'Failed to assign permissions to role');
    }
  }

  return getRole(role.id);
};

/**
 * Update an existing role
 */
export const updateRole = async (
  roleId: string,
  data: {
    displayName?: string;
    description?: string;
    priority?: number;
    permissionIds?: string[];
  },
  actorId: string
): Promise<RoleWithPermissions> => {
  const supabase = getAdminClient();

  // Get current role
  const { data: currentRole, error: fetchError } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .single();

  if (fetchError || !currentRole) {
    throw new AppError('NOT_FOUND', 'Role not found');
  }

  // Prevent modifying system roles (except super_admin can modify)
  if (currentRole.is_system_role) {
    throw new AppError('FORBIDDEN', 'Cannot modify system roles');
  }

  // Update role fields
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.displayName !== undefined) {
    updateData.display_name = data.displayName;
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }

  const { error: updateError } = await supabase
    .from('roles')
    .update(updateData)
    .eq('id', roleId);

  if (updateError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update role');
  }

  // Update permissions if provided
  if (data.permissionIds !== undefined) {
    // Remove existing permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Add new permissions
    if (data.permissionIds.length > 0) {
      const rolePermissions = data.permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) {
        throw new AppError('INTERNAL_ERROR', 'Failed to update role permissions');
      }
    }
  }

  return getRole(roleId);
};

/**
 * Delete a role
 */
export const deleteRole = async (
  roleId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Get current role
  const { data: role, error: fetchError } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .single();

  if (fetchError || !role) {
    throw new AppError('NOT_FOUND', 'Role not found');
  }

  // Prevent deleting system roles
  if (role.is_system_role) {
    throw new AppError('FORBIDDEN', 'Cannot delete system roles');
  }

  // Check if any users have this role
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('id')
    .eq('role_id', roleId)
    .limit(1);

  if (userRoles && userRoles.length > 0) {
    throw new AppError(
      'CONFLICT',
      'Cannot delete role that is assigned to users. Remove role from users first.'
    );
  }

  // Delete role permissions first
  await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId);

  // Delete role
  const { error: deleteError } = await supabase
    .from('roles')
    .delete()
    .eq('id', roleId);

  if (deleteError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete role');
  }

};

/**
 * Get permissions grouped by resource
 */
export const getPermissionsByResource = async (): Promise<Record<string, Permission[]>> => {
  const permissions = await listPermissions();

  const grouped: Record<string, Permission[]> = {};

  for (const perm of permissions) {
    if (!grouped[perm.resource]) {
      grouped[perm.resource] = [];
    }
    grouped[perm.resource].push(perm);
  }

  return grouped;
};
