/**
 * Update properties to use the Moderate cancellation policy
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🔄 Updating properties to use Moderate policy...\n');

  // Get Moderate policy ID
  const { data: policy, error: policyError } = await supabase
    .from('cancellation_policies')
    .select('id, name, description')
    .eq('name', 'Moderate')
    .single();

  if (policyError || !policy) {
    console.error('❌ Moderate policy not found');
    return;
  }

  console.log('📋 Moderate Policy Details:');
  console.log(`   ID: ${policy.id}`);
  console.log(`   Name: ${policy.name}`);
  console.log(`   Description: ${policy.description}\n`);

  // Update properties
  const { data: updated, error: updateError } = await supabase
    .from('properties')
    .update({ cancellation_policy: policy.id })
    .in('slug', ['truer-river-lodge', 'ma-se-huisie'])
    .select('name, slug');

  if (updateError) {
    console.error('❌ Error updating properties:', updateError.message);
    return;
  }

  console.log(`✅ Updated ${updated.length} properties:\n`);
  updated.forEach((prop, i) => {
    console.log(`   ${i + 1}. ${prop.name} (${prop.slug})`);
  });

  console.log('\n🎉 Properties now use the Moderate cancellation policy!');
  console.log('🔄 Refresh the property page to see the cancellation policy displayed.\n');
})();
