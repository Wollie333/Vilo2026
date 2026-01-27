/**
 * Check if email management tables exist
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 Checking email management tables...\n');

    // Check if email_templates table exists by trying to query it
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('id, template_key, display_name')
      .limit(5);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Email management tables DO NOT exist');
        console.log('\n📋 Next steps:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Copy contents of: backend/migrations/138_create_email_management_system.sql');
        console.log('3. Paste and click "Run"');
        console.log('\nOr run: node backend/apply-migration-138.js (after I create it)');
        return;
      }
      throw error;
    }

    console.log('✅ Email management tables exist!');
    console.log(`\n📧 Found ${templates?.length || 0} templates:`);
    if (templates && templates.length > 0) {
      templates.forEach(t => {
        console.log(`  - ${t.display_name} (${t.template_key})`);
      });

      // Get total count
      const { count } = await supabase
        .from('email_templates')
        .select('*', { count: 'exact', head: true });

      console.log(`\n📊 Total templates in database: ${count || 0}`);
    } else {
      console.log('\n⚠️  No templates found! Seed data may not have been inserted.');
      console.log('Run the migration again to insert seed data.');
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();
