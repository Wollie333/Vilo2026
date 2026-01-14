/**
 * Verify refund_requests table structure
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

const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTable() {
  console.log('🔍 Checking refund_requests table...\n');

  try {
    // Try to select from refund_requests table
    const { data, error } = await supabase
      .from('refund_requests')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying refund_requests table:');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);

      if (error.code === '42P01') {
        console.log('\n⚠️  The refund_requests table does not exist!');
        console.log('\n📋 Please run migration 033_create_bookings_schema.sql');
      } else if (error.code === '42703') {
        console.log('\n⚠️  The refund_requests table exists but is missing columns!');
        console.log('\n📋 Please run migration 044_create_credit_memos_and_refund_enhancements.sql');
      }

      return false;
    }

    console.log('✅ refund_requests table exists');
    console.log(`   Found ${data.length} refund request(s)\n`);

    // Check for new columns from migration 044
    if (data.length > 0) {
      const firstRecord = data[0];
      const requiredColumns = [
        'refund_breakdown',
        'suggested_amount',
        'cancellation_policy',
        'calculated_policy_amount',
        'credit_memo_id',
        'auto_process_failed',
        'failure_reason'
      ];

      const missingColumns = [];
      for (const col of requiredColumns) {
        if (!(col in firstRecord)) {
          missingColumns.push(col);
        }
      }

      if (missingColumns.length > 0) {
        console.log('⚠️  Migration 044 columns are missing:');
        missingColumns.forEach(col => console.log(`   - ${col}`));
        console.log('\n📋 Please run migration 044_create_credit_memos_and_refund_enhancements.sql\n');
        return false;
      } else {
        console.log('✅ All migration 044 columns present');
      }
    } else {
      console.log('⚠️  Table is empty, cannot verify column structure');
      console.log('   This is OK for a fresh installation\n');
    }

    // Check for credit_memos table
    const { data: memoData, error: memoError } = await supabase
      .from('credit_memos')
      .select('*')
      .limit(1);

    if (memoError) {
      if (memoError.code === '42P01') {
        console.log('❌ credit_memos table does not exist!');
        console.log('📋 Please run migration 044_create_credit_memos_and_refund_enhancements.sql\n');
        return false;
      }
    } else {
      console.log('✅ credit_memos table exists');
      console.log(`   Found ${memoData.length} credit memo(s)\n`);
    }

    console.log('✅ Database structure is correct!\n');
    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

verifyTable().then(success => {
  process.exit(success ? 0 : 1);
});
