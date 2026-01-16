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
