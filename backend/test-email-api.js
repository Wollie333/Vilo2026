/**
 * Test Email Management API
 *
 * This script tests the email management API endpoints to verify they're working.
 * Run this AFTER you've granted yourself super admin access.
 *
 * Usage:
 *   1. Make sure backend is running (npm run dev)
 *   2. Log into your app and copy your JWT token from localStorage
 *   3. Set TOKEN environment variable:
 *      Windows: set TOKEN=your_jwt_token_here && node backend/test-email-api.js
 *      Mac/Linux: TOKEN=your_jwt_token_here node backend/test-email-api.js
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error('❌ ERROR: TOKEN environment variable not set');
  console.log('\n📋 How to get your token:');
  console.log('1. Log into your app');
  console.log('2. Open browser console (F12)');
  console.log('3. Run: JSON.parse(localStorage.getItem("auth")).accessToken');
  console.log('4. Copy the token');
  console.log('\n💡 Then run:');
  console.log('   Windows: set TOKEN=your_token && node backend/test-email-api.js');
  console.log('   Mac/Linux: TOKEN=your_token node backend/test-email-api.js');
  process.exit(1);
}

/**
 * Make API request
 */
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🧪 Testing Email Management API');
  console.log('='.repeat(60));
  console.log(`API Base: ${API_BASE_URL}`);
  console.log(`Token: ${TOKEN.substring(0, 20)}...`);
  console.log('='.repeat(60));
  console.log();

  let passed = 0;
  let failed = 0;

  // Test 1: Get categories
  try {
    console.log('Test 1: GET /admin/email/categories');
    const result = await makeRequest('/admin/email/categories');

    if (result.status === 200) {
      console.log(`  ✅ Status: ${result.status}`);
      console.log(`  ✅ Categories found: ${result.data.data?.categories?.length || 0}`);
      if (result.data.data?.categories?.length > 0) {
        console.log(`  📦 Sample: ${result.data.data.categories[0].display_name}`);
      }
      passed++;
    } else if (result.status === 401) {
      console.log(`  ❌ Status: ${result.status} (Unauthorized)`);
      console.log('  💡 Your token may be expired. Get a fresh token and try again.');
      failed++;
    } else if (result.status === 403) {
      console.log(`  ❌ Status: ${result.status} (Forbidden)`);
      console.log('  💡 You need super admin access. Run GRANT_SUPER_ADMIN.sql first.');
      failed++;
    } else {
      console.log(`  ❌ Status: ${result.status}`);
      console.log(`  ❌ Response: ${JSON.stringify(result.data, null, 2)}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    failed++;
  }

  console.log();

  // Test 2: Get templates
  try {
    console.log('Test 2: GET /admin/email/templates');
    const result = await makeRequest('/admin/email/templates');

    if (result.status === 200) {
      console.log(`  ✅ Status: ${result.status}`);
      console.log(`  ✅ Templates found: ${result.data.data?.templates?.length || 0}`);
      if (result.data.data?.templates?.length > 0) {
        console.log(`  📧 Sample templates:`);
        result.data.data.templates.slice(0, 3).forEach(t => {
          console.log(`     - ${t.display_name} (${t.template_key})`);
        });
      } else {
        console.log('  ⚠️  No templates found. Migration may not have run.');
      }
      passed++;
    } else {
      console.log(`  ❌ Status: ${result.status}`);
      console.log(`  ❌ Response: ${JSON.stringify(result.data, null, 2)}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    failed++;
  }

  console.log();
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${passed + failed}`);
  console.log(`❌ Failed: ${failed}/${passed + failed}`);
  console.log('='.repeat(60));

  if (passed === 2) {
    console.log();
    console.log('🎉 SUCCESS! Email Management API is working correctly.');
    console.log();
    console.log('📋 Next steps:');
    console.log('1. Open your browser to: http://localhost:5173/admin/email');
    console.log('2. You should see the Email Management page with templates');
    console.log('3. Try editing a template and sending a test email');
  } else if (failed > 0) {
    console.log();
    console.log('⚠️  Some tests failed. Check the errors above.');

    if (result.status === 401 || result.status === 403) {
      console.log();
      console.log('🔧 Troubleshooting:');
      console.log('1. Make sure you ran GRANT_SUPER_ADMIN.sql');
      console.log('2. Log out and log back in to refresh your token');
      console.log('3. Get a fresh token from browser localStorage');
      console.log('4. Run this test script again with the new token');
    }
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
