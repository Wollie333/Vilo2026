/**
 * Payment Rules Protection System Test Script
 *
 * Tests:
 * 1. List payment rules - verify room_count is populated
 * 2. Check edit permission - verify canEdit logic
 * 3. Attempt to edit in-use rule - verify protection works
 * 4. Unassign rooms - verify edit becomes allowed
 */

const BACKEND_URL = 'http://localhost:3001/api';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status}: ${testName}`, color);
  if (details) {
    console.log(`  ${details}`);
  }
}

// Test results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
};

function recordResult(passed) {
  results.total++;
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

async function testListPaymentRules(authToken) {
  logSection('TEST 1: List Payment Rules with Room Count');

  try {
    const response = await fetch(`${BACKEND_URL}/payment-rules`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    // Test 1.1: Response is successful
    const test1 = response.ok;
    logTest('List endpoint returns 200 OK', test1);
    recordResult(test1);

    if (!data.success) {
      logTest('Response has success=true', false, `Got: ${data.success}`);
      recordResult(false);
      return null;
    }
    logTest('Response has success=true', true);
    recordResult(true);

    // Test 1.2: Payment rules array exists
    const rules = data.data?.payment_rules || [];
    const test2 = Array.isArray(rules);
    logTest('Payment rules array exists', test2, `Found ${rules.length} rules`);
    recordResult(test2);

    if (rules.length === 0) {
      log('⚠ No payment rules found. Cannot test room_count feature.', 'yellow');
      return null;
    }

    // Test 1.3: room_count field exists on rules
    const hasRoomCount = rules.every(rule => typeof rule.room_count === 'number');
    logTest('All rules have room_count field', hasRoomCount);
    recordResult(hasRoomCount);

    // Display room counts
    console.log('\nPayment Rules Summary:');
    rules.forEach(rule => {
      console.log(`  - ${rule.rule_name}: ${rule.room_count} room(s) assigned`);
    });

    // Find a rule with assignments for further testing
    const ruleWithAssignments = rules.find(r => r.room_count > 0);
    const ruleWithoutAssignments = rules.find(r => r.room_count === 0);

    if (ruleWithAssignments) {
      log(`\n✓ Found rule with assignments: "${ruleWithAssignments.rule_name}" (${ruleWithAssignments.room_count} rooms)`, 'green');
    } else {
      log('\n⚠ No rules with room assignments found for edit protection testing', 'yellow');
    }

    if (ruleWithoutAssignments) {
      log(`✓ Found rule without assignments: "${ruleWithoutAssignments.rule_name}"`, 'green');
    }

    return {
      ruleWithAssignments,
      ruleWithoutAssignments,
      allRules: rules,
    };

  } catch (error) {
    logTest('List payment rules endpoint', false, error.message);
    recordResult(false);
    return null;
  }
}

async function testCheckEditPermission(authToken, ruleId, expectedCanEdit, ruleName) {
  logSection(`TEST 2: Check Edit Permission - ${ruleName}`);

  try {
    const response = await fetch(`${BACKEND_URL}/payment-rules/${ruleId}/edit-permission`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    // Test 2.1: Response is successful
    const test1 = response.ok;
    logTest('Edit permission endpoint returns 200 OK', test1);
    recordResult(test1);

    if (!data.success) {
      logTest('Response has success=true', false, `Got: ${data.success}`);
      recordResult(false);
      return null;
    }
    logTest('Response has success=true', true);
    recordResult(true);

    const permission = data.data;

    // Test 2.2: Permission object has required fields
    const hasFields = permission &&
      typeof permission.canEdit === 'boolean' &&
      typeof permission.assignedRoomCount === 'number' &&
      Array.isArray(permission.roomNames);
    logTest('Permission object has required fields', hasFields);
    recordResult(hasFields);

    // Test 2.3: canEdit matches expected value
    const canEditMatches = permission.canEdit === expectedCanEdit;
    logTest(
      `canEdit is ${expectedCanEdit}`,
      canEditMatches,
      `Got: ${permission.canEdit}, Expected: ${expectedCanEdit}`
    );
    recordResult(canEditMatches);

    // Display permission details
    console.log('\nPermission Details:');
    console.log(`  canEdit: ${permission.canEdit}`);
    console.log(`  assignedRoomCount: ${permission.assignedRoomCount}`);
    console.log(`  roomNames: [${permission.roomNames.slice(0, 3).join(', ')}${permission.roomNames.length > 3 ? '...' : ''}]`);

    return permission;

  } catch (error) {
    logTest('Check edit permission endpoint', false, error.message);
    recordResult(false);
    return null;
  }
}

async function testEditProtection(authToken, ruleId, ruleName, shouldFail) {
  logSection(`TEST 3: Edit Protection - ${ruleName}`);

  try {
    const updateData = {
      description: `Updated at ${new Date().toISOString()}`,
    };

    const response = await fetch(`${BACKEND_URL}/payment-rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (shouldFail) {
      // Test 3.1: Edit should be blocked (400 error)
      const test1 = response.status === 400;
      logTest('Edit is blocked with 400 status', test1, `Got status: ${response.status}`);
      recordResult(test1);

      // Test 3.2: Error message mentions rule is in use
      const errorMessage = data.error?.message || '';
      const test2 = errorMessage.includes('assigned to') || errorMessage.includes('in use');
      logTest('Error message explains rule is in use', test2, `Message: "${errorMessage}"`);
      recordResult(test2);

      console.log('\nResponse:');
      console.log(`  Status: ${response.status}`);
      console.log(`  Message: ${errorMessage}`);

    } else {
      // Test 3.3: Edit should succeed
      const test1 = response.ok;
      logTest('Edit succeeds with 200 status', test1, `Got status: ${response.status}`);
      recordResult(test1);

      if (data.success) {
        log('✓ Rule updated successfully', 'green');
      }
    }

  } catch (error) {
    logTest('Edit protection test', false, error.message);
    recordResult(false);
  }
}

