-- ============================================================================
-- Migration 128: Add Invoice Type Discriminator
-- Description: Adds explicit invoice_type enum to distinguish between
--              subscription invoices (SaaS-to-User) and booking invoices (User-to-Guest)
-- Date: 2026-01-20
-- ============================================================================

-- ============================================================================
-- CREATE ENUM TYPE
-- ============================================================================

-- Create invoice_type enum to explicitly distinguish invoice purposes
DO $$ BEGIN
  CREATE TYPE invoice_type AS ENUM ('subscription', 'booking');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE invoice_type IS 'Type of invoice: subscription (SaaS billing users for subscriptions) or booking (property owners billing guests for bookings)';

-- ============================================================================
-- ADD MISSING COLUMNS (if not already added by migrations 035 & 042)
-- ============================================================================

-- Add booking-related columns (from migration 035) if they don't exist
DO $$ BEGIN
  -- Add booking_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_invoices_booking_id
      ON public.invoices(booking_id)
      WHERE booking_id IS NOT NULL;

    COMMENT ON COLUMN public.invoices.booking_id IS 'Reference to booking (for booking invoices)';
  END IF;

  -- Add booking_reference column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'booking_reference'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN booking_reference TEXT;

    COMMENT ON COLUMN public.invoices.booking_reference IS 'Booking reference number (snapshot)';
  END IF;

  -- Add property_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'property_name'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN property_name TEXT;

    COMMENT ON COLUMN public.invoices.property_name IS 'Property name (snapshot for booking invoices)';
  END IF;

  -- Add company_id column if it doesn't exist (from migration 042)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_invoices_company_id
      ON public.invoices(company_id);

    COMMENT ON COLUMN public.invoices.company_id IS 'Reference to company that generated this invoice (for tracking and reporting)';
  END IF;

  -- Add customer_phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN customer_phone TEXT;

    COMMENT ON COLUMN public.invoices.customer_phone IS 'Customer phone number';
  END IF;

  -- Add company_email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'company_email'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN company_email VARCHAR(255);

    COMMENT ON COLUMN public.invoices.company_email IS 'Company email (snapshot)';
  END IF;

  -- Add company_phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'company_phone'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN company_phone VARCHAR(50);

    COMMENT ON COLUMN public.invoices.company_phone IS 'Company phone (snapshot)';
  END IF;
END $$;

-- ============================================================================
-- ADD COLUMN TO INVOICES TABLE
-- ============================================================================

-- Add invoice_type column (nullable initially for backfill)
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_type invoice_type;

COMMENT ON COLUMN public.invoices.invoice_type IS 'Explicit discriminator: subscription = SaaS billing user for plan, booking = property owner billing guest for stay';

-- ============================================================================
-- BACKFILL EXISTING RECORDS
-- ============================================================================

-- Set invoice_type based on existing foreign key relationships
-- Logic:
--   - booking_id IS NOT NULL → booking invoice (user-to-guest)
--   - checkout_id/subscription_id IS NOT NULL → subscription invoice (SaaS-to-user)
--   - Default to subscription for any legacy records
UPDATE public.invoices
SET invoice_type = CASE
  WHEN booking_id IS NOT NULL THEN 'booking'::invoice_type
  WHEN checkout_id IS NOT NULL OR subscription_id IS NOT NULL THEN 'subscription'::invoice_type
  ELSE 'subscription'::invoice_type
END
WHERE invoice_type IS NULL;

-- ============================================================================
-- APPLY NOT NULL CONSTRAINT
-- ============================================================================

-- Now that all records have a type, make it required
ALTER TABLE public.invoices
  ALTER COLUMN invoice_type SET NOT NULL;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- General index for filtering by invoice type
CREATE INDEX IF NOT EXISTS idx_invoices_type
  ON public.invoices(invoice_type);

-- Composite index for subscription invoice queries (user's subscription invoices)
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_type
  ON public.invoices(user_id, invoice_type)
  WHERE invoice_type = 'subscription';

-- Composite index for booking invoice queries (property owner's booking invoices)
CREATE INDEX IF NOT EXISTS idx_invoices_booking_type
  ON public.invoices(company_id, invoice_type)
  WHERE invoice_type = 'booking';

-- Composite index for guest booking invoice queries (via booking_id)
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id_type
  ON public.invoices(booking_id, invoice_type)
  WHERE invoice_type = 'booking';

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Verify all invoices have a type
-- SELECT COUNT(*) FROM public.invoices WHERE invoice_type IS NULL; -- Should be 0

-- Verify subscription invoices have correct structure
-- SELECT COUNT(*) FROM public.invoices
-- WHERE invoice_type = 'subscription' AND (checkout_id IS NULL AND subscription_id IS NULL); -- Should be 0

-- Verify booking invoices have correct structure
-- SELECT COUNT(*) FROM public.invoices
-- WHERE invoice_type = 'booking' AND booking_id IS NULL; -- Should be 0

-- View distribution of invoice types
-- SELECT invoice_type, COUNT(*) FROM public.invoices GROUP BY invoice_type;
