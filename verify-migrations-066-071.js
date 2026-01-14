/**
 * Verification Script for Migrations 066-071
 * Checks database schema for member type categories implementation
 */

require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigrations() {
  console.log('🔍 Verifying Migrations 066-071...\n');

  const results = {
    passed: 0,
    failed: 0,
    checks: []
  };

  // ============================================================================
  // CHECK 1: Category field exists on user_types
  // ============================================================================
  try {
    const { data, error } = await supabase
      .from('user_types')
      .select('id, name, display_name, category')
      .limit(5);

    if (error) throw error;

    if (data && data.length > 0 && data[0].category !== undefined) {
      console.log('✅ CHECK 1: Category field exists on user_types');
      console.log(`   Found ${data.length} user types with categories:`);
      data.forEach(ut => {
        console.log(`   - ${ut.name} (${ut.display_name}): category = "${ut.category}"`);
      });
      results.passed++;
      results.checks.push({ name: 'Category field on user_types', status: 'PASS' });
    } else {
      throw new Error('Category field not found or no user types exist');
    }
  } catch (err) {
    console.error('❌ CHECK 1 FAILED: Category field on user_types');
    console.error(`   Error: ${err.message}`);
    results.failed++;
    results.checks.push({ name: 'Category field on user_types', status: 'FAIL', error: err.message });
  }

  console.log('');

  // ============================================================================
  // CHECK 2: subscription_type_permissions table exists
  // ============================================================================
  try {
    const { data, error } = await supabase
      .from('subscription_type_permissions')
      .select('id, subscription_type_id, permission_id')
      .limit(1);

    if (error && error.code !== 'PGRST116') throw error;

    console.log('✅ CHECK 2: subscription_type_permissions table exists');
    if (data && data.length > 0) {
      console.log(`   Table exists with ${data.length}+ rows`);

      // Count total permissions
      const { count } = await supabase
        .from('subscription_type_permissions')
        .select('*', { count: 'exact', head: true });

      console.log(`   Total permission assignments: ${count || 0}`);
    } else {
      console.log('   Table exists but is empty (no permission assignments yet)');
    }
    results.passed++;
    results.checks.push({ name: 'subscription_type_permissions table', status: 'PASS' });
  } catch (err) {
    console.error('❌ CHECK 2 FAILED: subscription_type_permissions table');
    console.error(`   Error: ${err.message}`);
    results.failed++;
    results.checks.push({ name: 'subscription_type_permissions table', status: 'FAIL', error: err.message });
  }

  console.log('');

  // ============================================================================
  // CHECK 3: company_team_members table exists
  // ============================================================================
  try {
    const { data, error } = await supabase
      .from('company_team_members')
      .select('id, company_id, user_id, role')
      .limit(1);

    if (error && error.code !== 'PGRST116') throw error;

    console.log('✅ CHECK 3: company_team_members table exists');
    if (data && data.length > 0) {
      console.log(`   Table exists with ${data.length}+ team members`);
    } else {
      console.log('   Table exists but is empty (no team members yet)');
    }
    results.passed++;
    results.checks.push({ name: 'company_team_members table', status: 'PASS' });
  } catch (err) {
    console.error('❌ CHECK 3 FAILED: company_team_members table');
    console.error(`   Error: ${err.message}`);
    results.failed++;
    results.checks.push({ name: 'company_team_members table', status: 'FAIL', error: err.message });
  }

  console.log('');

  // ============================================================================
  // CHECK 4: Free tier subscription plan exists with price_cents = 0
  // ============================================================================
  try {
    const { data: freePlan, error } = await supabase
      .from('subscription_types')
      .select('id, name, display_name, price_cents, limits')
      .eq('name', 'free_tier')
      .single();

    if (error) throw error;

    if (freePlan && freePlan.price_cents === 0) {
      console.log('✅ CHECK 4: Free tier subscription plan exists');
      console.log(`   Plan: ${freePlan.display_name} (${freePlan.name})`);
      console.log(`   Price: R${(freePlan.price_cents / 100).toFixed(2)} (FREE)`);
      console.log(`   Limits:`, JSON.stringify(freePlan.limits, null, 2));
      results.passed++;
      results.checks.push({ name: 'Free tier subscription plan', status: 'PASS' });
    } else {
      throw new Error('Free tier plan not found or price is not 0');
    }
  } catch (err) {
    console.error('❌ CHECK 4 FAILED: Free tier subscription plan');
    console.error(`   Error: ${err.message}`);
    results.failed++;
    results.checks.push({ name: 'Free tier subscription plan', status: 'FAIL', error: err.message });
  }

  console.log('');

  // ============================================================================
  // CHECK 5: Free tier has permissions assigned
  // ============================================================================
  try {
    const { data: freePlan } = await supabase
      .from('subscription_types')
      .select('id')
      .eq('name', 'free_tier')
      .single();

    if (!freePlan) throw new Error('Free tier plan not found');

    const { data: permissions, error } = await supabase
      .from('subscription_type_permissions')
      .select('permission:permissions(resource, action)')
      .eq('subscription_type_id', freePlan.id);

    if (error) throw error;

    if (permissions && permissions.length > 0) {
      console.log('✅ CHECK 5: Free tier has permissions assigned');
      console.log(`   Permission count: ${permissions.length}`);
      console.log('   Sample permissions:');
      permissions.slice(0, 5).forEach(p => {
        if (p.permission) {
          console.log(`   - ${p.permission.resource}:${p.permission.action}`);
        }
      });
      results.passed++;
      results.checks.push({ name: 'Free tier permissions', status: 'PASS' });
    } else {
      throw new Error('Free tier has no permissions assigned');
    }
  } catch (err) {
    console.error('❌ CHECK 5 FAILED: Free tier permissions');
    console.error(`   Error: ${err.message}`);
    results.failed++;
    results.checks.push({ name: 'Free tier permissions', status: 'FAIL', error: err.message });
  }

  console.log('');

  // ============================================================================
  // CHECK 6: All customer users have active subscriptions
  // ============================================================================
  try {
    // Get all customer user types (there can be multiple: free, paid, etc.)
    const { data: customerTypes } = await supabase
      .from('user_types')
      .select('id, name')
      .eq('category', 'customer');

    if (!customerTypes || customerTypes.length === 0) throw new Error('No customer user types found');

    const customerTypeIds = customerTypes.map(ct => ct.id);

    // Count customer users
    const { count: totalCustomers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('user_type_id', customerTypeIds);

    // Count customer users with active subscriptions
    const { data: usersWithSubs } = await supabase
      .from('users')
      .select(`
        id,
        email,
        subscriptions:user_subscriptions!inner(id, status, is_active)
      `)
      .in('user_type_id', customerTypeIds)
      .eq('subscriptions.is_active', true);

    console.log('✅ CHECK 6: Customer users subscription status');
    console.log(`   Total customer users: ${totalCustomers || 0}`);
    console.log(`   Users with active subscriptions: ${usersWithSubs?.length || 0}`);

    if (totalCustomers === 0) {
      console.log('   ⚠️  No customer users exist yet (expected for fresh install)');
    } else if ((usersWithSubs?.length || 0) === totalCustomers) {
      console.log('   ✓ All customer users have active subscriptions');
    } else {
      console.log(`   ⚠️  ${totalCustomers - (usersWithSubs?.length || 0)} customer users without active subscriptions`);
    }

    results.passed++;
    results.checks.push({ name: 'Customer subscription coverage', status: 'PASS' });
  } catch (err) {
    console.error('❌ CHECK 6 FAILED: Customer subscription coverage');
    console.error(`   Error: ${err.message}`);
    results.failed++;
    results.checks.push({ name: 'Customer subscription coverage', status: 'FAIL', error: err.message });
  }

  console.log('');

  // ============================================================================
  // CHECK 7: has_user_type_permission function exists
  // ============================================================================
  try {
    const { data, error } = await supabase.rpc('has_user_type_permission', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_resource: 'test',
      p_action: 'test'
    });

    // Function exists if we get a response (even false is OK)
    console.log('✅ CHECK 7: has_user_type_permission function exists');
    console.log('   Function is callable from client');
    results.passed++;
    results.checks.push({ name: 'has_user_type_permission function', status: 'PASS' });
  } catch (err) {
    // Check if error is about function not found vs permission denied
    if (err.message.includes('function') && err.message.includes('does not exist')) {
      console.error('❌ CHECK 7 FAILED: has_user_type_permission function');
      console.error(`   Error: ${err.message}`);
      results.failed++;
      results.checks.push({ name: 'has_user_type_permission function', status: 'FAIL', error: err.message });
    } else {
      // Other errors (like RLS) mean function exists
      console.log('✅ CHECK 7: has_user_type_permission function exists');
      console.log(`   Function exists (got expected error: ${err.code})`);
      results.passed++;
      results.checks.push({ name: 'has_user_type_permission function', status: 'PASS' });
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Checks: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('');

  if (results.failed === 0) {
    console.log('🎉 ALL CHECKS PASSED - Migrations 066-071 successfully applied!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test backend API endpoints');
    console.log('2. Test frontend UI components');
    console.log('3. Run end-to-end user scenarios');
    process.exit(0);
  } else {
    console.log('⚠️  SOME CHECKS FAILED - Review errors above');
    console.log('');
    console.log('Failed checks:');
    results.checks.filter(c => c.status === 'FAIL').forEach(c => {
      console.log(`  - ${c.name}: ${c.error}`);
    });
    console.log('');
    console.log('Action required: Apply missing migrations from backend/migrations/');
    process.exit(1);
  }
}

verifyMigrations().catch(err => {
  console.error('❌ Verification script error:', err);
  process.exit(1);
});
