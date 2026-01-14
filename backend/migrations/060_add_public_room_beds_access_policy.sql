-- Migration: 060_add_public_room_beds_access_policy
-- Description: Add RLS policy to allow anonymous users to view room beds of publicly listed properties
-- Date: 2026-01-11

-- ============================================================================
-- ADD PUBLIC ACCESS POLICY FOR ROOM_BEDS
-- ============================================================================

-- Allow anonymous users to view room beds of publicly listed properties
CREATE POLICY "Anyone can view room beds of publicly listed properties"
    ON public.room_beds FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM rooms r
            JOIN properties p ON p.id = r.property_id
            WHERE r.id = room_beds.room_id
            AND r.is_active = true
            AND r.is_paused = false
            AND p.is_listed_publicly = true
            AND p.is_active = true
        )
    );

-- Allow authenticated users to view room beds
CREATE POLICY "Authenticated users can view room beds"
    ON public.room_beds FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM rooms r
            JOIN properties p ON p.id = r.property_id
            WHERE r.id = room_beds.room_id
            AND (
                (r.is_active = true AND r.is_paused = false AND p.is_listed_publicly = true AND p.is_active = true)
                OR public.has_property_access(p.id)
            )
        )
    );
