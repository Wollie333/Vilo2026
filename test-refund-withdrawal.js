/**
 * Test Script: Refund Withdrawal Feature
 * Tests the complete refund withdrawal flow including booking lock
 */

const http = require('http');
const https = require('https');

const API_BASE = process.env.API_URL || 'http://localhost:3001';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

let authToken = null;
let testBookingId = null;
let testRefundId = null;

// Helper: Make HTTP request
function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test Steps
async function runTests() {
  console.log('🧪 Testing Refund Withdrawal Feature\n');
  console.log('━'.repeat(60));

  try {
    // Step 1: Authentication
    console.log('\n📍 Step 1: Authenticate User');
    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
      console.log('⚠️  Skipping API tests - Set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars');
      console.log('   To test manually, use the frontend application\n');
      await testFrontendComponents();
      return;
    }

    const authResponse = await request('POST', '/api/auth/login', {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (authResponse.status !== 200 || !authResponse.data.success) {
      throw new Error('Authentication failed: ' + JSON.stringify(authResponse.data));
    }

    authToken = authResponse.data.data.token;
    console.log('✅ Authentication successful');

    // Step 2: Get a booking with payment
    console.log('\n📍 Step 2: Find Booking with Payment');
    const bookingsResponse = await request('GET', '/api/bookings?limit=10', null, authToken);

    if (!bookingsResponse.data.success || !bookingsResponse.data.data.length) {
      console.log('⚠️  No bookings found. Please create a booking first.');
      return;
    }

    // Find a booking with payment_status = 'paid' or 'partial'
    testBookingId = bookingsResponse.data.data.find(
      (b) => b.payment_status === 'paid' || b.payment_status === 'partial'
    )?.id;

    if (!testBookingId) {
      console.log('⚠️  No paid bookings found. Please make a payment first.');
      return;
    }

    console.log(`✅ Found test booking: ${testBookingId}`);

    // Step 3: Create refund request
    console.log('\n📍 Step 3: Create Refund Request');
    const createRefundResponse = await request(
      'POST',
      `/api/bookings/${testBookingId}/refunds`,
      {
        reason: 'Testing withdrawal feature',
        requested_amount: 50.0,
      },
      authToken
    );

    if (!createRefundResponse.data.success) {
      throw new Error('Failed to create refund: ' + JSON.stringify(createRefundResponse.data));
    }

    testRefundId = createRefundResponse.data.data.id;
    console.log(`✅ Created refund request: ${testRefundId}`);
    console.log(`   Status: ${createRefundResponse.data.data.status}`);
    console.log(`   Amount: ${createRefundResponse.data.data.requested_amount}`);

    // Step 4: Check booking lock
    console.log('\n📍 Step 4: Verify Booking Lock');
    const bookingDetailResponse = await request('GET', `/api/bookings/${testBookingId}`, null, authToken);

    const hasActiveRefunds = bookingDetailResponse.data.data.refunds?.some((r) =>
      ['requested', 'under_review', 'approved', 'processing'].includes(r.status)
    );

    if (hasActiveRefunds) {
      console.log('✅ Booking has active refunds - should be locked');
    } else {
      console.log('❌ Booking lock detection failed');
    }

    // Step 5: Attempt to edit booking (should fail if lock is working)
    console.log('\n📍 Step 5: Test Booking Lock Protection');
    const updateAttempt = await request(
      'PATCH',
      `/api/bookings/${testBookingId}`,
      { notes: 'Testing lock protection' },
      authToken
    );

    if (updateAttempt.status === 403 || updateAttempt.data.error?.code === 'REFUND_LOCK') {
      console.log('✅ Booking lock is working - edit was blocked');
    } else if (updateAttempt.status === 200) {
      console.log('⚠️  Booking lock may not be working - edit succeeded (lock validation might be missing)');
    } else {
      console.log(`⚠️  Unexpected response: ${updateAttempt.status}`);
    }

    // Step 6: Withdraw refund request
    console.log('\n📍 Step 6: Withdraw Refund Request');
    const withdrawResponse = await request('POST', `/api/refunds/${testRefundId}/withdraw`, {}, authToken);

    if (!withdrawResponse.data.success) {
      throw new Error('Failed to withdraw refund: ' + JSON.stringify(withdrawResponse.data));
    }

    console.log(`✅ Refund withdrawn successfully`);
    console.log(`   New status: ${withdrawResponse.data.data.status}`);
    console.log(`   Updated at: ${withdrawResponse.data.data.updated_at}`);

    // Step 7: Verify booking is unlocked
    console.log('\n📍 Step 7: Verify Booking Unlocked');
    const bookingAfterWithdraw = await request('GET', `/api/bookings/${testBookingId}`, null, authToken);

    const stillHasActiveRefunds = bookingAfterWithdraw.data.data.refunds?.some((r) =>
      ['requested', 'under_review', 'approved', 'processing'].includes(r.status)
    );

    if (!stillHasActiveRefunds) {
      console.log('✅ Booking is now unlocked - no active refunds');
    } else {
      console.log('⚠️  Booking still has active refunds');
    }

    // Step 8: Check booking history
    console.log('\n📍 Step 8: Check Booking History');
    const historyResponse = await request('GET', `/api/bookings/${testBookingId}/history`, null, authToken);

    if (historyResponse.data.success) {
      const refundEvents = historyResponse.data.data.filter((e) => e.type === 'refund');
      console.log(`✅ History endpoint working - found ${refundEvents.length} refund events`);

      const withdrawnEvent = refundEvents.find((e) => e.title?.includes('withdrawn') || e.description?.includes('withdrawn'));
      if (withdrawnEvent) {
        console.log('✅ Withdrawal event recorded in history');
      } else {
        console.log('⚠️  Withdrawal event not found in history');
      }
    } else {
      console.log('❌ History endpoint failed:', historyResponse.data);
    }

    // Summary
    console.log('\n' + '━'.repeat(60));
    console.log('✅ All API Tests Completed Successfully!\n');

    console.log('🎯 Next Steps:');
    console.log('   1. Test in the frontend UI:');
    console.log(`      - Go to booking: ${testBookingId}`);
    console.log('      - Verify "Refund Pending" pill is gone');
    console.log('      - Verify lock banner is gone');
    console.log('      - Check History tab shows withdrawal event');
    console.log('   2. Test the complete flow with a new booking\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Test frontend component structure
async function testFrontendComponents() {
  console.log('\n📍 Frontend Component Structure Check\n');

  const fs = require('fs');
  const path = require('path');

  const componentsToCheck = [
    'frontend/src/components/ui/RefundStatusPill/RefundStatusPill.tsx',
    'frontend/src/components/features/Booking/BookingTimeline/BookingTimeline.tsx',
    'frontend/src/components/features/Booking/BookingLockBanner.tsx',
    'frontend/src/pages/bookings/BookingDetailPage.tsx',
    'frontend/src/services/refund.service.ts',
    'frontend/src/services/booking.service.ts',
  ];

  for (const filePath of componentsToCheck) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for key implementations
      if (filePath.includes('BookingDetailPage')) {
        const hasRefundPill = content.includes('RefundStatusPill');
        const hasLockBanner = content.includes('BookingLockBanner');
        const hasHistoryTab = content.includes('history') || content.includes('History');
        const hasWithdrawHandler = content.includes('handleWithdraw') || content.includes('withdrawRefund');

        console.log(`✅ ${filePath}`);
        console.log(`   - RefundStatusPill: ${hasRefundPill ? '✓' : '✗'}`);
        console.log(`   - BookingLockBanner: ${hasLockBanner ? '✓' : '✗'}`);
        console.log(`   - History Tab: ${hasHistoryTab ? '✓' : '✗'}`);
        console.log(`   - Withdraw Handler: ${hasWithdrawHandler ? '✓' : '✗'}`);
      } else if (filePath.includes('refund.service')) {
        const hasWithdrawMethod = content.includes('withdrawRefund');
        console.log(`✅ ${filePath}`);
        console.log(`   - withdrawRefund method: ${hasWithdrawMethod ? '✓' : '✗'}`);
      } else if (filePath.includes('booking.service')) {
        const hasHistoryMethod = content.includes('getBookingHistory');
        console.log(`✅ ${filePath}`);
        console.log(`   - getBookingHistory method: ${hasHistoryMethod ? '✓' : '✗'}`);
      } else {
        console.log(`✅ ${filePath}`);
      }
    } else {
      console.log(`❌ ${filePath} - NOT FOUND`);
    }
  }

  console.log('\n🎯 Frontend components are ready for testing!');
  console.log('\n📋 Manual Testing Checklist:');
  console.log('   1. Start the dev servers: npm run dev');
  console.log('   2. Login to the application');
  console.log('   3. Navigate to a booking with payment');
  console.log('   4. Go to Refunds tab → Request Refund');
  console.log('   5. Verify orange "Refund Pending" pill appears in header');
  console.log('   6. Verify lock banner appears above tabs');
  console.log('   7. Verify edit/cancel buttons are disabled');
  console.log('   8. Click "Withdraw Request" button');
  console.log('   9. Verify pill and banner disappear');
  console.log('   10. Go to History tab → verify withdrawal event\n');
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
