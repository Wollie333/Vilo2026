/**
 * Seed script to create an initial super admin user
 * Run with: npx ts-node src/scripts/seed-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedAdmin() {
  const email = 'admin@vilo.com';
  const password = 'Admin123!';
  const fullName = 'Super Admin';

  console.log('Creating super admin user...');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('');

  try {
    // 1. Check if user exists in auth, create if not
    let userId: string;

    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(u => u.email === email);

    if (existingAuthUser) {
      userId = existingAuthUser.id;
      console.log(`Auth user already exists: ${userId}`);
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        // Handle "email already exists" error
        if (authError.message.includes('already been registered') || (authError as any).code === 'email_exists') {
          // Re-fetch users to get the ID
          const { data: refetch } = await supabase.auth.admin.listUsers();
          const found = refetch?.users?.find(u => u.email === email);
          if (found) {
            userId = found.id;
            console.log(`Found existing auth user: ${userId}`);
          } else {
            throw new Error('User exists but could not be found');
          }
        } else {
          throw authError;
        }
      } else if (!authData?.user) {
        throw new Error('Failed to create user');
      } else {
        userId = authData.user.id;
        console.log(`Auth user created: ${userId}`);
      }
    }

    // 2. Use raw SQL to insert/update user profile (avoids schema cache issues)
    const { error: sqlError1 } = await supabase.rpc('exec_sql', {
      query: `
        INSERT INTO public.users (id, email, full_name, status, email_verified_at, approved_at, timezone, created_at, updated_at)
        VALUES ($1, $2, $3, 'active', NOW(), NOW(), 'UTC', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          status = 'active',
          email_verified_at = COALESCE(users.email_verified_at, NOW()),
          approved_at = COALESCE(users.approved_at, NOW()),
          updated_at = NOW()
      `,
      params: [userId, email, fullName]
    });

    // If RPC doesn't exist, try direct insert via REST
    if (sqlError1) {
      console.log('RPC not available, using direct table access...');

      // Try direct insert
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          status: 'active',
          email_verified_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          timezone: 'UTC',
        });

      if (insertError && !insertError.message.includes('duplicate')) {
        // If it's a duplicate key error, that's fine - user already exists
        // Try update instead
        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: fullName,
            status: 'active',
            email_verified_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Update error:', updateError.message);
        }
      }
    }

    console.log('User profile created/updated');

    // 3. Get super_admin role ID
    const { data: roles, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'super_admin');

    if (roleError || !roles || roles.length === 0) {
      console.error('Could not find super_admin role');
      console.error(roleError);
      process.exit(1);
    }

    const roleId = roles[0].id;
    console.log(`Found super_admin role: ${roleId}`);

    // 4. Assign role (delete existing first to avoid conflicts)
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    const { error: assignError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
      });

    if (assignError) {
      console.error('Role assignment error:', assignError.message);
    } else {
      console.log('Role assigned successfully');
    }

    console.log('');
    console.log('✓ Super admin user ready!');
    console.log('');
    console.log('Login with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log('');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedAdmin();
