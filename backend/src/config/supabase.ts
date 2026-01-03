import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// Admin client with service_role key for privileged operations
// WARNING: This bypasses Row Level Security - use with caution
let adminClient: SupabaseClient | null = null;

export const getAdminClient = (): SupabaseClient => {
  if (!adminClient) {
    adminClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminClient;
};

// Anon client for operations that should respect RLS
let anonClient: SupabaseClient | null = null;

export const getAnonClient = (): SupabaseClient => {
  if (!anonClient) {
    anonClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return anonClient;
};

// Create a client scoped to a specific user's JWT (for user-context operations)
export const getUserClient = (accessToken: string): SupabaseClient => {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
