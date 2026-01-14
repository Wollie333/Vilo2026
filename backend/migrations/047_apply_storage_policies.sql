-- =====================================================
-- MIGRATION 047: Apply Storage RLS Policies
-- Purpose: Set up access control for refund-documents bucket
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing policies (safe to run multiple times)
DROP POLICY IF EXISTS "Users can upload refund documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view refund documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete unverified refund documents" ON storage.objects;

-- =====================================================
-- POLICY 1: Upload (INSERT)
-- Users can upload documents to their own refund folders
-- =====================================================
CREATE POLICY "Users can upload refund documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'refund-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM refund_requests WHERE requested_by = auth.uid()
  )
);

-- =====================================================
-- POLICY 2: Download (SELECT)
-- Users can view their own documents, admins can view all
-- =====================================================
CREATE POLICY "Users can view refund documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'refund-documents'
  AND (
    -- User can see their own refund documents
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM refund_requests WHERE requested_by = auth.uid()
    )
    -- OR user is admin/super_admin
    OR EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name IN ('super_admin', 'saas_team_member')
    )
  )
);

-- =====================================================
-- POLICY 3: Delete
-- Users can delete their own unverified documents only
-- =====================================================
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

-- =====================================================
-- VERIFICATION: List all policies for refund-documents
-- =====================================================
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
WHERE tablename = 'objects'
  AND (
    policyname LIKE '%refund%'
    OR qual::text LIKE '%refund-documents%'
    OR with_check::text LIKE '%refund-documents%'
  )
ORDER BY policyname;
