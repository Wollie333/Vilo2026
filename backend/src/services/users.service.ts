import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import {
  UserWithRoles,
  UserListParams,
  UserListResponse,
  UpdateUserRequest,
  ApproveUserRequest,
  AssignRolesRequest,
  AssignPermissionsRequest,
  AssignPropertiesRequest,
} from '../types/user.types';
import { CreateUserInput } from '../validators/user.validators';

/**
 * List users with pagination and filters
 */
export const listUsers = async (
  params: UserListParams
): Promise<UserListResponse> => {
  const supabase = getAdminClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' });

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.search) {
    query = query.or(
      `email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`
    );
  }
  if (params.propertyId) {
    // Filter by property assignment
    const { data: propertyUsers } = await supabase
      .from('user_properties')
      .select('user_id')
      .eq('property_id', params.propertyId);

    if (propertyUsers && propertyUsers.length > 0) {
      const userIds = propertyUsers.map((pu) => pu.user_id);
      query = query.in('id', userIds);
    } else {
      // No users assigned to this property
      return {
        users: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }
  if (params.roleId) {
    // Filter by role
    const { data: roleUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_id', params.roleId);

    if (roleUsers && roleUsers.length > 0) {
      const userIds = roleUsers.map((ru) => ru.user_id);
      query = query.in('id', userIds);
    } else {
      return {
        users: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  // Apply sorting
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder === 'asc' ? true : false;
  query = query.order(sortBy, { ascending: sortOrder });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: profiles, error, count } = await query;

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch users');
  }

  // Batch enrich with roles and permissions (optimized to avoid N+1 queries)
  const users = await batchEnrichUserProfiles(profiles || []);

  const total = count || 0;

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Create a new user (admin function)
 */
export const createUser = async (
  data: CreateUserInput,
  actorId: string
): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  // Create auth user with Supabase Admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // Admin-created users have verified email
  });

  if (authError) {
    if (authError.message.includes('already')) {
      throw new AppError('CONFLICT', 'A user with this email already exists');
    }
    throw new AppError('BAD_REQUEST', authError.message);
  }

  if (!authData.user) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create user');
  }

  const userId = authData.user.id;

  // Update user profile with additional data
  const { error: updateError } = await supabase
    .from('users')
    .update({
      full_name: data.fullName,
      phone: data.phone || null,
      status: data.status || 'active',
      user_type_id: data.userTypeId || null,
      email_verified_at: new Date().toISOString(),
      approved_at: data.status === 'active' ? new Date().toISOString() : null,
      approved_by: data.status === 'active' ? actorId : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    // Clean up auth user if profile update fails
    await supabase.auth.admin.deleteUser(userId);
    throw new AppError('INTERNAL_ERROR', 'Failed to update user profile');
  }

  // NOTE: Roles are no longer assigned here - permissions come from user_type_permissions
  // based on the user_type_id set above

  return getUser(userId);
};

/**
 * Get single user by ID
 */
export const getUser = async (userId: string): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  return enrichUserProfile(profile);
};

/**
 * Update user profile
 */
export const updateUser = async (
  userId: string,
  data: UpdateUserRequest,
  actorId: string
): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  const { data: oldProfile, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (fetchError || !oldProfile) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  // Update profile
  const { data: newProfile, error: updateError } = await supabase
    .from('users')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (updateError || !newProfile) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update user');
  }

  return enrichUserProfile(newProfile);
};

/**
 * Soft delete user
 */
export const deleteUser = async (
  userId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  // Soft delete by setting status to deactivated
  const { error: updateError } = await supabase
    .from('users')
    .update({
      status: 'deactivated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete user');
  }

};

/**
 * Hard delete user (permanent deletion)
 * WARNING: This permanently removes the user and all their data
 */
export const hardDeleteUser = async (
  userId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  // Prevent deletion of super admin users
  const { data: userType } = await supabase
    .from('user_types')
    .select('name')
    .eq('id', profile.user_type_id)
    .single();

  if (userType?.name === 'super_admin') {
    throw new AppError('FORBIDDEN', 'Cannot delete super admin users');
  }

  // Delete all related records to avoid FK constraint violations
  // Order matters - delete child records first

  // 1. Delete room payment rule assignments (where user is assigner)
  await supabase
    .from('room_payment_rule_assignments')
    .delete()
    .eq('assigned_by', userId);

  // 2. Delete room assignments (where user is assigner)
  await supabase
    .from('room_assignments')
    .delete()
    .eq('assigned_by', userId);

  // 3. Delete user subscriptions
  await supabase
    .from('user_subscriptions')
    .delete()
    .eq('user_id', userId);

  // 4. Delete user permissions
  await supabase
    .from('user_permissions')
    .delete()
    .eq('user_id', userId);

  // 5. Delete company team memberships
  await supabase
    .from('company_team_members')
    .delete()
    .eq('user_id', userId);

  // 7. Delete checkouts
  await supabase
    .from('checkouts')
    .delete()
    .eq('user_id', userId);

  // 8. Delete user's properties (will cascade to rooms, bookings, etc.)
  await supabase
    .from('properties')
    .delete()
    .eq('owner_id', userId);

  // 9. Delete user's companies (will cascade to related records)
  await supabase
    .from('companies')
    .delete()
    .eq('owner_id', userId);

  // 10. Hard delete user from database
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (deleteError) {
    throw new AppError('INTERNAL_ERROR', `Failed to delete user: ${deleteError.message}`);
  }

};

