-- Migration: 059_add_public_room_access_policy
-- Description: Add RLS policy to allow anonymous users to view rooms of publicly listed properties
-- Date: 2026-01-11

-- ============================================================================
-- ADD PUBLIC ACCESS POLICY FOR ROOMS
-- ============================================================================

-- Allow anonymous users to view rooms of publicly listed and active properties
CREATE POLICY "Anyone can view rooms of publicly listed properties"
    ON public.rooms FOR SELECT
    TO anon
    USING (
        is_active = true
        AND is_paused = false
        AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = rooms.property_id
            AND p.is_listed_publicly = true
            AND p.is_active = true
        )
    );

-- Update authenticated users policy to include public rooms
CREATE POLICY "Authenticated users can view public rooms"
    ON public.rooms FOR SELECT
    TO authenticated
    USING (
        (
            is_active = true
            AND is_paused = false
            AND EXISTS (
                SELECT 1 FROM properties p
                WHERE p.id = rooms.property_id
                AND p.is_listed_publicly = true
                AND p.is_active = true
            )
        )
        OR public.has_property_access(property_id)
    );

-- Drop old restrictive policy if exists
DROP POLICY IF EXISTS "Users can view rooms of their properties" ON public.rooms;
