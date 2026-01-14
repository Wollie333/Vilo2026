/**
 * Apply migration 057: Add property-level payment rules support
 * Using Supabase client to execute raw SQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

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
    persistSession: false
  }
});

async function executeSqlStatement(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
  return data;
}

async function applyMigration() {
  try {
    console.log('📋 Reading migration file...');
    const migrationPath = path.join(__dirname, 'backend', 'migrations', '057_add_property_level_payment_rules.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying migration 057...');
    console.log('   - Adding property_id column to room_payment_rules');
    console.log('   - Making room_id nullable');
    console.log('   - Adding check constraint (room_id OR property_id required)');
    console.log('   - Creating indexes for property-level rules');
    console.log('   - Updating RLS policies to support both levels\n');

    // Split SQL into individual statements and execute them one by one
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');

    console.log(`   Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (!statement || statement.startsWith('--')) continue;

      console.log(`   [${i + 1}/${statements.length}] Executing...`);

      try {
        // Execute via Supabase's query function for raw SQL
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });

        if (error) {
          // If exec doesn't exist, try direct query
          if (error.code === 'PGRST202' || error.message.includes('exec')) {
            console.log('   ⚠️  RPC function not available, using alternative method...');

            // For ALTER TABLE and CREATE INDEX, we can execute directly
            const { error: directError } = await supabase.from('_').select('*').limit(0);

            // Try using postgres://
            console.log('   ℹ️  Please run this migration manually in Supabase SQL Editor');
            console.log('   See RUN_MIGRATION_057_IN_SUPABASE.md for instructions\n');

            throw new Error('Supabase RPC function not available. Please run migration manually.');
          }
          throw error;
        }

        console.log(`   ✓ Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.error(`   ✗ Failed at statement ${i + 1}:`, err.message);
        throw err;
      }
    }

    console.log('\n✅ Migration 057 applied successfully!');
    console.log('\n📊 Verifying schema changes...');

    // Verify the property_id column was added using a simple query
    const { data: testData, error: testError } = await supabase
      .from('room_payment_rules')
      .select('id, property_id, room_id')
      .limit(1);

    if (testError && !testError.message.includes('no rows')) {
      console.warn('⚠️  Could not verify schema:', testError.message);
    } else {
      console.log('✓ Schema verification passed - property_id column is accessible');
    }

    console.log('\n🎉 Payment rules now support both property-level and room-level rules!');
    console.log('\n📝 Next steps:');
    console.log('   1. The backend server should now work correctly');
    console.log('   2. Test the Payment Rules step in the Room Wizard');
    console.log('   3. Existing payment rules can be viewed and selected');
    console.log('   4. New rules can be created and saved to the property');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);

    if (error.code) {
      console.error('Error code:', error.code);
    }

    if (error.hint) {
      console.error('Hint:', error.hint);
    }

    console.log('\n📝 Alternative: Run migration manually');
    console.log('   1. Open Supabase SQL Editor');
    console.log('   2. Copy SQL from: backend/migrations/057_add_property_level_payment_rules.sql');
    console.log('   3. Paste and execute in SQL Editor');
    console.log('   See RUN_MIGRATION_057_IN_SUPABASE.md for detailed instructions');

    process.exit(1);
  }
}

// Run the migration
applyMigration();
