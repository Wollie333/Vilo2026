# Apply Migration 076: Add show_video to properties

## Steps to Apply

1. Open your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL below
4. Click "Run"

## SQL to Execute

```sql
-- Migration: 076_add_show_video_to_properties.sql
-- Description: Add show_video field to control video visibility on frontend
-- Date: 2026-01-12

-- ============================================================================
-- ADD SHOW VIDEO COLUMN
-- ============================================================================

-- Add show_video column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS show_video BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN properties.show_video IS 'Whether to display the video on the public property page';
```

## Expected Result

You should see: `Success. No rows returned`

## Verification

After running the migration, verify it worked:

```sql
-- Check that the column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'properties' AND column_name = 'show_video';
```

Expected output:
- column_name: `show_video`
- data_type: `boolean`
- column_default: `true`

## What This Does

- Adds a `show_video` column to the properties table
- Default value is `true` (video will show if URL is provided)
- Property owners can toggle this off to hide the video even if a URL is saved
- The switch control is in the admin panel under Listing Details > SHOWCASE > Video tab
