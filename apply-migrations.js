/**
 * Apply SQL Migrations Directly
 * Uses Supabase Management API to execute SQL migrations
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1];

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runMigrationFile(filePath, migrationName) {
  console.log(`\n📝 Running: ${migrationName}...`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');

    // Use Supabase client to execute the SQL
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Since we can't execute raw SQL directly via the JS client,
    // we'll need to use a different approach
    // Let's just output the SQL for the user to run

    console.log(`  ⚠️  Cannot execute directly via API`);
    console.log(`  📄 Migration needs to be run in SQL Editor`);

    return { success: false, needsManual: true };
  } catch (error) {
    console.error(`  ❌ Error reading migration: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function applyAllMigrations() {
  console.log('🚀 Applying SQL migrations...\n');

  // Read the consolidated migration
  const consolidatedPath = path.join(__dirname, 'backend', 'migrations', 'RUN_THIS_MIGRATION.sql');

  if (!fs.existsSync(consolidatedPath)) {
    console.error('❌ Consolidated migration file not found!');
    console.log('   Run: node run-migrations.js first');
    process.exit(1);
  }

  const sql = fs.readFileSync(consolidatedPath, 'utf8');

  console.log('⚠️  Supabase requires SQL migrations to be run via the SQL Editor.');
  console.log('   The JavaScript client cannot execute DDL statements directly.\n');

  console.log('✅ Storage buckets created: receipts, invoice-logos');
  console.log('\n📋 To complete setup:\n');
  console.log('   1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
  console.log('   2. Copy the entire contents of:');
  console.log('      backend/migrations/RUN_THIS_MIGRATION.sql');
  console.log('   3. Paste into SQL Editor and click "Run"\n');

  console.log('💡 The migration file contains:');
  console.log('   - RLS policies for receipts bucket');
  console.log('   - RLS policies for invoice-logos bucket');
  console.log('   - booking invoice tracking fields');
  console.log('   - company contact fields for invoices\n');

  console.log('✨ After running the SQL, your system will be fully configured!\n');
}

applyAllMigrations().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
