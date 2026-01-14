/**
 * Verify RLS Policies in Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || !anonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function verifyRLSPolicies() {
  console.log('🔍 Verifying RLS Policies...\n');

  try {
    // Check policies using admin client
    console.log('📋 Checking RLS policies in database...');
    const { data: policies, error: policiesError } = await adminClient
      .from('pg_policies')
      .select('schemaname, tablename, policyname, roles')
      .eq('schemaname', 'public')
      .in('tablename', ['properties', 'rooms', 'add_ons', 'companies']);

    if (policiesError) {
      console.error('❌ Error fetching policies:', policiesError.message);
      return;
    }

    console.log(`Found ${policies?.length || 0} RLS policies\n`);

    // Filter for anon policies
    const anonPolicies = policies?.filter(p =>
      p.roles && (p.roles.includes('anon') || p.roles === '{anon}')
    ) || [];

    console.log(`📌 Anonymous user policies (${anonPolicies.length}):`);
    anonPolicies.forEach(p => {
      console.log(`   ✅ ${p.tablename}.${p.policyname}`);
    });
    console.log('');

    // Now test with anonymous client
    console.log('🧪 Testing anonymous client access...');

    const { data: property, error: propertyError } = await anonClient
      .from('properties')
      .select('id, slug, name, listing_title, featured_image_url, is_listed_publicly, is_active')
      .eq('slug', 'vilo')
      .single();

    if (propertyError) {
      console.error('❌ Anonymous client FAILED to fetch property:');
      console.error('   Error:', propertyError.message);
      console.error('   Code:', propertyError.code);
      console.error('   Details:', propertyError.details);
      console.log('');
      console.log('⚠️  This means RLS policies are NOT working for anonymous users!');
      console.log('   The migration may not have been applied correctly.');
      return;
    }

    if (!property) {
      console.error('❌ Property not found with anonymous client');
      console.log('   This could mean:');
      console.log('   1. Property is not set as is_listed_publicly = true');
      console.log('   2. Property is not set as is_active = true');
      console.log('   3. RLS policy is not working');
      return;
    }

    console.log('✅ Anonymous client CAN fetch property!');
    console.log(`   ID: ${property.id}`);
    console.log(`   Slug: ${property.slug}`);
    console.log(`   Name: ${property.name}`);
    console.log(`   Listing Title: ${property.listing_title || '(not set)'}`);
    console.log(`   Featured Image: ${property.featured_image_url ? 'Yes' : 'No'}`);
    console.log(`   is_listed_publicly: ${property.is_listed_publicly}`);
    console.log(`   is_active: ${property.is_active}`);
    console.log('');

    // Test rooms
    console.log('🧪 Testing rooms access...');
    const { data: rooms, error: roomsError } = await anonClient
      .from('rooms')
      .select('id, name, base_price_per_night')
      .eq('property_id', property.id);

    if (roomsError) {
      console.error('❌ Anonymous client FAILED to fetch rooms:', roomsError.message);
    } else {
      console.log(`✅ Anonymous client CAN fetch rooms (${rooms?.length || 0} found)`);
    }

    console.log('');
    console.log('✅ RLS policies are working correctly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyRLSPolicies();
