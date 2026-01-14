/**
 * Backend API Test Script for Migrations 066-071
 * Tests new endpoints for subscription permissions and team members
 */

require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBackendAPIs() {
  console.log('🔍 Testing Backend APIs for Migrations 066-071...\n');
  console.log(`Backend URL: ${backendUrl}\n`);

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };

  // ============================================================================
  // SETUP: Get test data
  // ============================================================================
  console.log('📋 Setting up test data...\n');

  let accessToken = null;
  let testUser = null;
  let subscriptionTypeId = null;
  let companyId = null;
  let teamMemberId = null;

  try {
    // Get a super admin user for testing
    const { data: adminUser } = await supabase
      .from('users')
      .select(`
        id,
        email,
        user_type:user_types!inner(category)
      `)
      .eq('user_type.category', 'saas')
      .limit(1)
      .single();

    if (!adminUser) {
      console.log('⚠️  No SaaS admin user found. Creating test credentials...');
      console.log('   Please ensure you have an admin user to test with.');
      results.skipped = 100;
      console.log('\n⚠️  TESTS SKIPPED - No admin user available for authentication\n');
      return;
    }

    testUser = adminUser;
    console.log(`✓ Found test user: ${adminUser.email}`);

    // Get free tier subscription type
    const { data: freePlan } = await supabase
      .from('subscription_types')
      .select('id, name')
      .eq('name', 'free_tier')
      .single();

    if (freePlan) {
      subscriptionTypeId = freePlan.id;
      console.log(`✓ Found subscription type: ${freePlan.name} (${freePlan.id})`);
    }

    // Get a company for team member testing
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1)
      .single();

    if (company) {
      companyId = company.id;
      console.log(`✓ Found test company: ${company.name} (${company.id})`);
    }

    // Create a session token for the admin user (simplified for testing)
    const { data: session, error: sessionError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@vilo.test`,
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'API Test User'
      }
    });

    if (!sessionError && session?.user) {
      // Sign in to get session
      const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || '');
      const { data: signInData } = await anonClient.auth.signInWithPassword({
        email: `test-${Date.now()}@vilo.test`,
        password: 'test123456'
      });

      if (signInData?.session) {
        accessToken = signInData.session.access_token;
        console.log('✓ Generated test access token');
      }
    }

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    console.log('\n⚠️  Cannot proceed with API tests without test data\n');
    return;
  }

  console.log('');

  // ============================================================================
  // TEST 1: GET /api/billing/subscription-types/:id/permissions
  // ============================================================================
  if (subscriptionTypeId) {
    try {
      console.log('TEST 1: GET subscription type permissions');

      const response = await fetch(
        `${backendUrl}/api/billing/subscription-types/${subscriptionTypeId}/permissions`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data?.permissions)) {
        console.log(`✅ TEST 1 PASSED`);
        console.log(`   Fetched ${data.data.permissions.length} permissions`);
        if (data.data.permissions.length > 0) {
          console.log(`   Sample: ${data.data.permissions[0].resource}:${data.data.permissions[0].action}`);
        }
        results.passed++;
        results.tests.push({ name: 'GET subscription permissions', status: 'PASS' });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error(`❌ TEST 1 FAILED: ${err.message}`);
      results.failed++;
      results.tests.push({ name: 'GET subscription permissions', status: 'FAIL', error: err.message });
    }
  } else {
    console.log('⚠️  TEST 1 SKIPPED: No subscription type available');
    results.skipped++;
  }

  console.log('');

  // ============================================================================
  // TEST 2: PUT /api/billing/subscription-types/:id/permissions
  // ============================================================================
  if (subscriptionTypeId && accessToken) {
    try {
      console.log('TEST 2: PUT update subscription permissions');

      // Get some permission IDs
      const { data: permissions } = await supabase
        .from('permissions')
        .select('id')
        .limit(5);

      const permissionIds = permissions?.map(p => p.id) || [];

      const response = await fetch(
        `${backendUrl}/api/billing/subscription-types/${subscriptionTypeId}/permissions`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ permission_ids: permissionIds })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data?.permissions)) {
        console.log(`✅ TEST 2 PASSED`);
        console.log(`   Updated permissions: ${data.data.permissions.length} assigned`);
        results.passed++;
        results.tests.push({ name: 'PUT subscription permissions', status: 'PASS' });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error(`❌ TEST 2 FAILED: ${err.message}`);
      results.failed++;
      results.tests.push({ name: 'PUT subscription permissions', status: 'FAIL', error: err.message });
    }
  } else {
    console.log('⚠️  TEST 2 SKIPPED: No subscription type or access token');
    results.skipped++;
  }

  console.log('');

  // ============================================================================
  // TEST 3: GET /api/companies/:id/team-members
  // ============================================================================
  if (companyId && accessToken) {
    try {
      console.log('TEST 3: GET company team members');

      const response = await fetch(
        `${backendUrl}/api/companies/${companyId}/team-members`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data?.team_members)) {
        console.log(`✅ TEST 3 PASSED`);
        console.log(`   Found ${data.data.team_members.length} team members`);
        results.passed++;
        results.tests.push({ name: 'GET team members', status: 'PASS' });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error(`❌ TEST 3 FAILED: ${err.message}`);
      results.failed++;
      results.tests.push({ name: 'GET team members', status: 'FAIL', error: err.message });
    }
  } else {
    console.log('⚠️  TEST 3 SKIPPED: No company or access token');
    results.skipped++;
  }

  console.log('');

  // ============================================================================
  // TEST 4: POST /api/companies/:id/team-members
  // ============================================================================
  if (companyId && accessToken && testUser) {
    try {
      console.log('TEST 4: POST add team member');

      // Get another user to add as team member
      const { data: otherUser } = await supabase
        .from('users')
        .select('id')
        .neq('id', testUser.id)
        .limit(1)
        .single();

      if (!otherUser) {
        throw new Error('No other user available for testing');
      }

      const response = await fetch(
        `${backendUrl}/api/companies/${companyId}/team-members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            user_id: otherUser.id,
            role: 'manager',
            permissions: ['properties:read', 'bookings:read']
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      if (data.success && data.data?.team_member?.id) {
        teamMemberId = data.data.team_member.id;
        console.log(`✅ TEST 4 PASSED`);
        console.log(`   Created team member: ${data.data.team_member.id}`);
        results.passed++;
        results.tests.push({ name: 'POST add team member', status: 'PASS' });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error(`❌ TEST 4 FAILED: ${err.message}`);
      results.failed++;
      results.tests.push({ name: 'POST add team member', status: 'FAIL', error: err.message });
    }
  } else {
    console.log('⚠️  TEST 4 SKIPPED: No company, access token, or test user');
    results.skipped++;
  }

  console.log('');

  // ============================================================================
  // TEST 5: DELETE /api/companies/:id/team-members/:memberId
  // ============================================================================
  if (companyId && accessToken && teamMemberId) {
    try {
      console.log('TEST 5: DELETE remove team member');

      const response = await fetch(
        `${backendUrl}/api/companies/${companyId}/team-members/${teamMemberId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ TEST 5 PASSED`);
        console.log(`   Removed team member: ${teamMemberId}`);
        results.passed++;
        results.tests.push({ name: 'DELETE team member', status: 'PASS' });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error(`❌ TEST 5 FAILED: ${err.message}`);
      results.failed++;
      results.tests.push({ name: 'DELETE team member', status: 'FAIL', error: err.message });
    }
  } else {
    console.log('⚠️  TEST 5 SKIPPED: No team member created to delete');
    results.skipped++;
  }

  console.log('');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('='.repeat(70));
  console.log('API TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.passed + results.failed + results.skipped}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log('');

  if (results.failed === 0 && results.passed > 0) {
    console.log('🎉 ALL API TESTS PASSED!');
    console.log('');
    console.log('Next: Test frontend UI components');
  } else if (results.skipped === results.passed + results.failed + results.skipped) {
    console.log('⚠️  ALL TESTS SKIPPED');
    console.log('');
    console.log('This is normal if:');
    console.log('- Backend server is not running');
    console.log('- No test data available');
    console.log('- Authentication setup needed');
    console.log('');
    console.log('To run API tests:');
    console.log('1. Start backend server: cd backend && npm run dev');
    console.log('2. Ensure admin user exists');
    console.log('3. Re-run this test');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
  }
}

testBackendAPIs().catch(err => {
  console.error('❌ Test script error:', err);
  process.exit(1);
});
