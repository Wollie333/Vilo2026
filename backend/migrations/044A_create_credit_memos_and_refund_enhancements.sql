-- Migration: 044_create_credit_memos_and_refund_enhancements.sql
-- Description: Create credit memos table and enhance refund management
-- Author: Claude
-- Date: 2026-01-10

-- ============================================================================
-- CREDIT MEMOS TABLE
-- Credit memos are negative invoices representing refunds to customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credit_memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_memo_number VARCHAR(50) NOT NULL UNIQUE,

    -- References
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    refund_request_id UUID REFERENCES public.refund_requests(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,

    -- Customer information (snapshot at time of credit memo generation)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,

    -- Company information (snapshot)
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_email VARCHAR(255),
    company_phone VARCHAR(50),
    company_vat_number VARCHAR(50),
    company_registration_number VARCHAR(50),

    -- Financial details (stored in cents, negative values representing credits)
    subtotal_cents INTEGER NOT NULL,
    tax_cents INTEGER DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_cents INTEGER NOT NULL, -- Negative value (credit amount)
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

    -- Original payment information
    original_payment_method VARCHAR(50),
    original_payment_reference VARCHAR(255),
    original_payment_date TIMESTAMPTZ,

    -- Refund details
    refund_method VARCHAR(50), -- 'original_payment_method', 'bank_transfer', 'manual'
    refund_reference VARCHAR(255),
    refund_processed_at TIMESTAMPTZ,

    -- Line items (JSONB array)
    -- Format: [{ description, quantity, unit_price_cents, total_cents }]
    line_items JSONB NOT NULL DEFAULT '[]',

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'void')),

    -- PDF storage
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT,
    reason TEXT, -- Refund reason

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),

    -- Audit
    issued_by UUID REFERENCES public.users(id),
    issued_at TIMESTAMPTZ
);

COMMENT ON TABLE public.credit_memos IS 'Credit memos for refunds - negative invoices representing credits to customers';
COMMENT ON COLUMN public.credit_memos.credit_memo_number IS 'Unique credit memo number in format CM-YYYYMM-NNNN';
COMMENT ON COLUMN public.credit_memos.total_cents IS 'Negative value representing credit amount (stored in cents)';
COMMENT ON COLUMN public.credit_memos.refund_method IS 'How refund was processed: original_payment_method, bank_transfer, manual';
COMMENT ON COLUMN public.credit_memos.line_items IS 'JSONB array of line items with description, quantity, unit_price_cents, total_cents';

-- ============================================================================
-- INDEXES FOR CREDIT MEMOS
-- ============================================================================

CREATE INDEX idx_credit_memos_user_id ON public.credit_memos(user_id);
CREATE INDEX idx_credit_memos_booking_id ON public.credit_memos(booking_id);
CREATE INDEX idx_credit_memos_invoice_id ON public.credit_memos(invoice_id);
CREATE INDEX idx_credit_memos_refund_request_id ON public.credit_memos(refund_request_id);
CREATE INDEX idx_credit_memos_number ON public.credit_memos(credit_memo_number);
CREATE INDEX idx_credit_memos_created_at ON public.credit_memos(created_at DESC);
CREATE INDEX idx_credit_memos_status ON public.credit_memos(status);

-- ============================================================================
-- ENHANCE REFUND_REQUESTS TABLE
-- Add fields for improved refund tracking and processing
-- ============================================================================

