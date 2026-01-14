/**
 * Apply migration 057: Add property-level payment rules support
 * Direct SQL execution via pg library
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Parse Supabase connection string
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL or SUPABASE_DB_URL in backend/.env');
  process.exit(1);
}

async function applyMigration() {
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

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

    await pool.query(migrationSQL);

    console.log('\n✅ Migration 057 applied successfully!');
    console.log('\n📊 Verifying schema changes...');

    // Verify the property_id column was added
    const { rows: columns } = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'room_payment_rules'
        AND column_name IN ('property_id', 'room_id')
      ORDER BY column_name;
    `);

    console.log('\nColumn verification:');
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '✓ nullable' : '✗ not null';
      console.log(`   - ${col.column_name}: ${col.data_type} (${nullable})`);
    });

    // Verify the constraint was added
    const { rows: constraints } = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'public.room_payment_rules'::regclass
        AND conname = 'room_or_property_required';
    `);

    if (constraints.length > 0) {
      console.log('\n✓ Check constraint added:');
      console.log(`   ${constraints[0].conname}`);
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
  } finally {
    await pool.end();
  }
}

// Run the migration
applyMigration();
