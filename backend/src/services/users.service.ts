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
  UserStats,
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

  // Create subscription if provided
  if (data.subscription) {
    try {
      // Check for existing active subscription
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!existingSub) {
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            subscription_type_id: data.subscription.subscription_type_id,
            status: data.subscription.status || 'active',
            started_at: new Date().toISOString(),
            trial_ends_at: data.subscription.trial_ends_at || null,
            expires_at: data.subscription.expires_at || null,
            is_active: true,
          });

        if (subError) {
          console.error('Subscription creation failed:', subError);
          // Don't fail user creation - admin can assign subscription manually later
        }
      } else {
        console.warn(`User ${userId} already has an active subscription`);
      }
    } catch (subError) {
      console.error('Subscription creation error:', subError);
      // Continue - user creation succeeded
    }
  }

  return getUser(userId);
};

/**
 * Get single user by ID
 */
export const getUser = async (userId: string): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  const { data: profile, error } = await supabase
    .from('users')
    .select(`
      *,
      user_type:user_types (
        id,
        name,
        display_name,
        category
      )
    `)
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

/**
 * Get user statistics (property count, room count, team count, etc.)
 * Super admin only
 */
export const getUserStats = async (userId: string): Promise<UserStats> => {
  const supabase = getAdminClient();

  // Get property count (owned by user)
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);

  // Get room count and addon count (from all user's properties)
  let roomCount = 0;
  let addonCount = 0;
  if (propertyCount && propertyCount > 0) {
    const { data: userProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_id', userId);

    if (userProperties && userProperties.length > 0) {
      const propertyIds = userProperties.map((p) => p.id);

      // Get room count
      const { count: roomsCount } = await supabase
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .in('property_id', propertyIds);
      roomCount = roomsCount || 0;

      // Get addon count
      const { count: addonsCount } = await supabase
        .from('add_ons')
        .select('id', { count: 'exact', head: true })
        .in('property_id', propertyIds);
      addonCount = addonsCount || 0;
    }
  }

  // Get team member count (users with this user as parent)
  const { count: teamMemberCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('parent_user_id', userId);

  // Get booking count (as guest + as property owner)
  // Use same logic as getBookingsByUser for consistency
  const { data: userPropertiesForBookings } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', userId);

  const userPropertyIds = userPropertiesForBookings?.map((p) => p.id) || [];

  let bookingCountQuery = supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true });

  if (userPropertyIds.length > 0) {
    // Count bookings where user is guest OR owns the property
    bookingCountQuery = bookingCountQuery.or(`guest_id.eq.${userId},property_id.in.(${userPropertyIds.join(',')})`);
  } else {
    // If user has no properties, only count bookings where they are the guest
    bookingCountQuery = bookingCountQuery.eq('guest_id', userId);
  }

  const { count: bookingCount } = await bookingCountQuery;

  // Get review count (as reviewer)
  const { count: reviewCount } = await supabase
    .from('property_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('guest_id', userId);

  // Get customer count (unique guests who booked at user's properties)
  // Use same logic as getCustomersByUser for consistency
  let customerCount = 0;
  const userProperties = await getUserProperties(userId);
  const propertyIds = userProperties.map((p: any) => p.id);

  if (propertyIds.length > 0) {
    // Get non-cancelled bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('guest_email, guest_phone, guest_name, created_at')
      .in('property_id', propertyIds)
      .neq('booking_status', 'cancelled');

    if (bookings) {
      // Group by email/phone (same logic as getCustomersByUser)
      const customerSet = new Set<string>();
      bookings.forEach((booking: any) => {
        const key = booking.guest_email || booking.guest_phone || `${booking.guest_name}-${booking.created_at}`;
        customerSet.add(key);
      });
      customerCount = customerSet.size;
    }
  }

  return {
    propertyCount: propertyCount || 0,
    roomCount,
    addonCount,
    teamMemberCount: teamMemberCount || 0,
    bookingCount: bookingCount || 0,
    reviewCount: reviewCount || 0,
    customerCount,
  };
};

/**
 * Get properties assigned to or owned by a user
 */
