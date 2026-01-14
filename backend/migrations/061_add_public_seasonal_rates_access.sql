-- Migration: 061_add_public_seasonal_rates_access
-- Description: Add RLS policy to allow anonymous users to view seasonal rates of publicly listed properties
-- Date: 2026-01-11

-- ============================================================================
-- ADD PUBLIC ACCESS POLICY FOR ROOM_SEASONAL_RATES
-- ============================================================================

-- Allow anonymous users to view seasonal rates of publicly listed properties
CREATE POLICY "Anyone can view seasonal rates of publicly listed properties"
    ON public.room_seasonal_rates FOR SELECT
    TO anon
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM rooms r
            JOIN properties p ON p.id = r.property_id
            WHERE r.id = room_seasonal_rates.room_id
            AND r.is_active = true
            AND r.is_paused = false
            AND p.is_listed_publicly = true
            AND p.is_active = true
        )
    );

-- Allow authenticated users to view seasonal rates
CREATE POLICY "Authenticated users can view seasonal rates"
    ON public.room_seasonal_rates FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND (
            -- Public rates
            EXISTS (
                SELECT 1 FROM rooms r
                JOIN properties p ON p.id = r.property_id
                WHERE r.id = room_seasonal_rates.room_id
                AND r.is_active = true
                AND r.is_paused = false
                AND p.is_listed_publicly = true
                AND p.is_active = true
            )
            -- Or user has property access
            OR EXISTS (
                SELECT 1 FROM rooms r
                JOIN properties p ON p.id = r.property_id
                WHERE r.id = room_seasonal_rates.room_id
                AND public.has_property_access(p.id)
            )
        )
    );

-- Drop old restrictive policy if exists
DROP POLICY IF EXISTS "seasonal_rates_select_policy" ON public.room_seasonal_rates;
