-- ============================================================================
-- Platform Legal Documents - Verification Script
-- Run this after applying migration 137 to verify everything is set up correctly
-- ============================================================================

-- ============================================================================
-- 1. CHECK TABLE EXISTS
-- ============================================================================
SELECT 'Checking if platform_legal_documents table exists...' as step;

SELECT
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'platform_legal_documents'
  ) as table_exists;

-- ============================================================================
-- 2. CHECK DOCUMENT COUNT
-- ============================================================================
SELECT 'Checking document count (should be 4)...' as step;

SELECT COUNT(*) as document_count
FROM platform_legal_documents;

-- ============================================================================
-- 3. CHECK ALL DOCUMENTS EXIST AND ARE ACTIVE
-- ============================================================================
SELECT 'Checking all document types exist and are active...' as step;

SELECT
  document_type,
  title,
  version,
  is_active,
  LENGTH(content) as content_length,
  created_at,
  updated_at
FROM platform_legal_documents
ORDER BY document_type;

-- Expected results:
-- - acceptable_use: Active, content_length > 5000
-- - cookie_policy: Active, content_length > 5000
-- - privacy_policy: Active, content_length > 8000
-- - terms_of_service: Active, content_length > 10000

-- ============================================================================
-- 4. VERIFY ONLY ONE ACTIVE VERSION PER TYPE
-- ============================================================================
SELECT 'Verifying only one active version per document type...' as step;

SELECT
  document_type,
  COUNT(*) as total_versions,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_versions
FROM platform_legal_documents
GROUP BY document_type;

-- Expected: Each document_type should have active_versions = 1

-- ============================================================================
-- 5. CHECK RLS IS ENABLED
-- ============================================================================
SELECT 'Checking if Row Level Security is enabled...' as step;

SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'platform_legal_documents';

-- Expected: rls_enabled = true

-- ============================================================================
-- 6. CHECK RLS POLICIES EXIST
-- ============================================================================
SELECT 'Checking RLS policies exist...' as step;

SELECT
  policyname,
  cmd as command_type,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'platform_legal_documents'
ORDER BY policyname;

-- Expected: At least 2 policies (public read, admin manage)

-- ============================================================================
-- 7. PREVIEW CONTENT (First 300 characters of each document)
-- ============================================================================
SELECT 'Content preview (first 300 chars of each document)...' as step;

SELECT
  document_type,
  LEFT(content, 300) as content_preview
FROM platform_legal_documents
WHERE is_active = true
ORDER BY document_type;

-- ============================================================================
-- 8. CHECK UPDATED TIMESTAMPS
-- ============================================================================
SELECT 'Checking updated_at timestamps (should be recent)...' as step;

SELECT
  document_type,
  version,
  updated_at,
  AGE(NOW(), updated_at) as time_since_update
FROM platform_legal_documents
ORDER BY document_type;

-- If migration 137 just ran, time_since_update should be very recent (minutes/hours)

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT '============================================================' as divider;
SELECT 'VERIFICATION SUMMARY' as summary;
SELECT '============================================================' as divider;

SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM platform_legal_documents) = 4
      THEN '✅ Document Count: 4 documents exist'
    ELSE '❌ Document Count: Expected 4, found ' || (SELECT COUNT(*) FROM platform_legal_documents)
  END as check_1;

SELECT
  CASE
    WHEN (
      SELECT COUNT(DISTINCT document_type)
      FROM platform_legal_documents
      WHERE is_active = true
    ) = 4
      THEN '✅ Active Documents: All 4 document types have active version'
    ELSE '❌ Active Documents: Not all types have active version'
  END as check_2;

SELECT
  CASE
    WHEN (
      SELECT MIN(LENGTH(content))
      FROM platform_legal_documents
      WHERE is_active = true
    ) > 1000
      THEN '✅ Content Length: All documents have substantial content (>1000 chars)'
    ELSE '❌ Content Length: Some documents have placeholder content (<1000 chars)'
  END as check_3;

SELECT
  CASE
    WHEN (
      SELECT rowsecurity
      FROM pg_tables
      WHERE tablename = 'platform_legal_documents'
    )
      THEN '✅ RLS Enabled: Row Level Security is enabled'
    ELSE '❌ RLS Enabled: Row Level Security is NOT enabled'
  END as check_4;

SELECT
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM pg_policies
      WHERE tablename = 'platform_legal_documents'
    ) >= 2
      THEN '✅ RLS Policies: At least 2 policies exist'
    ELSE '❌ RLS Policies: Missing RLS policies'
  END as check_5;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
SELECT '============================================================' as divider;
SELECT 'NEXT STEPS' as next_steps;
SELECT '============================================================' as divider;

SELECT '1. Start backend server: cd backend && npm run dev' as step_1;
SELECT '2. Start frontend server: cd frontend && npm run dev' as step_2;
SELECT '3. Navigate to: http://localhost:5173/admin/billing#legal-settings' as step_3;
SELECT '4. Log in as super_admin or saas_team_member' as step_4;
SELECT '5. Verify all 4 document types load with comprehensive templates' as step_5;

-- ============================================================================
-- END OF VERIFICATION
-- ============================================================================
