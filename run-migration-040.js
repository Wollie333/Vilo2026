/**
 * Run Migration 040: Add payment_reference to booking_payments
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, 'backend', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (match) {
      env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });

  return env;
}

const env = loadEnv();
const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('\n🚀 RUNNING MIGRATION 040\n');
console.log('='.repeat(70));

async function runMigration() {
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'backend', 'migrations', '040_add_payment_reference_to_booking_payments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📄 Migration file loaded');
    console.log('   Path:', migrationPath);

    // Execute migration using RPC (requires a function in Supabase)
    // Since we can't execute raw SQL directly via JS client for DDL,
    // we'll need to run this through the SQL editor or use pg client

    console.log('\n⚠️  This migration needs to be run manually:\n');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the migration SQL below:');
    console.log('\n' + '='.repeat(70));
    console.log(migrationSQL);
    console.log('='.repeat(70) + '\n');

    console.log('   3. Click "Run" to execute the migration\n');

    // Verify if column already exists
    console.log('🔍 Checking if migration is needed...\n');

    const { data, error } = await supabase
      .from('booking_payments')
      .select('id, payment_reference')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('✅ Migration is needed - payment_reference column does not exist yet\n');
      } else {
        console.log('❌ Error checking table:', error.message, '\n');
      }
    } else {
      console.log('✅ Migration may have already been applied - payment_reference column exists\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

runMigration();
