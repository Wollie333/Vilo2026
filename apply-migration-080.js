/**
 * Apply Migration 080: Create Refund Notification Templates
 * This migration adds all 12 notification templates for the refund system
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📧 Applying Migration 080: Refund Notification Templates');
console.log('='.repeat(80));
console.log('');

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = './backend/migrations/080_create_refund_notification_templates.sql';
    console.log(`📄 Reading migration file: ${migrationPath}`);

    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('✅ Migration file loaded successfully');
    console.log('');
    console.log('📝 IMPORTANT: This migration contains INSERT statements.');
    console.log('   You need to run this SQL in Supabase SQL Editor manually.');
    console.log('');
    console.log('🔗 Steps to apply:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Create a new query');
    console.log('   3. Copy the SQL from backend/migrations/080_create_refund_notification_templates.sql');
    console.log('   4. Run the query');
    console.log('');
    console.log('📋 Or use this command with psql:');
    console.log('   psql "YOUR_DATABASE_URL" < backend/migrations/080_create_refund_notification_templates.sql');
    console.log('');

    // Try to verify if templates already exist
    console.log('🔍 Checking current template status...');

    const requiredTemplates = [
      'refund_requested',
      'refund_approved',
      'refund_rejected',
      'refund_processing_started',
      'refund_processing_completed',
      'refund_processing_failed',
      'refund_completed',
      'refund_cancelled',
      'refund_comment_from_guest',
      'refund_comment_from_admin',
      'refund_document_uploaded',
      'refund_document_verified',
    ];

    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('template_key')
      .in('template_key', requiredTemplates);

    if (error) {
      console.error('❌ Error checking templates:', error.message);
      return;
    }

    const foundTemplates = templates?.map((t) => t.template_key) || [];
    const missingTemplates = requiredTemplates.filter((t) => !foundTemplates.includes(t));

    console.log('');
    console.log('Current Status:');
    console.log(`  Found: ${foundTemplates.length}/12 templates`);
    console.log(`  Missing: ${missingTemplates.length}/12 templates`);

    if (missingTemplates.length > 0) {
      console.log('');
      console.log('Missing Templates:');
      missingTemplates.forEach((t) => console.log(`  ❌ ${t}`));
      console.log('');
      console.log('⚠️  ACTION REQUIRED: Apply migration 080 in Supabase SQL Editor');
    } else {
      console.log('');
      console.log('✅ All notification templates are already present!');
      console.log('   Migration 080 has been applied successfully.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();
