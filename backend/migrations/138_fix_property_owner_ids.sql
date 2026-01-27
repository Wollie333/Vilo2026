-- =====================================================
-- MIGRATION: 138_fix_property_owner_ids.sql
-- Description: Fix property owner_ids to match company user_ids
-- Date: 2026-01-24
-- =====================================================

-- Update all properties to have owner_id matching their company's user_id
UPDATE properties p
SET owner_id = c.user_id
FROM companies c
WHERE p.company_id = c.id
  AND (p.owner_id IS NULL OR p.owner_id != c.user_id);

-- Verify the fix
SELECT
    COUNT(*) as properties_fixed
FROM properties p
JOIN companies c ON p.company_id = c.id
WHERE p.owner_id = c.user_id;

-- Show properties still without owner_id (should be 0)
SELECT
    COUNT(*) as properties_without_owner
FROM properties
WHERE owner_id IS NULL;

-- Add a trigger to automatically set owner_id when property is inserted/updated
CREATE OR REPLACE FUNCTION sync_property_owner_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If company_id is set, automatically set owner_id from company
    IF NEW.company_id IS NOT NULL THEN
        SELECT user_id INTO NEW.owner_id
        FROM companies
        WHERE id = NEW.company_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_property_owner_id ON properties;

-- Create trigger
CREATE TRIGGER trigger_sync_property_owner_id
    BEFORE INSERT OR UPDATE OF company_id ON properties
    FOR EACH ROW
    EXECUTE FUNCTION sync_property_owner_id();

COMMENT ON FUNCTION sync_property_owner_id() IS 'Automatically syncs property owner_id with company user_id';