export const getUserProperties = async (userId: string): Promise<any[]> => {
  console.log('getUserProperties - userId:', userId);
  const supabase = getAdminClient();

  // Get properties owned by user
  console.log('getUserProperties - fetching owned properties...');
  const { data: ownedProperties, error: ownedError } = await supabase
    .from('properties')
    .select(`
      id,
      name,
      slug,
      description,
      address_street,
      address_city,
      address_state,
      address_country,
      featured_image_url,
      is_active,
      created_at,
      owner_id
    `)
    .eq('owner_id', userId);

  if (ownedError) {
    console.error('getUserProperties - ownedError:', ownedError);
    throw new AppError('INTERNAL_ERROR', `Failed to fetch owned properties: ${ownedError.message}`);
  }
  console.log('getUserProperties - owned properties count:', ownedProperties?.length || 0);

  // Get properties assigned to user (via user_properties table)
  console.log('getUserProperties - fetching assigned properties...');
  const { data: assignedProperties, error: assignedError } = await supabase
    .from('user_properties')
    .select(`
      property_id,
      is_primary,
      created_at,
      property:properties (
        id,
        name,
        slug,
        description,
        address_street,
        address_city,
        address_state,
        address_country,
        featured_image_url,
        is_active,
        created_at,
        owner_id
      )
    `)
    .eq('user_id', userId);

  if (assignedError) {
    console.error('getUserProperties - assignedError:', assignedError);
    throw new AppError('INTERNAL_ERROR', `Failed to fetch assigned properties: ${assignedError.message}`);
  }
  console.log('getUserProperties - assigned properties count:', assignedProperties?.length || 0);

  // Combine and deduplicate properties
  const propertyMap = new Map();

  // Add owned properties
  (ownedProperties || []).forEach((prop) => {
    propertyMap.set(prop.id, {
      ...prop,
      relationship: 'owner',
      is_primary: false,
    });
  });

  // Add assigned properties (override if already in map as owner)
  (assignedProperties || []).forEach((assignment: any) => {
    const prop = assignment.property;
    if (prop) {
      const existing = propertyMap.get(prop.id);
      if (existing && existing.relationship === 'owner') {
        // Keep as owner but update is_primary
        propertyMap.set(prop.id, {
          ...existing,
          is_primary: assignment.is_primary || existing.is_primary,
        });
      } else {
        // Add as assigned
        propertyMap.set(prop.id, {
          ...prop,
          relationship: 'assigned',
          is_primary: assignment.is_primary,
          assigned_at: assignment.created_at,
        });
      }
    }
  });

  // Get room counts for each property
  const propertyIds = Array.from(propertyMap.keys());
  if (propertyIds.length > 0) {
    const { data: roomCounts } = await supabase
      .from('rooms')
      .select('property_id')
      .in('property_id', propertyIds);

    const countMap = new Map();
    (roomCounts || []).forEach((room: any) => {
      countMap.set(room.property_id, (countMap.get(room.property_id) || 0) + 1);
    });

    // Add room counts to properties
    propertyMap.forEach((prop, id) => {
      prop.room_count = countMap.get(id) || 0;
    });
  }

  return Array.from(propertyMap.values());
};

/**
 * Unassign a property from a user
 */
export const unassignProperty = async (
  userId: string,
  propertyId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify user exists
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  // Verify property exists
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, owner_id')
    .eq('id', propertyId)
    .single();

  if (propError || !property) {
    throw new AppError('NOT_FOUND', 'Property not found');
  }

  // Cannot unassign if user is the owner
  if (property.owner_id === userId) {
    throw new AppError('VALIDATION_ERROR', 'Cannot unassign property from its owner');
  }

  // Delete assignment
  const { error: deleteError } = await supabase
    .from('user_properties')
    .delete()
    .eq('user_id', userId)
    .eq('property_id', propertyId);

  if (deleteError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to unassign property');
  }

  // Log activity
  await logActivity({
    user_id: actorId,
    action: 'unassign_property',
    entity_type: 'user',
    entity_id: userId,
    old_data: { property_id: propertyId },
  });
};

/**
 * Get team members for a user (users where parent_user_id = userId)
 * Super admin only
 */
export const getTeamMembers = async (userId: string): Promise<any[]> => {
  const supabase = getAdminClient();

  // Get team members (users with this user as parent)
  const { data: teamMembers, error: teamError } = await supabase
    .from('users')
    .select(`
      id, email, full_name, phone, avatar_url,
      status, created_at, last_login_at,
      user_types (
        id, name, description
      ),
      user_roles!user_roles_user_id_fkey (
        roles (
          id, name, display_name
        )
      )
    `)
    .eq('parent_user_id', userId)
    .order('created_at', { ascending: false });

  if (teamError) {
    console.error('Error fetching team members:', teamError);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch team members');
  }

  // Transform the response to flatten roles
  const membersWithRoles = (teamMembers || []).map((member: any) => ({
    id: member.id,
    email: member.email,
    full_name: member.full_name,
    phone: member.phone,
    avatar_url: member.avatar_url,
    status: member.status,
    created_at: member.created_at,
    last_login_at: member.last_login_at,
    user_type: member.user_types,
    roles: (member.user_roles || []).map((ur: any) => ur.roles).filter(Boolean),
  }));

  return membersWithRoles;
};

