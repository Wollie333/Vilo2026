/**
 * Apply migration 058 - Add public property access policy
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📦 Applying migration 058: Add public property access policy\n');

  const migrationPath = path.join(__dirname, 'backend', 'migrations', '058_add_public_property_access_policy.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executing SQL...\n');

  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  console.log('✅ Migration 058 applied successfully!');
  console.log('\nYou can now access public properties at:');
  console.log('http://localhost:5173/accommodation/vilo');
}

applyMigration();
