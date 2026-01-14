/**
 * Comprehensive API Testing Script
 * Tests Payment Rules and Promotions API endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test credentials - you'll need to provide valid credentials
let authToken = null;
let testPropertyId = null;
let testRoomIds = [];
let createdPaymentRuleId = null;
let createdPromoCodeId = null;

console.log('\n🧪 COMPREHENSIVE API TESTING\n');
console.log('='.repeat(70));

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function logTest(id, name, status, message = '', details = null) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SKIP' ? '⏭️' : '⚠️';
  console.log(`${icon} ${id}: ${name}`);
  if (message) console.log(`   ${message}`);
  if (details) console.log(`   Details:`, JSON.stringify(details, null, 2));

  results.tests.push({ id, name, status, message, details });
  results.total++;
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else if (status === 'SKIP') results.skipped++;
}

async function authenticate() {
  console.log('\n📋 Setup: Authentication\n');

  try {
    // First, try to register a test user
    const email = `test-${Date.now()}@vilo-test.com`;
    const password = 'TestPassword123!';

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        email,
        password,
        first_name: 'Test',
        last_name: 'User',
        phone: '+27123456789',
        user_type: 'property_owner'
      });

      console.log('✅ Test user registered:', email);
      authToken = registerResponse.data.data.session.access_token;
    } catch (regError) {
      // If registration fails, try to login with existing credentials
      console.log('⚠️  Registration failed, trying login...');

      // You need to provide valid credentials here
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'wollie@vilo.com', // Replace with your test account
        password: 'password123' // Replace with your test account password
      });

      authToken = loginResponse.data.data.session.access_token;
      console.log('✅ Logged in with existing account');
    }

    return true;
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data || error.message);
    console.log('\n⚠️  CRITICAL: Cannot proceed without authentication');
    console.log('   Please update credentials in test-api-comprehensive.js');
    return false;
  }
}

async function setupTestData() {
  console.log('\n📋 Setup: Creating test property and rooms\n');

  try {
    // Create a test property
    const propertyResponse = await axios.post(
      `${API_BASE}/properties`,
      {
        name: 'Test Property for API Testing',
        description: 'Automated test property',
        property_type: 'hotel',
        address: '123 Test Street',
        city: 'Test City',
        country: 'South Africa',
        currency: 'ZAR'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    testPropertyId = propertyResponse.data.data.id;
    console.log('✅ Test property created:', testPropertyId);

    // Create 2 test rooms
    for (let i = 1; i <= 2; i++) {
      const roomResponse = await axios.post(
        `${API_BASE}/rooms`,
        {
          property_id: testPropertyId,
          name: `Test Room ${i}`,
          room_type: 'standard',
          base_price: 100 + (i * 50),
          max_guests: 2,
          bed_configuration: [{ bed_type: 'queen', quantity: 1 }]
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      testRoomIds.push(roomResponse.data.data.id);
      console.log(`✅ Test room ${i} created:`, roomResponse.data.data.id);
    }

    return true;
  } catch (error) {
    console.log('❌ Setup failed:', error.response?.data || error.message);
    return false;
  }
}

// ============================================================================
// PAYMENT RULES API TESTS
// ============================================================================

async function testPaymentRulesAPI() {
  console.log('\n\n📋 Test Suite: Payment Rules API\n');

  // Test PR-API-001: Create Payment Rule (Deposit Type)
  try {
    const response = await axios.post(
      `${API_BASE}/payment-rules`,
      {
        property_id: testPropertyId,
        rule_name: 'Test 50% Deposit Rule',
        description: 'Automated test deposit rule',
        rule_type: 'deposit',
        deposit_type: 'percentage',
        deposit_amount: 50,
        deposit_due: 'at_booking',
        balance_due: 'on_checkin',
        is_active: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success && response.data.data.id) {
      createdPaymentRuleId = response.data.data.id;
      logTest('PR-API-001', 'Create Payment Rule (Deposit Type)', 'PASS',
        `Created rule with ID: ${createdPaymentRuleId}`);
    } else {
      logTest('PR-API-001', 'Create Payment Rule (Deposit Type)', 'FAIL',
        'Response missing expected data structure');
    }
  } catch (error) {
    logTest('PR-API-001', 'Create Payment Rule (Deposit Type)', 'FAIL',
      error.response?.data?.message || error.message);
  }

  // Test PR-API-002: Create Payment Rule (Payment Schedule Type)
  try {
    const response = await axios.post(
      `${API_BASE}/payment-rules`,
      {
        property_id: testPropertyId,
        rule_name: 'Test 3-Payment Schedule',
        rule_type: 'payment_schedule',
        schedule_config: [
          {
            sequence: 1,
            name: 'First Payment',
            amount_type: 'percentage',
            amount: 33.33,
            due: 'at_booking'
          },
          {
            sequence: 2,
            name: 'Second Payment',
            amount_type: 'percentage',
            amount: 33.33,
            due: 'days_before_checkin',
            days: 30
          },
          {
            sequence: 3,
            name: 'Final Payment',
            amount_type: 'percentage',
            amount: 33.34,
            due: 'on_checkin'
          }
        ],
        is_active: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      logTest('PR-API-002', 'Create Payment Rule (Payment Schedule)', 'PASS',
        `Created schedule rule with ID: ${response.data.data.id}`);
    } else {
      logTest('PR-API-002', 'Create Payment Rule (Payment Schedule)', 'FAIL',
        'Response missing success flag');
    }
  } catch (error) {
    logTest('PR-API-002', 'Create Payment Rule (Payment Schedule)', 'FAIL',
      error.response?.data?.message || error.message);
  }

  // Test PR-API-003: Create Payment Rule with Room Assignment
  try {
    const response = await axios.post(
      `${API_BASE}/payment-rules`,
      {
        property_id: testPropertyId,
        room_ids: testRoomIds,
        rule_name: 'Test Assigned Rule',
        rule_type: 'deposit',
        deposit_type: 'percentage',
        deposit_amount: 30,
        deposit_due: 'at_booking',
        balance_due: 'on_checkin',
        is_active: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success && response.data.data.room_count === testRoomIds.length) {
      logTest('PR-API-003', 'Create Payment Rule with Room Assignment', 'PASS',
        `Assigned to ${testRoomIds.length} rooms`);
    } else {
      logTest('PR-API-003', 'Create Payment Rule with Room Assignment', 'FAIL',
        `Expected ${testRoomIds.length} assignments, got ${response.data.data.room_count}`);
    }
  } catch (error) {
    logTest('PR-API-003', 'Create Payment Rule with Room Assignment', 'FAIL',
      error.response?.data?.message || error.message);
  }

  // Test PR-API-004: Get Payment Rule by ID
  if (createdPaymentRuleId) {
    try {
      const response = await axios.get(
        `${API_BASE}/payment-rules/${createdPaymentRuleId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.data.data.id === createdPaymentRuleId) {
        logTest('PR-API-004', 'Get Payment Rule by ID', 'PASS',
          `Retrieved rule: ${response.data.data.rule_name}`);
      } else {
        logTest('PR-API-004', 'Get Payment Rule by ID', 'FAIL',
          'Retrieved rule ID does not match');
      }
    } catch (error) {
      logTest('PR-API-004', 'Get Payment Rule by ID', 'FAIL',
        error.response?.data?.message || error.message);
    }
  } else {
    logTest('PR-API-004', 'Get Payment Rule by ID', 'SKIP',
      'No payment rule created in previous test');
  }

  // Test PR-API-005: Update Payment Rule
  if (createdPaymentRuleId) {
    try {
      const response = await axios.put(
        `${API_BASE}/payment-rules/${createdPaymentRuleId}`,
        {
          rule_name: 'Updated Test Rule Name',
          deposit_amount: 60,
          is_active: false
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.data.data.rule_name === 'Updated Test Rule Name' &&
          response.data.data.deposit_amount === 60) {
        logTest('PR-API-005', 'Update Payment Rule', 'PASS',
          'Rule updated successfully');
      } else {
        logTest('PR-API-005', 'Update Payment Rule', 'FAIL',
          'Updated values do not match');
      }
    } catch (error) {
      logTest('PR-API-005', 'Update Payment Rule', 'FAIL',
        error.response?.data?.message || error.message);
    }
  } else {
    logTest('PR-API-005', 'Update Payment Rule', 'SKIP',
      'No payment rule created in previous test');
  }

  // Test PR-API-008: List All Payment Rules
  try {
    const response = await axios.get(
      `${API_BASE}/payment-rules`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (Array.isArray(response.data.data) && response.data.data.length >= 3) {
      logTest('PR-API-008', 'List All Payment Rules', 'PASS',
        `Found ${response.data.data.length} payment rules`);
    } else {
      logTest('PR-API-008', 'List All Payment Rules', 'FAIL',
        `Expected at least 3 rules, found ${response.data.data?.length || 0}`);
    }
  } catch (error) {
    logTest('PR-API-008', 'List All Payment Rules', 'FAIL',
      error.response?.data?.message || error.message);
  }

  // Test PR-API-009: List Payment Rules with Property Filter
  try {
    const response = await axios.get(
      `${API_BASE}/payment-rules?propertyId=${testPropertyId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const allBelongToProperty = response.data.data.every(
      rule => rule.property_id === testPropertyId
    );

    if (allBelongToProperty) {
      logTest('PR-API-009', 'List Payment Rules with Property Filter', 'PASS',
        `Filtered to ${response.data.data.length} rules for test property`);
    } else {
      logTest('PR-API-009', 'List Payment Rules with Property Filter', 'FAIL',
        'Response includes rules from other properties');
    }
  } catch (error) {
    logTest('PR-API-009', 'List Payment Rules with Property Filter', 'FAIL',
      error.response?.data?.message || error.message);
  }

  // Test PR-API-010: Get Payment Rule Assignments
  if (createdPaymentRuleId) {
    try {
      const response = await axios.get(
        `${API_BASE}/payment-rules/${createdPaymentRuleId}/assignments`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (Array.isArray(response.data.data)) {
        logTest('PR-API-010', 'Get Payment Rule Assignments', 'PASS',
          `Found ${response.data.data.length} room assignments`);
      } else {
        logTest('PR-API-010', 'Get Payment Rule Assignments', 'FAIL',
          'Response is not an array');
      }
    } catch (error) {
      logTest('PR-API-010', 'Get Payment Rule Assignments', 'FAIL',
        error.response?.data?.message || error.message);
    }
  } else {
    logTest('PR-API-010', 'Get Payment Rule Assignments', 'SKIP',
      'No payment rule created');
  }

  // Test PR-API-011: Assign Payment Rule to Rooms
  if (createdPaymentRuleId) {
    try {
      const response = await axios.post(
        `${API_BASE}/payment-rules/${createdPaymentRuleId}/assign-rooms`,
        {
          roomIds: testRoomIds
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.data.success) {
        logTest('PR-API-011', 'Assign Payment Rule to Rooms', 'PASS',
          `Assigned to ${testRoomIds.length} rooms`);
      } else {
        logTest('PR-API-011', 'Assign Payment Rule to Rooms', 'FAIL',
          'Assignment failed');
      }
    } catch (error) {
      logTest('PR-API-011', 'Assign Payment Rule to Rooms', 'FAIL',
        error.response?.data?.message || error.message);
    }
  } else {
    logTest('PR-API-011', 'Assign Payment Rule to Rooms', 'SKIP',
      'No payment rule created');
  }
}

// ============================================================================
// PROMOTIONS API TESTS
// ============================================================================

async function testPromotionsAPI() {
  console.log('\n\n📋 Test Suite: Promotions API\n');

  // Test PM-API-001: Create Promo Code (Percentage Discount)
  try {
    const response = await axios.post(
      `${API_BASE}/promotions`,
      {
        property_id: testPropertyId,
        code: 'SUMMER2026',
        name: 'Summer Discount',
        description: '20% off summer bookings',
        discount_type: 'percentage',
        discount_value: 20,
        min_nights: 2,
        max_uses: 100,
        start_date: '2026-06-01',
        end_date: '2026-08-31',
        is_active: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success && response.data.data.id) {
      createdPromoCodeId = response.data.data.id;
      logTest('PM-API-001', 'Create Promo Code (Percentage)', 'PASS',
        `Created promo: ${response.data.data.code}`);
    } else {
      logTest('PM-API-001', 'Create Promo Code (Percentage)', 'FAIL',
        'Response missing expected data');
    }
  } catch (error) {
    logTest('PM-API-001', 'Create Promo Code (Percentage)', 'FAIL',
      error.response?.data?.message || error.message);
  }

  // Test PM-API-002: Create Promo Code (Fixed Amount)
  try {
    const response = await axios.post(
      `${API_BASE}/promotions`,
      {
        property_id: testPropertyId,
        code: 'SAVE100',
        name: 'R100 Off',
        discount_type: 'fixed_amount',
        discount_value: 100,
        is_active: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      logTest('PM-API-002', 'Create Promo Code (Fixed Amount)', 'PASS',
        `Created promo: ${response.data.data.code}`);
    } else {
      logTest('PM-API-002', 'Create Promo Code (Fixed Amount)', 'FAIL',
        'Response missing success flag');
    }
  } catch (error) {
    logTest('PM-API-002', 'Create Promo Code (Fixed Amount)', 'FAIL',
      error.response?.data?.message || error.message);
  }

  // Test PM-API-003: Create Promo Code (Free Nights)
  try {
    const response = await axios.post(
      `${API_BASE}/promotions`,
      {
        property_id: testPropertyId,
        code: 'STAYFREE',
        name: 'Free Night',
        discount_type: 'free_nights',
        discount_value: 1,
        min_nights: 3,
        is_active: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      logTest('PM-API-003', 'Create Promo Code (Free Nights)', 'PASS',
        `Created promo: ${response.data.data.code}`);
    } else {
      logTest('PM-API-003', 'Create Promo Code (Free Nights)', 'FAIL',
        'Response missing success flag');
    }
  } catch (error) {
    logTest('PM-API-003', 'Create Promo Code (Free Nights)', 'FAIL',
      error.response?.data?.message || error.message);
  }

  // Test PM-API-004: Get Promo Code by ID
  if (createdPromoCodeId) {
    try {
      const response = await axios.get(
        `${API_BASE}/promotions/${createdPromoCodeId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.data.data.id === createdPromoCodeId) {
        logTest('PM-API-004', 'Get Promo Code by ID', 'PASS',
          `Retrieved promo: ${response.data.data.code}`);
      } else {
        logTest('PM-API-004', 'Get Promo Code by ID', 'FAIL',
          'Retrieved promo ID does not match');
      }
    } catch (error) {
      logTest('PM-API-004', 'Get Promo Code by ID', 'FAIL',
        error.response?.data?.message || error.message);
    }
  } else {
    logTest('PM-API-004', 'Get Promo Code by ID', 'SKIP',
      'No promo code created');
  }

  // Test PM-API-005: Update Promo Code
  if (createdPromoCodeId) {
    try {
      const response = await axios.put(
        `${API_BASE}/promotions/${createdPromoCodeId}`,
        {
          name: 'Updated Summer Sale',
          discount_value: 25,
          is_active: false
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.data.data.discount_value === 25) {
        logTest('PM-API-005', 'Update Promo Code', 'PASS',
          'Promo updated successfully');
      } else {
        logTest('PM-API-005', 'Update Promo Code', 'FAIL',
          'Updated values do not match');
      }
    } catch (error) {
      logTest('PM-API-005', 'Update Promo Code', 'FAIL',
        error.response?.data?.message || error.message);
    }
  } else {
    logTest('PM-API-005', 'Update Promo Code', 'SKIP',
      'No promo code created');
  }

  // Test PM-API-008: List All Promo Codes
  try {
    const response = await axios.get(
      `${API_BASE}/promotions`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (Array.isArray(response.data.data) && response.data.data.length >= 3) {
      logTest('PM-API-008', 'List All Promo Codes', 'PASS',
        `Found ${response.data.data.length} promo codes`);
    } else {
      logTest('PM-API-008', 'List All Promo Codes', 'FAIL',
        `Expected at least 3 promos, found ${response.data.data?.length || 0}`);
    }
  } catch (error) {
    logTest('PM-API-008', 'List All Promo Codes', 'FAIL',
      error.response?.data?.message || error.message);
  }
}

// ============================================================================
// VALIDATION TESTS
// ============================================================================

async function testValidation() {
  console.log('\n\n📋 Test Suite: Validation\n');

  // Test VAL-001: Missing Required Fields
  try {
    await axios.post(
      `${API_BASE}/payment-rules`,
      {
        property_id: testPropertyId,
        // Missing rule_name
        rule_type: 'deposit'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logTest('VAL-001', 'Missing Required Fields', 'FAIL',
      'Should have rejected request with missing rule_name');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('VAL-001', 'Missing Required Fields', 'PASS',
        'Correctly rejected with 400 Bad Request');
    } else {
      logTest('VAL-001', 'Missing Required Fields', 'FAIL',
        `Wrong error code: ${error.response?.status}`);
    }
  }

  // Test VAL-002: Invalid Property ID
  try {
    await axios.post(
      `${API_BASE}/payment-rules`,
      {
        property_id: 'not-a-valid-uuid',
        rule_name: 'Test Rule',
        rule_type: 'flexible'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logTest('VAL-002', 'Invalid Property ID', 'FAIL',
      'Should have rejected invalid UUID');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('VAL-002', 'Invalid Property ID', 'PASS',
        'Correctly rejected invalid UUID');
    } else {
      logTest('VAL-002', 'Invalid Property ID', 'FAIL',
        `Wrong error code: ${error.response?.status}`);
    }
  }

  // Test VAL-005: Schedule Milestones Don't Sum to 100%
  try {
    await axios.post(
      `${API_BASE}/payment-rules`,
      {
        property_id: testPropertyId,
        rule_name: 'Invalid Schedule',
        rule_type: 'payment_schedule',
        schedule_config: [
          {
            sequence: 1,
            name: 'Payment 1',
            amount_type: 'percentage',
            amount: 45,
            due: 'at_booking'
          },
          {
            sequence: 2,
            name: 'Payment 2',
            amount_type: 'percentage',
            amount: 50,
            due: 'on_checkin'
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logTest('VAL-005', 'Schedule Milestones Total 95%', 'FAIL',
      'Should have rejected milestones not totaling 100%');
  } catch (error) {
    if (error.response?.status === 400 &&
        error.response?.data?.message?.includes('100')) {
      logTest('VAL-005', 'Schedule Milestones Total 95%', 'PASS',
        'Correctly rejected invalid milestone sum');
    } else {
      logTest('VAL-005', 'Schedule Milestones Total 95%', 'FAIL',
        `Wrong error: ${error.response?.data?.message}`);
    }
  }

  // Test VAL-007: Percentage Discount > 100
  try {
    await axios.post(
      `${API_BASE}/promotions`,
      {
        property_id: testPropertyId,
        code: 'INVALID',
        name: 'Invalid Promo',
        discount_type: 'percentage',
        discount_value: 150
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logTest('VAL-007', 'Percentage Discount > 100', 'FAIL',
      'Should have rejected discount > 100%');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('VAL-007', 'Percentage Discount > 100', 'PASS',
        'Correctly rejected invalid percentage');
    } else {
      logTest('VAL-007', 'Percentage Discount > 100', 'FAIL',
        `Wrong error code: ${error.response?.status}`);
    }
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  try {
    // Setup
    const authenticated = await authenticate();
    if (!authenticated) {
      console.log('\n❌ Cannot proceed without authentication\n');
      return;
    }

    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      console.log('\n❌ Cannot proceed without test data\n');
      return;
    }

    // Run test suites
    await testPaymentRulesAPI();
    await testPromotionsAPI();
    await testValidation();

    // Final summary
    console.log('\n\n' + '='.repeat(70));
    console.log('\n📊 FINAL TEST RESULTS\n');

    console.log('Test Summary:');
    console.log(`  Total Tests: ${results.total}`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  ⏭️  Skipped: ${results.skipped}`);

    const passRate = ((results.passed / (results.total - results.skipped)) * 100).toFixed(1);
    console.log(`  Success Rate: ${passRate}% (excluding skipped)`);

    console.log('\n' + '='.repeat(70));

    if (results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  SOME TESTS FAILED\n');
      console.log('Failed Tests:');
      results.tests.filter(t => t.status === 'FAIL').forEach(t => {
        console.log(`  - ${t.id}: ${t.name}`);
        console.log(`    ${t.message}`);
      });
      console.log('\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test runner error:', error);
    process.exit(1);
  }
}

runAllTests();