/**
 * Invite a team member (create user with parent_user_id)
 * Super admin only
 */
export const inviteTeamMember = async (
  parentUserId: string,
  data: {
    email: string;
    full_name: string;
    phone?: string;
    roleIds?: string[];
  },
  actorId: string
): Promise<any> => {
  const supabase = getAdminClient();

  // Verify parent user exists
  const { data: parentUser, error: parentError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', parentUserId)
    .single();

  if (parentError || !parentUser) {
    throw new AppError('NOT_FOUND', 'Parent user not found');
  }

  // Check if email already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email)
    .single();

  if (existingUser) {
    throw new AppError('VALIDATION_ERROR', 'A user with this email already exists');
  }

  // Create user with pending status (they need to set password)
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      parent_user_id: parentUserId,
      status: 'pending',
      email_verified: false,
    })
    .select()
    .single();

  if (createError || !newUser) {
    console.error('Error creating team member:', createError);
    throw new AppError('INTERNAL_ERROR', 'Failed to create team member');
  }

  // Assign roles if provided
  if (data.roleIds && data.roleIds.length > 0) {
    const roleInserts = data.roleIds.map(roleId => ({
      user_id: newUser.id,
      role_id: roleId,
    }));

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert(roleInserts);

    if (roleError) {
      console.error('Error assigning roles:', roleError);
      // Don't fail the whole operation, just log it
    }
  }

  // Log activity
  await logActivity({
    user_id: actorId,
    action: 'invite_team_member',
    entity_type: 'user',
    entity_id: newUser.id,
    new_data: {
      email: data.email,
      full_name: data.full_name,
      parent_user_id: parentUserId,
    },
  });

  // TODO: Send invitation email with password setup link
  // This would use a email service to send an invite

  return newUser;
};

/**
 * Remove team member (remove parent relationship)
 * Super admin only
 */
export const removeTeamMember = async (
  parentUserId: string,
  memberId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify the member exists and is actually a team member of this parent
  const { data: member, error: memberError } = await supabase
    .from('users')
    .select('id, parent_user_id, email')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    throw new AppError('NOT_FOUND', 'Team member not found');
  }

  if (member.parent_user_id !== parentUserId) {
    throw new AppError('VALIDATION_ERROR', 'This user is not a team member of the specified parent');
  }

  // Remove the parent relationship (keep the user account but detach from team)
  const { error: updateError } = await supabase
    .from('users')
    .update({ parent_user_id: null })
    .eq('id', memberId);

  if (updateError) {
    console.error('Error removing team member:', updateError);
    throw new AppError('INTERNAL_ERROR', 'Failed to remove team member');
  }

  // Log activity
  await logActivity({
    user_id: actorId,
    action: 'remove_team_member',
    entity_type: 'user',
    entity_id: memberId,
    old_data: {
      parent_user_id: parentUserId,
      email: member.email,
    },
  });
};

/**
 * Get customers for a user (unique guests who have booked at their properties)
 * Super admin only
 */
