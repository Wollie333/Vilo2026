import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqvzftqwbwslrqhktwzr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxdnpmdHF3YndzbHJxaGt0d3pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjQyMzQzOCwiZXhwIjoyMDUxOTk5NDM4fQ.itnN4rVIp_0NVQ9CZXoAzAmWn-KIo6TK_pEV6SgWjKs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function checkColumns() {
  console.log('Checking properties table columns...\n');

  try {
    // Try to select the new columns
    const { data, error } = await supabase
      .from('properties')
      .select('id, city_id, country_id, province_id, is_listed_publicly, listed_at, listing_priority')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing columns:', error.message);
      console.log('\n⚠️  Migration 053 needs to be run!');
      console.log('\n📝 Steps to fix:');
      console.log('1. Open your Supabase dashboard: https://supabase.com/dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy and paste the contents of: backend/migrations/053_add_property_listing_visibility.sql');
      console.log('4. Click "Run"');
      console.log('5. Try saving your form again');
    } else {
      console.log('✅ All columns exist in the database!');
      console.log('\n🔄 The issue is Supabase PostgREST schema cache.');
      console.log('\n📝 Quick fix:');
      console.log('1. Go to Supabase Dashboard → Settings → API');
      console.log('2. Scroll to "PostgREST Configuration"');
      console.log('3. Click "Reload schema cache" button');
      console.log('\nOR just wait 30 seconds - the cache auto-refreshes periodically.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkColumns();
