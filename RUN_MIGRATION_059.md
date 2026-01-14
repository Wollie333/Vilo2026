# Apply Migration 059 - Public Room Access

## Issue
Anonymous users cannot view rooms of publicly listed properties due to missing RLS policy.

## Solution
Run the SQL from `backend/migrations/059_add_public_room_access_policy.sql` in your Supabase SQL Editor.

## Steps:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Your Project → SQL Editor
3. **Copy and paste** the SQL below:

```sql
-- Migration: 059_add_public_room_access_policy
-- Description: Add RLS policy to allow anonymous users to view rooms of publicly listed properties

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
```

4. **Click "Run"**
5. **Refresh your browser** at: http://localhost:5173/accommodation/vilo

## What This Does:
- Allows anonymous users to view rooms that belong to publicly listed properties
- Updates authenticated user policy to also include public rooms
- Rooms must be `is_active = true` AND `is_paused = false` to be visible

After running this, the Rooms tab should display your 3 rooms (Delux, King, Double)!
