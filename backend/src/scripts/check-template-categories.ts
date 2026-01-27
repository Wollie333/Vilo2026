/**
 * Check Template Categories Schema
 */

import { getAdminClient } from '../config/supabase';

async function checkSchema() {
  const supabase = getAdminClient();

  try {
    console.log('🔍 Checking template_categories schema...\n');

    // Try to insert a minimal test record to see what columns are required
    const { data: testData, error: testError } = await supabase
      .from('template_categories')
      .insert({
        name: 'Test Category',
        description: 'Test',
        sort_order: 999,
        is_active: true
      })
      .select();

    if (testError) {
      console.error('❌ Insert error:', testError);
      console.log('\nTrying to select existing records...');

      const { data: existing, error: selectError } = await supabase
        .from('template_categories')
        .select('*')
        .limit(1);

      if (selectError) {
        console.error('❌ Select error:', selectError);
      } else if (existing && existing.length > 0) {
        console.log('✓ Found existing record. Columns:');
        console.log(Object.keys(existing[0]));
      } else {
        console.log('Table is empty and insert failed.');
      }
    } else {
      console.log('✓ Test insert successful. Columns:');
      console.log(Object.keys(testData[0]));

      // Clean up test record
      await supabase
        .from('template_categories')
        .delete()
        .eq('name', 'Test Category');
      console.log('✓ Cleaned up test record');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSchema()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
