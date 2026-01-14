-- ========================================
-- CONSOLIDATED MIGRATION: Invoice & Receipt System
-- Run this entire file in Supabase SQL Editor
-- ========================================


-- ========================================
-- 041_create_storage_rls_policies
-- ========================================

-- Migration 041: Create Storage RLS Policies for Receipts and Invoice Logos
-- NOTE: The storage buckets must be created via Supabase Dashboard first
-- This migration only creates the RLS policies

-- ===========================================================================
-- RLS POLICIES FOR RECEIPTS BUCKET
-- ===========================================================================

-- Policy: Users can read receipts for their company's properties
CREATE POLICY "Users can read their company's receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id::text = (storage.foldername(name))[1]
    AND companies.user_id = auth.uid()
  )
);

-- Policy: Admins can read all receipts
CREATE POLICY "Admins can read all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  public.is_admin_or_super()
);

-- Policy: Service role can manage receipts (for backend operations)
CREATE POLICY "Service role can manage receipts"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'receipts');

-- ===========================================================================
-- RLS POLICIES FOR INVOICE-LOGOS BUCKET
-- ===========================================================================

-- Policy: Anyone can read logos (public bucket)
CREATE POLICY "Anyone can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoice-logos');

-- Policy: Authenticated users can read logos
CREATE POLICY "Authenticated users can read logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoice-logos');

-- Policy: Admins can upload logos
CREATE POLICY "Admins can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-logos' AND
  public.is_admin_or_super()
);

-- Policy: Admins can update logos
CREATE POLICY "Admins can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoice-logos' AND
  public.is_admin_or_super()
);

-- Policy: Admins can delete logos
CREATE POLICY "Admins can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoice-logos' AND
  public.is_admin_or_super()
);

-- Policy: Service role can manage logos (for backend operations)
CREATE POLICY "Service role can manage invoice logos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'invoice-logos');

-- ===========================================================================
-- LOG COMPLETION
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 041 completed: Created RLS policies for receipts and invoice-logos storage buckets';
END $$;



-- ========================================
-- 042_add_booking_invoice_fields
-- ========================================

-- Migration 042: Add Invoice Tracking Fields to Bookings
-- This migration adds fields to track auto-generated invoices for bookings
-- and adds company_id to invoices for better tracking

-- ===========================================================================
-- ADD INVOICE TRACKING TO BOOKINGS TABLE
-- ===========================================================================

-- Add invoice_id reference to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Add timestamp for when invoice was generated
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN public.bookings.invoice_id IS 'Reference to auto-generated invoice for fully paid bookings';
COMMENT ON COLUMN public.bookings.invoice_generated_at IS 'Timestamp when invoice was automatically generated';

-- ===========================================================================
-- ADD COMPANY TRACKING TO INVOICES TABLE
-- ===========================================================================

-- Add company_id to invoices for tracking which company generated it
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.invoices.company_id IS 'Reference to company that generated this invoice (for tracking and reporting)';

-- ===========================================================================
-- CREATE INDEXES
-- ===========================================================================

-- Index for looking up bookings by invoice
CREATE INDEX IF NOT EXISTS idx_bookings_invoice_id
ON public.bookings(invoice_id)
WHERE invoice_id IS NOT NULL;

-- Index for looking up invoices by company
CREATE INDEX IF NOT EXISTS idx_invoices_company_id
ON public.invoices(company_id)
WHERE company_id IS NOT NULL;

-- Index for finding bookings that need invoice generation (fully paid but no invoice)
CREATE INDEX IF NOT EXISTS idx_bookings_needs_invoice
ON public.bookings(id)
WHERE invoice_id IS NULL
AND amount_paid >= total_amount
AND booking_status NOT IN ('cancelled', 'no_show');

-- ===========================================================================
-- UPDATE RLS POLICIES (if needed)
-- ===========================================================================

-- Ensure users can see invoices for their bookings
-- (This should already exist, but we'll check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invoices'
    AND policyname = 'Users can view invoices for their bookings'
  ) THEN
    CREATE POLICY "Users can view invoices for their bookings"
    ON public.invoices FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.bookings
        WHERE bookings.invoice_id = invoices.id
        AND EXISTS (
          SELECT 1 FROM public.properties
          WHERE properties.id = bookings.property_id
          AND properties.owner_id = auth.uid()
        )
      )
    );
  END IF;
END $$;

-- ===========================================================================
-- LOG COMPLETION
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 042 completed: Added invoice tracking fields to bookings and company_id to invoices';
END $$;



-- ========================================
-- 043_add_company_contact_fields_to_invoices
-- ========================================

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


