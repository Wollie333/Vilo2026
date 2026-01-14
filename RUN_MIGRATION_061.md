# Apply Migration 061 - Public Seasonal Rates Access

## Issue
Anonymous users cannot view seasonal rates of publicly listed properties due to missing RLS policy.

## Solution
Run the SQL from `backend/migrations/061_add_public_seasonal_rates_access.sql` in your Supabase SQL Editor.

## Steps:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Your Project → SQL Editor
3. **Copy and paste** the SQL below:

```sql
-- Migration: 061_add_public_seasonal_rates_access
-- Description: Add RLS policy to allow anonymous users to view seasonal rates of publicly listed properties

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
```

4. **Click "Run"**
5. **Refresh your browser** at: http://localhost:5173/accommodation/vilo

## What This Does:
- Allows anonymous users to view seasonal rates that belong to publicly listed properties
- Allows authenticated users to view public seasonal rates OR rates for properties they have access to
- Removes the old restrictive policy that only allowed authenticated users

After running this, the Rates tab should display seasonal rates when they exist for the date ranges!
