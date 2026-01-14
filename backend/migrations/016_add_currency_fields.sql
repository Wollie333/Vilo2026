-- Migration: 016_add_currency_fields.sql
-- Description: Add default currency fields for currency inheritance chain
-- Author: Claude
-- Date: 2026-01-04

-- ============================================================================
-- CURRENCY INHERITANCE CHAIN
-- User (default_currency) → Company (default_currency) → Property (currency) → Room (currency)
-- Each level can override, or inherit from parent if null
-- ============================================================================

-- Add default_currency to users (system-wide default)
-- Default is ZAR (South African Rand) as this is the SaaS system default
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'ZAR';

-- Add currency to properties (nullable - inherits from company if null)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

-- Add comments for documentation
COMMENT ON COLUMN public.users.default_currency IS 'System-wide default currency (ISO 4217 code). Default: ZAR. Inherited by companies, properties, and rooms.';
COMMENT ON COLUMN public.properties.currency IS 'Property currency override (ISO 4217 code). Inherits from company default_currency if null.';

-- Create index for currency lookups
CREATE INDEX IF NOT EXISTS idx_users_currency ON public.users(default_currency);
CREATE INDEX IF NOT EXISTS idx_properties_currency ON public.properties(currency) WHERE currency IS NOT NULL;
