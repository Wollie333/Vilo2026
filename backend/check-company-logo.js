require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompanyLogo() {
  console.log('=== Checking company logos ===\n');

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, logo_url, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recent companies:');
  companies.forEach((c, i) => {
    console.log(`${i + 1}. ${c.name}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Logo: ${c.logo_url || '(no logo)'}`);
    console.log(`   Created: ${new Date(c.created_at).toLocaleString()}\n`);
  });

  process.exit(0);
}

checkCompanyLogo().catch(console.error);
