require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔧 Applying migration 046: Fix availability checking...\n');

  try {
    const sqlPath = path.join(__dirname, 'backend', 'migrations', '046_fix_availability_checking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query if RPC doesn't work
      console.log('RPC failed, trying direct query...');
      const { error: directError } = await supabase.from('_migrations').select('*').limit(1);

      if (directError) {
        throw new Error(`Database connection failed: ${directError.message}`);
      }

      // Execute SQL directly using the PostgreSQL connection
      const { Configuration } = await import('./backend/src/config/supabase.js');
      const pg = require('pg');

      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

      await pool.query(sql);
      await pool.end();

      console.log('✅ Migration applied successfully via direct connection!');
    } else {
      console.log('✅ Migration applied successfully!');
    }

    console.log('\n📋 What was fixed:');
    console.log('- Fixed check_room_availability function to correctly count bookings');
    console.log('- Single unit rooms now count ANY booking (not just distinct unit numbers)');
    console.log('- Multiple unit rooms still count distinct unit numbers');
    console.log('\n✅ Room availability checking should now work correctly!');
    console.log('   Unavailable rooms will be blocked from booking.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nYou can apply this migration manually in Supabase SQL Editor:');
    console.error('1. Go to Supabase Dashboard → SQL Editor');
    console.error('2. Copy the contents of: backend/migrations/046_fix_availability_checking.sql');
    console.error('3. Paste and run the SQL');
    process.exit(1);
  }
}

applyMigration();
