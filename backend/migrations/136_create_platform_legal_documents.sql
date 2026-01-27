-- ============================================================================
-- Migration: 136_create_platform_legal_documents.sql
-- Description: Create dedicated table for Vilo SaaS platform legal documents
-- Date: 2026-01-22
-- ============================================================================

-- ============================================================================
-- CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  version VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  effective_date TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_document_type CHECK (
    document_type IN ('terms_of_service', 'privacy_policy', 'cookie_policy', 'acceptable_use')
  ),
  CONSTRAINT valid_version_format CHECK (version ~ '^\d+\.\d+(\.\d+)?$')
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for active document lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_platform_legal_documents_active
  ON platform_legal_documents(document_type, is_active)
  WHERE is_active = true;

-- Index for creator lookups (audit trail)
CREATE INDEX IF NOT EXISTS idx_platform_legal_documents_creator
  ON platform_legal_documents(created_by);

-- Index for version queries
CREATE INDEX IF NOT EXISTS idx_platform_legal_documents_type_version
  ON platform_legal_documents(document_type, version);

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE platform_legal_documents IS 'Platform-wide legal documents for Vilo SaaS (separate from property legal docs)';
COMMENT ON COLUMN platform_legal_documents.document_type IS 'Type: terms_of_service, privacy_policy, cookie_policy, acceptable_use';
COMMENT ON COLUMN platform_legal_documents.version IS 'Version string (e.g., 1.0, 1.1, 2.0) - validated by CHECK constraint';
COMMENT ON COLUMN platform_legal_documents.is_active IS 'Only ONE active version per document_type (enforced in service layer)';
COMMENT ON COLUMN platform_legal_documents.effective_date IS 'When this legal document version becomes effective';
COMMENT ON COLUMN platform_legal_documents.created_by IS 'Admin user who created/last modified this document';

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Trigger function already exists from migration 103 (update_updated_at_column)
-- Just create the trigger
DROP TRIGGER IF EXISTS update_platform_legal_documents_updated_at ON platform_legal_documents;
CREATE TRIGGER update_platform_legal_documents_updated_at
  BEFORE UPDATE ON platform_legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE platform_legal_documents ENABLE ROW LEVEL SECURITY;

-- Public can view active documents (for frontend display during signup/login)
CREATE POLICY "Anyone can view active platform legal documents"
  ON platform_legal_documents
  FOR SELECT
  USING (is_active = true);

-- Only super admins and SaaS team can manage (matches pattern from migration 030A)
CREATE POLICY "Super admins can manage platform legal documents"
  ON platform_legal_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'saas_team_member')
    )
  );

-- ============================================================================
-- SEED INITIAL DOCUMENTS
-- ============================================================================

-- Create initial v1.0 documents for each type
INSERT INTO platform_legal_documents (document_type, title, content, version, is_active, effective_date)
VALUES
  (
    'terms_of_service',
    'Vilo Platform Terms of Service',
    '<h1>Vilo Platform Terms of Service</h1><p><em>Last updated: January 2026</em></p><p>Welcome to Vilo. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.</p><h2>1. Acceptance of Terms</h2><p>Content to be customized by SaaS admin...</p>',
    '1.0',
    true,
    NOW()
  ),
  (
    'privacy_policy',
    'Vilo Privacy Policy',
    '<h1>Vilo Privacy Policy</h1><p><em>Last updated: January 2026</em></p><p>This Privacy Policy describes how Vilo collects, uses, and discloses your personal information.</p><h2>1. Information We Collect</h2><p>Content to be customized by SaaS admin...</p>',
    '1.0',
    true,
    NOW()
  ),
  (
    'cookie_policy',
    'Cookie Policy',
    '<h1>Cookie Policy</h1><p><em>Last updated: January 2026</em></p><p>This Cookie Policy explains how Vilo uses cookies and similar technologies.</p><h2>1. What Are Cookies</h2><p>Content to be customized by SaaS admin...</p>',
    '1.0',
    true,
    NOW()
  ),
  (
    'acceptable_use',
    'Acceptable Use Policy',
    '<h1>Acceptable Use Policy</h1><p><em>Last updated: January 2026</em></p><p>This Acceptable Use Policy outlines the rules for using the Vilo platform.</p><h2>1. Prohibited Activities</h2><p>Content to be customized by SaaS admin...</p>',
    '1.0',
    true,
    NOW()
  );

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Show created documents
SELECT
  document_type,
  title,
  version,
  is_active,
  created_at
FROM platform_legal_documents
ORDER BY document_type;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
