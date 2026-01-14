/**
 * Check Property Status in Database
 *
 * This script checks if the property is correctly configured for public listing
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPropertyStatus() {
  console.log('🔍 Checking property status in database...\n');

  try {
    // Get property by slug
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, slug, name, is_listed_publicly, is_active, owner_id')
      .eq('slug', 'vilo')
      .single();

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    if (!property) {
      console.error('❌ No property found with slug "vilo"');
      return;
    }

    console.log('📋 Property found:');
    console.log(`   ID: ${property.id}`);
    console.log(`   Slug: ${property.slug}`);
    console.log(`   Name: ${property.name}`);
    console.log(`   Owner ID: ${property.owner_id}`);
    console.log(`   is_listed_publicly: ${property.is_listed_publicly}`);
    console.log(`   is_active: ${property.is_active}`);
    console.log('');

    // Check if it meets public listing criteria
    if (!property.is_listed_publicly) {
      console.warn('⚠️  PROBLEM: is_listed_publicly = false');
      console.log('   Fix: UPDATE properties SET is_listed_publicly = true WHERE slug = \'vilo\';');
      console.log('');
    }

    if (!property.is_active) {
      console.warn('⚠️  PROBLEM: is_active = false');
      console.log('   Fix: UPDATE properties SET is_active = true WHERE slug = \'vilo\';');
      console.log('');
    }

    if (property.is_listed_publicly && property.is_active) {
      console.log('✅ Property is correctly configured for public listing!');

      // Now check rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, is_active, is_paused, base_price_per_night')
        .eq('property_id', property.id);

      if (roomsError) {
        console.error('❌ Error fetching rooms:', roomsError.message);
        return;
      }

      console.log('');
      console.log(`📦 Rooms (${rooms?.length || 0} total):`);
      if (!rooms || rooms.length === 0) {
        console.warn('   ⚠️  No rooms found! Add rooms to this property.');
      } else {
        rooms.forEach((room, i) => {
          const status = room.is_active && !room.is_paused ? '✅' : '❌';
          console.log(`   ${status} ${room.name} - ${room.base_price_per_night} (active: ${room.is_active}, paused: ${room.is_paused})`);
        });

        const activeRooms = rooms.filter(r => r.is_active && !r.is_paused);
        if (activeRooms.length === 0) {
          console.warn('');
          console.warn('   ⚠️  No active rooms! Set at least one room to active and not paused.');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPropertyStatus();
