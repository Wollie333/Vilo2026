-- Migration: 075_add_video_url_to_properties.sql
-- Description: Add video_url field to properties table for YouTube/Vimeo embeds
-- Date: 2026-01-12

-- ============================================================================
-- ADD VIDEO URL COLUMN
-- ============================================================================

-- Add video_url column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comment
COMMENT ON COLUMN properties.video_url IS 'YouTube or Vimeo video URL for property showcase';
