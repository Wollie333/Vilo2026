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
