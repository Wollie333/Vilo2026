#!/usr/bin/env node

/**
 * Apply migration 076: Add show_video to properties
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying migration 076: Add show_video to properties...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'backend', 'migrations', '076_add_show_video_to_properties.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('\nVerifying column...');

    // Verify the column was created
    const { data: columns, error: verifyError } = await supabase
      .from('properties')
      .select('show_video')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      process.exit(1);
    }

    console.log('✅ Column verified successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Added show_video BOOLEAN column to properties table');
    console.log('  - Default value: true');
    console.log('  - All existing properties will have show_video = true');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
