-- Migration: 084_add_company_payment_tracking_to_bookings.sql
-- Description: Add company_payment_integration_id to bookings table for tracking which credentials were used
-- Date: 2026-01-15

-- ============================================================================
-- ADD COLUMN TO BOOKINGS TABLE
-- ============================================================================

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS company_payment_integration_id UUID REFERENCES public.company_payment_integrations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.bookings.company_payment_integration_id IS 'The payment integration used to process this booking';

-- ============================================================================
-- CREATE INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_company_payment_integration ON public.bookings(company_payment_integration_id);
