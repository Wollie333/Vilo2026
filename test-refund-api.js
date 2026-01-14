/**
 * REFUND MANAGEMENT SYSTEM - BACKEND API TESTS
 * Phase 14: Test all comment-related endpoints
 *
 * Tests:
 * 1. POST /api/refunds/:id/comments - Add comment
 * 2. GET /api/refunds/:id/comments - Get comments
 * 3. GET /api/refunds/:id/activity - Get activity feed
 * 4. GET /api/refunds/:id/history - Get status history
 * 5. Admin vs Guest permissions
 * 6. Character limit validation
 * 7. Internal comment filtering
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Test configuration
const tests = {
  passed: 0,
  failed: 0,
  total: 0,
};

// Helper functions
function logTest(name, passed, message = '') {
  tests.total++;
  if (passed) {
    tests.passed++;
    console.log(`✅ TEST ${tests.total}: ${name}`);
    if (message) console.log(`   ${message}`);
  } else {
    tests.failed++;
    console.error(`❌ TEST ${tests.total}: ${name}`);
    if (message) console.error(`   ${message}`);
  }
}

async function makeRequest(method, path, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

// Test Suite
async function runTests() {
  console.log('\n========================================');
  console.log('REFUND API TESTS - Starting...');
  console.log('========================================\n');

  // You'll need to replace these with actual tokens and IDs from your database
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';
  const GUEST_TOKEN = process.env.GUEST_TOKEN || 'YOUR_GUEST_TOKEN_HERE';
  const TEST_REFUND_ID = process.env.TEST_REFUND_ID || 'YOUR_TEST_REFUND_ID_HERE';

  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.error('⚠️  ERROR: Please set environment variables:');
    console.error('   ADMIN_TOKEN=<your_admin_jwt_token>');
    console.error('   GUEST_TOKEN=<your_guest_jwt_token>');
    console.error('   TEST_REFUND_ID=<uuid_of_test_refund>');
    console.error('\nExample:');
    console.error('   ADMIN_TOKEN=eyJhbGc... GUEST_TOKEN=eyJhbGc... TEST_REFUND_ID=123e4567... node test-refund-api.js');
    process.exit(1);
  }

  let createdCommentId = null;

  // =====================================================
  // TEST 1: POST /api/refunds/:id/comments (Valid)
  // =====================================================
  try {
    const result = await makeRequest(
      'POST',
      `/refunds/${TEST_REFUND_ID}/comments`,
      {
        comment_text: 'This is a test comment from the API test suite',
        is_internal: false,
      },
      GUEST_TOKEN
    );

    if (result.status === 201 && result.data.success) {
      createdCommentId = result.data.data.id;
      logTest(
        'POST /api/refunds/:id/comments (Valid comment)',
        true,
        `Comment created with ID: ${createdCommentId}`
      );
    } else {
      logTest('POST /api/refunds/:id/comments (Valid comment)', false, JSON.stringify(result.data));
    }
  } catch (error) {
    logTest('POST /api/refunds/:id/comments (Valid comment)', false, error.message);
  }

  // =====================================================
  // TEST 2: POST /api/refunds/:id/comments (Empty - should fail)
  // =====================================================
  try {
    const result = await makeRequest(
      'POST',
      `/refunds/${TEST_REFUND_ID}/comments`,
      {
        comment_text: '',
        is_internal: false,
      },
      GUEST_TOKEN
    );

    const shouldFail = result.status === 400;
    logTest(
      'POST /api/refunds/:id/comments (Empty text - should fail)',
      shouldFail,
      shouldFail ? 'Correctly rejected empty comment' : 'ERROR: Empty comment was accepted'
    );
  } catch (error) {
    logTest('POST /api/refunds/:id/comments (Empty text)', false, error.message);
  }

  // =====================================================
  // TEST 3: POST /api/refunds/:id/comments (>2000 chars - should fail)
  // =====================================================
  try {
    const longText = 'A'.repeat(2001);
    const result = await makeRequest(
      'POST',
      `/refunds/${TEST_REFUND_ID}/comments`,
      {
        comment_text: longText,
        is_internal: false,
      },
      GUEST_TOKEN
    );

    const shouldFail = result.status === 400;
    logTest(
      'POST /api/refunds/:id/comments (2001 chars - should fail)',
      shouldFail,
      shouldFail ? 'Correctly rejected 2001 char comment' : 'ERROR: Overlimit comment was accepted'
    );
  } catch (error) {
    logTest('POST /api/refunds/:id/comments (2001 chars)', false, error.message);
  }

  // =====================================================
  // TEST 4: POST /api/refunds/:id/comments (Internal as guest - should be forced to false)
  // =====================================================
  try {
    const result = await makeRequest(
      'POST',
      `/refunds/${TEST_REFUND_ID}/comments`,
      {
        comment_text: 'Guest attempting to create internal comment',
        is_internal: true, // Guest trying to set this to true
      },
      GUEST_TOKEN
    );

    if (result.status === 201 && result.data.data.is_internal === false) {
      logTest(
        'POST /api/refunds/:id/comments (Guest cannot create internal)',
        true,
        'Guest comment correctly forced to public (is_internal: false)'
      );
    } else {
      logTest(
        'POST /api/refunds/:id/comments (Guest cannot create internal)',
        false,
        'Guest was able to create internal comment'
      );
    }
  } catch (error) {
    logTest('POST /api/refunds/:id/comments (Guest internal)', false, error.message);
  }

  // =====================================================
  // TEST 5: POST /api/refunds/:id/comments (Admin creates internal)
  // =====================================================
  try {
    const result = await makeRequest(
      'POST',
      `/refunds/${TEST_REFUND_ID}/comments`,
      {
        comment_text: 'Admin creating internal comment',
        is_internal: true,
      },
      ADMIN_TOKEN
    );

    if (result.status === 201 && result.data.data.is_internal === true) {
      logTest(
        'POST /api/refunds/:id/comments (Admin creates internal)',
        true,
        'Admin successfully created internal comment'
      );
    } else {
      logTest(
        'POST /api/refunds/:id/comments (Admin creates internal)',
        false,
        'Admin could not create internal comment'
      );
    }
  } catch (error) {
    logTest('POST /api/refunds/:id/comments (Admin internal)', false, error.message);
  }

  // =====================================================
  // TEST 6: GET /api/refunds/:id/comments (Guest - no internal)
  // =====================================================
  try {
    const result = await makeRequest('GET', `/refunds/${TEST_REFUND_ID}/comments`, null, GUEST_TOKEN);

    if (result.status === 200 && result.data.success) {
      const comments = result.data.data || result.data;
      const hasInternalComments = comments.some((c) => c.is_internal === true);

      logTest(
        'GET /api/refunds/:id/comments (Guest sees no internal)',
        !hasInternalComments,
        hasInternalComments
          ? 'ERROR: Guest can see internal comments'
          : `Guest sees ${comments.length} comments (all public)`
      );
    } else {
      logTest('GET /api/refunds/:id/comments (Guest)', false, 'Failed to fetch comments');
    }
  } catch (error) {
    logTest('GET /api/refunds/:id/comments (Guest)', false, error.message);
  }

  // =====================================================
  // TEST 7: GET /api/refunds/:id/comments (Admin - sees all)
  // =====================================================
  try {
    const result = await makeRequest('GET', `/refunds/${TEST_REFUND_ID}/comments`, null, ADMIN_TOKEN);

    if (result.status === 200 && result.data.success) {
      const comments = result.data.data || result.data;
      const hasInternalComments = comments.some((c) => c.is_internal === true);

      logTest(
        'GET /api/refunds/:id/comments (Admin sees all)',
        true,
        `Admin sees ${comments.length} comments (including ${
          comments.filter((c) => c.is_internal).length
        } internal)`
      );
    } else {
      logTest('GET /api/refunds/:id/comments (Admin)', false, 'Failed to fetch comments');
    }
  } catch (error) {
    logTest('GET /api/refunds/:id/comments (Admin)', false, error.message);
  }

  // =====================================================
  // TEST 8: GET /api/refunds/:id/activity (Activity feed)
  // =====================================================
  try {
    const result = await makeRequest('GET', `/refunds/${TEST_REFUND_ID}/activity`, null, ADMIN_TOKEN);

    if (result.status === 200 && result.data.success) {
      const activities = result.data.data || result.data;
      const hasComments = activities.some((a) => a.activity_type === 'comment');
      const hasStatusChanges = activities.some((a) => a.activity_type === 'status_change');

      logTest(
        'GET /api/refunds/:id/activity (Unified timeline)',
        true,
        `Timeline has ${activities.length} activities (${
          activities.filter((a) => a.activity_type === 'comment').length
        } comments, ${activities.filter((a) => a.activity_type === 'status_change').length} status changes)`
      );
    } else {
      logTest('GET /api/refunds/:id/activity', false, 'Failed to fetch activity feed');
    }
  } catch (error) {
    logTest('GET /api/refunds/:id/activity', false, error.message);
  }

  // =====================================================
  // TEST 9: GET /api/refunds/:id/history (Status history)
  // =====================================================
  try {
    const result = await makeRequest('GET', `/refunds/${TEST_REFUND_ID}/history`, null, ADMIN_TOKEN);

    if (result.status === 200 && result.data.success) {
      const history = result.data.data || result.data;

      logTest(
        'GET /api/refunds/:id/history (Status history)',
        true,
        `Found ${history.length} status changes`
      );

      // Check if history entries have required fields
      if (history.length > 0) {
        const firstEntry = history[0];
        const hasRequiredFields =
          firstEntry.from_status !== undefined &&
          firstEntry.to_status &&
          firstEntry.changed_by &&
          firstEntry.changed_at;

        logTest(
          'Status history entries have required fields',
          hasRequiredFields,
          hasRequiredFields ? 'All required fields present' : 'Missing required fields'
        );
      }
    } else {
      logTest('GET /api/refunds/:id/history', false, 'Failed to fetch status history');
    }
  } catch (error) {
    logTest('GET /api/refunds/:id/history', false, error.message);
  }

  // =====================================================
  // TEST 10: Character count validation (exactly 2000 chars - should pass)
  // =====================================================
  try {
    const exactlyLimit = 'A'.repeat(2000);
    const result = await makeRequest(
      'POST',
      `/refunds/${TEST_REFUND_ID}/comments`,
      {
        comment_text: exactlyLimit,
        is_internal: false,
      },
      GUEST_TOKEN
    );

    logTest(
      'POST /api/refunds/:id/comments (Exactly 2000 chars - should pass)',
      result.status === 201,
      result.status === 201 ? 'Correctly accepted 2000 char comment' : 'ERROR: 2000 char comment rejected'
    );
  } catch (error) {
    logTest('POST /api/refunds/:id/comments (2000 chars)', false, error.message);
  }

  // =====================================================
  // TEST 11: Unauthorized access (no token - should fail)
  // =====================================================
  try {
    const result = await makeRequest('GET', `/refunds/${TEST_REFUND_ID}/comments`, null, null);

    logTest(
      'GET /api/refunds/:id/comments (No auth - should fail)',
      result.status === 401,
      result.status === 401 ? 'Correctly rejected unauthorized request' : 'ERROR: Unauthorized access allowed'
    );
  } catch (error) {
    logTest('GET /api/refunds/:id/comments (No auth)', false, error.message);
  }

  // =====================================================
  // TEST 12: Comment has user populated
  // =====================================================
  try {
    const result = await makeRequest('GET', `/refunds/${TEST_REFUND_ID}/comments`, null, ADMIN_TOKEN);

    if (result.status === 200 && result.data.success) {
      const comments = result.data.data || result.data;
      if (comments.length > 0) {
        const firstComment = comments[0];
        const hasUserInfo = firstComment.user && firstComment.user.first_name && firstComment.user.last_name;

        logTest(
          'Comments have user information populated',
          hasUserInfo,
          hasUserInfo
            ? `User info present: ${firstComment.user.first_name} ${firstComment.user.last_name}`
            : 'User info missing'
        );
      } else {
        logTest('Comments have user information populated', false, 'No comments to check');
      }
    }
  } catch (error) {
    logTest('Comment user population', false, error.message);
  }

  // Print summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${tests.total}`);
  console.log(`✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  console.log(`Success Rate: ${((tests.passed / tests.total) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  if (tests.failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
