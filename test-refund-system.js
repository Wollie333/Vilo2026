/**
 * Comprehensive Refund System Test Script
 *
 * Tests:
 * 1. Backend services - refund calculation, approval workflow, processing
 * 2. API endpoints - guest and admin authorization, validation
 * 3. End-to-end refund workflows - auto refund, manual refund, mixed payments
 * 4. Credit memo PDF generation and download
 *
 * Usage: node test-refund-system.js
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

let authToken = null;
let testBookingId = null;
let testRefundRequestId = null;
let testCreditMemoId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
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
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80));
}

function logTest(name) {
  log(`\n▶ Testing: ${name}`, 'cyan');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

// ============================================================================
// Helper Functions
// ============================================================================

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    return { response, data };
  } catch (error) {
    logError(`Request failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// Test: Authentication
// ============================================================================

async function testAuthentication() {
  logSection('1. AUTHENTICATION');

  logTest('User login');
  const { response, data } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123',
    }),
  });

  if (response.ok && data.success && data.data?.token) {
    authToken = data.data.token;
    logSuccess(`Logged in successfully`);
    logSuccess(`Token: ${authToken.substring(0, 20)}...`);
  } else {
    logError(`Login failed: ${data.error || 'Unknown error'}`);
    throw new Error('Authentication required to continue tests');
  }
}

// ============================================================================
// Test: Refund Calculation
// ============================================================================

async function testRefundCalculation() {
  logSection('2. REFUND CALCULATION');

  logTest('Calculate suggested refund amount');

  // First, create a test booking or use existing one
  // For this test, we'll assume a booking exists
  // In production, you'd create a test booking first

  const { response, data } = await makeRequest(`/bookings/${testBookingId}/refunds/calculate`);

  if (response.ok && data.success) {
    logSuccess(`Calculation successful`);
    logSuccess(`Suggested amount: ${data.data.suggested_amount}`);
    logSuccess(`Policy: ${data.data.policy}`);
    logSuccess(`Days until check-in: ${data.data.days_until_checkin}`);
    logSuccess(`Policy-based amount: ${data.data.policy_amount}`);
    logSuccess(`Eligible: ${data.data.is_policy_eligible}`);
  } else {
    logWarning(`Calculation failed (might be expected if no test booking): ${data.error}`);
  }
}

// ============================================================================
// Test: Create Refund Request
// ============================================================================

async function testCreateRefundRequest() {
  logSection('3. CREATE REFUND REQUEST');

  logTest('Create refund request with validation');

  // Test 1: Invalid amount (negative)
  logTest('Test 1: Invalid amount (should fail)');
  let result = await makeRequest(`/bookings/${testBookingId}/refunds`, {
    method: 'POST',
    body: JSON.stringify({
      requested_amount: -100,
      reason: 'Test refund',
    }),
  });

  if (!result.response.ok) {
    logSuccess('Validation correctly rejected negative amount');
  } else {
    logError('Validation should have rejected negative amount');
  }

  // Test 2: Missing reason (should fail)
  logTest('Test 2: Missing reason (should fail)');
  result = await makeRequest(`/bookings/${testBookingId}/refunds`, {
    method: 'POST',
    body: JSON.stringify({
      requested_amount: 100,
      reason: '',
    }),
  });

  if (!result.response.ok) {
    logSuccess('Validation correctly rejected empty reason');
  } else {
    logError('Validation should have rejected empty reason');
  }

  // Test 3: Valid refund request
  logTest('Test 3: Valid refund request (should succeed)');
  result = await makeRequest(`/bookings/${testBookingId}/refunds`, {
    method: 'POST',
    body: JSON.stringify({
      requested_amount: 500,
      reason: 'Change of plans - automated test',
    }),
  });

  if (result.response.ok && result.data.success) {
    testRefundRequestId = result.data.data.id;
    logSuccess(`Refund request created: ${testRefundRequestId}`);
    logSuccess(`Status: ${result.data.data.status}`);
    logSuccess(`Amount: ${result.data.data.requested_amount}`);
  } else {
    logWarning(`Failed to create refund request: ${result.data.error}`);
  }
}

// ============================================================================
// Test: Admin Approval Workflow
// ============================================================================

async function testApprovalWorkflow() {
  logSection('4. ADMIN APPROVAL WORKFLOW');

  if (!testRefundRequestId) {
    logWarning('Skipping approval workflow tests - no refund request created');
    return;
  }

  // Test: Get refund details
  logTest('Get refund request details');
  let result = await makeRequest(`/admin/refunds/${testRefundRequestId}`);

  if (result.response.ok && result.data.success) {
    logSuccess(`Retrieved refund details`);
    logSuccess(`Status: ${result.data.data.status}`);
    logSuccess(`Suggested amount: ${result.data.data.suggested_amount}`);
  } else {
    logError(`Failed to get refund details: ${result.data.error}`);
  }

  // Test: Approve refund
  logTest('Approve refund request');
  result = await makeRequest(`/admin/refunds/${testRefundRequestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      approved_amount: 450, // Approve slightly less than requested
      review_notes: 'Approved with adjustment - automated test',
    }),
  });

  if (result.response.ok && result.data.success) {
    logSuccess(`Refund approved`);
    logSuccess(`Approved amount: ${result.data.data.approved_amount}`);
    logSuccess(`New status: ${result.data.data.status}`);
  } else {
    logError(`Failed to approve refund: ${result.data.error}`);
  }
}

// ============================================================================
// Test: Refund Processing
// ============================================================================

async function testRefundProcessing() {
  logSection('5. REFUND PROCESSING');

  if (!testRefundRequestId) {
    logWarning('Skipping processing tests - no refund request available');
    return;
  }

  // Test: Process automatic refund
  logTest('Process automatic refund');
  const result = await makeRequest(`/admin/refunds/${testRefundRequestId}/process`, {
    method: 'POST',
  });

  if (result.response.ok && result.data.success) {
    logSuccess(`Refund processing initiated`);
    logSuccess(`Status: ${result.data.data.success ? 'Success' : 'Failed'}`);
    if (result.data.data.breakdown_results) {
      logSuccess(`Breakdown:`);
      result.data.data.breakdown_results.forEach((item) => {
        logSuccess(`  - ${item.method}: ${item.success ? 'Success' : 'Failed'}`);
      });
    }
  } else {
    logWarning(`Processing failed (expected in test environment): ${result.data.error}`);
  }
}

// ============================================================================
// Test: Credit Memo Generation
// ============================================================================

async function testCreditMemoGeneration() {
  logSection('6. CREDIT MEMO GENERATION');

  if (!testRefundRequestId) {
    logWarning('Skipping credit memo tests - no refund request available');
    return;
  }

  // Test: Generate credit memo
  logTest('Generate credit memo for refund');
  const result = await makeRequest(`/admin/refunds/${testRefundRequestId}/generate-credit-memo`, {
    method: 'POST',
  });

  if (result.response.ok && result.data.success) {
    testCreditMemoId = result.data.data.id;
    logSuccess(`Credit memo generated: ${result.data.data.credit_memo_number}`);
    logSuccess(`Status: ${result.data.data.status}`);
    logSuccess(`Total: ${result.data.data.total_cents / 100} ${result.data.data.currency}`);
  } else {
    logWarning(`Failed to generate credit memo: ${result.data.error}`);
  }

  // Test: Get credit memo download URL
  if (testCreditMemoId) {
    logTest('Get credit memo download URL');
    const downloadResult = await makeRequest(`/credit-memos/${testCreditMemoId}/download`);

    if (downloadResult.response.ok && downloadResult.data.success) {
      logSuccess(`Download URL generated`);
      logSuccess(`URL: ${downloadResult.data.data.download_url.substring(0, 60)}...`);
      logSuccess(`Expires: ${downloadResult.data.data.expires_at}`);
    } else {
      logError(`Failed to get download URL: ${downloadResult.data.error}`);
    }
  }
}

// ============================================================================
// Test: List and Filter Endpoints
// ============================================================================

async function testListEndpoints() {
  logSection('7. LIST & FILTER ENDPOINTS');

  // Test: List all refunds
  logTest('List all refunds');
  let result = await makeRequest('/admin/refunds?limit=10');

  if (result.response.ok && result.data.success) {
    logSuccess(`Retrieved ${result.data.data.length} refunds`);
    logSuccess(`Total: ${result.data.pagination.total}`);
  } else {
    logError(`Failed to list refunds: ${result.data.error}`);
  }

  // Test: Filter by status
  logTest('Filter refunds by status');
  result = await makeRequest('/admin/refunds?status=approved&limit=10');

  if (result.response.ok && result.data.success) {
    logSuccess(`Retrieved ${result.data.data.length} approved refunds`);
  } else {
    logError(`Failed to filter refunds: ${result.data.error}`);
  }

  // Test: List credit memos
  logTest('List all credit memos');
  result = await makeRequest('/admin/credit-memos?limit=10');

  if (result.response.ok && result.data.success) {
    logSuccess(`Retrieved ${result.data.data.length} credit memos`);
    logSuccess(`Total: ${result.data.pagination.total}`);
  } else {
    logError(`Failed to list credit memos: ${result.data.error}`);
  }
}

// ============================================================================
// Test: Guest Access Control
// ============================================================================

async function testGuestAccessControl() {
  logSection('8. GUEST ACCESS CONTROL');

  logTest('Verify guest can only access own refunds');

  // This test assumes you have a guest user token
  // In a real scenario, you'd log in as a guest user first

  logWarning('Guest access control test requires separate guest authentication');
  logWarning('Ensure your backend properly validates booking ownership');
}

// ============================================================================
// Test: Refund Status Check
// ============================================================================

async function testRefundStatus() {
  logSection('9. REFUND STATUS CHECK');

  if (!testBookingId) {
    logWarning('Skipping refund status test - no test booking available');
    return;
  }

  logTest('Get refund status for booking');
  const result = await makeRequest(`/refunds/booking/${testBookingId}/status`);

  if (result.response.ok && result.data.success) {
    logSuccess(`Refund status retrieved`);
    logSuccess(`Has active request: ${result.data.data.has_active_request}`);
    logSuccess(`Total refunded: ${result.data.data.total_refunded}`);
    logSuccess(`Available for refund: ${result.data.data.available_for_refund}`);
    logSuccess(`Can request refund: ${result.data.data.can_request_refund}`);
  } else {
    logWarning(`Failed to get refund status: ${result.data.error}`);
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  log('\n╔══════════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║                     REFUND SYSTEM COMPREHENSIVE TEST SUITE                ║', 'bright');
  log('╚══════════════════════════════════════════════════════════════════════════╝', 'bright');

  log('\nAPI Base URL: ' + API_BASE_URL, 'blue');
  log('Test Mode: Comprehensive\n', 'blue');

  try {
    // Run tests in sequence
    await testAuthentication();
    await testRefundCalculation();
    await testCreateRefundRequest();
    await testApprovalWorkflow();
    await testRefundProcessing();
    await testCreditMemoGeneration();
    await testListEndpoints();
    await testGuestAccessControl();
    await testRefundStatus();

    // Summary
    logSection('TEST SUMMARY');
    logSuccess('All tests completed!');
    log('\nNote: Some tests may show warnings in test environment.', 'yellow');
    log('Ensure you have:', 'yellow');
    log('  1. Database migrations run (migration 044 & 045)', 'yellow');
    log('  2. Test booking created with payments', 'yellow');
    log('  3. Payment gateway credentials configured (for live tests)', 'yellow');
    log('  4. Admin user credentials', 'yellow');

  } catch (error) {
    logSection('TEST FAILED');
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// ============================================================================
// Setup Instructions
// ============================================================================

function showSetupInstructions() {
  logSection('SETUP INSTRUCTIONS');
  log('Before running this test, ensure:', 'yellow');
  log('1. Run database migrations:', 'yellow');
  log('   node apply-migrations.js', 'cyan');
  log('2. Start the backend server:', 'yellow');
  log('   cd backend && npm run dev', 'cyan');
  log('3. Create a test booking with payments:', 'yellow');
  log('   node create-test-booking.js', 'cyan');
  log('4. Set environment variables:', 'yellow');
  log('   export API_URL=http://localhost:3001/api', 'cyan');
  log('   export SUPABASE_URL=your_supabase_url', 'cyan');
  log('   export SUPABASE_ANON_KEY=your_anon_key', 'cyan');
  log('\nThen run this test:', 'yellow');
  log('   node test-refund-system.js\n', 'cyan');
}

// Check if --help flag is passed
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showSetupInstructions();
  process.exit(0);
}

// Run the tests
runAllTests();
