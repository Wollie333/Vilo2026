-- =====================================================
-- MIGRATION: 013_create_companies.sql
-- Description: Create companies table for multi-company support
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. COMPANIES TABLE
-- =====================================================

CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    logo_url TEXT,
    website VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    -- Address fields
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_country VARCHAR(100),
    -- Tax/Legal information
    vat_number VARCHAR(100),
    registration_number VARCHAR(100),
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.companies IS 'Companies owned by users - properties are linked to companies';

-- =====================================================
-- 2. ADD COMPANY_ID TO PROPERTIES
-- =====================================================

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.properties.company_id IS 'The company this property belongs to';

-- =====================================================
-- 3. ADD OWNER_ID TO PROPERTIES (if not exists)
-- =====================================================

-- Properties need to know which user owns them (through the company)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.properties.owner_id IS 'The user who owns this property';

-- =====================================================
-- 4. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON public.properties(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);

-- =====================================================
-- 5. UPDATED_AT TRIGGER
-- =====================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_companies_updated_at ON public.companies;
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Users can view their own companies
CREATE POLICY "Users can view their own companies"
    ON public.companies
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own companies
CREATE POLICY "Users can create their own companies"
    ON public.companies
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own companies
CREATE POLICY "Users can update their own companies"
    ON public.companies
    FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own companies
CREATE POLICY "Users can delete their own companies"
    ON public.companies
    FOR DELETE
    USING (user_id = auth.uid());

-- Admins can view all companies (for admin panel)
CREATE POLICY "Admins can view all companies"
    ON public.companies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- =====================================================
-- 7. ADD max_companies TO SUBSCRIPTION LIMITS
-- =====================================================

-- Add max_companies limit to existing subscription types
-- Default to 1 company for basic plans
INSERT INTO public.subscription_limits (subscription_type_id, limit_key, limit_value, description)
SELECT
    id,
    'max_companies',
    CASE
        WHEN name = 'free' THEN 1
        WHEN name = 'starter' THEN 2
        WHEN name = 'professional' THEN 5
        WHEN name = 'enterprise' THEN -1  -- Unlimited
        ELSE 1
    END,
    'Maximum number of companies allowed'
FROM public.subscription_types
WHERE NOT EXISTS (
    SELECT 1 FROM public.subscription_limits sl
    WHERE sl.subscription_type_id = subscription_types.id
    AND sl.limit_key = 'max_companies'
);
