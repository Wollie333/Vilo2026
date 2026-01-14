-- Migration 052: Website Templates & CRM Schema
-- Creates tables for white-label website template builder feature
-- Date: 2026-01-11

-- ============================================================================
-- TEMPLATE CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.template_categories IS 'Categories for website templates (Hotel, B&B, Villa, Guesthouse, Resort)';

-- ============================================================================
-- WEBSITE TEMPLATES (Parent Templates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.website_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  category_id UUID REFERENCES public.template_categories(id) ON DELETE SET NULL,
  description TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,

  -- Template Configuration (JSON)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { sections: [...], pages: [...], dataBindings: {...} }

  -- Default Theme Settings
  default_theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { primaryColor, secondaryColor, fontFamily, logoUrl, faviconUrl }

  -- Version & Status
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,

  -- Analytics
  install_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

COMMENT ON TABLE public.website_templates IS 'Parent website templates available for activation by users';
COMMENT ON COLUMN public.website_templates.config IS 'JSON configuration defining template structure, sections, and data bindings';
COMMENT ON COLUMN public.website_templates.default_theme IS 'Default branding settings (colors, fonts, logos)';

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_website_templates_category ON public.website_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_website_templates_active ON public.website_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_website_templates_featured ON public.website_templates(is_featured);

-- ============================================================================
-- PROPERTY WEBSITES (Child Templates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.property_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE UNIQUE,
  template_id UUID NOT NULL REFERENCES public.website_templates(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Domain Configuration
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,
  custom_domain_verified BOOLEAN NOT NULL DEFAULT false,
  custom_domain_verified_at TIMESTAMPTZ,
  dns_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, error
  ssl_enabled BOOLEAN NOT NULL DEFAULT true,
  ssl_status VARCHAR(50) DEFAULT 'active', -- active, pending, error, expired

  -- Theme Customizations (overrides template defaults)
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { primaryColor, secondaryColor, fontFamily, logoUrl, faviconUrl }

  -- Section Customizations
  customizations JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { sections: { hero: { visible: true, content: {...}, order: 1 }, ... } }

  -- SEO Settings (per page)
  seo_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { home: { title, description, keywords, ogImage }, about: {...}, ... }

  -- Publishing & Versioning
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, published, unpublished
  draft_version JSONB, -- Temporary draft before publishing
  restore_points JSONB DEFAULT '[]'::jsonb, -- Array of up to 4 restore points
  published_at TIMESTAMPTZ,
  unpublished_at TIMESTAMPTZ,

  -- Features
  chat_enabled BOOLEAN NOT NULL DEFAULT true,
  booking_widget_enabled BOOLEAN NOT NULL DEFAULT true,
  contact_form_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Performance
  cache_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  cache_last_refresh TIMESTAMPTZ,

  -- Analytics Counters
  total_page_views INTEGER NOT NULL DEFAULT 0,
  total_unique_visitors INTEGER NOT NULL DEFAULT 0,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_leads INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.property_websites IS 'Property-specific websites (child templates with customizations)';
COMMENT ON COLUMN public.property_websites.subdomain IS 'Subdomain for website (e.g., "my-hotel" for my-hotel.vilo.com)';
COMMENT ON COLUMN public.property_websites.customizations IS 'User customizations to sections (visibility, content, order)';
COMMENT ON COLUMN public.property_websites.draft_version IS 'Draft changes before publishing (allows preview without affecting live site)';
COMMENT ON COLUMN public.property_websites.restore_points IS 'Array of up to 4 previous published versions for rollback';

-- Indexes for property websites
CREATE INDEX IF NOT EXISTS idx_property_websites_property ON public.property_websites(property_id);
CREATE INDEX IF NOT EXISTS idx_property_websites_template ON public.property_websites(template_id);
CREATE INDEX IF NOT EXISTS idx_property_websites_user ON public.property_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_property_websites_status ON public.property_websites(status);
CREATE INDEX IF NOT EXISTS idx_property_websites_subdomain ON public.property_websites(subdomain);
CREATE INDEX IF NOT EXISTS idx_property_websites_custom_domain ON public.property_websites(custom_domain);

-- ============================================================================
-- TEMPLATE SECTIONS (Reusable Component Blocks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.website_templates(id) ON DELETE CASCADE,

  -- Section Metadata
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  category VARCHAR(100), -- hero, features, gallery, rooms, contact, footer, etc.
  description TEXT,

  -- Component Configuration
  component_type VARCHAR(100) NOT NULL, -- HeroSection, RoomsGridSection, etc.
  component_props JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_bindings JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Positioning
  default_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false, -- Cannot be hidden/deleted
  is_reusable BOOLEAN NOT NULL DEFAULT true, -- Can be duplicated

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.template_sections IS 'Reusable section components for templates';
COMMENT ON COLUMN public.template_sections.component_props IS 'React component props configuration';
COMMENT ON COLUMN public.template_sections.data_bindings IS 'Maps template placeholders to backend data sources';

-- Indexes for template sections
CREATE INDEX IF NOT EXISTS idx_template_sections_template ON public.template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_template_sections_category ON public.template_sections(category);

-- ============================================================================
-- TEMPLATE DATA BINDINGS (Backend Data Mapping)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.template_data_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.website_templates(id) ON DELETE CASCADE,

  -- Binding Configuration
  binding_key VARCHAR(200) NOT NULL, -- e.g., "hero.title", "rooms.list"
  data_source VARCHAR(100) NOT NULL, -- property, room, company, booking, addon, review
  data_field VARCHAR(200) NOT NULL, -- e.g., "name", "description", "gallery_images"

  -- Transformation
  transformation VARCHAR(100), -- truncate, uppercase, format_date, etc.
  transformation_params JSONB,
  fallback_value TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(template_id, binding_key)
);

COMMENT ON TABLE public.template_data_bindings IS 'Maps template placeholders to backend data sources';
COMMENT ON COLUMN public.template_data_bindings.binding_key IS 'Unique key identifying where data should be inserted in template';
COMMENT ON COLUMN public.template_data_bindings.data_source IS 'Backend table/entity to pull data from';

-- Indexes for data bindings
CREATE INDEX IF NOT EXISTS idx_template_data_bindings_template ON public.template_data_bindings(template_id);

-- ============================================================================
-- CRM: PIPELINE STAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#6B7280', -- Hex color for UI
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Stage Behavior
  is_default BOOLEAN NOT NULL DEFAULT false, -- New leads start here
  is_terminal BOOLEAN NOT NULL DEFAULT false, -- Final stage (Won, Lost)
  auto_convert_to_customer BOOLEAN NOT NULL DEFAULT false, -- Auto-convert when booking created

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pipeline_stages IS 'CRM pipeline stages for lead management';
COMMENT ON COLUMN public.pipeline_stages.is_terminal IS 'Terminal stages cannot transition to other stages';
COMMENT ON COLUMN public.pipeline_stages.auto_convert_to_customer IS 'If true, lead marked as converted when booking created';

-- Seed pipeline stages
INSERT INTO public.pipeline_stages (name, slug, color, sort_order, is_default, is_terminal, auto_convert_to_customer) VALUES
  ('Lead', 'lead', '#3B82F6', 1, true, false, false),
  ('Negotiating', 'negotiating', '#8B5CF6', 2, false, false, false),
  ('Quoted', 'quoted', '#6366F1', 3, false, false, false),
  ('Checkout Failed', 'checkout_failed', '#EF4444', 4, false, false, false),
  ('Booked', 'booked', '#10B981', 5, false, false, true),
  ('Won', 'won', '#059669', 6, false, true, true),
  ('Lost', 'lost', '#6B7280', 7, false, true, false)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- CRM: LEADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lead Information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),

  -- Source Tracking
  source VARCHAR(50) NOT NULL, -- contact_form, chat, booking_abandoned, email, phone
  source_url TEXT, -- URL where lead originated
  referrer_url TEXT,

  -- Property & Room Inquiry
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,

  -- Inquiry Details
  inquiry_message TEXT,
  check_in_date DATE,
  check_out_date DATE,
  guest_count_adults INTEGER,
  guest_count_children INTEGER,

  -- Pipeline Management
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Conversion Tracking
  converted_to_customer BOOLEAN NOT NULL DEFAULT false,
  converted_at TIMESTAMPTZ,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,

  -- Communication
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE SET NULL,
  last_contact_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.leads IS 'CRM leads from website interactions (contact forms, chat, abandoned checkouts)';
COMMENT ON COLUMN public.leads.source IS 'How the lead was captured (contact_form, chat, booking_abandoned, etc.)';
COMMENT ON COLUMN public.leads.converted_to_customer IS 'True when lead completes a booking';

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_property ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_room ON public.leads(room_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_booking ON public.leads(booking_id);
CREATE INDEX IF NOT EXISTS idx_leads_conversation ON public.leads(conversation_id);
CREATE INDEX IF NOT EXISTS idx_leads_converted ON public.leads(converted_to_customer);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- ============================================================================
-- CRM: LEAD ACTIVITIES (Timeline)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,

  -- Activity Details
  activity_type VARCHAR(50) NOT NULL, -- stage_changed, note_added, email_sent, contacted, booking_created
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Stage Change Tracking
  old_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  new_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,

  -- Related Entities
  related_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  related_message_id UUID,

  -- Metadata
  metadata JSONB,

  -- Audit
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_activities IS 'Activity timeline for lead interactions and stage changes';
COMMENT ON COLUMN public.lead_activities.activity_type IS 'Type of activity (stage_changed, note_added, email_sent, etc.)';

-- Indexes for lead activities
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON public.lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activities(created_at DESC);

-- ============================================================================
-- WEBSITE ANALYTICS EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.website_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Website & Page
  property_website_id UUID NOT NULL REFERENCES public.property_websites(id) ON DELETE CASCADE,
  page_path VARCHAR(500),
  page_title VARCHAR(255),

  -- Event Details
  event_type VARCHAR(50) NOT NULL, -- page_view, booking_started, booking_completed, contact_form, chat_started
  event_category VARCHAR(100), -- engagement, conversion, navigation
  event_label VARCHAR(255),
  event_value INTEGER,

  -- Visitor Tracking
  visitor_id UUID, -- Cookie-based visitor ID
  session_id UUID, -- Session ID
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- If logged in

  -- Traffic Source
  referrer_url TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_term VARCHAR(100),
  utm_content VARCHAR(100),

  -- Device & Browser
  device_type VARCHAR(50), -- desktop, tablet, mobile
  browser VARCHAR(100),
  os VARCHAR(100),

  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),

  -- Metadata
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.website_analytics_events IS 'Analytics events for property websites';
COMMENT ON COLUMN public.website_analytics_events.event_type IS 'Type of event (page_view, booking_started, booking_completed, etc.)';

-- Indexes for analytics (optimized for time-series queries)
CREATE INDEX IF NOT EXISTS idx_analytics_website ON public.website_analytics_events(property_website_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.website_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.website_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor ON public.website_analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.website_analytics_events(session_id);

-- Composite index for analytics queries (website + date range + event type)
CREATE INDEX IF NOT EXISTS idx_analytics_website_date_event ON public.website_analytics_events(property_website_id, created_at DESC, event_type);

-- ============================================================================
-- NOTIFICATION TEMPLATES (Website Notifications)
-- ============================================================================

-- Insert website notification templates
INSERT INTO public.notification_templates (name, type, subject, body, priority, variant) VALUES
  ('website_published', 'website', 'Your website is live!', '🎉 Your website is now live at {{subdomain}}.vilo.com', 'normal', 'success'),
  ('website_unpublished', 'website', 'Website unpublished', 'Your website {{subdomain}}.vilo.com has been unpublished', 'normal', 'info'),
  ('custom_domain_verified', 'website', 'Custom domain verified', '✅ Custom domain {{domain}} verified and active', 'high', 'success'),
  ('custom_domain_verification_failed', 'website', 'Domain verification failed', '⚠️ Custom domain {{domain}} verification failed. Please check your DNS settings.', 'high', 'error'),
  ('ssl_certificate_error', 'website', 'SSL certificate error', '🚨 SSL certificate error for {{domain}}. Website may be inaccessible.', 'urgent', 'error'),
  ('domain_fallback_to_subdomain', 'website', 'Domain temporarily unavailable', '⚠️ Your custom domain {{domain}} is temporarily unavailable. Website is being served on {{subdomain}}.vilo.com', 'high', 'warning'),
  ('website_new_lead', 'website', 'New lead from website', '📋 New lead from website: {{lead_name}} ({{source}})', 'high', 'info'),
  ('website_lead_converted', 'website', 'Lead converted to booking', '✅ Lead {{lead_name}} from website has booked {{room_name}}', 'normal', 'success'),
  ('website_checkout_abandoned', 'website', 'Checkout abandoned', '⚠️ {{guest_name}} abandoned checkout for {{room_name}}. Follow up?', 'normal', 'warning'),
  ('website_first_visitor', 'website', 'First visitor!', '🎉 Your website received its first visitor!', 'normal', 'success'),
  ('website_milestone_views', 'website', 'Website milestone reached', '🎉 Your website has reached {{milestone}} page views!', 'low', 'success'),
  ('website_first_booking', 'website', 'First booking from website', '🎉 First booking from your website! {{guest_name}} booked {{room_name}}', 'high', 'success'),
  ('website_performance_degraded', 'website', 'Website performance issue', '⚠️ Your website {{subdomain}}.vilo.com is loading slowly', 'high', 'warning'),
  ('website_down', 'website', 'Website is down', '🚨 Your website {{subdomain}}.vilo.com is currently down', 'urgent', 'error'),
  ('template_update_available', 'website', 'Template update available', '📦 Update available for your website template: {{template_name}} v{{version}}', 'low', 'info'),
  ('template_auto_updated', 'website', 'Template updated', '✨ Your website template has been updated to v{{version}}', 'low', 'info'),
  ('website_review_received', 'website', 'New review on your website', '⭐ New review on your website from {{guest_name}}: {{rating}} stars', 'normal', 'info'),
  ('website_review_response_added', 'website', 'Response to your review', '{{property_name}} has responded to your review', 'low', 'info')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_data_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_analytics_events ENABLE ROW LEVEL SECURITY;

-- Template Categories: Public read, admin write
CREATE POLICY template_categories_public_read ON public.template_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY template_categories_admin_all ON public.template_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

-- Website Templates: Public read (active only), admin write
CREATE POLICY website_templates_public_read ON public.website_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY website_templates_admin_all ON public.website_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

-- Property Websites: Users can view/manage their property's website only
CREATE POLICY property_websites_select ON public.property_websites
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin', 'saas_team_member')
    )
  );

CREATE POLICY property_websites_insert ON public.property_websites
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_websites.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY property_websites_update ON public.property_websites
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

CREATE POLICY property_websites_delete ON public.property_websites
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

-- Template Sections: Linked to templates (public read for active templates)
CREATE POLICY template_sections_public_read ON public.template_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.website_templates
      WHERE website_templates.id = template_sections.template_id
      AND website_templates.is_active = true
    )
  );

