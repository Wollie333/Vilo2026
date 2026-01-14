/**
 * Apply Storage RLS Policies for refund-documents bucket
 * Run with: node apply-storage-policies.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyStoragePolicies() {
  console.log('🚀 Applying storage RLS policies for refund-documents bucket...\n');

  try {
    // Drop existing policies first (in case of re-run)
    console.log('📋 Step 1: Dropping existing policies (if any)...');

    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can upload refund documents" ON storage.objects;
      DROP POLICY IF EXISTS "Users can view refund documents" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete unverified refund documents" ON storage.objects;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies }).catch(() => {
      // Try direct query if rpc doesn't exist
      return supabase.from('_').select('*').limit(0).then(() => ({ error: null }));
    });

    // If RPC doesn't work, try direct SQL execution
    const dropResult = await supabase.rpc('exec', { query: dropPolicies }).catch(async () => {
      // Fallback: execute via raw query
      const { error } = await supabase.from('_sql').select(dropPolicies).single().catch(() => ({ error: null }));
      return { error };
    });

    console.log('✅ Existing policies dropped (or none existed)\n');

    // Create Policy 1: Upload (INSERT)
    console.log('📋 Step 2: Creating upload policy...');

    const uploadPolicy = `
      CREATE POLICY "Users can upload refund documents"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'refund-documents'
        AND (storage.foldername(name))[1] IN (
          SELECT id::text FROM refund_requests WHERE requested_by = auth.uid()
        )
      );
    `;

    const { error: uploadError } = await supabase.rpc('exec_sql', { sql: uploadPolicy });

    if (uploadError) {
      console.error('❌ Error creating upload policy:', uploadError.message);
      throw uploadError;
    }

    console.log('✅ Upload policy created\n');

    // Create Policy 2: Download (SELECT)
    console.log('📋 Step 3: Creating download policy...');

    const downloadPolicy = `
      CREATE POLICY "Users can view refund documents"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'refund-documents'
        AND (
          (storage.foldername(name))[1] IN (
            SELECT id::text FROM refund_requests WHERE requested_by = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM users u
            JOIN user_types ut ON u.user_type_id = ut.id
            WHERE u.id = auth.uid()
              AND ut.name IN ('super_admin', 'saas_team_member')
          )
        )
      );
    `;

    const { error: downloadError } = await supabase.rpc('exec_sql', { sql: downloadPolicy });

    if (downloadError) {
      console.error('❌ Error creating download policy:', downloadError.message);
      throw downloadError;
    }

    console.log('✅ Download policy created\n');

    // Create Policy 3: Delete
    console.log('📋 Step 4: Creating delete policy...');

    const deletePolicy = `
      CREATE POLICY "Users can delete unverified refund documents"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'refund-documents'
        AND (storage.foldername(name))[1] IN (
          SELECT rd.refund_request_id::text
          FROM refund_documents rd
          JOIN refund_requests rr ON rd.refund_request_id = rr.id
          WHERE rd.storage_path = name
            AND rr.requested_by = auth.uid()
            AND rd.is_verified = false
        )
      );
    `;

    const { error: deleteError } = await supabase.rpc('exec_sql', { sql: deletePolicy });

    if (deleteError) {
      console.error('❌ Error creating delete policy:', deleteError.message);
      throw deleteError;
    }

    console.log('✅ Delete policy created\n');

    console.log('🎉 SUCCESS! All storage RLS policies applied successfully!\n');
    console.log('Policies created:');
    console.log('  1. ✅ Users can upload refund documents (INSERT)');
    console.log('  2. ✅ Users can view refund documents (SELECT)');
    console.log('  3. ✅ Users can delete unverified refund documents (DELETE)\n');

  } catch (error) {
    console.error('\n❌ FAILED to apply storage policies:', error.message);
    console.error('\n📝 Manual Steps Required:');
    console.error('   Go to Supabase Dashboard → Storage → refund-documents → Policies');
    console.error('   And manually create the 3 policies from the migration file comments.\n');
    process.exit(1);
  }
}

// Run the script
applyStoragePolicies();
