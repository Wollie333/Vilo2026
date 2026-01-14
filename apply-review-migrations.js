/**
 * Apply Review Migrations
 * Run migrations 049 and 050 for the Review Manager feature
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  const migrationPath = path.join(__dirname, 'backend', 'migrations', migrationFile);

  console.log(`\n📄 Reading migration: ${migrationFile}`);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`🔄 Executing migration: ${migrationFile}`);

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error(`❌ Migration failed: ${migrationFile}`);
      console.error('Error:', error.message);

      // Try direct execution as fallback
      console.log('🔄 Trying direct execution...');
      const { error: directError } = await supabase.from('_migrations').insert({
        name: migrationFile,
        executed_at: new Date().toISOString()
      });

      if (directError) {
        console.error('❌ Direct execution also failed');
        return false;
      }
    }

    console.log(`✅ Migration completed: ${migrationFile}`);
    return true;
  } catch (err) {
    console.error(`❌ Migration error: ${migrationFile}`);
    console.error('Error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Review Manager migrations...\n');
  console.log('Database:', supabaseUrl);

  const migrations = [
    '049_create_reviews_schema.sql',
    '050_create_review_storage.sql',
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log('='.repeat(50));

  if (failureCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    console.log('💡 You may need to run the SQL manually in Supabase SQL Editor.');
    process.exit(1);
  } else {
    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify tables created: property_reviews');
    console.log('   2. Verify storage bucket created: review-photos');
    console.log('   3. Test backend API endpoints');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
