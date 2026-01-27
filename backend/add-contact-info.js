require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addContactInfo() {
  const propertyId = 'abb4c03b-3d6d-4950-8ec4-fe6e57361e5d';

  console.log('=== Adding contact information to property ===\n');
  console.log('Property ID:', propertyId);

  const contactData = {
    phone: '+27 21 123 4567',
    email: 'bookings@masehuisie.com',
    website: 'https://www.masehuisie.com',
    updated_at: new Date().toISOString()
  };

  console.log('\nUpdating with:');
  console.log('Phone:', contactData.phone);
  console.log('Email:', contactData.email);
  console.log('Website:', contactData.website);

  const { data, error } = await supabase
    .from('properties')
    .update(contactData)
    .eq('id', propertyId)
    .select('id, name, phone, email, website')
    .single();

  if (error) {
    console.error('\nError:', error);
    process.exit(1);
  }

  console.log('\n=== Update successful! ===');
  console.log('Property:', data.name);
  console.log('Phone:', data.phone);
  console.log('Email:', data.email);
  console.log('Website:', data.website);

  console.log('\nNow refresh the page at:');
  console.log('http://localhost:5173/manage/properties/abb4c03b-3d6d-4950-8ec4-fe6e57361e5d#property-contact');

  process.exit(0);
}

addContactInfo().catch(console.error);
