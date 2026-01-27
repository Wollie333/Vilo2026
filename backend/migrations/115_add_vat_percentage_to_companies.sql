-- Migration: 115_add_vat_percentage_to_companies.sql
-- Description: Add vat_percentage field to companies table for configurable VAT/tax rates
-- Date: 2026-01-18

-- ============================================================================
-- ADD VAT PERCENTAGE COLUMN
-- ============================================================================

-- Add vat_percentage column to companies table
-- Default to 15% (South African standard VAT rate)
-- Allow NULL for companies that don't charge VAT
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS vat_percentage DECIMAL(5,2) DEFAULT 15.00 CHECK (vat_percentage >= 0 AND vat_percentage <= 100);

-- Add comment
COMMENT ON COLUMN public.companies.vat_percentage IS 'VAT/Tax percentage rate (0-100). Default 15% for South African VAT. NULL if company does not charge VAT.';

-- ============================================================================
-- INDEX FOR REPORTING
-- ============================================================================

-- Index for filtering companies by VAT percentage (useful for tax reports)
CREATE INDEX IF NOT EXISTS idx_companies_vat_percentage
ON public.companies(vat_percentage)
WHERE vat_percentage IS NOT NULL;
