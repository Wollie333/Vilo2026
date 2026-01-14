/**
 * Verify African Countries Data
 * Checks that only African countries remain with complete data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verify() {
  console.log('\n🔍 Verifying African Countries Data');
  console.log('=====================================\n');

  try {
    // Get total counts
    const { count: countryCount } = await supabase
      .from('countries')
      .select('*', { count: 'exact', head: true });

    const { count: provinceCount } = await supabase
      .from('provinces')
      .select('*', { count: 'exact', head: true });

    const { count: cityCount } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Overview:');
    console.log(`   Total Countries: ${countryCount || 0} (should be 8)`);
    console.log(`   Total Provinces/Regions: ${provinceCount || 0}`);
    console.log(`   Total Cities: ${cityCount || 0}\n`);

    // Check each target country
    const targetCountries = [
      { code: 'ZAF', name: 'South Africa', expectedProvinces: 9 },
      { code: 'LSO', name: 'Lesotho', expectedProvinces: 4 },
      { code: 'BWA', name: 'Botswana', expectedProvinces: 4 },
      { code: 'ZWE', name: 'Zimbabwe', expectedProvinces: 5 },
      { code: 'KEN', name: 'Kenya', expectedProvinces: 5 },
      { code: 'NAM', name: 'Namibia', expectedProvinces: 4 },
      { code: 'MOZ', name: 'Mozambique', expectedProvinces: 5 },
      { code: 'SWZ', name: 'Eswatini', expectedProvinces: 4 }
    ];

    console.log('🌍 African Countries Detail:\n');

    for (const target of targetCountries) {
      const { data: country } = await supabase
        .from('countries')
        .select('id, name, code')
        .eq('code', target.code)
        .maybeSingle();

      if (!country) {
        console.log(`❌ ${target.name} - MISSING`);
        continue;
      }

      const { data: provinces } = await supabase
        .from('provinces')
        .select('id, name')
        .eq('country_id', country.id)
        .order('sort_order');

      let cityCount = 0;
      if (provinces && provinces.length > 0) {
        const provinceIds = provinces.map(p => p.id);
        const { count } = await supabase
          .from('cities')
          .select('*', { count: 'exact', head: true })
          .in('province_id', provinceIds);
        cityCount = count || 0;
      }

      const provinceStatus = (provinces?.length || 0) >= target.expectedProvinces ? '✅' : '⚠️';
      const cityStatus = cityCount > 0 ? '✅' : '❌';

      console.log(`${provinceStatus}${cityStatus} ${country.name} (${target.code})`);
      console.log(`   Provinces: ${provinces?.length || 0}/${target.expectedProvinces}`);
      console.log(`   Cities: ${cityCount}`);

      if (provinces && provinces.length > 0) {
        console.log(`   Provinces:`);
        provinces.forEach(p => {
          console.log(`     • ${p.name}`);
        });
      }
      console.log('');
    }

    // Check for non-African countries
    const { data: allCountries } = await supabase
      .from('countries')
      .select('code, name')
      .order('name');

    const targetCodes = targetCountries.map(t => t.code);
    const nonAfrican = allCountries?.filter(c => !targetCodes.includes(c.code));

    if (nonAfrican && nonAfrican.length > 0) {
      console.log('\n⚠️  Non-African countries still present:');
      nonAfrican.forEach(c => {
        console.log(`   • ${c.name} (${c.code})`);
      });
    } else {
      console.log('\n✅ All non-African countries removed successfully!');
    }

    console.log('\n✨ Verification complete!');

  } catch (err) {
    console.error('\n❌ Verification failed!');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

verify()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
