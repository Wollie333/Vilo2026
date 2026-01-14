-- ============================================================================
-- Migration: 039_add_property_id_to_payment_rules.sql (FIXED)
-- Description: Add property_id column to room_payment_rules and room_promotions
--              tables to support property-level rules without room assignment
-- Author: Claude
-- Date: 2026-01-09
-- Issue: BUG-002 - createPaymentRuleGlobal was trying to insert property_id
--        which didn't exist in the schema
-- Fix: Added DROP POLICY IF EXISTS for assignment tables to prevent conflicts
-- ============================================================================

-- ============================================================================
-- ADD PROPERTY_ID COLUMNS
-- ============================================================================

-- Add property_id to room_payment_rules
ALTER TABLE public.room_payment_rules
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

-- Add property_id to room_promotions
ALTER TABLE public.room_promotions
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

-- ============================================================================
-- UPDATE EXISTING RULES WITH PROPERTY_ID (backfill from room_id)
-- ============================================================================

-- Update payment rules that have room_id
UPDATE public.room_payment_rules pr
SET property_id = r.property_id
FROM public.rooms r
WHERE pr.room_id = r.id
AND pr.property_id IS NULL;

-- Update promotions that have room_id
UPDATE public.room_promotions rp
SET property_id = r.property_id
FROM public.rooms r
WHERE rp.room_id = r.id
AND rp.property_id IS NULL;