CREATE POLICY template_sections_admin_all ON public.template_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

-- Template Data Bindings: Linked to templates (same as sections)
CREATE POLICY template_data_bindings_public_read ON public.template_data_bindings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.website_templates
      WHERE website_templates.id = template_data_bindings.template_id
      AND website_templates.is_active = true
    )
  );

CREATE POLICY template_data_bindings_admin_all ON public.template_data_bindings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

-- Pipeline Stages: Public read, admin write
CREATE POLICY pipeline_stages_public_read ON public.pipeline_stages
  FOR SELECT USING (true);

CREATE POLICY pipeline_stages_admin_all ON public.pipeline_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

-- Leads: Users can view/manage leads for their properties only
CREATE POLICY leads_select ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = leads.property_id
      AND properties.user_id = auth.uid()
    )
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin', 'saas_team_member')
    )
  );

CREATE POLICY leads_insert ON public.leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = leads.property_id
      AND properties.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

CREATE POLICY leads_update ON public.leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = leads.property_id
      AND properties.user_id = auth.uid()
    )
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

CREATE POLICY leads_delete ON public.leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = leads.property_id
      AND properties.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

-- Lead Activities: Follow lead permissions
CREATE POLICY lead_activities_select ON public.lead_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads
      JOIN public.properties ON properties.id = leads.property_id
      WHERE leads.id = lead_activities.lead_id
      AND (properties.user_id = auth.uid() OR leads.assigned_to = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin', 'saas_team_member')
    )
  );

