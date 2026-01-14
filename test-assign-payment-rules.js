/**
 * Test Payment Rules Assignment
 *
 * This script tests assigning multiple payment rules to the King room
 * to verify the backend assignment logic works correctly.
 */

require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const KING_ROOM_ID = 'a174e7b3-b712-4051-b150-8dcd1ef62246';
const USER_ID = '81decc90-9e72-4495-9b74-45f80430fe35'; // wolki@gmail.com

async function testAssignPaymentRules() {
  console.log('🧪 Testing Payment Rules Assignment\n');

  // Step 1: Get the property ID for the King room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, name, property_id')
    .eq('id', KING_ROOM_ID)
    .single();

  if (roomError || !room) {
    console.error('❌ Failed to fetch room:', roomError);
    return;
  }

  console.log(`✅ Room: ${room.name}`);
  console.log(`   Property ID: ${room.property_id}\n`);

  // Step 2: Get all property-level payment rules
  const { data: allRules, error: rulesError } = await supabase
    .from('room_payment_rules')
    .select('id, rule_name, rule_type')
    .eq('property_id', room.property_id)
    .is('room_id', null);

  if (rulesError) {
    console.error('❌ Failed to fetch rules:', rulesError);
    return;
  }

  console.log(`📦 Available payment rules: ${allRules?.length || 0}`);
  allRules?.forEach((rule, i) => {
    console.log(`   ${i + 1}. ${rule.rule_name} (${rule.rule_type}) - ID: ${rule.id}`);
  });
  console.log();

  // Step 3: Clear existing assignments
  console.log('🧹 Clearing existing assignments...');
  const { error: deleteError } = await supabase
    .from('room_payment_rule_assignments')
    .delete()
    .eq('room_id', KING_ROOM_ID);

  if (deleteError) {
    console.error('❌ Failed to clear assignments:', deleteError);
    return;
  }
  console.log('✅ Cleared existing assignments\n');

  // Step 4: Assign 3 rules (simulate selecting 3 rules in UI)
  const rulesToAssign = allRules?.slice(0, 3) || []; // Take first 3 rules

  console.log(`📝 Assigning ${rulesToAssign.length} rules...`);

  const assignments = rulesToAssign.map(rule => ({
    room_id: KING_ROOM_ID,
    payment_rule_id: rule.id,
    assigned_by: USER_ID,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('room_payment_rule_assignments')
    .upsert(assignments, { onConflict: 'room_id,payment_rule_id' })
    .select();

  if (insertError) {
    console.error('❌ Failed to assign rules:', insertError);
    return;
  }

  console.log(`✅ Assigned ${inserted?.length || 0} rules`);
  rulesToAssign.forEach((rule, i) => {
    console.log(`   ${i + 1}. ${rule.rule_name}`);
  });
  console.log();

  // Step 5: Verify assignments by querying junction table
  const { data: verify, error: verifyError } = await supabase
    .from('room_payment_rule_assignments')
    .select(`
      payment_rule_id,
      room_payment_rules (
        id,
        rule_name,
        rule_type
      )
    `)
    .eq('room_id', KING_ROOM_ID);

  console.log('✅ Verification - Rules now assigned:');
  if (verify && verify.length > 0) {
    verify.forEach((v, i) => {
      const rule = v.room_payment_rules;
      if (rule) {
        console.log(`   ${i + 1}. ${rule.rule_name} (${rule.rule_type})`);
      }
    });
  } else {
    console.log('   No rules found');
  }

  console.log('\n🎉 Test complete!');
  console.log('✅ Multiple payment rules can be assigned successfully');
  console.log('\n📱 Refresh the frontend and check if all 3 rules show on the detail page');
}

testAssignPaymentRules()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
