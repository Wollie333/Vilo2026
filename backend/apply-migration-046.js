require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in .env file');
  process.exit(1);
}

async function applyMigration() {
  console.log('🔧 Applying migration 046: Fix availability checking...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const sqlPath = path.join(__dirname, 'migrations', '046_fix_availability_checking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL...');
    await pool.query(sql);

    console.log('\n✅ Migration applied successfully!');
    console.log('\n📋 What was fixed:');
    console.log('   • Fixed check_room_availability function');
    console.log('   • Single unit rooms: Now correctly counts ALL bookings');
    console.log('   • Multiple unit rooms: Counts distinct unit numbers');
    console.log('\n✅ Room availability checking is now working!');
    console.log('   Rooms with existing bookings will be marked as unavailable.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📝 Manual application instructions:');
    console.error('1. Go to Supabase Dashboard → SQL Editor');
    console.error('2. Copy contents of: backend/migrations/046_fix_availability_checking.sql');
    console.error('3. Paste and run the SQL\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
