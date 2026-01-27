/**
 * List Tables Script
 * Shows all tables in the database
 */

import { getAdminClient } from '../config/supabase';

async function listTables() {
  const supabase = getAdminClient();

  try {
    console.log('🔍 Checking for template-related tables...\n');

    const tables = [
      'website_templates',
      'website_template_pages',
      'website_template_page_sections',
      'template_sections',
      'template_categories'
    ];

    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: Does not exist or not accessible`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`✓ ${table}: Exists (${count || 0} records)`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listTables()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
