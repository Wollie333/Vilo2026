/**
 * Quick script to check if add-ons exist for the property
 */

require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAddons() {
  console.log('🔍 Checking add-ons for property slug: vilo\n');

  // Get property ID
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, name, slug')
    .eq('slug', 'vilo')
    .single();

  if (propError || !property) {
    console.error('❌ Property not found:', propError);
    return;
  }

  console.log('✅ Property found:', {
    id: property.id,
    name: property.name,
    slug: property.slug
  });

  // Check all add-ons (active and inactive)
  const { data: allAddons, error: allError } = await supabase
    .from('add_ons')
    .select('*')
    .eq('property_id', property.id);

  console.log('\n📦 All add-ons for this property:', {
    count: allAddons?.length || 0,
    add_ons: allAddons || []
  });

  // Check only active add-ons
  const { data: activeAddons, error: activeError } = await supabase
    .from('add_ons')
    .select('*')
    .eq('property_id', property.id)
    .eq('is_active', true);

  console.log('\n✅ Active add-ons only:', {
    count: activeAddons?.length || 0,
    add_ons: activeAddons || []
  });

  if (!allAddons || allAddons.length === 0) {
    console.log('\n⚠️  NO ADD-ONS FOUND FOR THIS PROPERTY!');
    console.log('You need to create add-ons in the admin panel or database.');
    console.log('\nTo create a test add-on, run:');
    console.log(`
INSERT INTO add_ons (property_id, name, description, price, addon_type, is_active)
VALUES (
  '${property.id}',
  'Airport Pickup',
  'Complimentary airport pickup service',
  150.00,
  'per_booking',
  true
);
    `);
  }
}

checkAddons().then(() => process.exit(0));
