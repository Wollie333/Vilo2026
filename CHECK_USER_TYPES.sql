-- ============================================================================
-- CHECK USER TYPES - See what user types exist
-- ============================================================================

-- Check all user types
SELECT
  id,
  name,
  category,
  is_active,
  created_at
FROM public.user_types
ORDER BY category, name;

-- Count by category
SELECT
  category,
  COUNT(*) as count
FROM public.user_types
GROUP BY category;
