/**
 * Check Serengeti Template Data
 */

import { getAdminClient } from '../config/supabase';

async function checkData() {
  const supabase = getAdminClient();

  try {
    console.log('🔍 Checking Serengeti template data...\n');

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('website_templates')
      .select('*')
      .eq('name', 'Serengeti Lodge')
      .single();

    if (templateError) {
      console.error('❌ Template error:', templateError);
      return;
    }

    console.log('✓ Template found:');
    console.log(`  ID: ${template.id}`);
    console.log(`  Name: ${template.name}`);
    console.log(`  Category: ${template.category}`);
    console.log('');

    // Get pages
    const { data: pages, error: pagesError } = await supabase
      .from('website_template_pages')
      .select('*')
      .eq('template_id', template.id)
      .order('sort_order');

    if (pagesError) {
      console.error('❌ Pages error:', pagesError);
    } else {
      console.log(`✓ Pages found: ${pages?.length || 0}`);
      pages?.forEach(page => {
        console.log(`  - ${page.title} (${page.page_type})`);
      });
      console.log('');
    }

    // Get sections
    if (pages && pages.length > 0) {
      for (const page of pages) {
        const { data: sections, error: sectionsError } = await supabase
          .from('website_template_page_sections')
          .select('*')
          .eq('template_page_id', page.id)
          .order('sort_order');

        if (sectionsError) {
          console.error(`❌ Sections error for ${page.title}:`, sectionsError);
        } else {
          console.log(`✓ Sections for ${page.title}: ${sections?.length || 0}`);
          sections?.forEach(section => {
            console.log(`  - ${section.section_name} (${section.section_type})`);
          });
          console.log('');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkData()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
