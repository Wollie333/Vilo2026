/**
 * Apply Wishlist Migration
 * Creates the user_wishlists table if it doesn't exist
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

async function checkAndApplyMigration() {
  console.log('🔍 Checking if user_wishlists table exists...\n');

  try {
    // Check if table exists
    const { data: tables, error: checkError } = await supabase
      .from('user_wishlists')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ user_wishlists table already exists!');
      console.log('📊 Testing table access...');

      // Test table structure
      const { data: testData, error: testError } = await supabase
        .from('user_wishlists')
        .select('*')
        .limit(1);

      if (testError) {
        console.log('⚠️  Table exists but might have permission issues:', testError.message);
      } else {
        console.log('✅ Table is accessible and working correctly!');
      }

      return;
    }

    console.log('📋 Table does not exist. Applying migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'backend/migrations/054_create_wishlist_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🔄 Creating user_wishlists table...\n');

    // Split SQL into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.log('\n⚠️  Direct SQL execution not available. Please run manually:\n');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of:');
        console.log('   backend/migrations/054_create_wishlist_schema.sql');
        console.log('4. Click "Run"\n');
        process.exit(1);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 Verifying table creation...');

    // Verify table was created
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_wishlists')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.log('⚠️  Table might not be created properly:', verifyError.message);
    } else {
      console.log('✅ user_wishlists table verified and working!');
    }

    console.log('\n🎉 Wishlist functionality is now available!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Manual migration required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run: backend/migrations/054_create_wishlist_schema.sql');
    process.exit(1);
  }
}

checkAndApplyMigration();
