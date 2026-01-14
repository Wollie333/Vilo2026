-- ============================================================================
-- Migration 026: Create Invoice Schema
-- Creates invoice_settings and invoices tables for payment history tracking
-- ============================================================================

-- ============================================================================
-- Invoice Settings (Admin-configurable business info)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL DEFAULT 'Vilo',
    company_address TEXT,
    company_email VARCHAR(255),
    company_phone VARCHAR(50),
    vat_number VARCHAR(50),
    registration_number VARCHAR(50),
    logo_url TEXT,
    footer_text TEXT DEFAULT 'Thank you for your business!',
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    next_invoice_number INTEGER DEFAULT 1,
    currency VARCHAR(3) DEFAULT 'ZAR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Invoices Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    checkout_id UUID REFERENCES public.checkouts(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,

    -- Customer info (snapshot at time of invoice)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_address TEXT,

    -- Business info (snapshot at time of invoice)
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_vat_number VARCHAR(50),
    company_registration_number VARCHAR(50),

    -- Financial details
    subtotal_cents INTEGER NOT NULL,
    tax_cents INTEGER DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

    -- Payment info
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    payment_date TIMESTAMPTZ,

    -- Line items (JSONB array)
    -- Structure: [{ description, quantity, unit_price_cents, total_cents }]
    line_items JSONB NOT NULL DEFAULT '[]',

    -- Invoice status
    status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (status IN ('draft', 'paid', 'void')),

    -- PDF storage
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_checkout_id ON invoices(checkout_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY invoices_select_own ON invoices
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all invoices
CREATE POLICY invoices_select_admin ON invoices
    FOR SELECT
    TO authenticated
    USING (public.is_admin_or_super());

-- Service role can do everything with invoices
CREATE POLICY invoices_service_all ON invoices
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Invoice settings: only service role and admins
CREATE POLICY invoice_settings_select_admin ON invoice_settings
    FOR SELECT
    TO authenticated
    USING (public.is_admin_or_super());

CREATE POLICY invoice_settings_service_all ON invoice_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_settings_updated_at
    BEFORE UPDATE ON invoice_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed default invoice settings
-- ============================================================================
INSERT INTO invoice_settings (
    company_name,
    company_email,
    invoice_prefix,
    currency,
    footer_text
) VALUES (
    'Vilo',
    'billing@vilo.app',
    'INV',
    'ZAR',
    'Thank you for your business!'
) ON CONFLICT DO NOTHING;
