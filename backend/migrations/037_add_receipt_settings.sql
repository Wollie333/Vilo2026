/**
 * Migration: Add Receipt Settings
 *
 * Adds receipt configuration to invoice_settings table and creates
 * function to generate sequential receipt numbers.
 */

-- ============================================================================
-- Add Receipt Settings to invoice_settings
-- ============================================================================

ALTER TABLE IF EXISTS public.invoice_settings
  ADD COLUMN IF NOT EXISTS receipt_prefix VARCHAR(10) DEFAULT 'RCP',
  ADD COLUMN IF NOT EXISTS receipt_next_sequence INTEGER DEFAULT 1;

COMMENT ON COLUMN public.invoice_settings.receipt_prefix IS 'Prefix for receipt numbers (e.g., RCP)';
COMMENT ON COLUMN public.invoice_settings.receipt_next_sequence IS 'Next sequence number for receipts';

-- ============================================================================
-- Function: Generate Receipt Number
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefix TEXT;
  v_sequence INTEGER;
  v_receipt_number TEXT;
  v_year_month TEXT;
BEGIN
  -- Get current year-month (YYYYMM format)
  v_year_month := TO_CHAR(NOW(), 'YYYYMM');

  -- Get receipt settings for company (or use defaults)
  SELECT
    COALESCE(receipt_prefix, 'RCP'),
    COALESCE(receipt_next_sequence, 1)
  INTO v_prefix, v_sequence
  FROM public.invoice_settings
  WHERE company_id = p_company_id;

  -- If no settings exist, create default settings
  IF NOT FOUND THEN
    INSERT INTO public.invoice_settings (company_id, receipt_prefix, receipt_next_sequence)
    VALUES (p_company_id, 'RCP', 1)
    ON CONFLICT (company_id) DO NOTHING;

    v_prefix := 'RCP';
    v_sequence := 1;
  END IF;

  -- Format: PREFIX-YYYYMM-NNNN (e.g., RCP-202601-0001)
  v_receipt_number := v_prefix || '-' || v_year_month || '-' || LPAD(v_sequence::TEXT, 4, '0');

  -- Increment sequence for next receipt
  UPDATE public.invoice_settings
  SET receipt_next_sequence = receipt_next_sequence + 1,
      updated_at = NOW()
  WHERE company_id = p_company_id;

  RETURN v_receipt_number;
END;
$$;

COMMENT ON FUNCTION public.generate_receipt_number(UUID) IS 'Generates sequential receipt numbers for a company';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant execute on function to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_receipt_number(UUID) TO authenticated;

-- ============================================================================
-- Test Data (Optional - for development)
-- ============================================================================

-- Update existing invoice_settings if they don't have receipt settings
UPDATE public.invoice_settings
SET
  receipt_prefix = COALESCE(receipt_prefix, 'RCP'),
  receipt_next_sequence = COALESCE(receipt_next_sequence, 1)
WHERE receipt_prefix IS NULL OR receipt_next_sequence IS NULL;
