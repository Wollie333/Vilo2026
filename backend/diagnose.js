/**
 * Email Template System Diagnostics
 *
 * This script checks if the email management system is set up correctly.
 * Run with: node backend/diagnose.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  console.log('\nMake sure your .env file has:');
  console.log('SUPABASE_URL=https://your-project.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 Email Template System Diagnostics');
  console.log('═══════════════════════════════════════════════════════════\n');

  let allGood = true;

  // =========================================================================
  // Check 1: Tables exist
  // =========================================================================
  console.log('📋 Check 1: Verifying tables exist...');
  try {
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('id')
      .limit(1);

    if (templatesError) {
      if (templatesError.code === '42P01') {
        console.log('   ❌ email_templates table DOES NOT EXIST');
        console.log('   💡 Solution: Run migration 138_create_email_management_system.sql');
        allGood = false;
      } else {
        console.log('   ⚠️  Error accessing email_templates:', templatesError.message);
        allGood = false;
      }
    } else {
      console.log('   ✅ email_templates table exists');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    allGood = false;
  }
  console.log();

  // =========================================================================
  // Check 2: Count templates
  // =========================================================================
  console.log('📊 Check 2: Counting templates...');
  try {
    const { count, error } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ Error counting templates:', error.message);
      allGood = false;
    } else {
      if (count === 16) {
        console.log(`   ✅ Found ${count} templates (expected 16)`);
      } else if (count === 0) {
        console.log(`   ⚠️  Found ${count} templates (expected 16)`);
        console.log('   💡 Solution: Re-run migration 138 to seed templates');
        allGood = false;
      } else {
        console.log(`   ⚠️  Found ${count} templates (expected 16)`);
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    allGood = false;
  }
  console.log();

  // =========================================================================
  // Check 3: List sample templates
  // =========================================================================
  console.log('📧 Check 3: Listing sample templates...');
  try {
    const { data: sampleTemplates, error } = await supabase
      .from('email_templates')
      .select('template_key, display_name, is_active, template_type')
      .order('display_name')
      .limit(5);

    if (error) {
      console.log('   ❌ Error fetching templates:', error.message);
      allGood = false;
    } else if (sampleTemplates && sampleTemplates.length > 0) {
      console.log('   ✅ Sample templates:');
      sampleTemplates.forEach(t => {
        const status = t.is_active ? '🟢 Active' : '⚪ Inactive';
        console.log(`      ${status} - ${t.display_name}`);
        console.log(`         Key: ${t.template_key}`);
        console.log(`         Type: ${t.template_type}`);
      });
    } else {
      console.log('   ⚠️  No templates found');
      allGood = false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    allGood = false;
  }
  console.log();

  // =========================================================================
  // Check 4: Categories
  // =========================================================================
  console.log('📁 Check 4: Checking categories...');
  try {
    const { count, error } = await supabase
      .from('email_template_categories')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ Error counting categories:', error.message);
      allGood = false;
    } else {
      console.log(`   ✅ Found ${count} categories`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    allGood = false;
  }
  console.log();

  // =========================================================================
  // Check 5: Super admin role
  // =========================================================================
  console.log('👤 Check 5: Checking for super admin role...');
  try {
    const { data: role, error } = await supabase
      .from('user_roles')
      .select('id, name, display_name')
      .eq('name', 'super_admin')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ⚠️  super_admin role does not exist');
        console.log('   💡 Solution: Run GRANT_SUPER_ADMIN_SIMPLE.sql to create it');
        allGood = false;
      } else {
        console.log('   ❌ Error checking role:', error.message);
        allGood = false;
      }
    } else {
      console.log('   ✅ super_admin role exists');

      // Count super admins
      const { count: adminCount } = await supabase
        .from('user_user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', role.id);

      console.log(`   ℹ️  ${adminCount} user(s) have super_admin role`);

      if (adminCount === 0) {
        console.log('   ⚠️  No users have super_admin role yet');
        console.log('   💡 Solution: Run GRANT_SUPER_ADMIN_SIMPLE.sql with your email');
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    allGood = false;
  }
  console.log();

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('═══════════════════════════════════════════════════════════');
  if (allGood) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 Next steps:');
    console.log('1. Make sure you have super_admin role (run FIND_MY_EMAIL.sql)');
    console.log('2. If not, run GRANT_SUPER_ADMIN_SIMPLE.sql with your email');
    console.log('3. Log out and log back in to refresh your token');
    console.log('4. Navigate to /admin/email in your browser');
    console.log('5. You should see all 16 templates! 🎉\n');
  } else {
    console.log('⚠️  SOME ISSUES DETECTED');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 Follow the solutions above, then:');
    console.log('1. Fix the issues');
    console.log('2. Run this script again to verify');
    console.log('3. Check DEBUG_EMAIL_TEMPLATES.md for more help\n');
  }
}

diagnose().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