-- Add new columns to existing refund_requests table
ALTER TABLE public.refund_requests
    ADD COLUMN IF NOT EXISTS refund_breakdown JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS suggested_amount DECIMAL(12, 2),
    ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(50),
    ADD COLUMN IF NOT EXISTS calculated_policy_amount DECIMAL(12, 2),
    ADD COLUMN IF NOT EXISTS credit_memo_id UUID REFERENCES public.credit_memos(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS auto_process_failed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS failure_reason TEXT;

COMMENT ON COLUMN public.refund_requests.refund_breakdown IS 'JSONB array of refund transactions: [{payment_id, method, amount, gateway_refund_id, status, processed_at, error_message}]';
COMMENT ON COLUMN public.refund_requests.suggested_amount IS 'System-calculated refund amount based on cancellation policy';
COMMENT ON COLUMN public.refund_requests.cancellation_policy IS 'Cancellation policy type at time of request (flexible, moderate, strict, non-refundable)';
COMMENT ON COLUMN public.refund_requests.calculated_policy_amount IS 'Amount calculated from cancellation policy rules';
COMMENT ON COLUMN public.refund_requests.credit_memo_id IS 'Link to generated credit memo';
COMMENT ON COLUMN public.refund_requests.auto_process_failed IS 'True if automatic refund processing via payment gateway failed';
COMMENT ON COLUMN public.refund_requests.failure_reason IS 'Reason for refund processing failure';

-- Create index for credit_memo_id lookups
CREATE INDEX IF NOT EXISTS idx_refund_requests_credit_memo ON public.refund_requests(credit_memo_id);

-- ============================================================================
-- ENHANCE BOOKINGS TABLE
-- Add refund tracking fields
-- ============================================================================

-- Create refund_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE booking_refund_status AS ENUM ('none', 'partial', 'full');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add refund tracking columns to bookings
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS refund_status booking_refund_status DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS total_refunded DECIMAL(12, 2) DEFAULT 0;

COMMENT ON COLUMN public.bookings.refund_status IS 'Refund status: none (no refunds), partial (some amount refunded), full (fully refunded)';
COMMENT ON COLUMN public.bookings.total_refunded IS 'Total amount refunded across all refund requests';

-- Create index for refund_status
CREATE INDEX IF NOT EXISTS idx_bookings_refund_status ON public.bookings(refund_status);

-- ============================================================================
-- ROW LEVEL SECURITY FOR CREDIT MEMOS
-- ============================================================================

ALTER TABLE public.credit_memos ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit memos
CREATE POLICY credit_memos_select_own ON public.credit_memos
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all credit memos
CREATE POLICY credit_memos_select_admin ON public.credit_memos
    FOR SELECT
    TO authenticated
    USING (public.is_admin_or_super());

-- Service role can do everything
CREATE POLICY credit_memos_service_all ON public.credit_memos
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on credit_memos
CREATE TRIGGER update_credit_memos_updated_at
    BEFORE UPDATE ON public.credit_memos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate suggested refund amount based on cancellation policy
CREATE OR REPLACE FUNCTION calculate_refund_amount(
    p_booking_id UUID,
    p_requested_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    suggested_amount DECIMAL(12, 2),
    policy VARCHAR(50),
    policy_amount DECIMAL(12, 2),
    days_until_checkin INTEGER,
    is_policy_eligible BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking RECORD;
    v_property RECORD;
    v_days_until INTEGER;
    v_refund_percentage DECIMAL(5, 2) := 0;
    v_amount DECIMAL(12, 2);
    v_available_for_refund DECIMAL(12, 2);
BEGIN
    -- Get booking details
    SELECT * INTO v_booking
    FROM bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Calculate available amount for refund (amount_paid - total_refunded)
    v_available_for_refund := COALESCE(v_booking.amount_paid, 0) - COALESCE(v_booking.total_refunded, 0);

    -- Get property cancellation policy
    SELECT cancellation_policy INTO v_property
    FROM properties
    WHERE id = v_booking.property_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Property not found';
    END IF;

    -- Calculate days until check-in (can be negative if past check-in date)
    v_days_until := EXTRACT(DAY FROM (v_booking.check_in_date::TIMESTAMP - p_requested_date::TIMESTAMP));

    -- Determine refund percentage based on policy
    CASE COALESCE(v_property.cancellation_policy, 'moderate')
        WHEN 'flexible' THEN
            -- Flexible: 100% refund up to 24 hours (1 day) before check-in
            IF v_days_until >= 1 THEN
                v_refund_percentage := 100;
            ELSE
                v_refund_percentage := 0;
            END IF;

        WHEN 'moderate' THEN
            -- Moderate: 100% if 5+ days before, 50% if 0-5 days before
            IF v_days_until >= 5 THEN
                v_refund_percentage := 100;
            ELSIF v_days_until >= 0 THEN
                v_refund_percentage := 50;
            ELSE
                v_refund_percentage := 0;
            END IF;

        WHEN 'strict' THEN
            -- Strict: 100% if 14+ days, 50% if 7-14 days, 0% if <7 days
            IF v_days_until >= 14 THEN
                v_refund_percentage := 100;
            ELSIF v_days_until >= 7 THEN
                v_refund_percentage := 50;
            ELSE
                v_refund_percentage := 0;
            END IF;

        WHEN 'non_refundable' THEN
            -- Non-refundable: no refunds
            v_refund_percentage := 0;

        ELSE
            -- Default to moderate policy if unknown
            IF v_days_until >= 5 THEN
                v_refund_percentage := 100;
            ELSIF v_days_until >= 0 THEN
                v_refund_percentage := 50;
            ELSE
                v_refund_percentage := 0;
            END IF;
    END CASE;

    -- Calculate refund amount based on available amount and policy percentage
    v_amount := v_available_for_refund * (v_refund_percentage / 100);

    -- Return the calculation results
    RETURN QUERY SELECT
        v_amount,
        COALESCE(v_property.cancellation_policy, 'moderate')::VARCHAR(50),
        v_amount,
        v_days_until,
        v_refund_percentage > 0;
END;
$$;

COMMENT ON FUNCTION calculate_refund_amount IS 'Calculate suggested refund amount based on booking cancellation policy and days until check-in';

-- ============================================================================
-- CREDIT MEMO NUMBER GENERATION SUPPORT
-- ============================================================================

-- Add next_credit_memo_number to invoice_settings if it doesn't exist
ALTER TABLE public.invoice_settings
    ADD COLUMN IF NOT EXISTS next_credit_memo_number INTEGER DEFAULT 1;

COMMENT ON COLUMN public.invoice_settings.next_credit_memo_number IS 'Next credit memo number for sequential numbering (CM-YYYYMM-NNNN format)';

-- ============================================================================
-- STORAGE BUCKET FOR CREDIT MEMO PDFs
-- ============================================================================

-- Note: Storage buckets need to be created manually via Supabase dashboard or via API
-- Bucket name: credit_memos
-- Public: false (requires authentication)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf

COMMENT ON TABLE public.credit_memos IS 'Storage bucket: credit_memos (create manually if needed)';
