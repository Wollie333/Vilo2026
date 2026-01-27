import { getAdminClient, getAnonClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { SignUpInput, LoginInput, ResetPasswordInput } from '../validators/auth.validators';
import { UserWithRoles } from '../types/user.types';
import { finalizeUserSetup } from './user-finalization.service';

interface AuthResult {
  user: any;
  session: any;
}

/**
 * Sign up a new user
 * Creates Supabase auth user and profile, then auto-logs them in
 */
export const signUp = async (
  data: SignUpInput,
  request?: { ip?: string; userAgent?: string }
): Promise<AuthResult> => {
  const supabase = getAdminClient();
  const anonClient = getAnonClient();

  console.log('=== SIGNUP STARTED ===');
  console.log('Email:', data.email);
  console.log('Full Name:', data.fullName);
  console.log('Phone:', data.phone || 'not provided');

  // Check if email already exists
  console.log('Step 1: Checking if email already exists in public.users...');
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email)
    .single();

  if (existingProfile) {
    console.log('❌ Email already exists in public.users:', existingProfile.id);
    throw new AppError('CONFLICT', 'An account with this email already exists');
  }
  console.log('✓ Email not found in public.users');

  // Create auth user with email auto-confirmed
  console.log('Step 2: Creating auth user in auth.users...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // Auto-verify email for immediate login
    user_metadata: {
      full_name: data.fullName,
      phone: data.phone,
    },
  });

  if (authError) {
    console.log('❌ Auth user creation failed:', authError.message);
    throw new AppError('BAD_REQUEST', authError.message);
  }

  if (!authData.user) {
    console.log('❌ Auth user created but no user object returned');
    throw new AppError('INTERNAL_ERROR', 'Failed to create user');
  }

  console.log('✓ Auth user created successfully:', authData.user.id);

  // Get 'free' customer user type FIRST (required by database NOT NULL constraint)
  // New signups should be 'free' (can have subscriptions), not 'guest' (cannot have subscriptions)
  // They will be upgraded to 'paid' after successful payment
  console.log('Step 3: Getting free user type...');
  console.log('Querying user_types table for name="free" and category="customer"...');
  const { data: customerType, error: typeError } = await supabase
    .from('user_types')
    .select('id, name, category')
    .eq('name', 'free')
    .eq('category', 'customer')
    .single();

  console.log('User type query result:', { customerType, typeError });

  if (!customerType) {
    console.error('❌ No "free" user type found', typeError);
    console.log('Rolling back: Deleting auth user...');
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AppError('INTERNAL_ERROR', 'User type configuration error. Please contact support.');
  }

  console.log(`✓ Found customer user type: ${customerType.name} (${customerType.id})`);

  // Create user profile WITH user_type_id (required by NOT NULL constraint)
  console.log('Step 4: Creating user profile in public.users...');
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName,
      phone: data.phone || null,
      status: 'active', // Allow immediate access
      user_type_id: customerType.id, // CRITICAL: Include user_type_id in initial insert
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id',
    });

  if (profileError) {
    // Cleanup: delete auth user if profile creation fails
    console.error('❌ Profile creation error:', profileError);
    console.log('Rolling back: Deleting auth user...');
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AppError('INTERNAL_ERROR', 'Failed to create user profile');
  }
  console.log('✓ User profile created successfully with user_type_id:', customerType.id);

  // Finalize user setup (create subscription, assign role if needed, set status)
  console.log('Step 4.5: Finalizing user setup (subscription, role, status)...');
  try {
    await finalizeUserSetup({
      userId: authData.user.id,
      userTypeId: customerType.id,
    });
    console.log('✓ User finalization completed');
  } catch (finalizationError) {
    console.error('⚠️  User finalization failed:', finalizationError);
    // Don't block signup - user is created, finalization can be retried
    console.warn('User created but finalization incomplete. They may need subscription assigned manually.');
  }

  // Sign in the user to get a session for auto-login
  console.log('Step 5: Signing in user to create session...');
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (signInError || !signInData.session) {
    console.error('❌ Failed to sign in after registration:', signInError);
    // User is created but couldn't auto-login - they can login manually
    throw new AppError('INTERNAL_ERROR', 'Account created but auto-login failed. Please log in manually.');
  }

  console.log('✓ User signed in successfully');
  console.log('=== SIGNUP COMPLETED SUCCESSFULLY ===');
  console.log('User ID:', signInData.user.id);
  console.log('Email:', data.email);
  console.log('Session created:', !!signInData.session);

  // Return user and session for auto-login
  return {
    user: signInData.user,
    session: signInData.session,
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

/**
 * Check if email already exists
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  const supabase = getAdminClient();

  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  return !!existingProfile;
};

/**
 * Register a guest user (for booking flow)
 * Similar to signUp but creates a guest user type and returns credentials
 */
export const registerGuest = async (data: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  marketing_consent?: boolean;
}): Promise<{
  user_id: string;
  email: string;
  user_type: string;
  access_token: string;
  refresh_token: string;
}> => {
  const supabase = getAdminClient();
  const anonClient = getAnonClient();

  // Check if email already exists in users table
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email)
    .single();

  if (existingProfile) {
    throw new AppError('CONFLICT', 'An account with this email already exists');
  }

  // Check if email exists in Supabase Auth (from previous failed attempts)
  console.log(`🔍 Checking for existing auth user: ${data.email}`);
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError);
  }

  const existingAuthUser = authUsers?.users?.find(u => u.email === data.email);

  if (existingAuthUser) {
    console.log(`🔄 Found orphaned auth user for ${data.email}, cleaning up...`);
    // Delete orphaned auth user from previous failed registration
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAuthUser.id);
    if (deleteError) {
      console.error('❌ Error deleting orphaned user:', deleteError);
    } else {
      console.log('✅ Orphaned user deleted successfully');
    }
  } else {
    console.log(`✅ No existing auth user found for ${data.email}`);
  }

  // Create auth user with email auto-confirmed
  console.log(`🚀 Creating new auth user for ${data.email}...`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // Auto-verify email for immediate login
    user_metadata: {
      full_name: data.full_name,
      phone: data.phone,
    },
  });

  console.log(`📊 createUser result:`, {
    hasData: !!authData,
    hasError: !!authError,
    userId: authData?.user?.id
  });

  if (authError) {
    console.error('🔥 [Auth Error Details]:', {
      message: authError.message,
      status: authError.status,
      name: authError.name,
      fullError: authError,
    });
    throw new AppError('BAD_REQUEST', authError.message);
  }

  if (!authData.user) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create user');
  }

  console.log('✅ Auth user created successfully, waiting for trigger to create profile...');

  // Wait briefly for trigger to complete (trigger runs asynchronously)
  await new Promise(resolve => setTimeout(resolve, 200));

  // Verify the trigger created the profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, status, user_type_id')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    console.error('❌ Profile not created by trigger:', profileError);
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AppError('INTERNAL_ERROR', 'User profile creation failed - trigger did not create profile');
  }

  console.log('✅ Profile created by trigger:', { userId: profile.id, status: profile.status });

  // Update status to 'active' for immediate access
  const { error: updateError } = await supabase
    .from('users')
    .update({
      status: 'active',  // Override trigger's 'pending' status
      marketing_consent: data.marketing_consent || false,
    })
    .eq('id', authData.user.id);

  if (updateError) {
    console.error('⚠️ Profile update error (non-fatal):', updateError);
    // Don't fail - profile exists, just couldn't update fields
  } else {
    console.log('✅ Profile updated to active status');
  }

  // Finalize user setup (create subscription, set proper status)
  console.log('Finalizing guest user setup (subscription)...');
  try {
    await finalizeUserSetup({
      userId: authData.user.id,
    });
    console.log('✅ Guest user finalization completed');
  } catch (finalizationError) {
    console.error('⚠️  Guest user finalization failed:', finalizationError);
    // Don't block registration - user is created, finalization can be retried
    console.warn('Guest user created but finalization incomplete.');
  }

  // Sign in the user to get a session for auto-login
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (signInError || !signInData.session) {
    throw new AppError('INTERNAL_ERROR', 'Account created but auto-login failed');
  }

  // Return user credentials and session
  return {
    user_id: authData.user.id,
    email: data.email,
    user_type: 'guest',
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  };
};
