require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteWollieAccount() {
  const email = 'wollie333@gmail.com';

  console.log(`=== Deleting ${email} from all tables ===\n`);

  try {
    // 1. Check if exists in public.users
    const { data: publicUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (publicUser) {
      console.log(`✓ Found in public.users: ${publicUser.id}`);

      // Delete from public.users
      const { error: deletePublicError } = await supabase
        .from('users')
        .delete()
        .eq('email', email);

      if (deletePublicError) {
        console.error('Error deleting from public.users:', deletePublicError);
      } else {
        console.log('✓ Deleted from public.users');
      }
    } else {
      console.log('✗ Not found in public.users');
    }

    // 2. Check if exists in auth.users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing auth users:', listError);
      return;
    }

    const authUser = authUsers.users.find(u => u.email === email);

    if (authUser) {
      console.log(`✓ Found in auth.users: ${authUser.id}`);

      // Delete from auth.users
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUser.id);

      if (deleteAuthError) {
        console.error('Error deleting from auth.users:', deleteAuthError);
      } else {
        console.log('✓ Deleted from auth.users');
      }
    } else {
      console.log('✗ Not found in auth.users');
    }

    console.log('\n=== Verification ===');

    // Verify deletion from public.users
    const { data: checkPublic } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    console.log(`public.users: ${checkPublic ? 'STILL EXISTS ✗' : 'DELETED ✓'}`);

    // Verify deletion from auth.users
    const { data: checkAuthUsers } = await supabase.auth.admin.listUsers();
    const stillInAuth = checkAuthUsers.users.find(u => u.email === email);

    console.log(`auth.users: ${stillInAuth ? 'STILL EXISTS ✗' : 'DELETED ✓'}`);

    console.log('\n=== Complete ===');
    console.log(`You can now create a new account with ${email}`);

  } catch (error) {
    console.error('Unexpected error:', error);
  }

  process.exit(0);
}

deleteWollieAccount().catch(console.error);
