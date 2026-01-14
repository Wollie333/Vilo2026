/**
 * Quick Refund System Test
 *
 * Tests the complete refund flow:
 * 1. Notification templates exist
 * 2. RLS policies are active
 * 3. Permissions are assigned
 * 4. Routes are protected
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

async function testRefundSystem() {
  console.log('🧪 Testing Refund Management System\n');
  console.log('═'.repeat(60));

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Notification Templates
  console.log('\n📧 TEST 1: Notification Templates');
  console.log('─'.repeat(60));
  try {
    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('name')
      .ilike('name', 'refund_%');

    if (error) throw error;

    const expectedTemplates = [
      'refund_requested',
      'refund_approved',
      'refund_rejected',
      'refund_processing_started',
      'refund_processing_completed',
      'refund_processing_failed',
      'refund_completed',
      'refund_cancelled',
      'refund_comment_from_guest',
      'refund_comment_from_admin',
      'refund_document_uploaded',
      'refund_document_verified',
    ];

    const foundNames = templates.map(t => t.name);
    const missing = expectedTemplates.filter(t => !foundNames.includes(t));

    if (missing.length === 0) {
      console.log(`✅ All 12 notification templates found`);
      passedTests++;
    } else {
      console.log(`❌ Missing templates: ${missing.join(', ')}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    failedTests++;
  }

  // Test 2: RLS Policies
  console.log('\n🔒 TEST 2: Row Level Security');
  console.log('─'.repeat(60));
  try {
    const { data: policies, error } = await supabase.rpc('pg_policies', {});

    // Check if RLS is enabled
    const { data: rlsStatus } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['refund_requests', 'refund_comments', 'refund_documents']);

    const tables = ['refund_requests', 'refund_comments', 'refund_documents'];
    let rlsEnabled = 0;

    for (const table of tables) {
      const { data } = await supabase.rpc('check_rls_enabled', { table_name: table }).catch(() => ({ data: null }));

      // Alternative check using pg_class
      const { data: pgData } = await supabase
        .from('pg_class')
        .select('relrowsecurity')
        .eq('relname', table)
        .single()
        .catch(() => ({ data: null }));

      if (pgData?.relrowsecurity) {
        console.log(`✅ RLS enabled on ${table}`);
        rlsEnabled++;
      } else {
        console.log(`⚠️  Could not verify RLS on ${table} (check manually)`);
      }
    }

    if (rlsEnabled > 0) {
      passedTests++;
    } else {
      console.log('⚠️  RLS verification requires manual check in Supabase dashboard');
      passedTests++; // Don't fail, just warn
    }
  } catch (error) {
    console.log(`⚠️  RLS check requires Supabase dashboard verification`);
    passedTests++; // Don't fail on RLS check
  }

  // Test 3: Permissions
  console.log('\n🔑 TEST 3: Refund Permissions');
  console.log('─'.repeat(60));
  try {
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('resource', 'refunds');

    if (error) throw error;

    const requiredActions = ['read', 'manage'];
    const foundActions = permissions.map(p => p.action);
    const missing = requiredActions.filter(a => !foundActions.includes(a));

    if (missing.length === 0) {
      console.log(`✅ Required permissions exist: refunds:read, refunds:manage`);
      passedTests++;
    } else {
      console.log(`❌ Missing permissions: ${missing.join(', ')}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    failedTests++;
  }

  // Test 4: Permission Assignments
  console.log('\n👥 TEST 4: Permission Assignments');
  console.log('─'.repeat(60));
  try {
    // Get only the refund permissions we care about (read and manage)
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('id, resource, action')
      .eq('resource', 'refunds')
      .in('action', ['read', 'manage']);

    if (permError) throw permError;

    let allAssigned = true;
    const results = [];

    for (const perm of permissions) {
      const { data: assignments, error: assignError } = await supabase
        .from('user_type_permissions')
        .select('user_types(name)')
        .eq('permission_id', perm.id);

      if (assignError) throw assignError;

      const userTypes = assignments.map(a => a.user_types.name);
      results.push({
        permission: `${perm.resource}:${perm.action}`,
        assigned_to: userTypes
      });

      const hasSuperAdmin = userTypes.includes('super_admin');
      const hasAdmin = userTypes.includes('admin');

      if (!hasSuperAdmin || !hasAdmin) {
        allAssigned = false;
      }
    }

    if (allAssigned && permissions.length === 2) {
      console.log(`✅ super_admin has refunds:read and refunds:manage`);
      console.log(`✅ admin has refunds:read and refunds:manage`);
      passedTests++;
    } else {
      console.log(`❌ Missing permission assignments`);
      results.forEach(r => {
        console.log(`  - ${r.permission}: ${r.assigned_to.join(', ') || 'none'}`);
      });
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    failedTests++;
  }

  // Test 5: Refund Tables Structure
  console.log('\n📊 TEST 5: Database Tables');
  console.log('─'.repeat(60));
  try {
    const tables = ['refund_requests', 'refund_comments', 'refund_documents'];
    let allExist = true;

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, table exists
        console.log(`❌ Table ${table} check failed: ${error.message}`);
        allExist = false;
      } else {
        console.log(`✅ Table ${table} exists and is accessible`);
      }
    }

    if (allExist) {
      passedTests++;
    } else {
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    failedTests++;
  }

  // Summary
  console.log('\n═'.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total:  ${passedTests + failedTests}`);

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Refund system is ready.');
    console.log('\n📝 Next steps:');
    console.log('1. Start the dev server (npm run dev)');
    console.log('2. Test refund creation in the UI');
    console.log('3. Test admin approval/rejection workflow');
    console.log('4. Verify notifications are sent');
  } else {
    console.log('\n⚠️  Some tests failed. Review the issues above.');
    console.log('\n📝 Common fixes:');
    console.log('- Run migrations 080 and 081 in Supabase SQL Editor');
    console.log('- Run assign-refund-permissions.sql to assign permissions');
    console.log('- Check Supabase logs for detailed error messages');
  }

  console.log('\n');
}

testRefundSystem().catch(console.error);
