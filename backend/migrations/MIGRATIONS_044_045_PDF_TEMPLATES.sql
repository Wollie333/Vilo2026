-- ============================================================================
-- CONSOLIDATED MIGRATION: PDF Template System
-- Migrations 044 & 045: Credit Notes and Bank Details
-- Run this entire file in Supabase SQL Editor
-- ============================================================================
-- Date: 2026-01-10
-- ============================================================================

-- ============================================================================
-- Migration 044: Create Credit Notes Schema
-- Creates credit_notes table and supporting functions for refund tracking
-- ============================================================================

-- ============================================================================
-- Credit Notes Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_note_number VARCHAR(50) NOT NULL UNIQUE,

    -- Reference to original invoice
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date TIMESTAMPTZ NOT NULL,

    -- Reference to booking/user
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,

    -- Sender information (snapshot at credit note creation)
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_email VARCHAR(255),
    company_phone VARCHAR(50),
    company_vat_number VARCHAR(50),
    company_registration_number VARCHAR(50),

    -- Receiver information (snapshot at credit note creation)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,

    -- Credit amounts (all in cents for precision)
    credit_subtotal_cents INTEGER NOT NULL,
    credit_tax_cents INTEGER NOT NULL DEFAULT 0,
    credit_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    credit_total_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

    -- Outstanding balance calculation
    original_invoice_total_cents INTEGER NOT NULL,
    outstanding_balance_cents INTEGER NOT NULL, -- original_total - credit_total

    -- Reason for credit
    reason TEXT NOT NULL,
    credit_type VARCHAR(50) NOT NULL CHECK (credit_type IN ('refund', 'cancellation', 'adjustment', 'error_correction')),

    -- Link to refund request (if applicable)
    refund_request_id UUID REFERENCES public.refund_requests(id) ON DELETE SET NULL,

    -- Line items (JSONB array)
    -- Structure: [{ description, quantity, unit_price_cents, total_cents }]
    -- Note: amounts are negative for credits
    line_items JSONB NOT NULL DEFAULT '[]',

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'void')),

    -- PDF storage
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,

    -- Approval/audit trail
    issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Additional notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice_id ON public.credit_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_user_id ON public.credit_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_booking_id ON public.credit_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_credit_note_number ON public.credit_notes(credit_note_number);
CREATE INDEX IF NOT EXISTS idx_credit_notes_status ON public.credit_notes(status);
CREATE INDEX IF NOT EXISTS idx_credit_notes_created_at ON public.credit_notes(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit notes
CREATE POLICY credit_notes_select_own ON public.credit_notes
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all credit notes
CREATE POLICY credit_notes_select_admin ON public.credit_notes
    FOR SELECT
    TO authenticated
    USING (public.is_admin_or_super());

-- Service role can do everything
CREATE POLICY credit_notes_service_all ON public.credit_notes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Add credit note fields to invoice_settings
-- ============================================================================

ALTER TABLE public.invoice_settings
    ADD COLUMN IF NOT EXISTS credit_note_prefix VARCHAR(10) DEFAULT 'CN',
    ADD COLUMN IF NOT EXISTS credit_note_next_sequence INTEGER DEFAULT 1;

COMMENT ON COLUMN public.invoice_settings.credit_note_prefix IS 'Prefix for credit note numbers (e.g., CN)';
COMMENT ON COLUMN public.invoice_settings.credit_note_next_sequence IS 'Next sequence number for credit notes';

-- ============================================================================
-- Function: Generate Credit Note Number
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_credit_note_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prefix TEXT;
    v_sequence INTEGER;
    v_credit_note_number TEXT;
    v_year_month TEXT;
BEGIN
    -- Get current year-month (YYYYMM format)
    v_year_month := TO_CHAR(NOW(), 'YYYYMM');

    -- Get credit note settings (or use defaults)
    SELECT
        COALESCE(credit_note_prefix, 'CN'),
        COALESCE(credit_note_next_sequence, 1)
    INTO v_prefix, v_sequence
    FROM public.invoice_settings
    LIMIT 1;

    -- If no settings exist, create default settings
    IF NOT FOUND THEN
        INSERT INTO public.invoice_settings (
            company_name,
            credit_note_prefix,
            credit_note_next_sequence
        ) VALUES (
            'Vilo',
            'CN',
            1
        ) ON CONFLICT DO NOTHING;

        v_prefix := 'CN';
        v_sequence := 1;
    END IF;

    -- Format: PREFIX-YYYYMM-NNNN (e.g., CN-202601-0001)
    v_credit_note_number := v_prefix || '-' || v_year_month || '-' || LPAD(v_sequence::TEXT, 4, '0');

    -- Increment sequence for next credit note
    UPDATE public.invoice_settings
    SET credit_note_next_sequence = credit_note_next_sequence + 1,
        updated_at = NOW();

    RETURN v_credit_note_number;
END;
$$;

COMMENT ON FUNCTION public.generate_credit_note_number() IS 'Generates sequential credit note numbers in format CN-YYYYMM-NNNN';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant execute on function to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_credit_note_number() TO authenticated;

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_credit_notes_updated_at
    BEFORE UPDATE ON public.credit_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.credit_notes IS 'Credit notes for refunds, cancellations, and adjustments';
COMMENT ON COLUMN public.credit_notes.credit_note_number IS 'Unique credit note number (CN-YYYYMM-NNNN)';
COMMENT ON COLUMN public.credit_notes.invoice_id IS 'Reference to original invoice';
COMMENT ON COLUMN public.credit_notes.outstanding_balance_cents IS 'Remaining balance: original_invoice_total - credit_total';
COMMENT ON COLUMN public.credit_notes.credit_type IS 'Type of credit: refund, cancellation, adjustment, error_correction';
COMMENT ON COLUMN public.credit_notes.line_items IS 'JSONB array of line items with negative amounts';
COMMENT ON COLUMN public.credit_notes.status IS 'Status: draft, issued, void';


-- ============================================================================
-- Migration 045: Add Bank Details to Invoice Settings
-- Adds bank account information and payment terms for EFT payments
-- ============================================================================

-- Add bank details fields to invoice_settings table
ALTER TABLE public.invoice_settings
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bank_branch_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Payment due within 30 days of invoice date';

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN public.invoice_settings.bank_name IS 'Bank name for EFT payments (e.g., Standard Bank)';
COMMENT ON COLUMN public.invoice_settings.bank_account_number IS 'Bank account number for receiving payments';
COMMENT ON COLUMN public.invoice_settings.bank_branch_code IS 'Bank branch code (e.g., 051-001)';
COMMENT ON COLUMN public.invoice_settings.bank_account_type IS 'Account type (e.g., Current, Savings, Cheque)';
COMMENT ON COLUMN public.invoice_settings.bank_account_holder IS 'Account holder name';
COMMENT ON COLUMN public.invoice_settings.payment_terms IS 'Payment terms text (e.g., Payment due within 30 days)';

-- ============================================================================
-- Update existing invoice_settings with default payment terms if NULL
-- ============================================================================

UPDATE public.invoice_settings
SET payment_terms = 'Payment due within 30 days of invoice date'
WHERE payment_terms IS NULL;


-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- ✅ Credit notes table created with outstanding balance tracking
-- ✅ Sequential credit note numbering function created
-- ✅ Bank details fields added to invoice_settings
-- ✅ RLS policies configured
-- ✅ Indexes created for performance
-- ============================================================================
