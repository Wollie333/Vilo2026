import { getAdminClient, getAnonClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { auditUserAction } from './audit.service';
import { SignUpInput, LoginInput, ResetPasswordInput } from '../validators/auth.validators';
import { UserWithRoles } from '../types/user.types';

interface AuthResult {
  user: any;
  session: any;
}

/**
 * Sign up a new user
 * Creates Supabase auth user and profile in pending status
 */
export const signUp = async (
  data: SignUpInput,
  request?: { ip?: string; userAgent?: string }
): Promise<{ user: any; message: string }> => {
  const supabase = getAdminClient();

  // Check if email already exists
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email)
    .single();

  if (existingProfile) {
    throw new AppError('CONFLICT', 'An account with this email already exists');
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: false, // Require email verification
    user_metadata: {
      full_name: data.fullName,
      phone: data.phone,
    },
  });

  if (authError) {
    throw new AppError('BAD_REQUEST', authError.message);
  }

  if (!authData.user) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create user');
  }

  // Profile is created automatically via database trigger
  // Update with additional fields
  const { error: profileError } = await supabase
    .from('users')
    .update({
      full_name: data.fullName,
      phone: data.phone || null,
      status: 'pending', // Require admin approval
    })
    .eq('id', authData.user.id);

  if (profileError) {
    // Cleanup: delete auth user if profile update fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AppError('INTERNAL_ERROR', 'Failed to create user profile');
  }

  // Audit log
  await auditUserAction(
    'user.created',
    authData.user.id,
    null, // No actor for self-registration
    null,
    { email: data.email, full_name: data.fullName },
    request
  );

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email,
    },
    message: 'Account created. Please verify your email and wait for admin approval.',
  };
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  data: LoginInput,
  request?: { ip?: string; userAgent?: string }
): Promise<AuthResult> => {
  const supabase = getAnonClient();
  const adminClient = getAdminClient();

  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    throw new AppError('UNAUTHORIZED', 'Invalid email or password');
  }

  if (!authData.user || !authData.session) {
    throw new AppError('UNAUTHORIZED', 'Authentication failed');
  }

  // Check user status
  const { data: profile, error: profileError } = await adminClient
    .from('users')
    .select('status')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    throw new AppError('NOT_FOUND', 'User profile not found');
  }

  if (profile.status === 'pending') {
    // Sign out the user since they're not approved yet
    await supabase.auth.signOut();
    throw new AppError('FORBIDDEN', 'Your account is pending approval');
  }

  if (profile.status === 'suspended') {
    await supabase.auth.signOut();
    throw new AppError('FORBIDDEN', 'Your account has been suspended');
  }

  if (profile.status === 'deactivated') {
    await supabase.auth.signOut();
    throw new AppError('FORBIDDEN', 'Your account has been deactivated');
  }

  // Update last login
  await adminClient
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', authData.user.id);

  // Audit log
  await auditUserAction(
    'user.login',
    authData.user.id,
    authData.user.id,
    null,
    null,
    request
  );

  return {
    user: authData.user,
    session: authData.session,
  };
};

/**
 * Sign out - invalidate session
 */
export const signOut = async (
  accessToken: string,
  userId: string,
  request?: { ip?: string; userAgent?: string }
): Promise<void> => {
  const supabase = getAdminClient();

  // Revoke session
  const { error } = await supabase.auth.admin.signOut(accessToken);

  if (error) {
    // Log but don't fail - user intent is to sign out
    console.error('Error signing out:', error);
  }

  // Audit log
  await auditUserAction('user.logout', userId, userId, null, null, request);
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  refreshToken: string
): Promise<AuthResult> => {
  const supabase = getAnonClient();

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token');
  }

  return {
    user: data.user,
    session: data.session,
  };
};

/**
 * Request password reset email
 */
export const forgotPassword = async (email: string): Promise<void> => {
  const supabase = getAdminClient();

  // Check if user exists
  const { data: profile } = await supabase
    .from('users')
    .select('id, status')
    .eq('email', email)
    .single();

  // Always return success to prevent email enumeration
  if (!profile || profile.status !== 'active') {
    return;
  }

  // Send password reset email
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
  });

  if (error) {
    // Log but don't expose error
    console.error('Password reset error:', error);
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  data: ResetPasswordInput,
  request?: { ip?: string; userAgent?: string }
): Promise<void> => {
  const supabase = getAnonClient();

  // Verify and update password
  const { data: sessionData, error } = await supabase.auth.verifyOtp({
    token_hash: data.token,
    type: 'recovery',
  });

  if (error || !sessionData.user) {
    throw new AppError('BAD_REQUEST', 'Invalid or expired reset token');
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (updateError) {
    throw new AppError('BAD_REQUEST', 'Failed to reset password');
  }

  // Audit log
  await auditUserAction(
    'user.password_reset',
    sessionData.user.id,
    sessionData.user.id,
    null,
    null,
    request
  );
};

/**
 * Verify email with token
 */
export const verifyEmail = async (
  token: string,
  request?: { ip?: string; userAgent?: string }
): Promise<{ user: any; session: any }> => {
  const supabase = getAnonClient();
  const adminClient = getAdminClient();

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email',
  });

  if (error || !data.user) {
    throw new AppError('BAD_REQUEST', 'Invalid or expired verification token');
  }

  // Update email verified timestamp
  await adminClient
    .from('users')
    .update({ email_verified_at: new Date().toISOString() })
    .eq('id', data.user.id);

  // Audit log
  await auditUserAction(
    'user.email_verified',
    data.user.id,
    data.user.id,
    null,
    null,
    request
  );

  return {
    user: data.user,
    session: data.session,
  };
};

/**
 * Get current user with full profile and permissions
 */
export const getCurrentUser = async (userId: string): Promise<UserWithRoles> => {
  const supabase = getAdminClient();

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new AppError('NOT_FOUND', 'User not found');
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
    .eq('user_id', userId);

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
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.now()');

  if (permError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to load user permissions');
  }

  // Get user properties
  const { data: userProperties, error: propError } = await supabase
    .from('user_properties')
    .select('*')
    .eq('user_id', userId);

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

  return {
    ...profile,
    roles,
    directPermissions: directPermissions || [],
    effectivePermissions,
    properties: userProperties || [],
  };
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
