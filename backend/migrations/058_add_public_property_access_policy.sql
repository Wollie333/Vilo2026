-- =====================================================
-- MIGRATION: 058_add_public_property_access_policy.sql
-- Description: Allow anonymous users to view publicly listed properties and related data
-- Date: 2026-01-14
-- =====================================================

-- ============================================================================
-- PROPERTIES TABLE - PUBLIC ACCESS
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view publicly listed properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can view publicly listed properties" ON public.properties;

-- Create policy for anonymous users to view publicly listed properties
CREATE POLICY "Anonymous users can view publicly listed properties"
    ON public.properties FOR SELECT
    TO anon
    USING (
        is_listed_publicly = true
        AND is_active = true
    );

-- Create policy for authenticated users (combines public access with their assigned properties)
CREATE POLICY "Authenticated users can view public or assigned properties"
    ON public.properties FOR SELECT
    TO authenticated
    USING (
        (is_listed_publicly = true AND is_active = true)
        OR public.is_super_admin()
        OR public.has_property_access(id)
    );

-- ============================================================================
-- ROOMS TABLE - PUBLIC ACCESS
-- ============================================================================

-- Drop existing anonymous policy if it exists
DROP POLICY IF EXISTS "Anonymous users can view rooms for public properties" ON public.rooms;

-- Create policy for anonymous users to view rooms of publicly listed properties
CREATE POLICY "Anonymous users can view rooms for public properties"
    ON public.rooms FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = rooms.property_id
            AND p.is_listed_publicly = true
            AND p.is_active = true
        )
    );

-- ============================================================================
-- ROOM_BEDS TABLE - PUBLIC ACCESS
-- ============================================================================

-- Drop existing anonymous policy if it exists
DROP POLICY IF EXISTS "Anonymous users can view room beds" ON public.room_beds;

-- Create policy for anonymous users to view room beds
CREATE POLICY "Anonymous users can view room beds"
    ON public.room_beds FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.rooms r
            JOIN public.properties p ON r.property_id = p.id
            WHERE r.id = room_beds.room_id
            AND p.is_listed_publicly = true
            AND p.is_active = true
        )
    );

-- ============================================================================
-- ROOM_SEASONAL_RATES TABLE - PUBLIC ACCESS
-- ============================================================================

-- Drop existing anonymous policy if it exists
DROP POLICY IF EXISTS "Anonymous users can view seasonal rates" ON public.room_seasonal_rates;

-- Create policy for anonymous users to view seasonal rates
CREATE POLICY "Anonymous users can view seasonal rates"
    ON public.room_seasonal_rates FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.rooms r
            JOIN public.properties p ON r.property_id = p.id
            WHERE r.id = room_seasonal_rates.room_id
            AND p.is_listed_publicly = true
            AND p.is_active = true
        )
    );

-- ============================================================================
-- ADD_ONS TABLE - PUBLIC ACCESS
-- ============================================================================

-- Drop existing anonymous policy if it exists
DROP POLICY IF EXISTS "Anonymous users can view add-ons" ON public.add_ons;

-- Create policy for anonymous users to view add-ons for public properties
CREATE POLICY "Anonymous users can view add-ons"
    ON public.add_ons FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = add_ons.property_id
            AND p.is_listed_publicly = true
            AND p.is_active = true
        )
    );

-- ============================================================================
-- COMPANIES TABLE - PUBLIC ACCESS (for property branding)
-- ============================================================================

-- Drop existing anonymous policy if it exists
DROP POLICY IF EXISTS "Anonymous users can view companies of public properties" ON public.companies;

-- Create policy for anonymous users to view companies
CREATE POLICY "Anonymous users can view companies of public properties"
    ON public.companies FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.company_id = companies.id
            AND p.is_listed_publicly = true
            AND p.is_active = true
        )
    );

-- ============================================================================
-- PROPERTY_REVIEWS TABLE - PUBLIC ACCESS
-- ============================================================================

-- Drop existing anonymous policy if it exists
DROP POLICY IF EXISTS "Anonymous users can view published reviews" ON public.property_reviews;

-- Create policy for anonymous users to view published reviews
CREATE POLICY "Anonymous users can view published reviews"
    ON public.property_reviews FOR SELECT
    TO anon
    USING (
        status = 'published'
        AND EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = property_reviews.property_id
            AND p.is_listed_publicly = true
            AND p.is_active = true
        )
    );

-- ============================================================================
-- LOCATION TABLES - PUBLIC ACCESS
-- ============================================================================

-- Countries
DROP POLICY IF EXISTS "Anonymous users can view countries" ON public.countries;
CREATE POLICY "Anonymous users can view countries"
    ON public.countries FOR SELECT
    TO anon
    USING (true);

-- Provinces
DROP POLICY IF EXISTS "Anonymous users can view provinces" ON public.provinces;
CREATE POLICY "Anonymous users can view provinces"
    ON public.provinces FOR SELECT
    TO anon
    USING (true);

-- Cities
DROP POLICY IF EXISTS "Anonymous users can view cities" ON public.cities;
CREATE POLICY "Anonymous users can view cities"
    ON public.cities FOR SELECT
    TO anon
    USING (true);
