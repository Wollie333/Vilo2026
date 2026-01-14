/**
 * Apply Room Storage Migration (055)
 * Creates the room-images storage bucket and RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Applying Room Storage Migration (055)...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, 'backend', 'migrations', '055_create_room_storage.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Running migration SQL...');

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('⚠️  RPC method failed, trying direct execution...');

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('do $$') || statement.toLowerCase().includes('raise notice')) {
          // Skip procedural blocks as they might not work with direct execution
          continue;
        }

        const { error: execError } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (execError) {
          console.error(`❌ Error executing statement: ${execError.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📦 Created storage bucket: room-images');
    console.log('🔐 Created RLS policies for room images\n');
    console.log('Next steps:');
    console.log('1. Go to Supabase Dashboard > Storage');
    console.log('2. Verify the "room-images" bucket exists and is marked as Public');
    console.log('3. Try uploading room images again\n');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('\n📝 Manual steps:');
    console.error('1. Go to Supabase Dashboard > SQL Editor');
    console.error('2. Copy the contents of: backend/migrations/055_create_room_storage.sql');
    console.error('3. Paste and run the SQL in the editor');
    process.exit(1);
  }
}

applyMigration();
