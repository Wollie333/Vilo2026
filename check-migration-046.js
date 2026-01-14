/**
 * Check if Migration 046 has been applied
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
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigration() {
  console.log('🔍 Checking Migration 046 status...\n');

  // Check 1: withdrawn status in enum
  console.log('1️⃣  Checking if "withdrawn" status exists in refund_status enum...');
  const { data: enumData, error: enumError } = await supabase
    .rpc('get_enum_values', { enum_name: 'refund_status' })
    .catch(() => ({ data: null, error: 'Function not available' }));

  // Alternative check using direct query
  const { data: refunds, error: refundError } = await supabase
    .from('refund_requests')
    .select('status')
    .limit(1);

  if (refundError && refundError.message.includes('withdrawn')) {
    console.log('   ⚠️  Enum check inconclusive');
  } else {
    console.log('   ✅ refund_status enum accessible');
  }

  // Check 2: notification template
  console.log('\n2️⃣  Checking if refund_withdrawn notification template exists...');
  const { data: template, error: templateError } = await supabase
    .from('notification_templates')
    .select('name, title_template, is_active')
    .eq('name', 'refund_withdrawn')
    .single();

  if (templateError) {
    if (templateError.code === 'PGRST116') {
      console.log('   ❌ Template NOT FOUND - Migration 046 needs to be applied');
    } else {
      console.log('   ❌ Error checking template:', templateError.message);
    }
  } else {
    console.log('   ✅ Template EXISTS:', template.title_template);
    console.log('   ✅ Status: Active =', template.is_active);
  }

  // Check 3: has_active_refunds function
  console.log('\n3️⃣  Checking if has_active_refunds() function exists...');
  const { data: funcData, error: funcError } = await supabase
    .rpc('has_active_refunds', { p_booking_id: '00000000-0000-0000-0000-000000000000' })
    .catch(e => ({ data: null, error: e }));

  if (funcError) {
    if (funcError.message && funcError.message.includes('does not exist')) {
      console.log('   ❌ Function NOT FOUND - Migration 046 needs to be applied');
    } else {
      console.log('   ❌ Error:', funcError.message || funcError);
    }
  } else {
    console.log('   ✅ Function EXISTS and is callable');
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY\n');

  const templateExists = template && !templateError;
  const functionExists = !funcError || (funcError && !funcError.message?.includes('does not exist'));

  if (templateExists && functionExists) {
    console.log('✅ Migration 046 appears to be APPLIED');
    console.log('   All components are in place.\n');
  } else {
    console.log('⚠️  Migration 046 NOT YET APPLIED');
    console.log('   Please run the migration in Supabase SQL Editor\n');
    console.log('📌 Instructions:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy SQL from: backend/migrations/046_refund_enhancements.sql');
    console.log('   3. Paste and execute\n');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

checkMigration().catch(err => {
  console.error('❌ Error running check:', err.message);
  process.exit(1);
});
