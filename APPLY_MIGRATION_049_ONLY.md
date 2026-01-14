# Apply Migration 049 - Reviews Schema

## Step 1: Apply Reviews Schema via SQL Editor

1. **Go to Supabase Dashboard → SQL Editor**

2. **Create New Query** (name it: "049 - Create Reviews Schema")

3. **Copy and Paste Migration 049**
   - Open: `backend/migrations/049_create_reviews_schema.sql`
   - Copy ALL content
   - Paste into SQL Editor

4. **Run the Query** (Click "Run" or Ctrl+Enter)

This migration will create:
- ✅ `property_reviews` table
- ✅ Indexes for performance
- ✅ RLS policies
- ✅ `review_sent_at` column on `bookings` table

---

## Step 2: Create Storage Bucket Manually

Storage buckets cannot be created via SQL INSERT (permission error). Create it manually instead:

1. **Go to Supabase Dashboard → Storage**

2. **Click "Create bucket"**

3. **Configure the bucket:**
   - **Name:** `review-photos`
   - **Public:** ✅ Yes (check the box)
   - **File size limit:** `5 MB`
   - **Allowed MIME types:**
     - image/jpeg
     - image/jpg
     - image/png
     - image/webp
     - image/heic

4. **Click "Create bucket"**

---

## Step 3: Apply Storage Policies via SQL Editor

After creating the bucket, apply the RLS policies:

1. **Go back to SQL Editor**

2. **Create New Query** (name it: "050 - Storage Policies")

3. **Copy and paste the following SQL:**

```sql
-- ============================================================================
-- STORAGE POLICIES FOR REVIEW PHOTOS
-- ============================================================================

-- Anyone can view review photos (public access)
CREATE POLICY "Anyone can view review photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');

-- Authenticated users can upload review photos
CREATE POLICY "Authenticated users can upload review photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'review-photos' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own review photos
CREATE POLICY "Users can update their own review photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'review-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'review-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own review photos
CREATE POLICY "Users can delete their own review photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can manage all review photos
CREATE POLICY "Admins can manage all review photos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'review-photos' AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'property_admin')
    )
  );
```

4. **Run the Query**

---

## Step 4: Verify Setup

Run the verification script:

```bash
node verify-review-tables.js
```

You should see:
- ✅ property_reviews table exists
- ✅ review_sent_at column exists on bookings table
- ✅ review-photos bucket exists

---

## If You Get Errors

### Migration 049 errors:
- "already exists" → OK, skip
- "role_name does not exist" → Make sure you're using the FIXED version (uses JOIN with roles table)

### Storage bucket creation:
- If bucket already exists, that's fine - just skip to Step 3
- Make sure "Public" is checked so review photos are accessible

### Storage policies errors:
- "policy already exists" → OK, skip
- Run each policy one at a time if you get errors

---

## Next Steps

Once all 3 steps are complete, you're ready to:
1. Test the backend API
2. Continue building frontend components