export const getCustomersByUser = async (userId: string): Promise<any[]> => {
  const supabase = getAdminClient();

  // Get all properties owned or assigned to this user
  const properties = await getUserProperties(userId);
  const propertyIds = properties.map((p: any) => p.id);

  if (propertyIds.length === 0) {
    return [];
  }

  // Get unique customers from bookings at these properties
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      guest_name,
      guest_email,
      guest_phone,
      created_at,
      check_in_date,
      check_out_date,
      total_amount,
      currency,
      booking_status,
      payment_status,
      property_id,
      properties (
        id,
        name
      )
    `)
    .in('property_id', propertyIds)
    .neq('booking_status', 'cancelled')
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('Error fetching customer bookings:', bookingsError);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch customers');
  }

  // Aggregate by email/phone to create unique customers
  const customerMap = new Map<string, any>();

  (bookings || []).forEach((booking: any) => {
    // Use email as primary key, fallback to phone or generate a key
    const key = booking.guest_email || booking.guest_phone || `${booking.guest_name}-${booking.created_at}`;

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone,
        first_booking_date: booking.created_at,
        last_booking_date: booking.created_at,
        total_bookings: 0,
        total_spent: 0,
        currency: booking.currency || 'ZAR',
        properties: new Set<string>(),
      });
    }

    const customer = customerMap.get(key);
    customer.total_bookings += 1;
    customer.total_spent += parseFloat(booking.total_amount || 0);
    customer.properties.add(booking.properties?.name || 'Unknown Property');

    // Update date range
    const bookingDate = new Date(booking.created_at);
    if (bookingDate < new Date(customer.first_booking_date)) {
      customer.first_booking_date = booking.created_at;
    }
    if (bookingDate > new Date(customer.last_booking_date)) {
      customer.last_booking_date = booking.created_at;
    }
  });

  // Convert to array and transform properties Set to array
  const customers = Array.from(customerMap.values()).map((customer) => ({
    ...customer,
    properties: Array.from(customer.properties),
  }));

  // Look up customer IDs from the customers table
  const emails = customers
    .map((c) => c.guest_email)
    .filter((email): email is string => !!email);

  if (emails.length > 0) {
    const { data: customerRecords } = await supabase
      .from('customers')
      .select('id, email')
      .in('email', emails);

    if (customerRecords) {
      const emailToIdMap = new Map(
        customerRecords.map((c) => [c.email.toLowerCase(), c.id])
      );

      customers.forEach((customer) => {
        if (customer.guest_email) {
          customer.customer_id = emailToIdMap.get(customer.guest_email.toLowerCase()) || null;
        }
      });
    }
  }

  // Sort by total bookings (most valuable customers first)
  customers.sort((a, b) => b.total_bookings - a.total_bookings);

  return customers;
};

/**
 * Get all rooms for a user's properties
 * Super admin only - aggregates rooms from all properties (owned + assigned)
 */
export const getUserRooms = async (userId: string): Promise<any[]> => {
  console.log('getUserRooms service - starting for userId:', userId);
  const supabase = getAdminClient();

  // Step 1: Get all properties for this user (owned + assigned)
  console.log('getUserRooms - fetching owned properties...');
  const { data: ownedProperties, error: ownedError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('owner_id', userId);

  if (ownedError) {
    console.error('getUserRooms - owned properties error:', ownedError);
    throw new Error(`Failed to fetch owned properties: ${ownedError.message}`);
  }
  console.log('getUserRooms - owned properties:', ownedProperties?.length || 0);

  console.log('getUserRooms - fetching assigned properties...');
  const { data: assignedProperties, error: assignedError } = await supabase
    .from('user_properties')
    .select(`
      property_id,
      properties (id, name)
    `)
    .eq('user_id', userId);

  if (assignedError) {
    console.error('getUserRooms - assigned properties error:', assignedError);
    throw new Error(`Failed to fetch assigned properties: ${assignedError.message}`);
  }
  console.log('getUserRooms - assigned properties:', assignedProperties?.length || 0);

  // Combine all property IDs
  const ownedPropertyIds = (ownedProperties || []).map((p) => p.id);
  const assignedPropertyData = (assignedProperties || [])
    .filter((ap: any) => ap.properties)
    .map((ap: any) => ap.properties);
  const assignedPropertyIds = assignedPropertyData.map((p: any) => p.id);

  // Deduplicate property IDs
  const allPropertyIds = [...new Set([...ownedPropertyIds, ...assignedPropertyIds])];

  if (allPropertyIds.length === 0) {
    return [];
  }

  // Step 2: Fetch all rooms for these properties (using SELECT * pattern from working booking system)
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select(`
      *,
      properties (
        id,
        name
      )
    `)
    .in('property_id', allPropertyIds)
    .order('created_at', { ascending: false });

  if (roomsError) {
    throw new Error(`Failed to fetch rooms: ${roomsError.message}`);
  }

  // Step 3: Fetch bed data separately (like room.service.ts does)
  let bedsMap = new Map();
  if (rooms && rooms.length > 0) {
    const roomIds = rooms.map((r: any) => r.id);
    const { data: bedsData } = await supabase
      .from('room_beds')
      .select('*')
      .in('room_id', roomIds)
      .order('sort_order', { ascending: true });

    // Aggregate beds per room
    bedsData?.forEach((bed: any) => {
      if (!bedsMap.has(bed.room_id)) {
        bedsMap.set(bed.room_id, []);
      }
      bedsMap.get(bed.room_id).push(bed);
    });
  }

  // Step 4: Format response with aggregated bed data
  const formattedRooms = (rooms || []).map((room: any) => {
    const beds = bedsMap.get(room.id) || [];
    const num_beds = beds.reduce((sum: number, bed: any) => sum + (bed.quantity || 1), 0);
    const bed_types = beds.map((bed: any) => bed.bed_type);

    return {
      id: room.id,
      property_id: room.property_id,
      property_name: room.properties?.name || 'Unknown Property',
      name: room.name,
      room_code: room.room_code,
      pricing_mode: room.pricing_mode,
      inventory_mode: room.inventory_mode,
      base_price_per_night: room.base_price_per_night,
      additional_person_rate: room.additional_person_rate,
      currency: room.currency,
      max_occupancy: room.max_guests, // Using correct column name from database
      num_beds: num_beds,
      bed_types: bed_types.length > 0 ? bed_types : null,
      is_active: room.is_active,
      created_at: room.created_at,
    };
  });

  return formattedRooms;
};

/**
 * Get all addons for a user's properties
 * Super admin only - aggregates addons from all properties (owned + assigned)
 */
export const getUserAddons = async (userId: string): Promise<any[]> => {
  const supabase = getAdminClient();

  // Step 1: Get all properties for this user (owned + assigned)
  const { data: ownedProperties, error: ownedError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('owner_id', userId);

  if (ownedError) {
    throw new Error(`Failed to fetch owned properties: ${ownedError.message}`);
  }

  const { data: assignedProperties, error: assignedError } = await supabase
    .from('user_properties')
    .select(`
      property_id,
      properties (id, name)
    `)
    .eq('user_id', userId);

  if (assignedError) {
    throw new Error(`Failed to fetch assigned properties: ${assignedError.message}`);
  }

  // Combine all property IDs
  const ownedPropertyIds = (ownedProperties || []).map((p) => p.id);
  const assignedPropertyData = (assignedProperties || [])
    .filter((ap: any) => ap.properties)
    .map((ap: any) => ap.properties);
  const assignedPropertyIds = assignedPropertyData.map((p: any) => p.id);

  // Deduplicate property IDs
  const allPropertyIds = [...new Set([...ownedPropertyIds, ...assignedPropertyIds])];

  if (allPropertyIds.length === 0) {
    return [];
  }

  // Step 2: Fetch all addons for these properties
  const { data: addons, error: addonsError } = await supabase
    .from('add_ons')
    .select(`
      id,
      property_id,
      name,
      description,
      type,
      pricing_type,
      price,
      currency,
      max_quantity,
      is_active,
      created_at,
      properties (
        id,
        name
      )
    `)
    .in('property_id', allPropertyIds)
    .order('created_at', { ascending: false });

  if (addonsError) {
    throw new Error(`Failed to fetch addons: ${addonsError.message}`);
  }

  // Step 3: Format response
  const formattedAddons = (addons || []).map((addon: any) => ({
    id: addon.id,
    property_id: addon.property_id,
    property_name: addon.properties?.name || 'Unknown Property',
    name: addon.name,
    description: addon.description,
    type: addon.type,
    pricing_type: addon.pricing_type,
    price: addon.price,
    currency: addon.currency,
    max_quantity: addon.max_quantity,
    is_active: addon.is_active,
    created_at: addon.created_at,
  }));

  return formattedAddons;
};

/**
 * Get all cancellation policies for a user's properties
 * Super admin only - shows which policies affect user's properties
 */
export const getUserPolicies = async (userId: string): Promise<any> => {
  const supabase = getAdminClient();

  console.log('\n========================================');
  console.log('🔍 getUserPolicies - START');
  console.log('========================================');
  console.log('User ID:', userId);

  // Step 1: Get all properties for this user (owned + assigned)
  const { data: ownedProperties, error: ownedError } = await supabase
    .from('properties')
    .select('id, name, cancellation_policy')
    .eq('owner_id', userId);

  if (ownedError) {
    throw new Error(`Failed to fetch owned properties: ${ownedError.message}`);
  }

  console.log('\n📦 Owned Properties:', ownedProperties?.length || 0);
  ownedProperties?.forEach((p, i) => {
    console.log(`  ${i + 1}. "${p.name}"`);
    console.log(`     - ID: ${p.id}`);
    console.log(`     - cancellation_policy: "${p.cancellation_policy}"`);
    console.log(`     - Type: ${typeof p.cancellation_policy}`);
  });

  const { data: assignedProperties, error: assignedError } = await supabase
    .from('user_properties')
    .select(`
      property_id,
      properties (id, name, cancellation_policy)
    `)
    .eq('user_id', userId);

  if (assignedError) {
    throw new Error(`Failed to fetch assigned properties: ${assignedError.message}`);
  }

  console.log('\n📦 Assigned Properties:', assignedProperties?.length || 0);

  // Combine all properties
  const ownedPropertiesData = (ownedProperties || []).map((p) => ({
    id: p.id,
    name: p.name,
    cancellation_policy: p.cancellation_policy,
  }));

  const assignedPropertiesData = (assignedProperties || [])
    .filter((ap: any) => ap.properties)
    .map((ap: any) => ({
      id: ap.properties.id,
      name: ap.properties.name,
      cancellation_policy: ap.properties.cancellation_policy,
    }));

  // Deduplicate properties by ID
  const propertiesMap = new Map();
  [...ownedPropertiesData, ...assignedPropertiesData].forEach((prop) => {
    if (!propertiesMap.has(prop.id)) {
      propertiesMap.set(prop.id, prop);
    }
  });
  const allProperties = Array.from(propertiesMap.values());

  console.log('\n📊 Total Unique Properties:', allProperties.length);

  if (allProperties.length === 0) {
    console.log('⚠️  No properties found, returning empty result');
    return { policies: [], propertyPolicies: [] };
  }

  // Step 2: Get unique policy names (string values like 'flexible', 'moderate', etc.)
  const policyNames = [...new Set(
    allProperties
      .map((p) => p.cancellation_policy)
      .filter(Boolean)
      .map((name) => name.toLowerCase())
  )];

  console.log('\n🏷️  Unique Policy Names from Properties:', policyNames);

  // Step 3: Fetch all cancellation policies from the database
  const { data: allPolicies, error: policiesError } = await supabase
    .from('cancellation_policies')
    .select(`
      id,
      name,
      description,
      tiers,
      is_active,
      created_at,
      updated_at
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (policiesError) {
    throw new Error(`Failed to fetch policies: ${policiesError.message}`);
  }

  console.log('\n📋 Policies from Database:', allPolicies?.length || 0);
  allPolicies?.forEach((policy, i) => {
    console.log(`  ${i + 1}. "${policy.name}"`);
    console.log(`     - ID: ${policy.id}`);
    console.log(`     - Lowercase: "${policy.name.toLowerCase()}"`);
    console.log(`     - is_active: ${policy.is_active}`);
  });

  // Create TWO maps: one for names (legacy), one for IDs (new schema)
  const policiesByName = new Map(
    (allPolicies || []).map((p) => [p.name.toLowerCase(), p])
  );
  const policiesById = new Map(
    (allPolicies || []).map((p) => [p.id, p])
  );

  console.log('\n🗺️  Policies Map Keys (by name):', Array.from(policiesByName.keys()));
  console.log('🗺️  Policies Map Keys (by ID):', Array.from(policiesById.keys()));

  // Step 4: Return ALL active policies (not just ones used by properties)
  // This ensures policies created in the legal section show up even if not yet assigned
  // NOTE: Currently showing all system-wide policies because cancellation_policies table
  // doesn't have user_id/company_id. Future improvement: add ownership to policies table.
  const usedPolicies = allPolicies || [];

  // Helper to check if a string is a UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Step 5: Map properties to their policies
  console.log('\n🔗 Matching Properties to Policies:');
  const propertyPolicies = allProperties.map((prop) => {
    const policyValue = prop.cancellation_policy;
    let policy = null;

    console.log(`\n  Property: "${prop.name}"`);
    console.log(`    - cancellation_policy value: "${policyValue}"`);

    if (policyValue) {
      // Check if it's a UUID (new schema) or a name (legacy schema)
      if (isUUID(policyValue)) {
        console.log(`    - Detected as UUID - matching by ID`);
        policy = policiesById.get(policyValue) || null;
      } else {
        console.log(`    - Detected as name - matching by name (case-insensitive)`);
        const policyName = policyValue.toLowerCase();
        policy = policiesByName.get(policyName) || null;
      }

      console.log(`    - Found in map: ${policy ? 'YES' : 'NO'}`);
      if (policy) {
        console.log(`    - ✅ Matched policy: "${policy.name}" (${policy.id})`);
      } else {
        console.log(`    - ❌ NO MATCH FOUND for "${policyValue}"`);
      }
    } else {
      console.log(`    - No cancellation_policy set (null/empty)`);
    }

    return {
      property_id: prop.id,
      property_name: prop.name,
      policy_id: policy?.id || null,
      policy_name: policy?.name || prop.cancellation_policy || 'No Policy',
    };
  });

  console.log('\n📤 Final Result:');
  console.log('  - Total policies:', usedPolicies.length);
  console.log('  - Property mappings:', propertyPolicies.length);
  console.log('  - Properties WITH policy:', propertyPolicies.filter(pp => pp.policy_id).length);
  console.log('  - Properties WITHOUT policy:', propertyPolicies.filter(pp => !pp.policy_id).length);
  console.log('========================================\n');

  return {
    policies: usedPolicies,
    propertyPolicies,
  };
};

