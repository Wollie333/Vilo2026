/**
 * Database Setup Helper for Tests
 * Provides functions to reset and seed the test database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in .env.test');
}

export const testDb = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Clear all data from test tables
 * Use this before each test suite to ensure clean state
 */
export async function clearTestData() {
  const tables = [
    'refunds',
    'reviews',
    'booking_payments',
    'booking_addons',
    'booking_rooms',
    'bookings',
    'credit_notes',
    'invoices',
    'checkout_sessions',
    'room_addons',
    'room_payment_rules',
    'addons',
    'payment_rules',
    'seasonal_rates',
    'promotions',
    'rooms',
    'properties',
    'companies',
    'user_subscriptions',
    'users',
  ];

  for (const table of tables) {
    try {
      await testDb.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.warn(`Failed to clear table ${table}:`, error);
    }
  }
}

/**
 * Create a test user
 */
export async function createTestUser(userData: {
  email: string;
  user_type: string;
  role?: string;
  first_name?: string;
  last_name?: string;
}) {
  const { data, error } = await testDb
    .from('users')
    .insert({
      email: userData.email,
      user_type: userData.user_type,
      role: userData.role || 'guest',
      first_name: userData.first_name || 'Test',
      last_name: userData.last_name || 'User',
      is_active: true,
      email_verified: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return data;
}

/**
 * Create a test property
 */
export async function createTestProperty(userId: string, propertyData?: Partial<any>) {
  const { data, error } = await testDb
    .from('properties')
    .insert({
      user_id: userId,
      name: propertyData?.name || 'Test Property',
      property_type: propertyData?.property_type || 'villa',
      description: propertyData?.description || 'A test property',
      location_city: propertyData?.location_city || 'Cape Town',
      location_province: propertyData?.location_province || 'Western Cape',
      location_country: propertyData?.location_country || 'South Africa',
      is_published: propertyData?.is_published ?? true,
      ...propertyData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test property: ${error.message}`);
  }

  return data;
}

/**
 * Create a test room
 */
export async function createTestRoom(propertyId: string, roomData?: Partial<any>) {
  const { data, error } = await testDb
    .from('rooms')
    .insert({
      property_id: propertyId,
      name: roomData?.name || 'Test Room',
      room_type: roomData?.room_type || 'standard',
      base_price: roomData?.base_price || 1000,
      max_occupancy: roomData?.max_occupancy || 2,
      is_active: roomData?.is_active ?? true,
      ...roomData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test room: ${error.message}`);
  }

  return data;
}

/**
 * Create a test booking
 */
export async function createTestBooking(
  roomId: string,
  guestId: string,
  bookingData?: Partial<any>
) {
  const checkIn = bookingData?.check_in_date || '2026-02-01';
  const checkOut = bookingData?.check_out_date || '2026-02-07';

  const { data, error } = await testDb
    .from('bookings')
    .insert({
      guest_id: guestId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      status: bookingData?.status || 'pending',
      total_price: bookingData?.total_price || 7000,
      ...bookingData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test booking: ${error.message}`);
  }

  // Add room to booking
  await testDb.from('booking_rooms').insert({
    booking_id: data.id,
    room_id: roomId,
    check_in_date: checkIn,
    check_out_date: checkOut,
    price_per_night: bookingData?.price_per_night || 1000,
  });

  return data;
}

/**
 * Seed test database with minimal data
 */
export async function seedTestData() {
  // Create test users
  const guest = await createTestUser({
    email: 'guest@vilo-test.com',
    user_type: 'guest',
    role: 'guest',
    first_name: 'Test',
    last_name: 'Guest',
  });

  const host = await createTestUser({
    email: 'host@vilo-test.com',
    user_type: 'property_owner',
    role: 'property_owner',
    first_name: 'Test',
    last_name: 'Host',
  });

  const admin = await createTestUser({
    email: 'admin@vilo-test.com',
    user_type: 'saas_admin',
    role: 'admin',
    first_name: 'Test',
    last_name: 'Admin',
  });

  // Create test property
  const property = await createTestProperty(host.id, {
    name: 'Test Villa',
    property_type: 'villa',
  });

  // Create test room
  const room = await createTestRoom(property.id, {
    name: 'Deluxe Suite',
    base_price: 1500,
  });

  return {
    guest,
    host,
    admin,
    property,
    room,
  };
}

/**
 * Reset database to clean state
 */
export async function resetTestDatabase() {
  await clearTestData();
  return await seedTestData();
}
