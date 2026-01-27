-- ============================================================================
-- Migration 130: Deprecate Credit Notes Table
-- Description: Standardizes on credit_memos as the single source of truth
--              for credits/refunds. Marks credit_notes as deprecated and
--              prevents new inserts while maintaining backward compatibility.
-- Date: 2026-01-20
-- ============================================================================

-- ============================================================================
-- MARK TABLE AS DEPRECATED
-- ============================================================================

COMMENT ON TABLE public.credit_notes IS
  'DEPRECATED: Use credit_memos instead. This table is maintained for legacy data only. New credits should be created in credit_memos table.';

-- ============================================================================
-- ADD DEPRECATION FLAG
-- ============================================================================

-- Add flag to mark all existing records as deprecated
ALTER TABLE public.credit_notes
  ADD COLUMN IF NOT EXISTS is_deprecated BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.credit_notes.is_deprecated IS
  'Flag indicating this table is deprecated. All records default to true.';

-- Update existing records to be marked as deprecated
UPDATE public.credit_notes
SET is_deprecated = TRUE
WHERE is_deprecated IS NULL OR is_deprecated = FALSE;

-- ============================================================================
-- CREATE UNIFIED VIEW FOR BACKWARD COMPATIBILITY
-- ============================================================================

-- Create view that unions both credit systems for backward compatibility
-- This allows legacy code to continue working while migration to credit_memos completes
CREATE OR REPLACE VIEW public.unified_credits AS
SELECT
  id,
  credit_memo_number AS credit_number,
  'credit_memo' AS credit_source,
  invoice_id,
  refund_request_id,
  booking_id,
  user_id,
  customer_name,
  customer_email,
  customer_phone,
  company_id,
  company_name,
  subtotal_cents AS credit_subtotal_cents,
  tax_cents AS credit_tax_cents,
  tax_rate AS credit_tax_rate,
  total_cents AS credit_total_cents,
  currency,
  line_items,
  status,
  notes,
  reason,
  created_at,
  updated_at,
  created_by,
  issued_at,
  issued_by
FROM public.credit_memos

UNION ALL

SELECT
  id,
  credit_note_number AS credit_number,
  'credit_note' AS credit_source,
  invoice_id,
  NULL AS refund_request_id, -- credit_notes don't have refund_request_id
  booking_id,
  user_id,
  customer_name,
  customer_email,
  customer_phone,
  company_id,
  company_name,
  credit_subtotal_cents,
  credit_tax_cents,
  credit_tax_rate,
  credit_total_cents,
  currency,
  line_items,
  status,
  notes,
  reason,
  created_at,
  updated_at,
  NULL AS created_by, -- credit_notes doesn't have created_by
  issued_at,
  issued_by
FROM public.credit_notes;

COMMENT ON VIEW public.unified_credits IS
  'Unified view of credit_memos and deprecated credit_notes for backward compatibility. Use credit_memos table directly for new code.';

-- ============================================================================
-- PREVENT NEW INSERTS INTO CREDIT_NOTES
-- ============================================================================

-- Create trigger function to block new credit_note inserts
CREATE OR REPLACE FUNCTION prevent_credit_note_insert()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Credit notes are deprecated. Use credit_memos table instead. See migration 130 for details.'
    USING HINT = 'Create credits in credit_memos table',
          ERRCODE = 'feature_not_supported';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_credit_note_insert() IS
  'Trigger function that prevents new inserts into deprecated credit_notes table';

-- Create trigger to prevent inserts
DROP TRIGGER IF EXISTS prevent_new_credit_notes ON public.credit_notes;

CREATE TRIGGER prevent_new_credit_notes
  BEFORE INSERT ON public.credit_notes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_credit_note_insert();

COMMENT ON TRIGGER prevent_new_credit_notes ON public.credit_notes IS
  'Prevents creation of new credit notes - forces use of credit_memos table';

-- ============================================================================
-- MIGRATION SCRIPT FOR EXISTING DATA (optional, run separately if needed)
-- ============================================================================

-- This script migrates any existing credit_notes to credit_memos
-- Run this separately if you have existing credit_notes data
-- It's idempotent and safe to re-run

/*
INSERT INTO public.credit_memos (
  id,
  credit_memo_number,
  invoice_id,
  booking_id,
  user_id,
  customer_name,
  customer_email,
  customer_phone,
  customer_address,
  company_id,
  company_name,
  company_address,
  company_email,
  company_phone,
  company_vat_number,
  company_registration_number,
  subtotal_cents,
  tax_cents,
  tax_rate,
  total_cents,
  currency,
  line_items,
  status,
  notes,
  reason,
  created_at,
  updated_at,
  created_by,
  issued_at,
  issued_by,
  voided_at,
  voided_by,
  void_reason
)
SELECT
  cn.id,
  cn.credit_note_number AS credit_memo_number,
  cn.invoice_id,
  cn.booking_id,
  cn.user_id,
  cn.customer_name,
  cn.customer_email,
  cn.customer_phone,
  cn.customer_address,
  cn.company_id,
  cn.company_name,
  cn.company_address,
  cn.company_email,
  cn.company_phone,
  cn.company_vat_number,
  cn.company_registration_number,
  cn.credit_subtotal_cents,
  cn.credit_tax_cents,
  cn.credit_tax_rate,
  cn.credit_total_cents,
  cn.currency,
  cn.line_items,
  cn.status,
  cn.notes,
  cn.reason,
  cn.created_at,
  cn.updated_at,
  cn.created_by,
  cn.issued_at,
  cn.issued_by,
  cn.voided_at,
  cn.voided_by,
  cn.void_reason
FROM public.credit_notes cn
WHERE NOT EXISTS (
  SELECT 1
  FROM public.credit_memos cm
  WHERE cm.id = cn.id
)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Test 1: Verify trigger prevents inserts
-- INSERT INTO public.credit_notes (invoice_id, user_id, customer_name, customer_email, credit_total_cents, currency, status)
-- VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Test', 'test@example.com', 1000, 'ZAR', 'draft');
-- ^ This should fail with exception message

-- Test 2: Verify unified view works
-- SELECT credit_source, COUNT(*) FROM public.unified_credits GROUP BY credit_source;
-- Should show counts from both credit_memos and credit_notes

-- Test 3: Check deprecation flags
-- SELECT COUNT(*) FROM public.credit_notes WHERE is_deprecated = FALSE; -- Should be 0

-- Test 4: Verify credit_memos table is being used for new credits
-- SELECT COUNT(*) FROM public.credit_memos WHERE created_at > NOW() - INTERVAL '1 day';

-- ============================================================================
-- NOTES
-- ============================================================================

-- Migration Strategy:
-- 1. This migration soft-deprecates credit_notes (doesn't drop the table)
-- 2. Existing credit_notes data remains accessible via unified_credits view
-- 3. New code should use credit_memos exclusively
-- 4. Trigger prevents accidental creation of new credit_notes
-- 5. Run the commented migration script separately if you need to consolidate data

-- Future Cleanup:
-- Once all credit_notes have been migrated to credit_memos and no code references
-- credit_notes directly, the table can be dropped in a future migration:
-- DROP TRIGGER prevent_new_credit_notes ON public.credit_notes;
-- DROP FUNCTION prevent_credit_note_insert();
-- DROP VIEW unified_credits;
-- DROP TABLE credit_notes;

-- Performance Considerations:
-- - Unified view has no performance impact (only used for legacy compatibility)
-- - Trigger adds negligible overhead (only fires on INSERT which is blocked)
-- - No impact on credit_memos table performance