/**
 * Get property terms and conditions for a user
 * Super admin only - shows terms for all user properties
 */
export const getUserTerms = async (userId: string): Promise<any[]> => {
  const supabase = getAdminClient();

  console.log('\n========================================');
  console.log('🔍 getUserTerms - START');
  console.log('========================================');
  console.log('User ID:', userId);

  // Step 1: Get all properties for this user (owned + assigned)
  const { data: ownedProperties, error: ownedError } = await supabase
    .from('properties')
    .select('id, name, terms_and_conditions, updated_at')
    .eq('owner_id', userId);

  if (ownedError) {
    throw new Error(`Failed to fetch owned properties: ${ownedError.message}`);
  }

  console.log('\n📦 Owned Properties:', ownedProperties?.length || 0);
  ownedProperties?.forEach((p, i) => {
    console.log(`  ${i + 1}. "${p.name}"`);
    console.log(`     - ID: ${p.id}`);
    console.log(`     - terms_and_conditions: ${p.terms_and_conditions ? `"${p.terms_and_conditions.substring(0, 100)}..."` : 'null'}`);
    console.log(`     - Type: ${typeof p.terms_and_conditions}`);
    console.log(`     - Length: ${p.terms_and_conditions?.length || 0} characters`);
  });

  const { data: assignedProperties, error: assignedError } = await supabase
    .from('user_properties')
    .select(`
      property_id,
      properties (id, name, terms_and_conditions, updated_at)
    `)
    .eq('user_id', userId);

  if (assignedError) {
    throw new Error(`Failed to fetch assigned properties: ${assignedError.message}`);
  }

  console.log('\n📦 Assigned Properties:', assignedProperties?.length || 0);

  // Combine all properties
  const ownedPropertiesData = (ownedProperties || []).map((p) => ({
    id: p.id,
    name: p.name,
    terms_and_conditions: p.terms_and_conditions,
    updated_at: p.updated_at,
  }));

  const assignedPropertiesData = (assignedProperties || [])
    .filter((ap: any) => ap.properties)
    .map((ap: any) => ({
      id: ap.properties.id,
      name: ap.properties.name,
      terms_and_conditions: ap.properties.terms_and_conditions,
      updated_at: ap.properties.updated_at,
    }));

  // Deduplicate properties by ID
  const propertiesMap = new Map();
  [...ownedPropertiesData, ...assignedPropertiesData].forEach((prop) => {
    if (!propertiesMap.has(prop.id)) {
      propertiesMap.set(prop.id, prop);
    }
  });

  const result = Array.from(propertiesMap.values());

  console.log('\n📤 Final Result:');
  console.log('  - Total properties:', result.length);
  console.log('  - Properties WITH terms:', result.filter(p => p.terms_and_conditions).length);
  console.log('  - Properties WITHOUT terms:', result.filter(p => !p.terms_and_conditions).length);
  console.log('========================================\n');

  return result;
};

