/**
 * Check User Type and Update if Needed
 * Run this to see your current user type and optionally update it
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndUpdateUserType() {
  console.log('🔍 Checking User Types\n');

  try {
    // 1. List all users with their types
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        user_type_id,
        user_type:user_types(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log('📋 Recent Users:');
    console.log('─'.repeat(80));
    users.forEach((user, index) => {
      const userType = user.user_type?.name || 'No type assigned';
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.full_name || 'N/A'}`);
      console.log(`   User Type: ${userType}`);
      console.log(`   User ID: ${user.id}`);
      console.log('');
    });

    // 2. Show available user types
    const { data: userTypes, error: typesError } = await supabase
      .from('user_types')
      .select('id, name, description')
      .order('name');

    if (typesError) {
      console.error('❌ Error fetching user types:', typesError.message);
      return;
    }

    console.log('─'.repeat(80));
    console.log('📝 Available User Types:');
    console.log('─'.repeat(80));
    userTypes.forEach((type, index) => {
      console.log(`${index + 1}. ${type.name}`);
      console.log(`   Description: ${type.description || 'N/A'}`);
      console.log(`   ID: ${type.id}`);
      console.log('');
    });

    // 3. Instructions to update
    console.log('─'.repeat(80));
    console.log('🔧 To Update Your User Type:');
    console.log('─'.repeat(80));
    console.log('Run this SQL in Supabase SQL Editor:\n');
    console.log(`-- Option 1: Update by email`);
    console.log(`UPDATE users`);
    console.log(`SET user_type_id = (SELECT id FROM user_types WHERE name = 'super_admin')`);
    console.log(`WHERE email = 'your-email@example.com';\n`);

    console.log(`-- Option 2: Update by user ID`);
    console.log(`UPDATE users`);
    console.log(`SET user_type_id = (SELECT id FROM user_types WHERE name = 'super_admin')`);
    console.log(`WHERE id = 'your-user-id-here';\n`);

    console.log('─'.repeat(80));
    console.log('📚 User Type Access Levels:');
    console.log('─'.repeat(80));
    console.log('• super_admin - Full system access (recommended for testing)');
    console.log('• property_manager - Can manage properties and refunds for their properties');
    console.log('• saas_team_member - Vilo platform team member');
    console.log('• guest - Regular user, can only manage their own bookings/refunds');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndUpdateUserType();
