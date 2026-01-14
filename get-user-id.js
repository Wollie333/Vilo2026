require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUserId() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('User:', data);
  }
}

getUserId().then(() => process.exit(0));