/**
 * Get payment integrations for a user's company
 * Super admin only - returns sanitized data (no API keys)
 */
export const getUserPaymentIntegrations = async (userId: string): Promise<any[]> => {
  const supabase = getAdminClient();

  // Step 1: Get user's company
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (userError) {
    throw new Error(`Failed to fetch user: ${userError.message}`);
  }

  if (!userData?.company_id) {
    return [];
  }

  // Step 2: Fetch payment integrations for the company
  const { data: integrations, error: integrationsError } = await supabase
    .from('company_payment_integrations')
    .select(`
      id,
      company_id,
      provider,
      display_name,
      is_enabled,
      is_primary,
      environment,
      verification_status,
      last_verified_at,
      created_at,
      updated_at
    `)
    .eq('company_id', userData.company_id)
    .order('created_at', { ascending: false });

  if (integrationsError) {
    throw new Error(`Failed to fetch payment integrations: ${integrationsError.message}`);
  }

  // Step 3: Return sanitized data (NO API keys or secrets)
  const sanitizedIntegrations = (integrations || []).map((integration: any) => ({
    id: integration.id,
    provider: integration.provider,
    display_name: integration.display_name,
    is_enabled: integration.is_enabled,
    is_primary: integration.is_primary,
    environment: integration.environment,
    verification_status: integration.verification_status,
    last_verified_at: integration.last_verified_at,
    created_at: integration.created_at,
    updated_at: integration.updated_at,
  }));

  return sanitizedIntegrations;
};

