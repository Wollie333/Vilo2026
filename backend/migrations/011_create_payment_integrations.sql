-- Migration: 011_create_payment_integrations.sql
-- Description: Create payment integrations table for managing payment providers
-- Author: Claude
-- Date: 2026-01-04

-- ============================================================================
-- PAYMENT INTEGRATIONS TABLE
-- Stores payment provider configurations (Paystack, PayPal, EFT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL UNIQUE,       -- 'paystack', 'paypal', 'eft'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  environment VARCHAR(20) DEFAULT 'test',     -- 'test' or 'live'
  config JSONB NOT NULL DEFAULT '{}',         -- API keys stored here (encrypted at app level)
  webhook_secret VARCHAR(255),
  last_verified_at TIMESTAMPTZ,
  verification_status VARCHAR(20) DEFAULT 'unverified', -- 'unverified', 'verified', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.payment_integrations IS 'Payment provider configurations for Paystack, PayPal, and EFT';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_integrations_provider ON public.payment_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_payment_integrations_enabled ON public.payment_integrations(is_enabled);
CREATE INDEX IF NOT EXISTS idx_payment_integrations_primary ON public.payment_integrations(is_primary) WHERE is_primary = true;

-- ============================================================================
-- UPDATE TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_payment_integrations_updated_at ON public.payment_integrations;
CREATE TRIGGER update_payment_integrations_updated_at
  BEFORE UPDATE ON public.payment_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.payment_integrations ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
DROP POLICY IF EXISTS payment_integrations_select_policy ON public.payment_integrations;
CREATE POLICY payment_integrations_select_policy ON public.payment_integrations
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS payment_integrations_insert_policy ON public.payment_integrations;
CREATE POLICY payment_integrations_insert_policy ON public.payment_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS payment_integrations_update_policy ON public.payment_integrations;
CREATE POLICY payment_integrations_update_policy ON public.payment_integrations
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS payment_integrations_delete_policy ON public.payment_integrations;
CREATE POLICY payment_integrations_delete_policy ON public.payment_integrations
  FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- SEED DATA: Default Payment Providers
-- ============================================================================

INSERT INTO public.payment_integrations (provider, display_name, description, is_enabled, is_primary, environment, config)
VALUES
  (
    'paystack',
    'Paystack',
    'Accept payments via cards, bank transfers, and mobile money across Africa.',
    false,
    true,
    'test',
    '{}'::jsonb
  ),
  (
    'paypal',
    'PayPal',
    'Accept payments globally via PayPal accounts and credit/debit cards.',
    false,
    false,
    'test',
    '{}'::jsonb
  ),
  (
    'eft',
    'EFT (Bank Transfer)',
    'Accept manual bank transfers with reference tracking.',
    false,
    false,
    'live',
    '{}'::jsonb
  )
ON CONFLICT (provider) DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.payment_integrations TO service_role;
GRANT SELECT ON public.payment_integrations TO authenticated;
