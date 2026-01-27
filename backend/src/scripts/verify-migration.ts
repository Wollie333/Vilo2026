/**
 * Verify Migration Script
 * Checks if website_templates tables were created successfully
 */

import { getAdminClient } from '../config/supabase';

async function verifyMigration() {
  const supabase = getAdminClient();

  try {
    console.log('🔍 Verifying migration...\n');

    // Try to query the tables
    console.log('1. Checking website_templates table...');
    const { data: templates, error: templatesError } = await supabase
      .from('website_templates')
      .select('*')
      .limit(1);

    if (templatesError) {
      console.log('  ❌ Error:', templatesError.message);
      console.log('  Details:', templatesError);
    } else {
      console.log('  ✓ Table exists and is accessible');
      console.log('  Current records:', templates?.length || 0);
    }

    console.log('\n2. Checking website_template_pages table...');
    const { data: pages, error: pagesError } = await supabase
      .from('website_template_pages')
      .select('*')
      .limit(1);

    if (pagesError) {
      console.log('  ❌ Error:', pagesError.message);
    } else {
      console.log('  ✓ Table exists and is accessible');
      console.log('  Current records:', pages?.length || 0);
    }

    console.log('\n3. Checking website_template_page_sections table...');
    const { data: sections, error: sectionsError } = await supabase
      .from('website_template_page_sections')
      .select('*')
      .limit(1);

    if (sectionsError) {
      console.log('  ❌ Error:', sectionsError.message);
    } else {
      console.log('  ✓ Table exists and is accessible');
      console.log('  Current records:', sections?.length || 0);
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

verifyMigration()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
