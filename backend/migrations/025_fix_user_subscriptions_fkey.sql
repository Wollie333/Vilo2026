-- Migration: 025_fix_user_subscriptions_fkey.sql
-- Description: Fix foreign key on user_subscriptions to reference users table (not user_profiles)
-- Author: Claude
-- Date: 2026-01-05

-- Drop the incorrect foreign key constraint (if it exists with wrong reference)
ALTER TABLE public.user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;

-- Recreate with correct reference to users table
ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
