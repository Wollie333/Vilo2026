-- ============================================================================
-- Migration: Create Cancellation Policies Table
-- Description: Centralized cancellation policies for properties/rooms
-- ============================================================================

-- Create cancellation_policies table
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tiers JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active policies lookup
CREATE INDEX IF NOT EXISTS idx_cancellation_policies_active
  ON cancellation_policies(is_active, sort_order);

-- Enable RLS
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read active policies
CREATE POLICY "Anyone can view active cancellation policies"
  ON cancellation_policies
  FOR SELECT
  USING (is_active = true);

-- Admin users can manage policies (super_admin or saas_team_member user types)
CREATE POLICY "Admins can manage cancellation policies"
  ON cancellation_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'saas_team_member')
    )
  );

-- Seed default cancellation policies
INSERT INTO cancellation_policies (name, description, tiers, is_default, sort_order) VALUES
  (
    'Flexible',
    'Full refund up to 24 hours before check-in. After that, no refund.',
    '[{"days": 1, "refund": 100}, {"days": 0, "refund": 0}]'::jsonb,
    true,
    1
  ),
  (
    'Moderate',
    'Full refund 5+ days before check-in. 50% refund 1-5 days before. No refund after.',
    '[{"days": 5, "refund": 100}, {"days": 1, "refund": 50}, {"days": 0, "refund": 0}]'::jsonb,
    true,
    2
  ),
  (
    'Strict',
    'Full refund 14+ days before check-in. 50% refund 7-14 days before. No refund within 7 days.',
    '[{"days": 14, "refund": 100}, {"days": 7, "refund": 50}, {"days": 0, "refund": 0}]'::jsonb,
    true,
    3
  ),
  (
    'Non-refundable',
    'No refunds for cancellations at any time.',
    '[{"days": 0, "refund": 0}]'::jsonb,
    true,
    4
  )
ON CONFLICT DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_cancellation_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cancellation_policies_updated_at ON cancellation_policies;
CREATE TRIGGER trigger_cancellation_policies_updated_at
  BEFORE UPDATE ON cancellation_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_cancellation_policies_updated_at();
