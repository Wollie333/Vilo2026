/**
 * Check if storage policies for refund-documents bucket have been applied
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

async function checkStoragePolicies() {
  console.log('🔍 Checking storage setup for refund-documents...\n');

  // Check if bucket exists
  console.log('1️⃣  Checking if refund-documents bucket exists...');
  const { data: buckets, error: bucketError } = await supabase
    .storage
    .listBuckets();

  if (bucketError) {
    console.log('❌ Error listing buckets:', bucketError.message);
    return;
  }

  const refundBucket = buckets.find(b => b.name === 'refund-documents');

  if (!refundBucket) {
    console.log('❌ Bucket "refund-documents" DOES NOT EXIST\n');
    console.log('⚠️  Storage setup incomplete\n');
    console.log('📌 Next steps:');
    console.log('   1. Create bucket in Supabase Dashboard:');
    console.log('      - Name: refund-documents');
    console.log('      - Public: false');
    console.log('      - File size limit: 10MB');
    console.log('      - Allowed types: PDF, PNG, JPG\n');
    console.log('   2. Then run migration 047 in SQL Editor');
    console.log('      File: backend/migrations/047_apply_storage_policies.sql\n');
    return;
  }

  console.log('✅ Bucket "refund-documents" EXISTS');
  console.log('   - Public:', refundBucket.public);
  console.log('   - Created:', new Date(refundBucket.created_at).toLocaleString());

  // Try to test upload/download permissions (will fail if policies not set)
  console.log('\n2️⃣  Testing bucket accessibility...');
  const testPath = `test-${Date.now()}.txt`;
  const { error: uploadError } = await supabase
    .storage
    .from('refund-documents')
    .upload(testPath, new Blob(['test']), {
      contentType: 'text/plain',
      upsert: false
    });

  if (uploadError) {
    if (uploadError.message && uploadError.message.includes('row-level security')) {
      console.log('⚠️  RLS policies not yet configured (expected for security)');
      console.log('   This means migration 047 needs to be applied\n');
      console.log('📌 Run migration 047:');
      console.log('   File: backend/migrations/047_apply_storage_policies.sql\n');
    } else if (uploadError.message && uploadError.message.includes('new row violates')) {
      console.log('✅ RLS policies ARE CONFIGURED (upload blocked as expected)');
      console.log('   Storage security is properly set up!\n');
    } else {
      console.log('⚠️  Unexpected error:', uploadError.message);
    }
  } else {
    // Clean up test file
    await supabase.storage.from('refund-documents').remove([testPath]);
    console.log('⚠️  Upload succeeded (RLS may not be configured)');
    console.log('   Consider applying migration 047 for security\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY\n');
  console.log('✅ Bucket exists:', refundBucket ? 'Yes' : 'No');
  console.log('📌 Next: Apply migration 047 for RLS policies\n');
}

checkStoragePolicies().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
