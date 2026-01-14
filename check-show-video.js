#!/usr/bin/env node

/**
 * Check show_video column and values
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkShowVideo() {
  console.log('🔍 Checking show_video field in properties...\n');

  try {
    // Try to get properties with video_url
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, name, video_url, show_video')
      .not('video_url', 'is', null);

    if (propError) {
      console.error('❌ Error fetching properties:', propError.message);
      if (propError.message.includes('show_video')) {
        console.log('\n⚠️  The show_video column does not exist yet!');
        console.log('📝 You need to run migration 076 first.');
        console.log('   See: RUN_MIGRATION_076.md\n');
      }
      return;
    }

    if (!properties || properties.length === 0) {
      console.log('📋 No properties with video_url found');
      console.log('\n💡 Try adding a video URL to a property first, then toggle the switch.\n');
      return;
    }

    console.log(`📋 Found ${properties.length} property/properties with video_url:\n`);
    properties.forEach(prop => {
      console.log(`Property: ${prop.name}`);
      console.log(`  ID: ${prop.id}`);
      console.log(`  video_url: ${prop.video_url ? '✓ Has URL' : '✗ No URL'}`);
      console.log(`  show_video: ${prop.show_video === true ? '✓ TRUE (video will show)' : prop.show_video === false ? '✗ FALSE (video will hide)' : '? NULL/undefined (treated as TRUE)'}`);
      console.log('');
    });

    console.log('\n💡 Expected behavior:');
    console.log('   - show_video = true  → Video displays on public page');
    console.log('   - show_video = false → Video is hidden on public page');
    console.log('   - show_video = null  → Treated as true (default)\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkShowVideo();