-- ============================================================================
-- ADD CHECK CONSTRAINTS (only if they don't exist)
-- ============================================================================

-- Payment rules must have either room_id OR property_id (or both for backward compat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_rule_must_have_property'
  ) THEN
    ALTER TABLE public.room_payment_rules
      ADD CONSTRAINT payment_rule_must_have_property CHECK (
        property_id IS NOT NULL OR room_id IS NOT NULL
      );
  END IF;
END $$;

-- Promotions must have either room_id OR property_id (or both for backward compat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promotion_must_have_property'
  ) THEN
    ALTER TABLE public.room_promotions
      ADD CONSTRAINT promotion_must_have_property CHECK (
        property_id IS NOT NULL OR room_id IS NOT NULL
      );
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index on property_id for payment rules
CREATE INDEX IF NOT EXISTS idx_room_payment_rules_property_id
  ON public.room_payment_rules(property_id)
  WHERE property_id IS NOT NULL;

-- Index on property_id for promotions
CREATE INDEX IF NOT EXISTS idx_room_promotions_property_id
  ON public.room_promotions(property_id)
  WHERE property_id IS NOT NULL;

-- ============================================================================
-- UPDATE RLS POLICIES FOR PAYMENT RULES
-- ============================================================================

-- Drop old select policy for payment rules
DROP POLICY IF EXISTS room_payment_rules_select_policy ON public.room_payment_rules;

-- Create new select policy that works with both room_id and property_id
CREATE POLICY room_payment_rules_select_policy
  ON public.room_payment_rules
  FOR SELECT
  USING (
    -- Direct property ownership
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR
    -- Ownership through room
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Drop old insert policy for payment rules
DROP POLICY IF EXISTS room_payment_rules_insert_policy ON public.room_payment_rules;

-- Create new insert policy
CREATE POLICY room_payment_rules_insert_policy
  ON public.room_payment_rules
  FOR INSERT
  WITH CHECK (
    -- Direct property ownership
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR
    -- Ownership through room
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Drop old update policy for payment rules
DROP POLICY IF EXISTS room_payment_rules_update_policy ON public.room_payment_rules;

-- Create new update policy
CREATE POLICY room_payment_rules_update_policy
  ON public.room_payment_rules
  FOR UPDATE
  USING (
    -- Direct property ownership
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR
    -- Ownership through room
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Drop old delete policy for payment rules
DROP POLICY IF EXISTS room_payment_rules_delete_policy ON public.room_payment_rules;

-- Create new delete policy
CREATE POLICY room_payment_rules_delete_policy
  ON public.room_payment_rules
  FOR DELETE
  USING (
    -- Direct property ownership
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR
    -- Ownership through room
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATE RLS POLICIES FOR PROMOTIONS
-- ============================================================================

-- Drop old select policy for promotions
DROP POLICY IF EXISTS room_promotions_select_policy ON public.room_promotions;

-- Create new select policy that works with both room_id and property_id
CREATE POLICY room_promotions_select_policy
  ON public.room_promotions
  FOR SELECT
  USING (
    -- Direct property ownership
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR
    -- Ownership through room
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Drop old insert policy for promotions
DROP POLICY IF EXISTS room_promotions_insert_policy ON public.room_promotions;

-- Create new insert policy
CREATE POLICY room_promotions_insert_policy
  ON public.room_promotions
  FOR INSERT
  WITH CHECK (
    -- Direct property ownership
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR
    -- Ownership through room
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Drop old update policy for promotions
DROP POLICY IF EXISTS room_promotions_update_policy ON public.room_promotions;

-- Create new update policy
CREATE POLICY room_promotions_update_policy
  ON public.room_promotions
  FOR UPDATE
  USING (
    -- Direct property ownership
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR
    -- Ownership through room
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Drop old delete policy for promotions
DROP POLICY IF EXISTS room_promotions_delete_policy ON public.room_promotions;

-- Create new delete policy
CREATE POLICY room_promotions_delete_policy
  ON public.room_promotions
  FOR DELETE
  USING (
    -- Direct property ownership
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR
    -- Ownership through room
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATE RLS POLICIES FOR ASSIGNMENT TABLES (FIX FOR EXISTING POLICIES)
-- ============================================================================

-- Drop and recreate policies for room_payment_rule_assignments
DROP POLICY IF EXISTS room_payment_rule_assignments_select_policy ON public.room_payment_rule_assignments;
DROP POLICY IF EXISTS room_payment_rule_assignments_insert_policy ON public.room_payment_rule_assignments;
DROP POLICY IF EXISTS room_payment_rule_assignments_update_policy ON public.room_payment_rule_assignments;
DROP POLICY IF EXISTS room_payment_rule_assignments_delete_policy ON public.room_payment_rule_assignments;

CREATE POLICY room_payment_rule_assignments_select_policy
  ON public.room_payment_rule_assignments
  FOR SELECT
  USING (
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_payment_rule_assignments_insert_policy
  ON public.room_payment_rule_assignments
  FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_payment_rule_assignments_delete_policy
  ON public.room_payment_rule_assignments
  FOR DELETE
  USING (
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- Drop and recreate policies for room_promotion_assignments
DROP POLICY IF EXISTS room_promotion_assignments_select_policy ON public.room_promotion_assignments;
DROP POLICY IF EXISTS room_promotion_assignments_insert_policy ON public.room_promotion_assignments;
DROP POLICY IF EXISTS room_promotion_assignments_update_policy ON public.room_promotion_assignments;
DROP POLICY IF EXISTS room_promotion_assignments_delete_policy ON public.room_promotion_assignments;

CREATE POLICY room_promotion_assignments_select_policy
  ON public.room_promotion_assignments
  FOR SELECT
  USING (
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_promotion_assignments_insert_policy
  ON public.room_promotion_assignments
  FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_promotion_assignments_delete_policy
  ON public.room_promotion_assignments
  FOR DELETE
  USING (
    room_id IN (
      SELECT r.id FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.room_payment_rules.property_id IS
  'Property this rule belongs to. Required for property-level rules (where room_id is NULL).';

COMMENT ON COLUMN public.room_promotions.property_id IS
  'Property this promotion belongs to. Required for property-level promotions (where room_id is NULL).';

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration to verify success)
-- ============================================================================

-- Verify property_id columns exist
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name IN ('room_payment_rules', 'room_promotions') AND column_name = 'property_id';

-- Verify backfill worked
-- SELECT COUNT(*) as total_rules, COUNT(property_id) as rules_with_property_id
-- FROM room_payment_rules;

-- Verify indexes created
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('room_payment_rules', 'room_promotions') AND indexname LIKE '%property_id%';

-- Verify policies updated
-- SELECT policyname, tablename FROM pg_policies
-- WHERE tablename IN ('room_payment_rules', 'room_promotions', 'room_payment_rule_assignments', 'room_promotion_assignments');
