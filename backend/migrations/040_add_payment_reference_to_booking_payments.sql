-- Migration: Add payment_reference to booking_payments
-- This allows storing custom payment references (transaction IDs, check numbers, etc.)
-- separate from gateway_reference which is for payment gateway transaction IDs

-- Add payment_reference column
ALTER TABLE public.booking_payments
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_booking_payments_payment_reference
ON public.booking_payments(payment_reference)
WHERE payment_reference IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.booking_payments.payment_reference IS 'Custom payment reference (e.g., check number, transaction ID, reference code)';
