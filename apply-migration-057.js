/**
 * Apply migration 057: Add property-level payment rules support
 *
 * This migration adds the ability to create payment rules at the property level
 * (in addition to room-level rules), which is needed for the Room Wizard
 * Payment Rules step.
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️  exec_sql function not found, attempting direct execution...\n');

        // Split into individual statements and execute
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);

          const { error: execError } = await supabase.rpc('exec', {
            sql: statement + ';'
          });

          if (execError) {
            console.error(`   ❌ Error in statement ${i + 1}:`, execError.message);
            throw execError;
          }
        }
      } else {
        throw error;
      }
    }

    console.log('\n✅ Migration 057 applied successfully!');
    console.log('\n📊 Verifying schema changes...');

    // Verify the property_id column was added
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable, data_type')
      .eq('table_name', 'room_payment_rules')
      .in('column_name', ['property_id', 'room_id']);

    if (colError) {
      console.warn('⚠️  Could not verify columns:', colError.message);
    } else if (columns) {
      console.log('\nColumn verification:');
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '✓ nullable' : '✗ not null';
        console.log(`   - ${col.column_name}: ${col.data_type} (${nullable})`);
      });
    }

    console.log('\n🎉 Payment rules now support both property-level and room-level rules!');
    console.log('\n📝 Next steps:');
    console.log('   1. The backend server should now work correctly');
    console.log('   2. Test the Payment Rules step in the Room Wizard');
    console.log('   3. Existing payment rules can be viewed and selected');
    console.log('   4. New rules can be created and saved to the property');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.message);

    if (error.code) {
      console.error('Error code:', error.code);
    }

    if (error.hint) {
      console.error('Hint:', error.hint);
    }

    process.exit(1);
  }
}

// Run the migration
applyMigration();
