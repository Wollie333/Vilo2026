-- Migration: 092_create_company_whatsapp_config.sql
-- Description: Create company-specific WhatsApp Business API configuration table
-- Date: 2026-01-15
--
-- This migration enables multi-tenant WhatsApp integration where each company
-- can configure their own Meta WhatsApp Business API credentials securely.

-- ============================================================================
-- CREATE COMPANY WHATSAPP CONFIG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Encrypted Credentials (AES-256-CBC)
  -- Format: "iv:encryptedData" where IV is hex-encoded initialization vector
  phone_number_id_encrypted TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  webhook_secret_encrypted TEXT,

  -- Configuration
  api_version VARCHAR(20) NOT NULL DEFAULT 'v18.0',
  is_active BOOLEAN NOT NULL DEFAULT false,
  environment VARCHAR(20) NOT NULL DEFAULT 'test', -- 'test' or 'production'

  -- Connection Verification
  last_verified_at TIMESTAMPTZ,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified', -- unverified, verified, failed
  verification_error TEXT,

  -- Audit Fields
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_environment CHECK (environment IN ('test', 'production')),
  CONSTRAINT valid_verification_status CHECK (verification_status IN ('unverified', 'verified', 'failed'))
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for fast lookup by company
CREATE INDEX IF NOT EXISTS idx_company_whatsapp_config_company_id
  ON public.company_whatsapp_config(company_id);

-- Index for active configs
CREATE INDEX IF NOT EXISTS idx_company_whatsapp_config_active
  ON public.company_whatsapp_config(is_active)
  WHERE is_active = true;

-- Index for verification status
CREATE INDEX IF NOT EXISTS idx_company_whatsapp_config_verification
  ON public.company_whatsapp_config(verification_status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.company_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Policy: Company owners can view their own company's WhatsApp config
CREATE POLICY company_whatsapp_config_select_policy
  ON public.company_whatsapp_config
  FOR SELECT
  TO authenticated
  USING (
    -- Super admin can see all configs
    is_super_admin()
    OR
    -- Company owner can see their own company's config
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Policy: Company owners can insert config for their own company
CREATE POLICY company_whatsapp_config_insert_policy
  ON public.company_whatsapp_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Super admin can insert for any company
    is_super_admin()
    OR
    -- Company owner can insert for their own company
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Policy: Company owners can update their own company's config
CREATE POLICY company_whatsapp_config_update_policy
  ON public.company_whatsapp_config
  FOR UPDATE
  TO authenticated
  USING (
    -- Super admin can update any config
    is_super_admin()
    OR
    -- Company owner can update their own company's config
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Ensure company_id doesn't change to another company
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- Policy: Company owners can delete their own company's config
CREATE POLICY company_whatsapp_config_delete_policy
  ON public.company_whatsapp_config
  FOR DELETE
  TO authenticated
  USING (
    -- Super admin can delete any config
    is_super_admin()
    OR
    -- Company owner can delete their own company's config
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at on row changes
CREATE TRIGGER update_company_whatsapp_config_updated_at
  BEFORE UPDATE ON public.company_whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table was created
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'company_whatsapp_config'
ORDER BY ordinal_position;

-- Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'company_whatsapp_config';

-- Show RLS policies
SELECT
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'company_whatsapp_config'
ORDER BY policyname;
