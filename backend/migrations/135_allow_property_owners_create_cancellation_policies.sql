-- ============================================================================
-- Migration: 135 - Allow Property Owners to Create Cancellation Policies
-- Description: Add ownership tracking and update permissions so property owners can create custom policies
-- Date: 2026-01-21
-- ============================================================================

-- ============================================================================
-- ADD OWNERSHIP COLUMNS
-- ============================================================================

-- Add created_by column to track who created the policy
ALTER TABLE cancellation_policies
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add is_custom flag to distinguish user-created policies from system defaults
ALTER TABLE cancellation_policies
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Add index for efficient owner lookup
CREATE INDEX IF NOT EXISTS idx_cancellation_policies_created_by
  ON cancellation_policies(created_by);

-- Add comments for documentation
COMMENT ON COLUMN cancellation_policies.created_by IS
  'User who created this policy. NULL for system default policies.';
COMMENT ON COLUMN cancellation_policies.is_custom IS
  'True for user-created custom policies, false for system defaults.';

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Drop existing admin-only management policy
DROP POLICY IF EXISTS "Admins can manage cancellation policies" ON cancellation_policies;

-- Create new policy: Users can create their own custom policies
CREATE POLICY "Users can create custom cancellation policies"
  ON cancellation_policies
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND is_custom = true
  );

-- Create new policy: Users can update their own custom policies
CREATE POLICY "Users can update their own custom policies"
  ON cancellation_policies
  FOR UPDATE
  USING (created_by = auth.uid() AND is_custom = true)
  WITH CHECK (created_by = auth.uid() AND is_custom = true);

-- Create new policy: Users can delete their own custom policies
CREATE POLICY "Users can delete their own custom policies"
  ON cancellation_policies
  FOR DELETE
  USING (created_by = auth.uid() AND is_custom = true);

-- Create new policy: Admins can manage all policies (system defaults + custom)
CREATE POLICY "Admins can manage all cancellation policies"
  ON cancellation_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'saas_team_member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'saas_team_member')
    )
  );

-- ============================================================================
-- UPDATE EXISTING SYSTEM POLICIES
-- ============================================================================

-- Mark existing system default policies (created during initial migration)
-- These have NULL created_by and is_custom = false
UPDATE cancellation_policies
SET is_custom = false
WHERE created_by IS NULL;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. System default policies (Flexible, Moderate, Strict, Non-refundable) remain admin-only
-- 2. Property owners can now create custom cancellation policies with is_custom = true
-- 3. Users can only edit/delete their own custom policies
-- 4. The frontend will show both system defaults + user's custom policies in dropdowns
-- 5. Properties can select from either system defaults or custom policies
