/**
 * Create Storage Buckets Script
 * Run this script to create the required storage buckets for receipts and invoice logos
 *
 * Usage: node create-storage-buckets.js
 *
 * Make sure your .env file has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
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

async function createStorageBuckets() {
  console.log('🚀 Creating storage buckets...\n');

  // Create receipts bucket
  console.log('📄 Creating "receipts" bucket...');
  const { data: receiptsData, error: receiptsError } = await supabase.storage.createBucket('receipts', {
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf'],
  });

  if (receiptsError) {
    if (receiptsError.message.includes('already exists')) {
      console.log('✅ Receipts bucket already exists');
    } else {
      console.error('❌ Error creating receipts bucket:', receiptsError.message);
    }
  } else {
    console.log('✅ Receipts bucket created successfully');
  }

  // Create invoice-logos bucket
  console.log('\n🖼️  Creating "invoice-logos" bucket...');
  const { data: logosData, error: logosError } = await supabase.storage.createBucket('invoice-logos', {
    public: true,
    fileSizeLimit: 2097152, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  });

  if (logosError) {
    if (logosError.message.includes('already exists')) {
      console.log('✅ Invoice-logos bucket already exists');
    } else {
      console.error('❌ Error creating invoice-logos bucket:', logosError.message);
    }
  } else {
    console.log('✅ Invoice-logos bucket created successfully');
  }

  console.log('\n✨ Done! Now run migration 041_create_storage_rls_policies.sql in Supabase SQL Editor');
}

createStorageBuckets().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
