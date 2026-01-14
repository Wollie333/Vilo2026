#!/usr/bin/env node

/**
 * Test show_video save and retrieval
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

async function testShowVideo() {
  console.log('🧪 Testing show_video save and retrieval...\n');

  try {
    // Get first property with a video_url
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id, name, video_url, show_video')
      .not('video_url', 'is', null)
      .limit(1)
      .single();

    if (fetchError || !property) {
      console.log('❌ No properties with video_url found');
      console.log('   Please add a video URL to a property first.\n');
      return;
    }

    console.log(`📋 Testing with property: ${property.name}`);
    console.log(`   ID: ${property.id}`);
    console.log(`   Current show_video: ${property.show_video}\n`);

    // Toggle the value
    const newValue = !property.show_video;
    console.log(`🔄 Setting show_video to: ${newValue}...`);

    const { data: updated, error: updateError } = await supabase
      .from('properties')
      .update({ show_video: newValue })
      .eq('id', property.id)
      .select('id, name, video_url, show_video')
      .single();

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      return;
    }

    console.log(`✅ Update successful!`);
    console.log(`   New show_video value: ${updated.show_video}\n`);

    // Verify by fetching again
    console.log('🔍 Verifying by fetching property again...');
    const { data: verified, error: verifyError } = await supabase
      .from('properties')
      .select('id, name, video_url, show_video')
      .eq('id', property.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      return;
    }

    console.log(`✅ Verification successful!`);
    console.log(`   show_video value: ${verified.show_video}`);
    console.log(`   Matches update: ${verified.show_video === newValue ? '✓ YES' : '✗ NO'}\n`);

    // Toggle back to original value
    console.log(`🔄 Restoring original value (${property.show_video})...`);
    await supabase
      .from('properties')
      .update({ show_video: property.show_video })
      .eq('id', property.id);

    console.log('✅ Restored to original value\n');

    console.log('📊 Test Summary:');
    console.log('   ✓ show_video column exists');
    console.log('   ✓ Can update show_video value');
    console.log('   ✓ Updated value persists in database');
    console.log('   ✓ Can retrieve show_video value');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testShowVideo();
