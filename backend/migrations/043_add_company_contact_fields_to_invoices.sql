-- Migration 043: Add Company Contact Fields to Invoices
-- This migration adds company_email and company_phone to invoices table
-- for displaying contact information on invoice PDFs

-- ===========================================================================
-- ADD COMPANY CONTACT FIELDS TO INVOICES TABLE
-- ===========================================================================

-- Add company contact fields for invoice PDF display
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS company_email VARCHAR(255);

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50);

-- Add comments
COMMENT ON COLUMN public.invoices.company_email IS 'Company contact email (snapshot at invoice generation)';
COMMENT ON COLUMN public.invoices.company_phone IS 'Company contact phone (snapshot at invoice generation)';

-- ===========================================================================
-- LOG COMPLETION
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 043 completed: Added company_email and company_phone to invoices table';
END $$;
