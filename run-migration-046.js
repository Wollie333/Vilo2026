/**
 * Run Migration 046 - Refund Enhancements
 * Adds withdrawn status, fixes RLS policies, adds helper function
 */

const fs = require('fs');
const path = require('path');

console.log('📋 Migration 046: Refund Enhancements\n');

const migrationPath = path.join(__dirname, 'backend', 'migrations', '046_refund_enhancements.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('✅ Migration 046 SQL loaded successfully\n');
console.log('📝 This migration contains:');
console.log('   1. ALTER TYPE to add "withdrawn" status to refund_status enum');
console.log('   2. DROP and CREATE POLICY statements to fix RLS security');
console.log('   3. INSERT notification template for refund_withdrawn event (FIXED SCHEMA)');
console.log('   4. CREATE FUNCTION has_active_refunds() helper\n');
console.log('✅ Migration has been fixed to use correct notification_templates schema\n');

console.log('⚠️  IMPORTANT: This migration must be run in Supabase SQL Editor\n');
console.log('📌 Instructions:');
console.log('   1. Go to your Supabase project dashboard');
console.log('   2. Navigate to SQL Editor');
console.log('   3. Create a new query');
console.log('   4. Copy the SQL from: backend/migrations/046_refund_enhancements.sql');
console.log('   5. Paste and run the SQL\n');

console.log('🔗 Quick link to SQL Editor:');
console.log('   https://supabase.com/dashboard/project/_/sql/new\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('SQL CONTENT TO COPY:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(sql);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✅ After running in Supabase SQL Editor, you can verify with:');
console.log('   SELECT enumlabel FROM pg_enum WHERE enumtypid = \'refund_status\'::regtype;\n');
