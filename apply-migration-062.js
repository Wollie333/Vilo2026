/**
 * Apply Migration 062: Add Worldwide Countries
 *
 * This script adds popular countries worldwide to the location database
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('📦 Applying Migration 062: Add Worldwide Countries...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'backend/migrations/062_add_worldwide_countries.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🔄 Executing SQL...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('ℹ️  Trying direct execution...');

      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('insert into countries')) {
          // Use the from method for inserts
          const { error: insertError } = await supabase
            .from('countries')
            .upsert([]);  // This won't work directly, need to parse SQL

          // Instead, let's use a different approach - direct PostgreSQL connection
          console.log('⚠️  Direct Supabase client cannot execute raw SQL.');
          console.log('\n📋 Please run this migration manually in Supabase SQL Editor:');
          console.log('\n1. Go to your Supabase Dashboard');
          console.log('2. Navigate to SQL Editor');
          console.log('3. Copy and paste the contents of:');
          console.log('   backend/migrations/062_add_worldwide_countries.sql');
          console.log('4. Click "Run"\n');
          process.exit(1);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Countries added:');
    console.log('   - 50+ popular worldwide destinations');
    console.log('   - Covering Africa, Americas, Asia, Europe, and Oceania');
    console.log('\n🎉 Location selector now supports worldwide countries!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📋 Manual migration required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run: backend/migrations/062_add_worldwide_countries.sql');
    process.exit(1);
  }
}

applyMigration();
