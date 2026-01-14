/**
 * Check what notification templates exist in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTemplates() {
  console.log('🔍 Checking Notification Templates\n');

  try {
    // First, check the table structure
    console.log('📋 Fetching all notification templates...\n');

    const { data: allTemplates, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!allTemplates || allTemplates.length === 0) {
      console.log('⚠️  No templates found in database');
      return;
    }

    console.log(`✅ Found ${allTemplates.length} templates total\n`);

    // Show all templates
    console.log('All Templates:');
    console.log('='.repeat(80));
    allTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name || template.template_key || 'UNNAMED'}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Active: ${template.is_active ? '✅' : '❌'}`);
      console.log('');
    });

    // Check for refund-specific templates
    const refundTemplates = allTemplates.filter(t =>
      (t.name || '').includes('refund') ||
      (t.template_key || '').includes('refund')
    );

    console.log('='.repeat(80));
    console.log(`Refund Templates: ${refundTemplates.length}`);
    console.log('='.repeat(80));

    if (refundTemplates.length > 0) {
      refundTemplates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name || template.template_key}`);
        console.log(`   Type ID: ${template.notification_type_id || 'N/A'}`);
        console.log(`   Active: ${template.is_active ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    // Check for the refund notification type
    console.log('='.repeat(80));
    console.log('Checking Notification Types:');
    console.log('='.repeat(80));

    const { data: types } = await supabase
      .from('notification_types')
      .select('*');

    if (types) {
      const refundType = types.find(t => t.name === 'refund');
      if (refundType) {
        console.log('✅ Refund notification type exists:');
        console.log(`   ID: ${refundType.id}`);
        console.log(`   Name: ${refundType.name}`);
        console.log(`   Display: ${refundType.display_name}`);
      } else {
        console.log('❌ Refund notification type NOT found');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTemplates();