/**
 * Approve pending user
 */
export const approveUser = async (
  userId: string,
  data: ApproveUserRequest,
  actorId: string
): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  // Get current profile
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  if (profile.status !== 'pending') {
    throw new AppError('BAD_REQUEST', 'User is not pending approval');
  }

  // Update status to active
  const { error: updateError } = await supabase
    .from('users')
    .update({
      status: 'active',
      approved_at: new Date().toISOString(),
      approved_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to approve user');
  }

  // Assign default role if specified
  if (data.defaultRole) {
    // Get role by name
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', data.defaultRole)
      .single();

    if (!roleError && role) {
      await supabase.from('user_roles').insert({
        user_id: userId,
        role_id: role.id,
        assigned_by: actorId,
      });
    }
  }

  // Assign to properties if specified
  if (data.propertyIds && data.propertyIds.length > 0) {
    const propertyAssignments = data.propertyIds.map((propertyId, index) => ({
      user_id: userId,
      property_id: propertyId,
      is_primary: index === 0,
      assigned_by: actorId,
    }));

    await supabase.from('user_properties').insert(propertyAssignments);
  }

  return getUser(userId);
};

/**
 * Assign roles to user
 */
export const assignRoles = async (
  userId: string,
  data: AssignRolesRequest,
  actorId: string
): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  // Verify user exists
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const { data: oldRoles } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);

  // Remove existing roles if replaceExisting
  if (data.replaceExisting) {
    let deleteQuery = supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (data.propertyId) {
      deleteQuery = deleteQuery.eq('property_id', data.propertyId);
    }

    await deleteQuery;
  }

  // Insert new roles
  const roleAssignments = data.roleIds.map((roleId) => ({
    user_id: userId,
    role_id: roleId,
    property_id: data.propertyId || null,
    assigned_by: actorId,
  }));

  const { error: insertError } = await supabase
    .from('user_roles')
    .upsert(roleAssignments, { onConflict: 'user_id,role_id,property_id' });

  if (insertError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to assign roles');
  }

  return getUser(userId);
};

/**
 * Assign permission overrides to user
 */
export const assignPermissions = async (
  userId: string,
  data: AssignPermissionsRequest,
  actorId: string
): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  // Verify user exists
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const { data: oldPerms } = await supabase
    .from('user_permissions')
    .select('permission_id, override_type')
    .eq('user_id', userId);

  // Remove existing if replaceExisting
  if (data.replaceExisting) {
    await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId);
  }

  // Insert new permissions
  const permAssignments = data.permissions.map((perm) => ({
    user_id: userId,
    permission_id: perm.permissionId,
    override_type: perm.overrideType,
    property_id: perm.propertyId || null,
    expires_at: perm.expiresAt || null,
    reason: perm.reason || null,
    granted_by: actorId,
  }));

  const { error: insertError } = await supabase
    .from('user_permissions')
    .upsert(permAssignments, { onConflict: 'user_id,permission_id,property_id' });

  if (insertError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to assign permissions');
  }

  return getUser(userId);
};

/**
 * Assign properties to user
 */
export const assignProperties = async (
  userId: string,
  data: AssignPropertiesRequest,
  actorId: string
): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  // Verify user exists
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const { data: oldProps } = await supabase
    .from('user_properties')
    .select('property_id')
    .eq('user_id', userId);

  // Remove existing if replaceExisting
  if (data.replaceExisting) {
    await supabase
      .from('user_properties')
      .delete()
      .eq('user_id', userId);
  }

  // Insert new properties
  const propAssignments = data.propertyIds.map((propertyId, index) => ({
    user_id: userId,
    property_id: propertyId,
    is_primary: index === 0 && data.replaceExisting,
    assigned_by: actorId,
  }));

  const { error: insertError } = await supabase
    .from('user_properties')
    .upsert(propAssignments, { onConflict: 'user_id,property_id' });

  if (insertError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to assign properties');
  }

  return getUser(userId);
};

