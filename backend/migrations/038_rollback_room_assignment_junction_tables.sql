-- ============================================================================
-- Rollback Migration: 038_create_room_assignment_junction_tables.sql
-- Description: Rollback script to remove junction tables and restore direct FKs
-- Author: Claude
-- Date: 2026-01-09
-- ============================================================================

-- Drop views
DROP VIEW IF EXISTS public.promotions_with_room_count;
DROP VIEW IF EXISTS public.addons_with_room_count;
DROP VIEW IF EXISTS public.payment_rules_with_room_count;

-- Restore NOT NULL constraints (if you want to fully revert)
-- Note: This will fail if there are rows with NULL room_id
-- ALTER TABLE public.room_payment_rules ALTER COLUMN room_id SET NOT NULL;
-- ALTER TABLE public.room_promotions ALTER COLUMN room_id SET NOT NULL;

-- Remove deprecation comments
COMMENT ON COLUMN public.room_payment_rules.room_id IS NULL;
COMMENT ON COLUMN public.room_promotions.room_id IS NULL;
COMMENT ON COLUMN public.add_ons.room_ids IS NULL;

-- Drop junction tables (CASCADE will drop foreign key constraints)
DROP TABLE IF EXISTS public.room_promotion_assignments CASCADE;
DROP TABLE IF EXISTS public.room_addon_assignments CASCADE;
DROP TABLE IF EXISTS public.room_payment_rule_assignments CASCADE;
