-- Migration: Create checkouts table for payment processing
-- This table tracks checkout sessions for subscription purchases

-- Helper function: Check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create checkouts table
CREATE TABLE IF NOT EXISTS checkouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type_id UUID NOT NULL REFERENCES subscription_types(id) ON DELETE RESTRICT,
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    payment_provider VARCHAR(20) CHECK (payment_provider IN ('paystack', 'paypal', 'eft')),
    payment_reference VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled')),
    provider_data JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_checkouts_user_id ON checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_status ON checkouts(status);
CREATE INDEX IF NOT EXISTS idx_checkouts_payment_reference ON checkouts(payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checkouts_created_at ON checkouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkouts_expires_at ON checkouts(expires_at) WHERE status = 'pending';

-- Add RLS policies
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own checkouts
CREATE POLICY checkouts_select_own ON checkouts
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own checkouts
CREATE POLICY checkouts_insert_own ON checkouts
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own pending checkouts
CREATE POLICY checkouts_update_own ON checkouts
    FOR UPDATE
    USING (user_id = auth.uid() AND status IN ('pending', 'processing'));

-- Admins can view all checkouts
CREATE POLICY checkouts_select_admin ON checkouts
    FOR SELECT
    USING (public.is_admin_or_super());

-- Admins can update any checkout (for EFT confirmation)
CREATE POLICY checkouts_update_admin ON checkouts
    FOR UPDATE
    USING (public.is_admin_or_super());

-- Create trigger for updated_at
CREATE TRIGGER update_checkouts_updated_at
    BEFORE UPDATE ON checkouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE checkouts IS 'Tracks checkout sessions for subscription purchases with payment provider integration';
