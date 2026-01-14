# Apply Migration 058 - Public Property Access

## Issue
Anonymous users cannot view publicly listed properties due to missing RLS policy.

## Solution
Run the SQL from `backend/migrations/058_add_public_property_access_policy.sql` in your Supabase SQL Editor.

## Steps:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Your Project → SQL Editor
3. **Copy and paste** the SQL below:

```sql
-- Migration: 058_add_public_property_access_policy
-- Description: Add RLS policy to allow anonymous users to view publicly listed properties

-- Allow anonymous users to view publicly listed and active properties
CREATE POLICY "Anyone can view publicly listed properties"
    ON public.properties FOR SELECT
    TO anon
    USING (
        is_listed_publicly = true
        AND is_active = true
    );

-- Also allow authenticated users to view publicly listed properties
-- (in addition to their existing policies)
CREATE POLICY "Authenticated users can view publicly listed properties"
    ON public.properties FOR SELECT
    TO authenticated
    USING (
        (is_listed_publicly = true AND is_active = true)
        OR public.is_super_admin()
        OR public.has_property_access(id)
    );

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view assigned properties" ON public.properties;
```

4. **Click "Run"**
5. **Refresh your browser** at: http://localhost:5173/accommodation/vilo

## What This Does:
- Allows anonymous (not logged in) users to view properties where `is_listed_publicly = true` AND `is_active = true`
- Updates authenticated user policy to also include public properties
- Removes the old restrictive policy that only allowed property owners to see their properties

After running this, your public property page should load successfully!
