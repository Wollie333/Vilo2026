/**
 * Apply migration 057: Add property-level payment rules support
 * Constructs database URL from Supabase project
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databasePassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL in backend/.env');
  process.exit(1);
}

// Extract project reference from Supabase URL
// Example: https://bzmyilqkrtpxhswtpdtc.supabase.co -> bzmyilqkrtpxhswtpdtc
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Construct database connection URL
// Supabase pattern: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
const connectionString = process.env.DATABASE_URL ||
  (databasePassword
    ? `postgresql://postgres:${databasePassword}@db.${projectRef}.supabase.co:5432/postgres`
    : null);

if (!connectionString) {
  console.error('❌ Cannot construct database connection URL');
  console.error('Please add one of the following to backend/.env:');
  console.error('  - DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres');
  console.error('  - SUPABASE_DB_PASSWORD=[your-db-password]');
  console.error('\nOr run the migration manually in Supabase SQL Editor.');
  console.error('See RUN_MIGRATION_057_IN_SUPABASE.md for instructions.');
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

    console.log('🔌 Connecting to database...');
    console.log(`   Project: ${projectRef}\n`);

    console.log('🚀 Applying migration 057...');
    console.log('   - Adding property_id column to room_payment_rules');
    console.log('   - Making room_id nullable');
    console.log('   - Adding check constraint (room_id OR property_id required)');
    console.log('   - Creating indexes for property-level rules');
    console.log('   - Updating RLS policies to support both levels\n');

    await pool.query(migrationSQL);

    console.log('✅ Migration 057 applied successfully!\n');
    console.log('📊 Verifying schema changes...');

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

    // Verify indexes were created
    const { rows: indexes } = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'room_payment_rules'
        AND indexname IN ('idx_room_payment_rules_property_id', 'idx_room_payment_rules_property_active')
      ORDER BY indexname;
    `);

    if (indexes.length > 0) {
      console.log('\n✓ Indexes created:');
      indexes.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    }

    console.log('\n🎉 Payment rules now support both property-level and room-level rules!');
    console.log('\n📝 Next steps:');
    console.log('   1. The Payment Rules API should now work correctly');
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

    if (error.position) {
      console.error('Position:', error.position);
    }

    console.log('\n📝 Alternative: Run migration manually');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy SQL from: backend/migrations/057_add_property_level_payment_rules.sql');
    console.log('   3. Paste and execute in SQL Editor');
    console.log('   See RUN_MIGRATION_057_IN_SUPABASE.md for detailed instructions');

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyMigration();
