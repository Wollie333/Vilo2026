-- Migration: 082 - Add Terms and Conditions to Properties
-- Description: Allow property owners to set custom Terms & Conditions with HTML/rich text
-- Date: 2026-01-15

-- ============================================================================
-- ADD TERMS AND CONDITIONS COLUMN
-- ============================================================================

-- Add terms_and_conditions column to properties table
-- This will store HTML content from TinyMCE WYSIWYG editor
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;

-- Add column comment for documentation
COMMENT ON COLUMN public.properties.terms_and_conditions IS
  'HTML/rich text Terms & Conditions specific to this property. Editable via WYSIWYG editor in Legal settings.';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Field is nullable (optional) - properties can operate without custom terms
-- 2. TEXT type supports unlimited length (recommended max: 1MB for performance)
-- 3. TinyMCE editor will handle HTML sanitization on frontend
-- 4. Content will be displayed in:
--    - Booking wizard last step (accept checkbox with modal)
--    - Property listing Overview tab (link with modal)
--    - PDF download for guest records