/**
 * Get subscription details and usage for a user
 * Super admin only - shows plan, limits, and current usage
 */
export const getUserSubscriptionDetails = async (userId: string): Promise<any> => {
  const supabase = getAdminClient();

  // Step 1: Get user subscription
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select(`
      id,
      user_id,
      subscription_type_id,
      status,
      starts_at,
      expires_at,
      trial_ends_at,
      auto_renew,
      created_at,
      subscription_types (
        id,
        name,
        display_name,
        description,
        price_cents,
        currency,
        billing_cycle_days,
        is_recurring
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subError && subError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch subscription: ${subError.message}`);
  }

  // Step 2: Get subscription limits if subscription exists
  let limits: any = {};
  if (subscription?.subscription_type_id) {
    const { data: limitsData, error: limitsError } = await supabase
      .from('subscription_limits')
      .select('limit_key, limit_value')
      .eq('subscription_type_id', subscription.subscription_type_id);

    if (!limitsError && limitsData) {
      limits = limitsData.reduce((acc: any, item: any) => {
        acc[item.limit_key] = item.limit_value;
        return acc;
      }, {});
    }
  }

  // Step 3: Get user stats for usage calculation
  const stats = await getUserStats(userId);

  // Step 4: Calculate usage vs limits
  const usage = {
    properties: {
      used: stats.propertyCount || 0,
      limit: limits.max_properties || null,
    },
    rooms: {
      used: stats.roomCount || 0,
      limit: limits.max_rooms || null,
    },
    team_members: {
      used: stats.teamMemberCount || 0,
      limit: limits.max_team_members || null,
    },
    bookings: {
      used: stats.bookingCount || 0,
      limit: limits.max_bookings_per_month || null,
    },
  };

  return {
    subscription: subscription || null,
    limits,
    usage,
  };
};

