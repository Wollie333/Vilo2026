-- =====================================================
-- MIGRATION: 002_create_indexes.sql
-- Description: Performance indexes for auth tables
-- Run this in Supabase SQL Editor after 001
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX idx_user_roles_property_id ON public.user_roles(property_id) WHERE property_id IS NOT NULL;

-- User permissions indexes
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_expires ON public.user_permissions(expires_at)
    WHERE expires_at IS NOT NULL;

-- User properties indexes
CREATE INDEX idx_user_properties_user_id ON public.user_properties(user_id);
CREATE INDEX idx_user_properties_property_id ON public.user_properties(property_id);

-- Role permissions indexes
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);

-- Properties indexes
CREATE INDEX idx_properties_slug ON public.properties(slug);
CREATE INDEX idx_properties_is_active ON public.properties(is_active) WHERE is_active = TRUE;

-- Audit log indexes (critical for querying)
CREATE INDEX idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_property_id ON public.audit_log(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at) WHERE is_active = TRUE;
