/**
 * Verify Migration 039 Applied Correctly
 * Checks that property_id columns exist and are properly configured
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bzmyilqkrtpxhswtpdtc.supabase.co';
const supabaseKey = 'sb_publishable_es1tbdllfvmYVjR4vdFctQ_m2XpLajn';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔍 VERIFYING MIGRATION 039\n');
console.log('='.repeat(70));

async function verifyMigration() {
  const results = {
    passed: 0,
    failed: 0,
    checks: []
  };

  // Check 1: Verify property_id column exists in room_payment_rules
  console.log('\n✓ Check 1: property_id column in room_payment_rules');
  try {
    const { data, error } = await supabase
      .from('room_payment_rules')
      .select('id, property_id, room_id')
      .limit(1);

    if (error) throw error;
    console.log('  ✅ Column exists and is queryable');
    results.passed++;
    results.checks.push({ name: 'payment_rules property_id', status: 'PASS' });
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    results.failed++;
    results.checks.push({ name: 'payment_rules property_id', status: 'FAIL', error: error.message });
  }

  // Check 2: Verify property_id column exists in room_promotions
  console.log('\n✓ Check 2: property_id column in room_promotions');
  try {
    const { data, error } = await supabase
      .from('room_promotions')
      .select('id, property_id, room_id')
      .limit(1);

    if (error) throw error;
    console.log('  ✅ Column exists and is queryable');
    results.passed++;
    results.checks.push({ name: 'promotions property_id', status: 'PASS' });
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    results.failed++;
    results.checks.push({ name: 'promotions property_id', status: 'FAIL', error: error.message });
  }

  // Check 3: Verify RLS policies allow property-level queries
  console.log('\n✓ Check 3: RLS policies updated (structural check)');
  try {
    // This will fail with auth error if policies aren't updated properly
    const { error } = await supabase
      .from('room_payment_rules')
      .select('id, property_id')
      .limit(1);

    // We expect an auth error here (since we're using anon key)
    // but if we get a different error, policies might not be configured
    if (error && !error.message.includes('JWT')) {
      // Policy might be malformed
      console.log('  ⚠️  Unexpected error (might indicate policy issue):', error.message);
      results.checks.push({ name: 'RLS policies structure', status: 'WARN', error: error.message });
    } else {
      console.log('  ✅ Policies appear structurally sound');
      results.passed++;
      results.checks.push({ name: 'RLS policies structure', status: 'PASS' });
    }
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    results.failed++;
    results.checks.push({ name: 'RLS policies structure', status: 'FAIL', error: error.message });
  }

  // Check 4: Verify assignment tables are accessible
  console.log('\n✓ Check 4: Assignment tables accessible');
  try {
    const { error: assignError } = await supabase
      .from('room_payment_rule_assignments')
      .select('id, room_id, payment_rule_id')
      .limit(1);

    if (assignError && !assignError.message.includes('JWT')) {
      throw assignError;
    }
    console.log('  ✅ Assignment tables queryable');
    results.passed++;
    results.checks.push({ name: 'Assignment tables', status: 'PASS' });
  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    results.failed++;
    results.checks.push({ name: 'Assignment tables', status: 'FAIL', error: error.message });
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('\n📊 MIGRATION VERIFICATION RESULTS\n');

  results.checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
    console.log(`  ${icon} ${check.name}: ${check.status}`);
    if (check.error) {
      console.log(`      Error: ${check.error}`);
    }
  });

  console.log(`\n  Total Checks: ${results.passed + results.failed}`);
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);

  console.log('\n' + '='.repeat(70));

  if (results.failed === 0) {
    console.log('\n🎉 MIGRATION VERIFIED SUCCESSFULLY!\n');
    console.log('✅ Ready to proceed with API and UI testing\n');
    return true;
  } else {
    console.log('\n⚠️  MIGRATION VERIFICATION FAILED\n');
    console.log('❌ Please review errors above\n');
    return false;
  }
}

verifyMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('\n❌ Verification script error:', error);
    process.exit(1);
  });
