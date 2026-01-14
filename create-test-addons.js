/**
 * Create test add-ons for the Vilo property
 */

require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAddons() {
  console.log('🎁 Creating test add-ons for Vilo property...\n');

  // Get property ID
  const { data: property } = await supabase
    .from('properties')
    .select('id, name')
    .eq('slug', 'vilo')
    .single();

  if (!property) {
    console.error('❌ Property not found!');
    return;
  }

  console.log('✅ Property found:', property.name, '\n');

  // Sample add-ons to create
  const testAddons = [
    {
      property_id: property.id,
      name: 'Airport Pickup',
      description: 'Complimentary airport pickup service from OR Tambo International Airport',
      price: 350.00,
      addon_type: 'per_booking',
      max_quantity: 1,
      is_active: true
    },
    {
      property_id: property.id,
      name: 'Breakfast',
      description: 'Full English breakfast served daily',
      price: 120.00,
      addon_type: 'per_person',
      max_quantity: null,
      is_active: true
    },
    {
      property_id: property.id,
      name: 'Extra Towel Set',
      description: 'Additional premium towel set',
      price: 50.00,
      addon_type: 'per_room',
      max_quantity: 5,
      is_active: true
    },
    {
      property_id: property.id,
      name: 'Late Checkout',
      description: 'Extend your checkout time until 2 PM (subject to availability)',
      price: 200.00,
      addon_type: 'per_booking',
      max_quantity: 1,
      is_active: true
    },
    {
      property_id: property.id,
      name: 'City Tour',
      description: 'Guided half-day tour of Johannesburg attractions',
      price: 450.00,
      addon_type: 'per_person',
      max_quantity: 10,
      is_active: true
    }
  ];

  // Insert add-ons
  const { data: inserted, error } = await supabase
    .from('add_ons')
    .insert(testAddons)
    .select();

  if (error) {
    console.error('❌ Error creating add-ons:', error);
    return;
  }

  console.log('✅ Successfully created', inserted.length, 'test add-ons:\n');

  inserted.forEach((addon, index) => {
    console.log(`${index + 1}. ${addon.name}`);
    console.log(`   Price: ZAR ${addon.price} (${addon.addon_type})`);
    console.log(`   Description: ${addon.description}`);
    console.log('');
  });

  console.log('🎉 Done! Refresh your booking wizard to see the add-ons in Step 2.');
}

createTestAddons().then(() => process.exit(0));
