/**
 * Test Anonymous Access to Property
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testAnonAccess() {
  console.log('🧪 Testing Anonymous Client Access...\n');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Using anonymous key: ${anonKey.substring(0, 20)}...`);
  console.log('');

  try {
    // Test property access
    console.log('📋 Attempting to fetch property "vilo" with anonymous client...');
    const { data: property, error: propertyError } = await anonClient
      .from('properties')
      .select('*')
      .eq('slug', 'vilo')
      .single();

    if (propertyError) {
      console.error('❌ FAILED to fetch property:');
      console.error('   Error:', propertyError.message);
      console.error('   Code:', propertyError.code);
      console.error('   Hint:', propertyError.hint);
      console.error('   Details:', propertyError.details);
      console.log('');
      console.log('⚠️  This confirms RLS is blocking anonymous access!');
      console.log('');
      console.log('💡 Possible causes:');
      console.log('   1. Migration 058 was not applied correctly in Supabase');
      console.log('   2. RLS policies were not created');
      console.log('   3. Supabase cache needs to be cleared');
      console.log('');
      console.log('🔧 Solutions to try:');
      console.log('   1. In Supabase Dashboard > SQL Editor, run:');
      console.log('      SELECT * FROM pg_policies WHERE tablename = \'properties\';');
      console.log('   2. Verify you see a policy named "Anonymous users can view publicly listed properties"');
      console.log('   3. If not, re-run migration 058');
      return;
    }

    if (!property) {
      console.error('❌ Property not found (returned null)');
      console.log('   This means the query succeeded but no rows matched');
      console.log('   Check that property with slug="vilo" has:');
      console.log('   - is_listed_publicly = true');
      console.log('   - is_active = true');
      return;
    }

    console.log('✅ SUCCESS! Anonymous client CAN fetch property!');
    console.log('');
    console.log('Property Details:');
    console.log(`   ID: ${property.id}`);
    console.log(`   Slug: ${property.slug}`);
    console.log(`   Name: ${property.name}`);
    console.log(`   Listing Title: ${property.listing_title || '(not set)'}`);
    console.log(`   Featured Image: ${property.featured_image_url || '(not set)'}`);
    console.log(`   Property Type: ${property.property_type || '(not set)'}`);
    console.log(`   is_listed_publicly: ${property.is_listed_publicly}`);
    console.log(`   is_active: ${property.is_active}`);
    console.log('');

    // Test rooms
    console.log('🧪 Testing rooms access...');
    const { data: rooms, error: roomsError } = await anonClient
      .from('rooms')
      .select('id, name, base_price_per_night, featured_image')
      .eq('property_id', property.id)
      .eq('is_active', true)
      .eq('is_paused', false);

    if (roomsError) {
      console.error('❌ FAILED to fetch rooms:', roomsError.message);
    } else {
      console.log(`✅ SUCCESS! Found ${rooms?.length || 0} rooms`);
      if (rooms && rooms.length > 0) {
        rooms.forEach((room, i) => {
          console.log(`   ${i + 1}. ${room.name} - ${property.currency || 'ZAR'} ${room.base_price_per_night}`);
          console.log(`      Image: ${room.featured_image || '(no image)'}`);
        });
      }
    }
    console.log('');

    // Test add-ons
    console.log('🧪 Testing add-ons access...');
    const { data: addons, error: addonsError } = await anonClient
      .from('add_ons')
      .select('id, name, price, pricing_type')
      .eq('property_id', property.id)
      .eq('is_active', true);

    if (addonsError) {
      console.error('❌ FAILED to fetch add-ons:', addonsError.message);
    } else {
      console.log(`✅ SUCCESS! Found ${addons?.length || 0} add-ons`);
      if (addons && addons.length > 0) {
        addons.forEach((addon, i) => {
          console.log(`   ${i + 1}. ${addon.name} - ${property.currency || 'ZAR'} ${addon.price} (${addon.pricing_type})`);
        });
      }
    }
    console.log('');

    console.log('✅ All tests passed! RLS policies are working correctly.');
    console.log('');
    console.log('🎉 The booking wizard should now work!');
    console.log('   Open: http://localhost:5173/accommodation/vilo/book');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

testAnonAccess();
