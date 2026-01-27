/**
 * Apply migration 146: Fix customers_new references in functions
 *
 * NOTE: This migration must be applied directly to the database via Supabase SQL Editor
 * or psql, as it creates functions and triggers.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function displayInstructions() {
  try {
    console.log('📄 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', '146_fix_customer_function_references.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migration file loaded (${sql.length} characters)`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋  MIGRATION 146: Fix customers_new References');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('This migration needs to be applied manually via Supabase SQL Editor.');
    console.log('');
    console.log('🔧 STEPS TO APPLY:');
    console.log('');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Click "New query"');
    console.log('4. Copy the contents of: backend/migrations/146_fix_customer_function_references.sql');
    console.log('5. Paste into the SQL Editor');
    console.log('6. Click "Run" button');
    console.log('');
    console.log('OR via Command Line (if you have psql installed):');
    console.log('');
    console.log('  psql $DATABASE_URL < backend/migrations/146_fix_customer_function_references.sql');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 What this migration fixes:');
    console.log('');
    console.log('  Problem: Database functions created by migration 138 still reference');
    console.log('           "customers_new" table name, but the table was renamed to');
    console.log('           "customers", causing booking creation to fail.');
    console.log('');
    console.log('  Solution: Recreates all customer-related functions to use "customers"');
    console.log('           table name instead of "customers_new".');
    console.log('');
    console.log('  Functions fixed:');
    console.log('    • auto_create_customer_from_booking_property_scoped()');
    console.log('    • update_customer_booking_stats_property_scoped()');
    console.log('    • sync_customer_user_id_property_scoped()');
    console.log('');
    console.log('🎯 After applying this migration, guest booking checkout will work!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    process.exit(1);
  }
}

displayInstructions();
