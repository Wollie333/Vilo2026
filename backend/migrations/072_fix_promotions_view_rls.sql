-- ============================================================================
-- Migration: 072_fix_promotions_view_rls.sql
-- Description: Fix promotions_with_room_count view to properly show room counts
--              by creating a security definer function that bypasses RLS
-- Date: 2026-01-12
-- ============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.promotions_with_room_count;

-- Create a security definer function to get room count (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_promotion_room_count(promotion_id UUID)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(DISTINCT room_id)
  FROM public.room_promotion_assignments
  WHERE promotion_id = $1;
$$;

-- Recreate the view using the function
CREATE OR REPLACE VIEW public.promotions_with_room_count AS
SELECT
  rp.*,
  COALESCE(public.get_promotion_room_count(rp.id), 0)::integer as room_count
FROM public.room_promotions rp;

-- Grant access to the view
GRANT SELECT ON public.promotions_with_room_count TO authenticated;
GRANT SELECT ON public.promotions_with_room_count TO anon;

-- Comment
COMMENT ON VIEW public.promotions_with_room_count IS
  'Promotions with count of assigned rooms - uses security definer function to bypass RLS';
COMMENT ON FUNCTION public.get_promotion_room_count IS
  'Security definer function to get promotion room count bypassing RLS policies';
