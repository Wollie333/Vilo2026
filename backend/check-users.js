require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  console.log('=== Checking users in database ===\n');

  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Total users found: ${users?.length || 0}\n`);

  if (users && users.length > 0) {
    console.log('Users:');
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}`);
      console.log(`   Name: ${u.full_name || 'No name'}`);
      console.log(`   Status: ${u.status}`);
      console.log(`   Created: ${u.created_at}\n`);
    });
  }

  // Check for specific emails
  console.log('=== Checking specific emails ===');
  const emails = ['admin@vilo.com', 'wollie333@gmail.com'];
  for (const email of emails) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    console.log(`${email}: ${data ? 'EXISTS ✓' : 'NOT FOUND ✗'}`);
  }

  process.exit(0);
}

checkUsers().catch(console.error);
