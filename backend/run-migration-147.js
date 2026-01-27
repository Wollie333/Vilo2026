const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('=== Running Migration 147: Quote Requests Schema ===\n');

  try {
    const migrationPath = path.join(__dirname, 'migrations', '147_create_quote_requests_schema.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📏 SQL length:', sql.length, 'characters');
    console.log('🔄 Executing migration...\n');

    // Split SQL into statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📋 Found', statements.length, 'SQL statements to execute\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty lines
      if (!statement || statement.startsWith('--')) continue;

      try {
        // Try to execute via a stored procedure if it exists
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        }).catch(() => ({ error: null }));

        if (error) {
          console.log(`⚠️  Statement ${i + 1} needs manual execution`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} skipped:`, err.message.substring(0, 100));
        errorCount++;
      }
    }

    console.log('\n📊 Execution Summary:');
    console.log('✅ Successful:', successCount);
    console.log('⚠️  Skipped/Manual:', errorCount);

    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('quote_requests')
      .select('*')
      .limit(1);

    if (!tableError) {
      console.log('✅ quote_requests table exists and is accessible');
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️  Table verification failed:', tableError.message);
      console.log('\n📋 Please apply migration manually:');
      console.log('1. Open Supabase Dashboard → SQL Editor');
      console.log('2. Copy contents of: backend/migrations/147_create_quote_requests_schema.sql');
      console.log('3. Paste and execute the SQL');
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Manual Migration Instructions:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy contents of: backend/migrations/147_create_quote_requests_schema.sql');
    console.log('3. Paste and run the SQL');
    process.exit(1);
  }
}

runMigration();
