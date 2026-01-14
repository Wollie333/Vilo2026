-- ============================================================================
-- Migration: 038_create_room_assignment_junction_tables.sql
-- Description: Creates junction tables for many-to-many relationships between
--              rooms and payment rules, add-ons, and promotions to support
--              centralized management with shared assignments
-- Author: Claude
-- Date: 2026-01-09
-- ============================================================================

-- ============================================================================
-- ROOM PAYMENT RULE ASSIGNMENTS (many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_payment_rule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  payment_rule_id UUID NOT NULL REFERENCES public.room_payment_rules(id) ON DELETE CASCADE,

  -- Assignment metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  assigned_by UUID REFERENCES public.users(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique room-rule pairs
  CONSTRAINT unique_room_payment_rule UNIQUE(room_id, payment_rule_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_payment_rule_assignments_room
  ON public.room_payment_rule_assignments(room_id);
CREATE INDEX IF NOT EXISTS idx_room_payment_rule_assignments_rule
  ON public.room_payment_rule_assignments(payment_rule_id);

-- RLS policies
ALTER TABLE public.room_payment_rule_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY room_payment_rule_assignments_select_policy
  ON public.room_payment_rule_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rule_assignments.room_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_payment_rule_assignments_insert_policy
  ON public.room_payment_rule_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rule_assignments.room_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_payment_rule_assignments_delete_policy
  ON public.room_payment_rule_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_payment_rule_assignments.room_id
      AND p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- ROOM ADDON ASSIGNMENTS (many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_addon_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.add_ons(id) ON DELETE CASCADE,

  -- Assignment metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  assigned_by UUID REFERENCES public.users(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique room-addon pairs
  CONSTRAINT unique_room_addon UNIQUE(room_id, addon_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_addon_assignments_room
  ON public.room_addon_assignments(room_id);
CREATE INDEX IF NOT EXISTS idx_room_addon_assignments_addon
  ON public.room_addon_assignments(addon_id);

-- RLS policies
ALTER TABLE public.room_addon_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY room_addon_assignments_select_policy
  ON public.room_addon_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_addon_assignments.room_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_addon_assignments_insert_policy
  ON public.room_addon_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_addon_assignments.room_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_addon_assignments_delete_policy
  ON public.room_addon_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_addon_assignments.room_id
      AND p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- ROOM PROMOTION ASSIGNMENTS (many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_promotion_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES public.room_promotions(id) ON DELETE CASCADE,

  -- Assignment metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  assigned_by UUID REFERENCES public.users(id),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique room-promotion pairs
  CONSTRAINT unique_room_promotion UNIQUE(room_id, promotion_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_promotion_assignments_room
  ON public.room_promotion_assignments(room_id);
CREATE INDEX IF NOT EXISTS idx_room_promotion_assignments_promotion
  ON public.room_promotion_assignments(promotion_id);

-- RLS policies
ALTER TABLE public.room_promotion_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY room_promotion_assignments_select_policy
  ON public.room_promotion_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_promotion_assignments.room_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_promotion_assignments_insert_policy
  ON public.room_promotion_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_promotion_assignments.room_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY room_promotion_assignments_delete_policy
  ON public.room_promotion_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      INNER JOIN public.properties p ON r.property_id = p.id
      WHERE r.id = room_promotion_assignments.room_id
      AND p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- DATA MIGRATION - Migrate existing assignments to junction tables
-- ============================================================================

-- Migrate payment rules (from room_id FK to junction table)
INSERT INTO public.room_payment_rule_assignments (room_id, payment_rule_id, assigned_at)
SELECT
  room_id,
  id as payment_rule_id,
  created_at as assigned_at
FROM public.room_payment_rules
WHERE room_id IS NOT NULL
ON CONFLICT (room_id, payment_rule_id) DO NOTHING;

-- Migrate add-ons (from room_ids JSONB array to junction table)
INSERT INTO public.room_addon_assignments (room_id, addon_id, assigned_at)
SELECT
  r.id as room_id,
  a.id as addon_id,
  a.created_at as assigned_at
FROM public.add_ons a
CROSS JOIN public.rooms r
WHERE
  a.room_ids IS NOT NULL
  AND jsonb_typeof(a.room_ids) = 'array'
  AND a.room_ids ? r.id::text
ON CONFLICT (room_id, addon_id) DO NOTHING;

-- Migrate promotions (from room_id FK to junction table)
INSERT INTO public.room_promotion_assignments (room_id, promotion_id, assigned_at)
SELECT
  room_id,
  id as promotion_id,
  created_at as assigned_at
FROM public.room_promotions
WHERE room_id IS NOT NULL
ON CONFLICT (room_id, promotion_id) DO NOTHING;

-- ============================================================================
-- ALTER EXISTING TABLES - Make room_id nullable for backward compatibility
-- Note: In future migration, these columns can be dropped after full transition
-- ============================================================================

-- Make room_id nullable in room_payment_rules (keep for backward compatibility)
ALTER TABLE public.room_payment_rules
  ALTER COLUMN room_id DROP NOT NULL;

-- Make room_id nullable in room_promotions (keep for backward compatibility)
ALTER TABLE public.room_promotions
  ALTER COLUMN room_id DROP NOT NULL;

-- Add deprecation comments
COMMENT ON COLUMN public.room_payment_rules.room_id IS
  'DEPRECATED: Use room_payment_rule_assignments junction table instead. This column will be removed in a future migration.';
COMMENT ON COLUMN public.room_promotions.room_id IS
  'DEPRECATED: Use room_promotion_assignments junction table instead. This column will be removed in a future migration.';
COMMENT ON COLUMN public.add_ons.room_ids IS
  'DEPRECATED: Use room_addon_assignments junction table instead. This column will be removed in a future migration.';

-- ============================================================================
-- HELPER VIEWS - Convenient views for querying assignments
-- ============================================================================

-- View: Payment rules with room counts
CREATE OR REPLACE VIEW public.payment_rules_with_room_count AS
SELECT
  pr.*,
  COUNT(DISTINCT rpra.room_id) as room_count
FROM public.room_payment_rules pr
LEFT JOIN public.room_payment_rule_assignments rpra ON pr.id = rpra.payment_rule_id
GROUP BY pr.id;

-- View: Add-ons with room counts
CREATE OR REPLACE VIEW public.addons_with_room_count AS
SELECT
  a.*,
  COUNT(DISTINCT raa.room_id) as room_count
FROM public.add_ons a
LEFT JOIN public.room_addon_assignments raa ON a.id = raa.addon_id
GROUP BY a.id;

-- View: Promotions with room counts
CREATE OR REPLACE VIEW public.promotions_with_room_count AS
SELECT
  rp.*,
  COUNT(DISTINCT rpa.room_id) as room_count
FROM public.room_promotions rp
LEFT JOIN public.room_promotion_assignments rpa ON rp.id = rpa.promotion_id
GROUP BY rp.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.room_payment_rule_assignments IS
  'Many-to-many junction table linking rooms to payment rules for centralized management';
COMMENT ON TABLE public.room_addon_assignments IS
  'Many-to-many junction table linking rooms to add-ons for centralized management';
COMMENT ON TABLE public.room_promotion_assignments IS
  'Many-to-many junction table linking rooms to promotions for centralized management';

COMMENT ON VIEW public.payment_rules_with_room_count IS
  'Payment rules with count of assigned rooms for management pages';
COMMENT ON VIEW public.addons_with_room_count IS
  'Add-ons with count of assigned rooms for management pages';
COMMENT ON VIEW public.promotions_with_room_count IS
  'Promotions with count of assigned rooms for management pages';
