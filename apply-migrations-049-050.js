/**
 * Apply Review Manager Migrations (049 & 050)
 * Applies migrations directly via Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read from backend .env file (same pattern as verify script)
const envPath = path.join(__dirname, 'backend', '.env');

let supabaseUrl, supabaseServiceKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^['"]+|['"]+$/g, '');
    }
  });

  supabaseUrl = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
  supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(migrationFile) {
  const migrationPath = path.join(__dirname, 'backend', 'migrations', migrationFile);

  console.log(`\n📄 Reading migration: ${migrationFile}`);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`🔄 Applying migration: ${migrationFile}`);
  console.log(`   SQL length: ${sql.length} characters`);

  try {
    // Split SQL into individual statements
    // We need to handle this carefully because Supabase client doesn't support multi-statement execution well
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .map(s => s + ';');

    console.log(`   Found ${statements.length} SQL statements`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (!statement || statement.trim().startsWith('--') || statement.trim().length < 5) {
        continue;
      }

      console.log(`   Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
        console.error(`   Statement preview: ${statement.substring(0, 100)}...`);

        // Some errors are acceptable (e.g., "already exists")
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Skipping (already exists)`);
          continue;
        }

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
  console.log('🚀 Applying Review Manager migrations...\n');
  console.log('Database:', supabaseUrl);
  console.log('\n' + '='.repeat(60) + '\n');

  const migrations = [
    '049_create_reviews_schema.sql',
    '050_create_review_storage.sql',
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) {
      successCount++;
    } else {
      failureCount++;
      console.log('\n⚠️  Migration failed. You can apply it manually in Supabase SQL Editor.');
      console.log(`\n📋 To apply manually:`);
      console.log(`   1. Go to Supabase Dashboard → SQL Editor`);
      console.log(`   2. Open: backend/migrations/${migration}`);
      console.log(`   3. Copy the entire SQL content`);
      console.log(`   4. Paste and run in SQL Editor\n`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log('='.repeat(60));

  if (failureCount > 0) {
    console.log('\n⚠️  Some migrations failed.');
    console.log('💡 Please apply them manually via Supabase SQL Editor.');
    process.exit(1);
  } else {
    console.log('\n🎉 All migrations applied successfully!');
    console.log('\n📋 Next: Run verification script');
    console.log('   node verify-review-tables.js');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
