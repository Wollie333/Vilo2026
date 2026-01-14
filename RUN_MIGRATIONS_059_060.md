# Apply Migrations 059 & 060 - Public Room Access

## Issue
Anonymous users cannot view rooms in the Rooms tab because of missing RLS policies.

## Solution
Run both migrations in your Supabase SQL Editor to allow public access to rooms and room beds.

## Steps:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Your Project → SQL Editor
3. **Copy and paste** the SQL below:

```sql
-- ============================================================================
-- Migration 059: Public Room Access
-- ============================================================================

-- Allow anonymous users to view rooms of publicly listed properties
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

-- ============================================================================
-- Migration 060: Public Room Beds Access
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
```

4. **Click "Run"**
5. **Refresh your browser** at: http://localhost:5173/accommodation/vilo

## What This Does:
- Allows anonymous users to view rooms that belong to publicly listed properties
- Allows anonymous users to view bed configurations for those rooms
- Your 3 rooms (Delux, King, Double) will now appear in the Rooms tab!

After running this, the Rooms tab should display all your rooms with their details, images, pricing, and "Reserve" buttons.
