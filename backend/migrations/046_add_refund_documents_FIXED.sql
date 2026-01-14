-- =====================================================
-- MIGRATION 046: Add Refund Documents Table (FIXED)
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

-- Create indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_refund_documents_refund ON refund_documents(refund_request_id);
CREATE INDEX IF NOT EXISTS idx_refund_documents_uploaded ON refund_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_refund_documents_uploaded_at ON refund_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_documents_verified ON refund_documents(is_verified) WHERE is_verified = false;

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

-- Drop and recreate trigger to ensure it's correct
DROP TRIGGER IF EXISTS trg_update_refund_document_count ON refund_documents;
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
-- )
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RLS POLICIES FOR DOCUMENTS (Placeholder - replaced in migration 081)
-- =====================================================

-- Enable RLS
ALTER TABLE refund_documents ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (idempotent)
DROP POLICY IF EXISTS refund_documents_guest_read ON refund_documents;
DROP POLICY IF EXISTS refund_documents_admin_read ON refund_documents;
DROP POLICY IF EXISTS refund_documents_guest_insert ON refund_documents;
DROP POLICY IF EXISTS refund_documents_admin_insert ON refund_documents;

-- Note: Basic policies are created here but will be replaced
-- by comprehensive policies in migration 081

-- Guest can view their own documents
CREATE POLICY refund_documents_guest_read ON refund_documents
  FOR SELECT
  USING (uploaded_by = auth.uid());

-- Admin can view all documents
CREATE POLICY refund_documents_admin_read ON refund_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin', 'property_manager')
    )
  );

-- Guest can upload documents to their own refunds
CREATE POLICY refund_documents_guest_insert ON refund_documents
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM refund_requests
      WHERE id = refund_request_id
      AND requested_by = auth.uid()
    )
  );

-- Admin can upload documents
CREATE POLICY refund_documents_admin_insert ON refund_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin', 'property_manager')
    )
  );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 046 completed successfully';
  RAISE NOTICE '- Created refund_documents table';
  RAISE NOTICE '- Added document_count to refund_requests';
  RAISE NOTICE '- Created auto-update trigger for document count';
  RAISE NOTICE '- Configured basic RLS policies (will be enhanced in migration 081)';
  RAISE NOTICE '- NOTE: Storage bucket "refund-documents" must be created manually';
END $$;
