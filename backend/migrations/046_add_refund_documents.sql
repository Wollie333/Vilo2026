-- =====================================================
-- MIGRATION 046: Add Refund Documents Table
-- Purpose: Enable guests to upload supporting documents for refund requests
-- Features: File metadata storage, document verification, RLS policies
-- =====================================================

-- Create refund_documents table
CREATE TABLE IF NOT EXISTS refund_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_request_id UUID NOT NULL REFERENCES refund_requests(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
  file_type TEXT NOT NULL CHECK (file_type IN ('application/pdf', 'image/png', 'image/jpeg', 'image/jpg')),
  storage_path TEXT NOT NULL UNIQUE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('receipt', 'proof_of_cancellation', 'bank_statement', 'other')),
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,

  -- Ensure verification fields are consistent
  CONSTRAINT verified_by_requires_verified_at CHECK (
    (verified_by IS NULL AND verified_at IS NULL AND is_verified = false) OR
    (verified_by IS NOT NULL AND verified_at IS NOT NULL AND is_verified = true)
  )
);

-- Create indexes for performance
CREATE INDEX idx_refund_documents_refund ON refund_documents(refund_request_id);
CREATE INDEX idx_refund_documents_uploaded ON refund_documents(uploaded_by);
CREATE INDEX idx_refund_documents_uploaded_at ON refund_documents(uploaded_at DESC);
CREATE INDEX idx_refund_documents_verified ON refund_documents(is_verified) WHERE is_verified = false;

-- Add helpful comments
COMMENT ON TABLE refund_documents IS 'Supporting documents uploaded by guests for refund requests (receipts, proof, etc.)';
COMMENT ON COLUMN refund_documents.file_size IS 'File size in bytes (max 10MB = 10485760 bytes)';
COMMENT ON COLUMN refund_documents.file_type IS 'MIME type of uploaded file (PDF or image only)';
COMMENT ON COLUMN refund_documents.storage_path IS 'Path in Supabase Storage: refunds/{refund_id}/{timestamp}_{filename}';
COMMENT ON COLUMN refund_documents.document_type IS 'Category of document for organization';
COMMENT ON COLUMN refund_documents.is_verified IS 'Admin verification status (guests can see all, but verified status indicates legitimacy)';

-- Add document_count to refund_requests for quick reference
ALTER TABLE refund_requests
ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN refund_requests.document_count IS 'Cached count of uploaded documents (updated via trigger)';

-- =====================================================
-- TRIGGER: Auto-update document count
-- =====================================================

CREATE OR REPLACE FUNCTION update_refund_document_count()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: increment count
  IF TG_OP = 'INSERT' THEN
    UPDATE refund_requests
    SET document_count = document_count + 1
    WHERE id = NEW.refund_request_id;
    RETURN NEW;

  -- On DELETE: decrement count
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE refund_requests
    SET document_count = GREATEST(0, document_count - 1)
    WHERE id = OLD.refund_request_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document count updates
CREATE TRIGGER trg_update_refund_document_count
AFTER INSERT OR DELETE ON refund_documents
FOR EACH ROW
EXECUTE FUNCTION update_refund_document_count();

-- =====================================================
-- STORAGE BUCKET SETUP (Manual step - see comments)
-- =====================================================

-- NOTE: Supabase Storage buckets must be created manually via Dashboard or API
-- Bucket name: refund-documents
-- Public: false (private bucket with RLS)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, image/png, image/jpeg, image/jpg

-- SQL equivalent (requires storage schema access):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'refund-documents',
--   'refund-documents',
--   false,
--   10485760,
--   ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
-- );

-- =====================================================
-- RLS POLICIES for Storage (Manual step)
-- =====================================================

-- NOTE: These policies must be created in Supabase Dashboard > Storage > refund-documents > Policies

-- POLICY 1: Insert (Upload) - Users can upload to their own refund folders
-- CREATE POLICY "Users can upload refund documents"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'refund-documents'
--   AND (storage.foldername(name))[1] IN (
--     SELECT id::text FROM refund_requests WHERE requested_by = auth.uid()
--   )
-- );

-- POLICY 2: Select (Download) - Users can view their own, admins can view all
-- CREATE POLICY "Users can view refund documents"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'refund-documents'
--   AND (
--     -- User can see their own refund documents
--     (storage.foldername(name))[1] IN (
--       SELECT id::text FROM refund_requests WHERE requested_by = auth.uid()
--     )
--     -- OR user is admin/super_admin (check via user_types table)
--     OR EXISTS (
--       SELECT 1 FROM users u
--       JOIN user_types ut ON u.user_type_id = ut.id
--       WHERE u.id = auth.uid()
--         AND ut.name IN ('super_admin', 'saas_team_member')
--     )
--   )
-- );

-- POLICY 3: Delete - Users can delete their own unverified documents
-- CREATE POLICY "Users can delete unverified refund documents"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'refund-documents'
--   AND (storage.foldername(name))[1] IN (
--     SELECT rd.refund_request_id::text
--     FROM refund_documents rd
--     JOIN refund_requests rr ON rd.refund_request_id = rr.id
--     WHERE rd.storage_path = name
--       AND rr.requested_by = auth.uid()
--       AND rd.is_verified = false
--   )
-- );

-- =====================================================
-- MIGRATION VERIFICATION
-- =====================================================

-- Test that table was created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refund_documents') THEN
    RAISE EXCEPTION 'Migration failed: refund_documents table not created';
  END IF;

  -- Test that document_count column was added
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'refund_requests' AND column_name = 'document_count'
  ) THEN
    RAISE EXCEPTION 'Migration failed: document_count column not added to refund_requests';
  END IF;

  -- Test that trigger function exists
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_refund_document_count') THEN
    RAISE EXCEPTION 'Migration failed: update_refund_document_count function not created';
  END IF;

  RAISE NOTICE '✅ Migration 046 completed successfully';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create storage bucket "refund-documents" in Supabase Dashboard';
  RAISE NOTICE '2. Configure RLS policies for storage bucket (see comments above)';
  RAISE NOTICE '3. Test document upload via API endpoints';
END $$;
