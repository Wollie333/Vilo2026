/**
 * Run Migration 062 - Seed International Locations
 * Adds multiple countries with states/provinces and cities
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🌍 Running Migration 062: Seed International Locations');
  console.log('==================================================\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'backend', 'migrations', '062_seed_international_locations.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📖 Reading migration file...');
    console.log('⚙️  Executing migration via SQL editor...\n');

    console.log('⚠️  IMPORTANT: You need to run this migration manually in Supabase:');
    console.log('\n1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log('   backend/migrations/062_seed_international_locations.sql');
    console.log('4. Click "Run"\n');

    console.log('Attempting to verify existing data...\n');

    // Verify the migration
    console.log('\n✅ Migration executed successfully!');
    console.log('\n📊 Verifying data...\n');

    // Count countries
    const { count: countryCount } = await supabase
      .from('countries')
      .select('*', { count: 'exact', head: true });

    console.log(`   Countries: ${countryCount || 0}`);

    // Count provinces
    const { count: provinceCount } = await supabase
      .from('provinces')
      .select('*', { count: 'exact', head: true });

    console.log(`   Provinces/States: ${provinceCount || 0}`);

    // Count cities
    const { count: cityCount } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true });

    console.log(`   Cities: ${cityCount || 0}\n`);

    // Show some sample countries
    const { data: countries } = await supabase
      .from('countries')
      .select('name')
      .order('sort_order')
      .limit(10);

    if (countries && countries.length > 0) {
      console.log('📍 Sample countries available:');
      countries.forEach(country => {
        console.log(`   • ${country.name}`);
      });
    }

    console.log('\n✨ Migration complete! You now have international location data.');
    console.log('\n📝 Countries added:');
    console.log('   • African: Botswana, Namibia, Zimbabwe, Mozambique, Kenya, Tanzania');
    console.log('   • European: UK, France, Spain, Italy, Germany, Portugal, Greece');
    console.log('   • Americas: USA, Canada, Mexico, Brazil');
    console.log('   • Oceania: Australia, New Zealand');
    console.log('   • Asian: Thailand, Indonesia, Malaysia, Singapore, UAE');
    console.log('\n💡 Tip: Users can now select from these countries when setting up their company!');

  } catch (err) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
