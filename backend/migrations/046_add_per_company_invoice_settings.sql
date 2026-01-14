-- ============================================================================
-- Migration 046: Add Per-Company Invoice Settings
-- ============================================================================
-- Description: Enable company-specific invoice settings while maintaining
--              global admin settings as fallback
-- Date: 2026-01-10
-- ============================================================================

-- ============================================================================
-- Step 1: Add company_id column to invoice_settings
-- ============================================================================

-- Add company_id column (nullable for global settings, not null for company-specific)
ALTER TABLE public.invoice_settings
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.invoice_settings.company_id IS
  'Company ID for company-specific settings. NULL = global admin settings (fallback).';

-- ============================================================================
-- Step 2: Create unique indexes
-- ============================================================================

-- Ensure only one settings record per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_settings_company_id
  ON public.invoice_settings(company_id)
  WHERE company_id IS NOT NULL;

-- Ensure only one global settings record (where company_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_settings_global
  ON public.invoice_settings((company_id IS NULL))
  WHERE company_id IS NULL;

-- Add index for efficient company lookups
CREATE INDEX IF NOT EXISTS idx_invoice_settings_company_lookup
  ON public.invoice_settings(company_id)
  WHERE company_id IS NOT NULL;

-- ============================================================================
-- Step 3: Row-Level Security (RLS) Policies
-- ============================================================================

-- Drop existing policies (will recreate with company_id support)
DROP POLICY IF EXISTS "Super admins can manage all invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "invoice_settings_admin_all" ON public.invoice_settings;

-- Enable RLS (if not already enabled)
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policy 1: Users can view their company settings + global settings
-- ============================================================================
CREATE POLICY "Users can view their company and global invoice settings"
  ON public.invoice_settings FOR SELECT
  TO authenticated
  USING (
    -- Can see global settings (company_id IS NULL)
    company_id IS NULL
    OR
    -- Can see their own company's settings
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoice_settings.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Policy 2: Users can create invoice settings for their own companies
-- ============================================================================
CREATE POLICY "Users can create their company invoice settings"
  ON public.invoice_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must provide a company_id (cannot create global settings)
    company_id IS NOT NULL
    AND
    -- Must own the company
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoice_settings.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Policy 3: Users can update their company settings
-- ============================================================================
CREATE POLICY "Users can update their company invoice settings"
  ON public.invoice_settings FOR UPDATE
  TO authenticated
  USING (
    -- Can only update company-specific settings (not global)
    company_id IS NOT NULL
    AND
    -- Must own the company
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoice_settings.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same check for updated data
    company_id IS NOT NULL
    AND
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoice_settings.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Policy 4: Users can delete their company settings
-- ============================================================================
CREATE POLICY "Users can delete their company invoice settings"
  ON public.invoice_settings FOR DELETE
  TO authenticated
  USING (
    -- Can only delete company-specific settings (not global)
    company_id IS NOT NULL
    AND
    -- Must own the company
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoice_settings.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Policy 5: Admins can manage ALL settings (including global)
-- ============================================================================
CREATE POLICY "Admins can manage all invoice settings"
  ON public.invoice_settings FOR ALL
  TO authenticated
  USING (
    public.is_admin_or_super()
  )
  WITH CHECK (
    public.is_admin_or_super()
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries (run these to test):
--
-- 1. Check global settings still exist:
-- SELECT * FROM public.invoice_settings WHERE company_id IS NULL;
--
-- 2. Create a test company-specific setting:
-- INSERT INTO public.invoice_settings (company_id, company_name, invoice_prefix, next_invoice_number, currency)
-- VALUES ('your-company-uuid', 'Test Company', 'TEST', 1, 'ZAR');
--
-- 3. Verify unique constraints work:
-- Try inserting duplicate company_id - should fail
-- Try inserting second NULL company_id - should fail
