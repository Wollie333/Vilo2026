/**
 * Check if migration 044 columns exist
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend/.env
const envPath = path.join(__dirname, 'backend', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 Checking refund_requests table columns...\n');

  try {
    // Insert a test record to check structure
    const testRecord = {
      booking_id: '00000000-0000-0000-0000-000000000000', // Will fail FK but that's OK
      requested_amount: 100,
      reason: 'Test',
    };

    const { data, error } = await supabase
      .from('refund_requests')
      .insert(testRecord)
      .select();

    if (error) {
      // Check if it's a foreign key error (expected) or a column doesn't exist error
      if (error.code === '23503') {
        console.log('✅ Table structure is OK (FK constraint as expected)\n');
        console.log('Columns check: PASSED');
        return true;
      } else if (error.code === '42703') {
        console.log('❌ Column does not exist!');
        console.log('Error:', error.message);
        console.log('\n📋 You need to run migration 044_create_credit_memos_and_refund_enhancements.sql\n');
        return false;
      } else {
        console.log('❌ Unexpected error:');
        console.log('Code:', error.code);
        console.log('Message:', error.message);
        console.log('Details:', error.details);
        return false;
      }
    }

    console.log('✅ Table structure is OK\n');
    return true;

  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

checkColumns().then(success => {
  process.exit(success ? 0 : 1);
});
