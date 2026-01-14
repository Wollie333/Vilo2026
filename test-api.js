/**
 * API Testing Script for Payment Rules & Promo Codes
 * Run with: node test-api.js
 */

const https = require('https');

const SUPABASE_URL = 'https://bzmyilqkrtpxhswtpdtc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_es1tbdllfvmYVjR4vdFctQ_m2XpLajn';
const BACKEND_URL = 'http://localhost:3001';

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make API requests
async function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };

    const req = require('http').request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Helper to log test results
function logTest(testId, testName, passed, expected, actual, error = null) {
  const result = {
    id: testId,
    name: testName,
    passed,
    expected,
    actual,
    error,
    timestamp: new Date().toISOString()
  };

  testResults.tests.push(result);
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testId}: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testId}: ${testName}`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}`);
    if (error) console.log(`   Error: ${error}`);
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting API Tests for Payment Rules & Promo Codes\n');
  console.log('=' .repeat(70));

  try {
    // TEST: Server Health Check
    console.log('\n📋 Phase 0: Environment Checks\n');

    try {
      const healthCheck = await apiRequest('GET', '/api/health');
      logTest(
        'ENV-001',
        'Backend server is running',
        healthCheck.status === 200 || healthCheck.status === 404,
        'Server responds',
        `Status ${healthCheck.status}`,
        null
      );
    } catch (e) {
      logTest(
        'ENV-001',
        'Backend server is running',
        false,
        'Server responds',
        'Connection failed',
        e.message
      );
      console.log('\n❌ Cannot reach backend server. Tests aborted.\n');
      return;
    }

    // TEST: Auth check (without token)
    try {
      const authCheck = await apiRequest('GET', '/api/payment-rules');
      logTest(
        'ENV-002',
        'Authentication required for protected routes',
        authCheck.status === 401,
        'Status 401 Unauthorized',
        `Status ${authCheck.status}`,
        null
      );
    } catch (e) {
      logTest(
        'ENV-002',
        'Authentication required for protected routes',
        false,
        'Status 401',
        'Request failed',
        e.message
      );
    }

    console.log('\n⚠️  Note: Full API testing requires valid authentication token.');
    console.log('   To continue testing, you need to:');
    console.log('   1. Log in to the application');
    console.log('   2. Get the JWT token from browser localStorage');
    console.log('   3. Update this script with the token');
    console.log('   4. Rerun the tests\n');

  } catch (error) {
    console.error('Fatal error during testing:', error);
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Test Summary\n');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);

  // Write results to file
  const fs = require('fs');
  fs.writeFileSync(
    'test-results.json',
    JSON.stringify(testResults, null, 2)
  );
  console.log('📁 Detailed results saved to: test-results.json\n');
}

// Run tests
runTests().catch(console.error);
