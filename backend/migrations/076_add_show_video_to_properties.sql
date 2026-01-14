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