CREATE POLICY lead_activities_insert ON public.lead_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      JOIN public.properties ON properties.id = leads.property_id
      WHERE leads.id = lead_activities.lead_id
      AND (properties.user_id = auth.uid() OR leads.assigned_to = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin')
    )
  );

-- Website Analytics: Users can view analytics for their websites only
CREATE POLICY website_analytics_select ON public.website_analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.property_websites
      WHERE property_websites.id = website_analytics_events.property_website_id
      AND property_websites.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type IN ('super_admin', 'saas_admin', 'saas_team_member')
    )
  );

CREATE POLICY website_analytics_insert ON public.website_analytics_events
  FOR INSERT WITH CHECK (true); -- Allow anonymous tracking

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_template_categories_updated_at BEFORE UPDATE ON public.template_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_templates_updated_at BEFORE UPDATE ON public.website_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_websites_updated_at BEFORE UPDATE ON public.property_websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_sections_updated_at BEFORE UPDATE ON public.template_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_data_bindings_updated_at BEFORE UPDATE ON public.template_data_bindings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create lead activity on stage change
CREATE OR REPLACE FUNCTION create_lead_stage_change_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.stage_id IS DISTINCT FROM NEW.stage_id) THEN
    INSERT INTO public.lead_activities (
      lead_id,
      activity_type,
      title,
      description,
      old_stage_id,
      new_stage_id,
      created_by
    )
    SELECT
      NEW.id,
      'stage_changed',
      'Stage changed from ' || old_stage.name || ' to ' || new_stage.name,
      NULL,
      OLD.stage_id,
      NEW.stage_id,
      auth.uid()
    FROM public.pipeline_stages old_stage, public.pipeline_stages new_stage
    WHERE old_stage.id = OLD.stage_id AND new_stage.id = NEW.stage_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_stage_change_activity AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION create_lead_stage_change_activity();

-- ============================================================================
-- SEED DATA: Template Categories
-- ============================================================================

INSERT INTO public.template_categories (name, slug, description, sort_order) VALUES
  ('Hotel', 'hotel', 'Modern hotel and motel templates', 1),
  ('Bed & Breakfast', 'bnb', 'Cozy B&B and guesthouse templates', 2),
  ('Villa', 'villa', 'Luxury villa and vacation home templates', 3),
  ('Guesthouse', 'guesthouse', 'Family-friendly guesthouse templates', 4),
  ('Resort', 'resort', 'Beach resort and tropical getaway templates', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'Migration 052: Website Templates & CRM Schema - COMPLETE';
