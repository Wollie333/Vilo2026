/**
 * Simple check if Migration 046 has been applied
 */
const path = require('path');
const fs = require('fs');

// Load .env file manually
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigration() {
  console.log('🔍 Checking Migration 046 status...\n');

  // Check: notification template
  console.log('Checking if refund_withdrawn notification template exists...');
  const { data: template, error: templateError } = await supabase
    .from('notification_templates')
    .select('name, title_template, is_active')
    .eq('name', 'refund_withdrawn')
    .maybeSingle();

  if (templateError) {
    console.log('❌ Error:', templateError.message);
    console.log('\n⚠️  Migration 046 NOT YET APPLIED\n');
    console.log('Please run: backend/migrations/046_refund_enhancements.sql');
    console.log('in your Supabase SQL Editor\n');
    return;
  }

  if (!template) {
    console.log('❌ Template NOT FOUND\n');
    console.log('⚠️  Migration 046 NOT YET APPLIED\n');
    console.log('Please run: backend/migrations/046_refund_enhancements.sql');
    console.log('in your Supabase SQL Editor\n');
    return;
  }

  console.log('✅ Template EXISTS:', template.title_template);
  console.log('✅ Status: Active =', template.is_active);
  console.log('\n✅ Migration 046 appears to be APPLIED!\n');
}

checkMigration().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
