-- Migration: 057_add_property_level_payment_rules.sql
-- Description: Add support for property-level payment rules (in addition to room-level rules)
-- Author: Claude
-- Date: 2026-01-11

-- ============================================================================
-- ADD PROPERTY_ID COLUMN AND MODIFY CONSTRAINTS
-- ============================================================================

-- Add property_id column to support property-level payment rules
ALTER TABLE public.room_payment_rules
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

-- Make room_id nullable since property-level rules won't have a room_id
ALTER TABLE public.room_payment_rules
  ALTER COLUMN room_id DROP NOT NULL;

-- Add constraint: Either room_id OR property_id must be set (but not both, not neither)
ALTER TABLE public.room_payment_rules
  DROP CONSTRAINT IF EXISTS room_or_property_required;

ALTER TABLE public.room_payment_rules
  ADD CONSTRAINT room_or_property_required CHECK (
    (room_id IS NOT NULL AND property_id IS NULL) OR
    (room_id IS NULL AND property_id IS NOT NULL)
  );

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for property-level rules
CREATE INDEX IF NOT EXISTS idx_room_payment_rules_property_id
  ON public.room_payment_rules(property_id)
  WHERE property_id IS NOT NULL;

-- Composite index for active property rules
CREATE INDEX IF NOT EXISTS idx_room_payment_rules_property_active
  ON public.room_payment_rules(property_id, is_active)
  WHERE property_id IS NOT NULL AND is_active = true;

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS room_payment_rules_select_policy ON public.room_payment_rules;
DROP POLICY IF EXISTS room_payment_rules_insert_policy ON public.room_payment_rules;
DROP POLICY IF EXISTS room_payment_rules_update_policy ON public.room_payment_rules;
DROP POLICY IF EXISTS room_payment_rules_delete_policy ON public.room_payment_rules;

-- NEW SELECT POLICY: Property owners can view rules for their properties (room-level or property-level)
CREATE POLICY room_payment_rules_select_policy ON public.room_payment_rules
  FOR SELECT
  USING (
    -- Property-level rules: check property ownership directly
    (property_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = room_payment_rules.property_id
      AND p.owner_id = auth.uid()
    ))
    OR
    -- Room-level rules: check property ownership via room
    (room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rules.room_id
      AND p.owner_id = auth.uid()
    ))
  );

-- NEW INSERT POLICY: Property owners can create rules for their properties or rooms
CREATE POLICY room_payment_rules_insert_policy ON public.room_payment_rules
  FOR INSERT
  WITH CHECK (
    -- Property-level rules: check property ownership directly
    (property_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = room_payment_rules.property_id
      AND p.owner_id = auth.uid()
    ))
    OR
    -- Room-level rules: check property ownership via room
    (room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rules.room_id
      AND p.owner_id = auth.uid()
    ))
  );

-- NEW UPDATE POLICY: Property owners can update their own rules
CREATE POLICY room_payment_rules_update_policy ON public.room_payment_rules
  FOR UPDATE
  USING (
    -- Property-level rules: check property ownership directly
    (property_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = room_payment_rules.property_id
      AND p.owner_id = auth.uid()
    ))
    OR
    -- Room-level rules: check property ownership via room
    (room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rules.room_id
      AND p.owner_id = auth.uid()
    ))
  );

-- NEW DELETE POLICY: Property owners can delete their own rules
CREATE POLICY room_payment_rules_delete_policy ON public.room_payment_rules
  FOR DELETE
  USING (
    -- Property-level rules: check property ownership directly
    (property_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = room_payment_rules.property_id
      AND p.owner_id = auth.uid()
    ))
    OR
    -- Room-level rules: check property ownership via room
    (room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rules.room_id
      AND p.owner_id = auth.uid()
    ))
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.room_payment_rules.property_id IS 'For property-level rules (applies to all rooms in property). Mutually exclusive with room_id.';
COMMENT ON COLUMN public.room_payment_rules.room_id IS 'For room-level rules (applies to specific room only). Mutually exclusive with property_id. Now nullable to support property-level rules.';
COMMENT ON CONSTRAINT room_or_property_required ON public.room_payment_rules IS 'Ensures either room_id or property_id is set, but not both or neither';
