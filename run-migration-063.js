/**
 * Run Migration 063 - African Countries Only
 * Removes non-African countries and completes data for 8 target countries
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
  console.log('🌍 Running Migration 063: African Countries Only');
  console.log('==================================================\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'backend', 'migrations', '063_african_countries_only.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📖 Reading migration file...');
    console.log('⚙️  Executing migration via SQL editor...\n');

    console.log('⚠️  IMPORTANT: You need to run this migration manually in Supabase:');
    console.log('\n1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log('   backend/migrations/063_african_countries_only.sql');
    console.log('4. Click "Run"\n');

    console.log('This migration will:');
    console.log('  • DELETE all non-African countries (USA, UK, etc.)');
    console.log('  • ADD Lesotho and Eswatini (Swaziland)');
    console.log('  • COMPLETE provinces and cities for all 8 African countries');
    console.log('\nTarget countries:');
    console.log('  1. South Africa (already complete)');
    console.log('  2. Lesotho (will add 4 districts, 4 cities)');
    console.log('  3. Botswana (already has 4 districts, 5 cities)');
    console.log('  4. Zimbabwe (will add 5 provinces, 6 cities)');
    console.log('  5. Kenya (will add 3 more regions, 3 more cities)');
    console.log('  6. Namibia (will add 4 regions, 5 cities)');
    console.log('  7. Mozambique (will add 5 provinces, 6 cities)');
    console.log('  8. Eswatini (will add 4 regions, 4 cities)');

    console.log('\n\nAttempting to verify current data...\n');

    // Verify before migration
    const { count: beforeCount } = await supabase
      .from('countries')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Before Migration:`);
    console.log(`   Total Countries: ${beforeCount || 0}`);

    const targetCountries = [
      { code: 'ZAF', name: 'South Africa' },
      { code: 'LSO', name: 'Lesotho' },
      { code: 'BWA', name: 'Botswana' },
      { code: 'ZWE', name: 'Zimbabwe' },
      { code: 'KEN', name: 'Kenya' },
      { code: 'NAM', name: 'Namibia' },
      { code: 'MOZ', name: 'Mozambique' },
      { code: 'SWZ', name: 'Eswatini' }
    ];

    console.log('\n   Target African Countries:');
    for (const target of targetCountries) {
      const { data: country } = await supabase
        .from('countries')
        .select('id, name')
        .eq('code', target.code)
        .maybeSingle();

      if (country) {
        console.log(`   ✅ ${country.name}`);
      } else {
        console.log(`   ❌ ${target.name} (will be added)`);
      }
    }

  } catch (err) {
    console.error('\n❌ Error!');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n✅ Ready to run migration!');
    console.log('\n💡 After running in Supabase, you can verify with:');
    console.log('   node verify-african-countries.js');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
