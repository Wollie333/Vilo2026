-- Migration: 017_update_currency_default_to_zar.sql
-- Description: Update default currency from USD to ZAR (South African Rand) as the SaaS system default
-- Author: Claude
-- Date: 2026-01-04

-- Update existing users who still have USD as their default to ZAR
-- Only update if they haven't explicitly chosen a currency
UPDATE public.users
SET default_currency = 'ZAR'
WHERE default_currency = 'USD' OR default_currency IS NULL;

-- Update the column default for new users
ALTER TABLE public.users
ALTER COLUMN default_currency SET DEFAULT 'ZAR';

-- Update companies default currency to ZAR where it's still USD
UPDATE public.companies
SET default_currency = 'ZAR'
WHERE default_currency = 'USD' OR default_currency IS NULL;

-- Update companies table default
ALTER TABLE public.companies
ALTER COLUMN default_currency SET DEFAULT 'ZAR';
