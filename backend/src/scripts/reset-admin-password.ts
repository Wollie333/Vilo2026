/**
 * Reset admin user password
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetPassword() {
  const userId = 'edd6f202-316e-4296-9bff-9f7256472609';
  const newPassword = 'Admin123!';

  console.log('Resetting password for admin user...');

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
    email_confirm: true,
  });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('Password reset successfully!');
  console.log('');
  console.log('Login with:');
  console.log('  Email: admin@vilo.com');
  console.log('  Password: Admin123!');
}

resetPassword();
