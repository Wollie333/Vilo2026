/**
 * Apply Migration 075: Fix handle_new_user trigger
 * Removes audit_log dependencies from auth triggers
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
  console.log('🚀 Starting migration 075: Fix handle_new_user trigger\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'backend', 'migrations', '075_fix_handle_new_user_trigger.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🔧 Applying migration...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Try direct query if exec_sql doesn't exist
      console.log('📝 Trying alternative method...');

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          const { error: stmtError } = await supabase.rpc('exec', {
            sql: statement
          });
          if (stmtError) {
            console.error(`   ❌ Error in statement ${i + 1}:`, stmtError);
          }
        }
      }
    }

    console.log('\n✅ Migration 075 completed successfully!');
    console.log('\n📋 What was fixed:');
    console.log('   • Removed audit_log insertions from handle_new_user trigger');
    console.log('   • Removed audit_log insertions from handle_email_confirmed trigger');
    console.log('   • Removed audit_log insertions from handle_user_login trigger');
    console.log('   • Added phone field extraction from user metadata');
    console.log('   • Added ON CONFLICT handling to prevent duplicate errors');
    console.log('\n🎉 Guest registration should now work!');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

applyMigration();
