/**
 * Check and fix cancellation policy for a property
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixCancellationPolicy() {
  try {
    console.log('🔍 Checking cancellation policy setup...\n');

    // 1. Check available policies
    console.log('1️⃣  Fetching available cancellation policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('cancellation_policies')
      .select('id, name, description, is_default, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
      return;
    }

    console.log(`\n✅ Found ${policies.length} active policies:\n`);
    policies.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} ${p.is_default ? '(DEFAULT)' : ''}`);
      console.log(`      ID: ${p.id}`);
      console.log(`      Description: ${p.description || 'N/A'}`);
      console.log('');
    });

    // 2. Check properties with text-based policies
    console.log('2️⃣  Checking properties with old text-based cancellation policies...');
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, name, slug, cancellation_policy')
      .not('cancellation_policy', 'is', null);

    if (propsError) {
      console.error('Error fetching properties:', propsError);
      return;
    }

    console.log(`\n✅ Found ${properties.length} properties with cancellation_policy set:\n`);

    const needsFixing = [];
    const isUUIDRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    properties.forEach((prop, i) => {
      const isUUID = isUUIDRegex.test(prop.cancellation_policy);
      console.log(`   ${i + 1}. ${prop.name} (${prop.slug})`);
      console.log(`      Current value: "${prop.cancellation_policy}"`);
      console.log(`      Is UUID: ${isUUID ? '✅ YES' : '❌ NO (needs fixing)'}`);
      console.log('');

      if (!isUUID) {
        needsFixing.push(prop);
      }
    });

    // 3. Fix properties with text-based policies
    if (needsFixing.length > 0) {
      console.log(`\n3️⃣  Fixing ${needsFixing.length} properties with text-based policies...\n`);

      for (const prop of needsFixing) {
        const textValue = prop.cancellation_policy.toLowerCase();

        // Find matching policy by name
        let matchingPolicy = policies.find(p => p.name.toLowerCase() === textValue);

        // If no match, use default
        if (!matchingPolicy) {
          matchingPolicy = policies.find(p => p.is_default) || policies[0];
          console.log(`   ⚠️  No policy matches "${textValue}", using default: ${matchingPolicy.name}`);
        }

        console.log(`   🔧 Updating ${prop.name}...`);
        console.log(`      Old: "${prop.cancellation_policy}"`);
        console.log(`      New: ${matchingPolicy.id} (${matchingPolicy.name})`);

        const { error: updateError } = await supabase
          .from('properties')
          .update({ cancellation_policy: matchingPolicy.id })
          .eq('id', prop.id);

        if (updateError) {
          console.error(`      ❌ Failed:`, updateError.message);
        } else {
          console.log(`      ✅ Updated successfully!`);
        }
        console.log('');
      }

      console.log('🎉 All properties have been updated to use UUID references!\n');
    } else {
      console.log('\n✅ All properties already use UUID references. No fixes needed!\n');
    }

    // 4. Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total active policies: ${policies.length}`);
    console.log(`Total properties checked: ${properties.length}`);
    console.log(`Properties fixed: ${needsFixing.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (needsFixing.length > 0) {
      console.log('✅ Cancellation policies will now display on property pages!');
      console.log('🔄 Refresh your browser to see the changes.\n');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndFixCancellationPolicy();
