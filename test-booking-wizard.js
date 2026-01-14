/**
 * Test Booking Wizard Data Flow
 *
 * This script tests the booking wizard API endpoints to identify issues
 */

const API_URL = 'http://localhost:3001/api';

async function testBookingWizard() {
  console.log('🧪 Testing Booking Wizard Flow...\n');

  try {
    // Step 1: Get list of public properties
    console.log('📋 Step 1: Fetching public properties...');
    const propertiesRes = await fetch(`${API_URL}/discovery/properties?limit=5`);
    const propertiesData = await propertiesRes.json();

    if (!propertiesData.properties || propertiesData.properties.length === 0) {
      console.error('❌ No public properties found');
      console.log('Response:', JSON.stringify(propertiesData, null, 2));
      return;
    }

    const firstProperty = propertiesData.properties[0];
    console.log(`✅ Found ${propertiesData.properties.length} properties`);
    console.log(`   First property: ${firstProperty.name} (slug: ${firstProperty.slug})`);
    console.log('');

    // Step 2: Get property detail by slug
    console.log(`📋 Step 2: Fetching property detail for "${firstProperty.slug}"...`);
    const propertyRes = await fetch(`${API_URL}/discovery/properties/${firstProperty.slug}`);
    const property = await propertyRes.json();

    if (!property || !property.id) {
      console.error('❌ Failed to fetch property detail');
      console.log('Response:', JSON.stringify(property, null, 2));
      return;
    }
    console.log('✅ Property loaded successfully');
    console.log(`   Name: ${property.name}`);
    console.log(`   Listing Title: ${property.listing_title || '(not set)'}`);
    console.log(`   Featured Image: ${property.featured_image_url || '(not set)'}`);
    console.log(`   Property Type: ${property.property_type || '(not set)'}`);
    console.log(`   Location: ${[property.city_name, property.province_name, property.country_name].filter(Boolean).join(', ') || '(not set)'}`);
    console.log(`   Currency: ${property.currency}`);
    console.log(`   Rooms: ${property.rooms?.length || 0}`);
    console.log(`   Add-ons: ${property.addons?.length || 0}`);
    console.log('');

    if (!property.rooms || property.rooms.length === 0) {
      console.warn('⚠️  WARNING: Property has NO ROOMS! The booking wizard will show "No rooms available"');
      console.log('   You need to add at least one active room to this property');
      console.log('');
    } else {
      console.log('📦 Rooms available:');
      property.rooms.forEach((room, i) => {
        console.log(`   ${i + 1}. ${room.name} - ${property.currency} ${room.base_price_per_night}/night`);
        console.log(`      Max guests: ${room.max_guests}, Active: ${room.is_active}, Paused: ${room.is_paused}`);
        console.log(`      Featured image: ${room.featured_image || '(not set)'}`);
      });
      console.log('');
    }

    if (property.addons && property.addons.length > 0) {
      console.log('🎁 Add-ons available:');
      property.addons.forEach((addon, i) => {
        console.log(`   ${i + 1}. ${addon.name} - ${property.currency} ${addon.price} (${addon.pricing_type})`);
      });
      console.log('');
    }

    // Step 3: Test booking initiation (if property has rooms)
    if (property.rooms && property.rooms.length > 0) {
      const activeRoom = property.rooms.find(r => r.is_active && !r.is_paused);

      if (activeRoom) {
        console.log('📋 Step 3: Testing booking initiation...');

        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 7); // 7 days from now
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 2); // 2 nights

        const bookingData = {
          property_id: property.id,
          property_slug: property.slug,
          check_in_date: checkIn.toISOString(),
          check_out_date: checkOut.toISOString(),
          nights: 2,
          rooms: [{
            room_id: activeRoom.id,
            room_name: activeRoom.name,
            room_code: activeRoom.room_code,
            adults: 2,
            children: 0,
            children_ages: [],
            unit_price: activeRoom.base_price_per_night,
            total_price: activeRoom.base_price_per_night * 2,
          }],
          addons: [],
          guest: {
            firstName: 'Test',
            lastName: 'User',
            email: `test${Date.now()}@example.com`,
            phone: '+27123456789',
            specialRequests: '',
            termsAccepted: true,
            marketingConsent: false,
          },
          payment_method: 'eft',
          total_amount: activeRoom.base_price_per_night * 2,
          currency: property.currency,
        };

        const initiateRes = await fetch(`${API_URL}/booking-wizard/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData),
        });

        const initiateData = await initiateRes.json();

        if (!initiateData.success) {
          console.error('❌ Failed to initiate booking');
          console.log('Error:', initiateData.error || initiateData.message);
          console.log('Full response:', JSON.stringify(initiateData, null, 2));
        } else {
          console.log('✅ Booking initiated successfully');
          console.log(`   Booking ID: ${initiateData.data.booking_id}`);
          console.log(`   Booking Reference: ${initiateData.data.booking_reference}`);
          console.log(`   Status: ${initiateData.data.booking_status}`);
        }
      } else {
        console.warn('⚠️  All rooms are either inactive or paused');
      }
    }

    console.log('');
    console.log('✅ Test complete!');
    console.log('');
    console.log('🔍 Next steps:');
    console.log(`   1. Open your browser to: http://localhost:5173/accommodation/${firstProperty.slug}/book`);
    console.log('   2. Check the browser console for any errors');
    console.log('   3. Verify that property title, image, and rooms are displaying');

  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

// Run the test
testBookingWizard();
