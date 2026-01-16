-- Migration: 083_create_company_payment_integrations.sql
-- Description: Create per-company payment gateway credentials for property owners
-- Date: 2026-01-15

-- ============================================================================
-- COMPANY PAYMENT INTEGRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_payment_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,       -- 'paystack', 'paypal', 'eft'
  display_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,    -- Primary method for this company
  environment VARCHAR(20) DEFAULT 'test',     -- 'test' or 'live'
  config JSONB NOT NULL DEFAULT '{}',         -- API keys (encrypted at app level)
  webhook_secret VARCHAR(255),
  last_verified_at TIMESTAMPTZ,
  verification_status VARCHAR(20) DEFAULT 'unverified', -- 'unverified', 'verified', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(company_id, provider)  -- One config per provider per company
);

COMMENT ON TABLE public.company_payment_integrations IS 'Per-company payment provider configurations';
COMMENT ON COLUMN public.company_payment_integrations.company_id IS 'Company/property owner this integration belongs to';
COMMENT ON COLUMN public.company_payment_integrations.config IS 'Provider-specific credentials (public_key, secret_key, etc.)';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_company_payment_integrations_company ON public.company_payment_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_payment_integrations_provider ON public.company_payment_integrations(company_id, provider);
CREATE INDEX IF NOT EXISTS idx_company_payment_integrations_enabled ON public.company_payment_integrations(company_id, is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_company_payment_integrations_primary ON public.company_payment_integrations(company_id, is_primary) WHERE is_primary = true;

-- ============================================================================
-- UPDATE TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_company_payment_integrations_updated_at ON public.company_payment_integrations;
CREATE TRIGGER update_company_payment_integrations_updated_at
  BEFORE UPDATE ON public.company_payment_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.company_payment_integrations ENABLE ROW LEVEL SECURITY;

-- Property owners can view/manage their own company's payment credentials
DROP POLICY IF EXISTS company_payment_integrations_select_policy ON public.company_payment_integrations;
CREATE POLICY company_payment_integrations_select_policy ON public.company_payment_integrations
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_payment_integrations_insert_policy ON public.company_payment_integrations;
CREATE POLICY company_payment_integrations_insert_policy ON public.company_payment_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_super_admin()
    OR company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_payment_integrations_update_policy ON public.company_payment_integrations;
CREATE POLICY company_payment_integrations_update_policy ON public.company_payment_integrations
  FOR UPDATE
  TO authenticated
  USING (
    is_super_admin()
    OR company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_super_admin()
    OR company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS company_payment_integrations_delete_policy ON public.company_payment_integrations;
CREATE POLICY company_payment_integrations_delete_policy ON public.company_payment_integrations
  FOR DELETE
  TO authenticated
  USING (
    is_super_admin()
    OR company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.company_payment_integrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_payment_integrations TO authenticated;

-- ============================================================================
-- HELPER FUNCTION: Get Company's Primary Payment Integration
-- ============================================================================

CREATE OR REPLACE FUNCTION get_company_primary_payment_integration(p_company_id UUID)
RETURNS TABLE (
  id UUID,
  provider VARCHAR(50),
  is_enabled BOOLEAN,
  environment VARCHAR(20),
  config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cpi.id,
    cpi.provider,
    cpi.is_enabled,
    cpi.environment,
    cpi.config
  FROM public.company_payment_integrations cpi
  WHERE cpi.company_id = p_company_id
    AND cpi.is_primary = true
    AND cpi.is_enabled = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_company_primary_payment_integration IS 'Get the primary enabled payment integration for a company';
