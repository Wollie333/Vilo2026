-- Migration: 011_add_trial_period_to_subscriptions.sql
-- Description: Add trial_period_days column to subscription_types table
-- Feature: Billing Settings Enhancement
-- Date: 2026-01-04

-- ============================================================================
-- ADD TRIAL PERIOD DAYS COLUMN
-- Allows subscription types to define a default trial period
-- ============================================================================

ALTER TABLE public.subscription_types
ADD COLUMN IF NOT EXISTS trial_period_days INTEGER DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.subscription_types.trial_period_days IS 'Default trial period in days for this subscription type. NULL means no trial.';

-- Create index for querying plans with trial periods
CREATE INDEX IF NOT EXISTS idx_subscription_types_trial ON public.subscription_types(trial_period_days) WHERE trial_period_days IS NOT NULL;
