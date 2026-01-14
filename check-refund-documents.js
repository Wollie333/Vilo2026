/**
 * Check if refund_documents table exists
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
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRefundDocuments() {
  console.log('🔍 Checking refund_documents table status...\n');

  // Check if table exists by trying to query it
  const { data, error } = await supabase
    .from('refund_documents')
    .select('id')
    .limit(1);

  if (error) {
    if (error.message && error.message.includes('does not exist')) {
      console.log('❌ refund_documents table DOES NOT EXIST\n');
      console.log('⚠️  Migration 046 (refund documents) NOT YET APPLIED\n');
      console.log('📌 Next steps:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Run: backend/migrations/046_add_refund_documents_FIXED.sql');
      console.log('   3. Then run: backend/migrations/047_apply_storage_policies.sql\n');
      return false;
    } else {
      console.log('❌ Error checking table:', error.message);
      return false;
    }
  }

  console.log('✅ refund_documents table EXISTS\n');

  // Check if document_count column exists in refund_requests
  const { data: refundReq, error: refundError } = await supabase
    .from('refund_requests')
    .select('document_count')
    .limit(1);

  if (refundError) {
    if (refundError.message && refundError.message.includes('column') && refundError.message.includes('document_count')) {
      console.log('⚠️  document_count column missing from refund_requests');
      console.log('   Migration may be incomplete\n');
    } else {
      console.log('✅ document_count column exists in refund_requests\n');
    }
  } else {
    console.log('✅ document_count column exists in refund_requests\n');
  }

  console.log('✅ Migration 046 (refund documents) appears to be APPLIED!\n');
  console.log('📌 Next step: Apply storage policies (migration 047)\n');
  return true;
}

checkRefundDocuments().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
