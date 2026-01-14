/**
 * Check Payment Rules Assigned to King Room
 *
 * This script checks what payment rules are currently assigned to the King room
 * by querying the junction table and the payment rules.
 */

require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const KING_ROOM_ID = 'a174e7b3-b712-4051-b150-8dcd1ef62246';

async function checkPaymentRules() {
  console.log('🔍 Checking payment rules for King room...\n');

  // Step 1: Get room details
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, name, property_id')
    .eq('id', KING_ROOM_ID)
    .single();

  if (roomError || !room) {
    console.error('❌ Failed to fetch room:', roomError);
    return;
  }

  console.log('✅ Room found:');
  console.log(`   ID: ${room.id}`);
  console.log(`   Name: ${room.name}`);
  console.log(`   Property ID: ${room.property_id}\n`);

  // Step 2: Get junction table assignments
  const { data: assignments, error: assignError } = await supabase
    .from('room_payment_rule_assignments')
    .select('*')
    .eq('room_id', KING_ROOM_ID);

  console.log(`📋 Junction Table Assignments (${assignments?.length || 0}):`);
  if (assignments && assignments.length > 0) {
    assignments.forEach((a, i) => {
      console.log(`   ${i + 1}. Payment Rule ID: ${a.payment_rule_id}`);
      console.log(`      Assigned By: ${a.assigned_by}`);
      console.log(`      Assigned At: ${a.assigned_at}\n`);
    });
  } else {
    console.log('   No assignments found\n');
  }

  // Step 3: Get the actual payment rules
  const { data: rules, error: rulesError } = await supabase
    .from('room_payment_rule_assignments')
    .select(`
      payment_rule_id,
      room_payment_rules (
        id,
        rule_name,
        rule_type,
        description,
        is_active
      )
    `)
    .eq('room_id', KING_ROOM_ID);

  console.log(`💰 Payment Rules Details (${rules?.length || 0}):`);
  if (rules && rules.length > 0) {
    rules.forEach((r, i) => {
      const rule = r.room_payment_rules;
      if (rule) {
        console.log(`   ${i + 1}. ${rule.rule_name} (${rule.rule_type})`);
        console.log(`      ID: ${rule.id}`);
        console.log(`      Description: ${rule.description || 'N/A'}`);
        console.log(`      Active: ${rule.is_active}\n`);
      }
    });
  } else {
    console.log('   No rules found\n');
  }

  // Step 4: Get all property-level payment rules available
  const { data: allRules, error: allRulesError } = await supabase
    .from('room_payment_rules')
    .select('id, rule_name, rule_type, property_id, room_id')
    .eq('property_id', room.property_id)
    .is('room_id', null);

  console.log(`\n📦 Available Property-Level Payment Rules (${allRules?.length || 0}):`);
  if (allRules && allRules.length > 0) {
    allRules.forEach((rule, i) => {
      const isAssigned = assignments?.some(a => a.payment_rule_id === rule.id);
      console.log(`   ${i + 1}. ${rule.rule_name} (${rule.rule_type})`);
      console.log(`      ID: ${rule.id}`);
      console.log(`      Assigned to King Room: ${isAssigned ? '✅ YES' : '❌ NO'}\n`);
    });
  }

  console.log('\n✅ Check complete!');
}

checkPaymentRules()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
