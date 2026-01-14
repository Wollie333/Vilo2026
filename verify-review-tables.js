/**
 * Verify Review Tables
 * Check if review migrations were applied successfully
 */

const { createClient } = require('@supabase/supabase-js');

// Read from backend .env file
const envPath = require('path').join(__dirname, 'backend', '.env');
const fs = require('fs');

let supabaseUrl, supabaseServiceKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  });

  supabaseUrl = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
  supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTables() {
  console.log('🔍 Verifying Review Manager tables...\n');

  try {
    // Check property_reviews table
    console.log('1️⃣ Checking property_reviews table...');
    const { data: reviews, error: reviewError } = await supabase
      .from('property_reviews')
      .select('*')
      .limit(1);

    if (reviewError) {
      console.log('   ❌ Table not found or error:', reviewError.message);
      console.log('   💡 Run migration 049_create_reviews_schema.sql');
    } else {
      console.log('   ✅ property_reviews table exists');
    }

    // Check bookings.review_sent_at column
    console.log('\n2️⃣ Checking bookings.review_sent_at column...');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('review_sent_at')
      .limit(1);

    if (bookingError) {
      console.log('   ❌ Column not found:', bookingError.message);
      console.log('   💡 Run migration 049_create_reviews_schema.sql');
    } else {
      console.log('   ✅ review_sent_at column exists on bookings table');
    }

    // Check storage bucket
    console.log('\n3️⃣ Checking review-photos storage bucket...');
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    if (bucketError) {
      console.log('   ❌ Error checking buckets:', bucketError.message);
    } else {
      const reviewBucket = buckets.find(b => b.id === 'review-photos');
      if (reviewBucket) {
        console.log('   ✅ review-photos bucket exists');
        console.log('   📦 Public:', reviewBucket.public);
      } else {
        console.log('   ❌ review-photos bucket not found');
        console.log('   💡 Run migration 050_create_review_storage.sql');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Verification complete!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Verification error:', error.message);
  }
}

verifyTables();