async function testRoomAssignments(authToken, ruleId, ruleName) {
  logSection(`TEST 4: Get Room Assignments - ${ruleName}`);

  try {
    const response = await fetch(`${BACKEND_URL}/payment-rules/${ruleId}/assignments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    // Test 4.1: Response is successful
    const test1 = response.ok;
    logTest('Get assignments endpoint returns 200 OK', test1);
    recordResult(test1);

    if (!data.success) {
      logTest('Response has success=true', false, `Got: ${data.success}`);
      recordResult(false);
      return;
    }
    logTest('Response has success=true', true);
    recordResult(true);

    const assignments = data.data || [];

    // Test 4.2: Assignments is an array
    const test2 = Array.isArray(assignments);
    logTest('Assignments is an array', test2, `Found ${assignments.length} assignments`);
    recordResult(test2);

    // Display assignments
    if (assignments.length > 0) {
      console.log('\nRoom Assignments:');
      assignments.forEach(assignment => {
        console.log(`  - Room: ${assignment.room_name || assignment.room_id}`);
      });
    } else {
      console.log('\nNo room assignments found.');
    }

  } catch (error) {
    logTest('Get room assignments endpoint', false, error.message);
    recordResult(false);
  }
}

async function runTests() {
  log('\n🧪 PAYMENT RULES PROTECTION SYSTEM - TEST SUITE', 'blue');
  log('=====================================================\n', 'blue');

  // Get auth token from command line or use default
  const authToken = process.argv[2];

  if (!authToken) {
    log('❌ ERROR: No authentication token provided', 'red');
    log('\nUsage: node test-payment-rules-protection.js <AUTH_TOKEN>', 'yellow');
    log('\nTo get your auth token:', 'yellow');
    log('1. Log in to the frontend', 'yellow');
    log('2. Open browser DevTools > Application > Local Storage', 'yellow');
    log('3. Copy the value of "accessToken"\n', 'yellow');
    process.exit(1);
  }

  log('Using provided authentication token\n', 'green');

  // Test 1: List payment rules
  const testData = await testListPaymentRules(authToken);

  if (!testData) {
    log('\n⚠ Cannot continue tests without payment rules data', 'yellow');
    printSummary();
    return;
  }

  // Test 2 & 3: Check edit permission and edit protection
  if (testData.ruleWithAssignments) {
    await testCheckEditPermission(
      authToken,
      testData.ruleWithAssignments.id,
      false, // Should NOT be editable
      testData.ruleWithAssignments.rule_name
    );

    await testEditProtection(
      authToken,
      testData.ruleWithAssignments.id,
      testData.ruleWithAssignments.rule_name,
      true // Should fail (blocked)
    );

    await testRoomAssignments(
      authToken,
      testData.ruleWithAssignments.id,
      testData.ruleWithAssignments.rule_name
    );
  }

  if (testData.ruleWithoutAssignments) {
    await testCheckEditPermission(
      authToken,
      testData.ruleWithoutAssignments.id,
      true, // Should be editable
      testData.ruleWithoutAssignments.rule_name
    );

    await testEditProtection(
      authToken,
      testData.ruleWithoutAssignments.id,
      testData.ruleWithoutAssignments.rule_name,
      false // Should succeed
    );
  }

  printSummary();
}

function printSummary() {
  logSection('TEST SUMMARY');

  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  const percentage = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  log(`\nSuccess Rate: ${percentage}%`, percentage >= 80 ? 'green' : 'red');

  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED!', 'green');
  } else {
    log('\n⚠ SOME TESTS FAILED - Review output above', 'yellow');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ TEST SUITE ERROR: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
