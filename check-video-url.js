const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load backend .env
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  console.error('SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideoUrl() {
  console.log('🔍 Checking video_url in properties table...\n');

  // Query properties directly
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, name, slug, video_url')
    .limit(10);

  if (error) {
    console.error('❌ Error querying properties:', error.message);
    return;
  }

  console.log(`✅ Found ${properties.length} properties\n`);

  properties.forEach((prop, index) => {
    console.log(`${index + 1}. ${prop.name} (${prop.slug})`);
    console.log(`   ID: ${prop.id}`);
    console.log(`   Video URL: ${prop.video_url || '(not set)'}`);
    console.log('');
  });

  const withVideo = properties.filter(p => p.video_url);
  console.log(`\n📊 Summary:`);
  console.log(`   Total properties: ${properties.length}`);
  console.log(`   With video_url: ${withVideo.length}`);
  console.log(`   Without video_url: ${properties.length - withVideo.length}`);
}

checkVideoUrl().catch(console.error);
