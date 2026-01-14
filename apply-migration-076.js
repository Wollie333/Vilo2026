/**
 * Apply Migration 076: Fix trigger table reference
 * Uses fully qualified table name for user_types
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Starting migration 076: Fix trigger table reference\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'backend', 'migrations', '076_fix_trigger_table_reference.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🔧 Applying migration...\n');

    // Execute the migration using raw SQL
    const { data, error } = await supabase.rpc('exec', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration 076 completed successfully!');
    console.log('\n📋 What was fixed:');
    console.log('   • Updated handle_new_user() to use public.user_types (fully qualified)');
    console.log('   • Trigger can now correctly lookup guest user type');
    console.log('\n🎉 Try guest registration again!');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

applyMigration();
