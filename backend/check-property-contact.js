require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPropertyContact() {
  const propertyId = 'abb4c03b-3d6d-4950-8ec4-fe6e57361e5d';

  console.log('=== Checking property contact information ===\n');
  console.log('Property ID:', propertyId);

  const { data, error } = await supabase
    .from('properties')
    .select('id, name, phone, email, website, address_city, address_country')
    .eq('id', propertyId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data) {
    console.log('Property not found');
    return;
  }

  console.log('\nProperty found:');
  console.log('Name:', data.name);
  console.log('Phone:', data.phone || '(empty)');
  console.log('Email:', data.email || '(empty)');
  console.log('Website:', data.website || '(empty)');
  console.log('City:', data.address_city || '(empty)');
  console.log('Country:', data.address_country || '(empty)');

  console.log('\n=== Field Status ===');
  console.log('Phone is null/empty:', !data.phone);
  console.log('Email is null/empty:', !data.email);
  console.log('Website is null/empty:', !data.website);

  process.exit(0);
}

checkPropertyContact().catch(console.error);
