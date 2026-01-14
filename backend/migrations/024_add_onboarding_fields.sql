-- Migration: Add onboarding tracking fields to users table
-- This enables the multi-step onboarding wizard

-- Add onboarding status columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS selected_plan_id UUID REFERENCES public.subscription_types(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS selected_billing_interval VARCHAR(20) DEFAULT 'monthly';

-- Add check constraint for billing interval
ALTER TABLE public.users
ADD CONSTRAINT check_billing_interval
CHECK (selected_billing_interval IS NULL OR selected_billing_interval IN ('monthly', 'annual'));

-- Index for finding users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding_incomplete
ON public.users (id)
WHERE onboarding_completed_at IS NULL;

-- Index for finding users by their selected plan
CREATE INDEX IF NOT EXISTS idx_users_selected_plan
ON public.users (selected_plan_id)
WHERE selected_plan_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.users.onboarding_completed_at IS 'Timestamp when user completed onboarding wizard (NULL = not completed)';
COMMENT ON COLUMN public.users.onboarding_step IS 'Current onboarding step: 0=not started, 1=profile, 2=company, 3=property, 4=complete';
COMMENT ON COLUMN public.users.selected_plan_id IS 'Subscription plan selected during signup flow';
COMMENT ON COLUMN public.users.selected_billing_interval IS 'Billing interval selected: monthly or annual';
