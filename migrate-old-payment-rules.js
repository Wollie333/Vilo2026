/**
 * Migrate Old-Style Payment Rules to Junction Table Pattern
 *
 * Finds payment rules with room_id set directly and creates junction table assignments
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateOldRules() {
  console.log('\n=== Migrating Old-Style Payment Rules ===\n');

  // Find all old-style rules (room_id is not null)
  const { data: oldRules, error: fetchError } = await supabase
    .from('room_payment_rules')
    .select('id, rule_name, room_id, property_id')
    .not('room_id', 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching old rules:', fetchError);
    return;
  }

  if (!oldRules || oldRules.length === 0) {
    console.log('✅ No old-style rules to migrate. All good!\n');
    process.exit(0);
    return;
  }

  console.log(`Found ${oldRules.length} old-style rules to migrate:\n`);

  for (const rule of oldRules) {
    console.log(`📝 Migrating: "${rule.rule_name}" (rule_id: ${rule.id}, room_id: ${rule.room_id})`);

    // Step 1: Get room's property_id
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('property_id')
      .eq('id', rule.room_id)
      .single();

    if (roomError || !room) {
      console.error('   ❌ Could not find room, skipping...');
      console.log('');
      continue;
    }

    // Step 2: Create junction table assignment
    const { error: insertError } = await supabase
      .from('room_payment_rule_assignments')
      .insert({
        room_id: rule.room_id,
        payment_rule_id: rule.id,
        assigned_at: new Date().toISOString(),
      });

    if (insertError) {
      // Check if it's a duplicate (already exists)
      if (insertError.code === '23505') {
        console.log('   ℹ️  Assignment already exists');
      } else {
        console.error('   ❌ Error creating assignment:', insertError.message);
        console.log('');
        continue;
      }
    } else {
      console.log('   ✅ Created junction table assignment');
    }

    // Step 3: Convert to property-level rule (set property_id and room_id=null in single update)
    const { error: updateError } = await supabase
      .from('room_payment_rules')
      .update({
        property_id: room.property_id,
        room_id: null
      })
      .eq('id', rule.id);

    if (updateError) {
      console.error('   ❌ Error converting to property-level:', updateError.message);
    } else {
      console.log('   ✅ Converted to property-level rule');
    }

    console.log('');
  }

  console.log('🎉 Migration complete!\n');
  console.log('Next steps:');
  console.log('1. Refresh the room details page');
  console.log('2. Payment rules should now appear in the tab\n');

  process.exit(0);
}

migrateOldRules().catch(console.error);
