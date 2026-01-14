/**
 * Verification Script: Check if refund permissions exist in database
 *
 * This script verifies that the required refund permissions are present
 * in the permissions table for the authorization middleware to work.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRefundPermissions() {
  console.log('🔍 Checking refund permissions in database...\n');

  try {
    // Check for refund permissions
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('resource', 'refunds')
      .order('action');

    if (error) {
      console.error('❌ Error fetching permissions:', error.message);
      return;
    }

    console.log('📋 Found Refund Permissions:');
    console.log('================================');

    if (permissions && permissions.length > 0) {
      permissions.forEach((perm) => {
        console.log(`✅ ${perm.resource}:${perm.action}`);
        console.log(`   Description: ${perm.description}`);
        console.log(`   Category: ${perm.category || 'N/A'}\n`);
      });
    } else {
      console.log('⚠️  No refund permissions found!\n');
      console.log('📝 To add them, run this SQL:');
      console.log('================================\n');
      console.log(`INSERT INTO permissions (resource, action, description, category) VALUES
  ('refunds', 'read', 'View refund requests', 'financial'),
  ('refunds', 'manage', 'Approve, reject, and process refunds', 'financial');
`);
    }

    // Check which user types have these permissions
    if (permissions && permissions.length > 0) {
      console.log('\n🔑 User Types with Refund Permissions:');
      console.log('================================');

      for (const perm of permissions) {
        const { data: userTypePerms } = await supabase
          .from('user_type_permissions')
          .select(`
            *,
            user_type:user_types(name, display_name)
          `)
          .eq('permission_id', perm.id);

        if (userTypePerms && userTypePerms.length > 0) {
          console.log(`\n${perm.resource}:${perm.action}`);
          userTypePerms.forEach((utp) => {
            console.log(`  - ${utp.user_type.display_name} (${utp.user_type.name})`);
          });
        } else {
          console.log(`\n${perm.resource}:${perm.action}`);
          console.log(`  ⚠️  No user types assigned!`);
        }
      }
    }

    console.log('\n✅ Verification complete!');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

verifyRefundPermissions();