/**
 * Suspend user
 */
export const suspendUser = async (
  userId: string,
  actorId: string
): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('users')
    .update({
      status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to suspend user');
  }


  return getUser(userId);
};

/**
 * Reactivate user
 */
export const reactivateUser = async (
  userId: string,
  actorId: string
): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('users')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to reactivate user');
  }


  return getUser(userId);
};

/**
 * Helper: Batch enrich user profiles with roles, permissions, and properties
 * Optimized to use batch queries instead of N+1 queries
 */
async function batchEnrichUserProfiles(profiles: any[]): Promise<UserWithRoles[]> {
  if (profiles.length === 0) return [];

  const supabase = getAdminClient();
  const userIds = profiles.map(p => p.id);

  // Batch fetch all roles for all users (1 query instead of N)
  const { data: allUserRoles } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role:roles (
        *,
        permissions:role_permissions (
          permission:permissions (*)
        )
      )
    `)
    .in('user_id', userIds);

  // Batch fetch all direct permissions (1 query instead of N)
  const { data: allDirectPermissions } = await supabase
    .from('user_permissions')
    .select(`
      user_id,
      *,
      permission:permissions (*)
    `)
    .in('user_id', userIds)
    .or('expires_at.is.null,expires_at.gt.now()');

  // Batch fetch all user properties (1 query instead of N)
  const { data: allUserProperties } = await supabase
    .from('user_properties')
    .select('*')
    .in('user_id', userIds);

  // Map results to each user
  return profiles.map(profile => {
    const userRoles = (allUserRoles || []).filter((ur: any) => ur.user_id === profile.id);
    const directPerms = (allDirectPermissions || []).filter((dp: any) => dp.user_id === profile.id);
    const userProps = (allUserProperties || []).filter((up: any) => up.user_id === profile.id);

    const roles = userRoles.map((ur: any) => ({
      ...ur.role,
      permissions: (ur.role?.permissions || []).map((rp: any) => rp.permission),
    }));

    const effectivePermissions = calculateEffectivePermissions(roles, directPerms);

    return {
      ...profile,
      roles,
      directPermissions: directPerms,
      effectivePermissions,
      properties: userProps,
    };
  });
}

/**
 * Helper: Enrich user profile with roles, permissions, and properties
 */
async function enrichUserProfile(profile: any): Promise<UserWithRoles> {
  const supabase = getAdminClient();

  // Get user roles with permissions
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
    .eq('user_id', profile.id);

  // Get direct permission overrides
  const { data: directPermissions } = await supabase
    .from('user_permissions')
    .select(`
      *,
      permission:permissions (*)
    `)
    .eq('user_id', profile.id)
    .or('expires_at.is.null,expires_at.gt.now()');

  // Get user properties
  const { data: userProperties } = await supabase
    .from('user_properties')
    .select('*')
    .eq('user_id', profile.id);

  // Build roles with permissions
  const roles = (userRoles || []).map((ur: any) => ({
    ...ur.role,
    permissions: (ur.role?.permissions || []).map((rp: any) => rp.permission),
  }));

  // Calculate effective permissions
  const effectivePermissions = calculateEffectivePermissions(roles, directPermissions || []);

  return {
    ...profile,
    roles,
    directPermissions: directPermissions || [],
    effectivePermissions,
    properties: userProperties || [],
  };
}

/**
 * Upload user avatar
 */
export const uploadAvatar = async (
  userId: string,
  file: Express.Multer.File,
  actorId: string
): Promise<string> => {
  const supabase = getAdminClient();

  // Verify user exists
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('id, avatar_url')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  // Delete old avatar if exists
  if (profile.avatar_url) {
    try {
      const oldPath = profile.avatar_url.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    } catch {
      // Ignore deletion errors - file may not exist
    }
  }

  // Generate unique filename
  const ext = file.originalname.split('.').pop() || 'jpg';
  const filename = `${userId}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to upload avatar');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filename);

  const avatarUrl = urlData.publicUrl;

  // Update user profile with new avatar URL
  const { error: updateError } = await supabase
    .from('users')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update avatar URL');
  }

  return avatarUrl;
};

/**
 * Calculate effective permissions
 */
function calculateEffectivePermissions(roles: any[], directPermissions: any[]): string[] {
  const permissionSet = new Set<string>();
  const deniedSet = new Set<string>();

  const sortedRoles = [...roles].sort((a, b) => b.priority - a.priority);

  for (const role of sortedRoles) {
    for (const perm of role.permissions || []) {
      const key = `${perm.resource}:${perm.action}`;
      permissionSet.add(key);
    }
  }

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

  for (const denied of deniedSet) {
    permissionSet.delete(denied);
  }

  return Array.from(permissionSet);
}
