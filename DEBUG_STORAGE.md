# Debug Storage Upload Issue

## Step 1: Run Migration 111
Run `backend/migrations/111_disable_rls_for_storage_bucket.sql` in Supabase SQL Editor

## Step 2: Verify Bucket Settings in Supabase Dashboard
1. Go to **Storage** in Supabase Dashboard
2. Click on `property-website-assets` bucket
3. Check settings:
   - **Public bucket**: Should be **YES** ✓
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: Should include image types

## Step 3: Check if User is Authenticated
Add this temporary debug code to `frontend/src/utils/storage.ts` before the upload:

```typescript
export async function uploadToStorage({
  bucket = 'property-website-assets',
  path,
  file,
  onProgress,
}: UploadOptions): Promise<string> {
  try {
    // DEBUG: Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔐 Auth Debug:', {
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
      authError: authError?.message
    });

    if (!user) {
      throw new Error('User not authenticated. Please log in and try again.');
    }

    // ... rest of existing code
```

## Step 4: Check RLS Policies in Database
Run this query in Supabase SQL Editor:

```sql
-- Check RLS status
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'property_assets%'
ORDER BY policyname;
```

Should return 4 policies:
- property_assets_public_select
- property_assets_auth_insert
- property_assets_auth_update
- property_assets_auth_delete

## Step 5: Test Upload with Supabase UI
1. Go to **Storage** → `property-website-assets` in Supabase Dashboard
2. Try uploading a file manually through the UI
3. If that works, the issue is with auth in the frontend
4. If that fails, the issue is with bucket configuration

## Step 6: Alternative - Use Service Role Key (NOT RECOMMENDED FOR PRODUCTION)
If all else fails, you can temporarily use the service role key for uploads (removes RLS):

In `frontend/src/config/supabase.ts`:
```typescript
// TEMPORARY DEBUG ONLY
export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Add this to .env
);
```

Then in storage.ts, use `supabaseAdmin` instead of `supabase` for upload.
**WARNING**: This bypasses all security. Only use for debugging.

## Expected Behavior
After migration 111, the upload should work if:
1. User is logged in (authenticated)
2. Bucket exists and is public
3. RLS policies are active

## Common Issues
- **"User not authenticated"**: User session expired, need to log in again
- **"Bucket not found"**: Bucket wasn't created, check Supabase Storage
- **"Invalid MIME type"**: File type not allowed in bucket settings
- **"File too large"**: File exceeds 5MB limit
