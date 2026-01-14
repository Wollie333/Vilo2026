/**
 * Authentication Helper for Tests
 * Provides functions to generate test JWT tokens and auth headers
 */

import { testDb } from './db-setup';

export interface TestUser {
  id: string;
  email: string;
  role: string;
  user_type: string;
}

/**
 * Login as a test user and get auth token
 */
export async function loginAsTestUser(email: string): Promise<string> {
  // In Supabase, we can use the admin API to create a session for testing
  // For now, we'll use a simplified approach

  // Get user from database
  const { data: user, error } = await testDb
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error(`Test user not found: ${email}`);
  }

  // In a real implementation, you would generate a JWT token here
  // For testing purposes, we'll use Supabase's auth.signInWithPassword
  // Or create a test token with the Supabase admin SDK

  // Return a mock token for now - you'll need to implement actual JWT generation
  // based on your auth setup
  return `test-token-${user.id}`;
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create test user and return auth token
 */
export async function createAuthenticatedTestUser(userData: {
  email: string;
  user_type: string;
  role?: string;
}) {
  const { data: user, error } = await testDb
    .from('users')
    .insert({
      email: userData.email,
      user_type: userData.user_type,
      role: userData.role || 'guest',
      is_active: true,
      email_verified: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create authenticated test user: ${error.message}`);
  }

  const token = await loginAsTestUser(userData.email);

  return {
    user,
    token,
    headers: getAuthHeaders(token),
  };
}

/**
 * Test user credentials
 */
export const TEST_USERS = {
  guest: {
    email: 'guest@vilo-test.com',
    password: 'TestGuest123!',
    role: 'guest',
    user_type: 'guest',
  },
  host: {
    email: 'host@vilo-test.com',
    password: 'TestHost123!',
    role: 'property_owner',
    user_type: 'property_owner',
  },
  admin: {
    email: 'admin@vilo-test.com',
    password: 'TestAdmin123!',
    role: 'admin',
    user_type: 'saas_admin',
  },
  superAdmin: {
    email: 'superadmin@vilo-test.com',
    password: 'TestSuper123!',
    role: 'super_admin',
    user_type: 'saas_admin',
  },
};
