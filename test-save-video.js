const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load backend .env
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSaveVideo() {
  console.log('🧪 Testing video_url save...\n');

  const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const propertyId = 'd7ffa3d5-29d9-4e82-8050-fbb7698adc39';

  console.log(`Property ID: ${propertyId}`);
  console.log(`Video URL to save: ${testVideoUrl}\n`);

  // Try to update directly
  const { data, error } = await supabase
    .from('properties')
    .update({ video_url: testVideoUrl })
    .eq('id', propertyId)
    .select('id, name, video_url')
    .single();

  if (error) {
    console.error('❌ Error updating:', error);
    return;
  }

  console.log('✅ Update successful!');
  console.log('Result:', JSON.stringify(data, null, 2));

  // Verify by reading back
  console.log('\n🔍 Reading back to verify...');
  const { data: verified, error: readError } = await supabase
    .from('properties')
    .select('id, name, video_url')
    .eq('id', propertyId)
    .single();

  if (readError) {
    console.error('❌ Error reading:', readError);
    return;
  }

  console.log('✅ Verified:');
  console.log(`   Name: ${verified.name}`);
  console.log(`   Video URL: ${verified.video_url || '(not set)'}`);
}

testSaveVideo().catch(console.error);