/**
 * Get payment history for a user (invoices and transactions)
 * Super admin only - shows all payment-related activity
 */
export const getUserPaymentHistory = async (userId: string): Promise<any> => {
  const supabase = getAdminClient();

  // Step 1: Fetch invoices for the user
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select(`
      id,
      user_id,
      invoice_number,
      total_cents,
      currency,
      status,
      line_items,
      payment_method,
      payment_reference,
      payment_date,
      pdf_url,
      created_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (invoicesError) {
    console.error('Error fetching invoices:', invoicesError);
  }

  // Step 2: Fetch checkout transactions (subscription purchases)
  const { data: checkouts, error: checkoutsError } = await supabase
    .from('checkouts')
    .select(`
      id,
      user_id,
      subscription_type_id,
      amount_cents,
      currency,
      status,
      payment_provider,
      payment_reference,
      billing_interval,
      created_at,
      completed_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (checkoutsError) {
    console.error('Error fetching checkouts:', checkoutsError);
  }

  // Step 3: Calculate statistics
  const paidInvoices = (invoices || []).filter((inv: any) => inv.status === 'paid');
  const totalPaidCents = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.total_cents || 0), 0);
  const draftInvoices = (invoices || []).filter((inv: any) => inv.status === 'draft');
  const totalDraftCents = draftInvoices.reduce((sum: number, inv: any) => sum + (inv.total_cents || 0), 0);
  const failedPayments = [
    ...(checkouts || []).filter((co: any) => co.status === 'failed'),
  ];

  return {
    invoices: invoices || [],
    checkouts: checkouts || [],
    stats: {
      total_paid_cents: totalPaidCents,
      total_draft_cents: totalDraftCents,
      failed_payments_count: failedPayments.length,
      currency: invoices?.[0]?.currency || checkouts?.[0]?.currency || 'ZAR',
    },
  };
};
