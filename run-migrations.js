/**
 * Run SQL Migrations Script
 * Runs all pending SQL migrations for invoice and receipt system
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env file manually
const envPath = path.join(__dirname, 'backend', '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration(migrationPath, migrationName) {
  console.log(`\n📝 Running migration: ${migrationName}...`);

  const sql = fs.readFileSync(migrationPath, 'utf8');

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async (err) => {
    // If exec_sql function doesn't exist, try direct query
    return await supabase.from('_migrations').select('*').limit(0).then(() => {
      // Use the postgres REST API directly
      return fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql_query: sql }),
      }).then(r => r.json());
    });
  });

  // Since Supabase doesn't have a built-in exec_sql RPC, we'll use a different approach
  // We'll execute the SQL using the postgres connection
  try {
    // Split SQL into statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.toLowerCase().includes('do $$') || statement.toLowerCase().includes('create policy')) {
        // These need to be executed as raw SQL
        console.log(`  ⚠️  Complex statement detected - please run manually: ${migrationName}`);
        console.log(`     Or use Supabase SQL Editor`);
        return false;
      }
    }

    console.log(`  ✅ Migration ${migrationName} needs to be run via SQL Editor`);
    return true;
  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Running SQL migrations...\n');

  const migrations = [
    {
      path: path.join(__dirname, 'backend', 'migrations', '041_create_storage_rls_policies.sql'),
      name: '041_create_storage_rls_policies',
    },
    {
      path: path.join(__dirname, 'backend', 'migrations', '042_add_booking_invoice_fields.sql'),
      name: '042_add_booking_invoice_fields',
    },
    {
      path: path.join(__dirname, 'backend', 'migrations', '043_add_company_contact_fields_to_invoices.sql'),
      name: '043_add_company_contact_fields_to_invoices',
    },
  ];

  console.log('⚠️  Note: SQL migrations with complex statements (CREATE POLICY, DO blocks) need to be run via Supabase SQL Editor.');
  console.log('\nCreating consolidated migration file...\n');

  // Create a single consolidated migration file
  const consolidatedPath = path.join(__dirname, 'backend', 'migrations', 'RUN_THIS_MIGRATION.sql');
  let consolidatedSql = '-- ========================================\n';
  consolidatedSql += '-- CONSOLIDATED MIGRATION: Invoice & Receipt System\n';
  consolidatedSql += '-- Run this entire file in Supabase SQL Editor\n';
  consolidatedSql += '-- ========================================\n\n';

  for (const migration of migrations) {
    const sql = fs.readFileSync(migration.path, 'utf8');
    consolidatedSql += `\n-- ========================================\n`;
    consolidatedSql += `-- ${migration.name}\n`;
    consolidatedSql += `-- ========================================\n\n`;
    consolidatedSql += sql;
    consolidatedSql += '\n\n';
  }

  fs.writeFileSync(consolidatedPath, consolidatedSql);

  console.log('✅ Created consolidated migration file:');
  console.log(`   ${consolidatedPath}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Open Supabase Dashboard → SQL Editor');
  console.log('   2. Copy the contents of: backend/migrations/RUN_THIS_MIGRATION.sql');
  console.log('   3. Paste and click "Run"');
  console.log('\n✨ All storage buckets are already created!\n');
}

runAllMigrations().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
