/**
 * Check if RLS policies exist for refund tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔒 Checking RLS Policies for Refund Tables\n');

  const tables = [
    'refund_requests',
    'refund_comments',
    'refund_status_history',
    'refund_documents',
  ];

  try {
    // Query pg_policies to check for existing policies
    for (const table of tables) {
      console.log(`\n📋 Checking policies for: ${table}`);
      console.log('='.repeat(60));

      // This is a raw SQL query to check policies
      const { data, error } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT
              schemaname,
              tablename,
              policyname,
              permissive,
              roles,
              cmd,
              qual
            FROM pg_policies
            WHERE tablename = '${table}'
            ORDER BY policyname;
          `
        })
        .catch(() => ({ data: null, error: 'RPC function not available' }));

      if (error) {
        console.log('⚠️  Cannot query policies directly (expected)');
        console.log('   RLS policies must be verified in Supabase Dashboard');
        console.log('   Go to: Database → Tables → ' + table + ' → Policies');
      } else if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} policies:`);
        data.forEach((policy) => {
          console.log(`   - ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log('⚠️  No policies found');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📝 RECOMMENDATION:');
    console.log('='.repeat(60));
    console.log('');
    console.log('To verify RLS policies manually:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Navigate to: Database → Tables');
    console.log('3. For each refund table, check the "Policies" tab');
    console.log('');
    console.log('Expected policies per table:');
    console.log('- refund_requests: 5 policies (guest view, manager view, admin view, guest create, manager/admin update)');
    console.log('- refund_comments: 2-3 policies (view non-internal, create)');
    console.log('- refund_status_history: 2 policies (view, insert)');
    console.log('- refund_documents: 4-5 policies (view, upload, update, delete)');
    console.log('');
    console.log('If no policies exist, apply migration 081:');
    console.log('  backend/migrations/081_create_refund_rls_policies.sql');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRLSPolicies();
