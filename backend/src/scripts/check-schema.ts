/**
 * Check Schema Script
 * Verifies what columns exist in website_templates table
 */

import { getAdminClient } from '../config/supabase';

async function checkSchema() {
  const supabase = getAdminClient();

  try {
    console.log('🔍 Checking website_templates schema...\n');

    // Try to select from the table to see what columns are available
    const { data, error } = await supabase
      .from('website_templates')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying table:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✓ Table columns found:');
      console.log(Object.keys(data[0]));
    } else {
      console.log('Table exists but is empty. Trying to insert minimal record...');

      const { data: insertData, error: insertError } = await supabase
        .from('website_templates')
        .insert({
          name: 'Test Template',
          description: 'Test',
          is_active: true
        })
        .select();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
      } else {
        console.log('✓ Successfully inserted test record');
        console.log('Columns:', Object.keys(insertData[0]));

        // Delete test record
        await supabase
          .from('website_templates')
          .delete()
          .eq('name', 'Test Template');
        console.log('✓ Cleaned up test record');
      }
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
