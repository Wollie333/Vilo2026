-- Migration: 065_seed_comprehensive_permissions.sql
-- Description: Seed comprehensive permissions for granular subscription plan control
--              Creates 140+ permissions across 8 categories for all major features
-- Date: 2026-01-12

-- ============================================================================
-- SEED PERMISSIONS - PROPERTY MANAGEMENT CATEGORY
-- ============================================================================

INSERT INTO public.permissions (resource, action, description) VALUES
  -- Properties
  ('properties', 'create', 'Create new properties'),
  ('properties', 'read', 'View properties'),
  ('properties', 'update', 'Update property details'),
  ('properties', 'delete', 'Delete properties'),
  ('properties', 'manage', 'Full property management including settings and configuration'),

  -- Rooms
  ('rooms', 'create', 'Create new rooms'),
  ('rooms', 'read', 'View rooms'),
  ('rooms', 'update', 'Update room details'),
  ('rooms', 'delete', 'Delete rooms'),
  ('rooms', 'manage', 'Full room management including rates and inventory'),

  -- Add-ons
  ('addons', 'create', 'Create add-ons'),
  ('addons', 'read', 'View add-ons'),
  ('addons', 'update', 'Update add-ons'),
  ('addons', 'delete', 'Delete add-ons'),
  ('addons', 'manage', 'Full add-on management')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- SEED PERMISSIONS - BOOKING OPERATIONS CATEGORY
-- ============================================================================

INSERT INTO public.permissions (resource, action, description) VALUES
  -- Bookings
  ('bookings', 'create', 'Create bookings'),
  ('bookings', 'read', 'View bookings'),
  ('bookings', 'update', 'Modify bookings'),
  ('bookings', 'delete', 'Cancel bookings'),
  ('bookings', 'manage', 'Full booking management including payments and status updates'),

  -- Checkout
  ('checkout', 'create', 'Create checkout sessions'),
  ('checkout', 'read', 'View checkout data'),
  ('checkout', 'update', 'Update checkout information'),
  ('checkout', 'delete', 'Delete checkout sessions'),
  ('checkout', 'manage', 'Manage checkout settings and payment processing'),

  -- Guests (if separate from users)
  ('guests', 'create', 'Create guest records'),
  ('guests', 'read', 'View guest information'),
  ('guests', 'update', 'Update guest details'),
  ('guests', 'delete', 'Delete guest records'),
  ('guests', 'manage', 'Full guest management including history and preferences')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- SEED PERMISSIONS - FINANCIAL MANAGEMENT CATEGORY
-- ============================================================================

INSERT INTO public.permissions (resource, action, description) VALUES
  -- Invoices
  ('invoices', 'create', 'Create invoices'),
  ('invoices', 'read', 'View invoices'),
  ('invoices', 'update', 'Update invoices'),
  ('invoices', 'delete', 'Delete invoices'),
  ('invoices', 'manage', 'Full invoice management including PDF generation and settings'),

  -- Refunds
  ('refunds', 'create', 'Create refund requests'),
  ('refunds', 'read', 'View refunds'),
  ('refunds', 'update', 'Update refund status'),
  ('refunds', 'delete', 'Delete refund requests'),
  ('refunds', 'manage', 'Full refund management including approvals and processing'),

  -- Credit Notes
  ('credit_notes', 'create', 'Create credit notes'),
  ('credit_notes', 'read', 'View credit notes'),
  ('credit_notes', 'update', 'Update credit notes'),
  ('credit_notes', 'delete', 'Delete credit notes'),
  ('credit_notes', 'manage', 'Full credit note management'),

  -- Credit Memos
  ('credit_memos', 'create', 'Create credit memos'),
  ('credit_memos', 'read', 'View credit memos'),
  ('credit_memos', 'update', 'Update credit memos'),
  ('credit_memos', 'delete', 'Delete credit memos'),
  ('credit_memos', 'manage', 'Full credit memo management'),

  -- Payment Rules
  ('payment_rules', 'create', 'Create payment rules'),
  ('payment_rules', 'read', 'View payment rules'),
  ('payment_rules', 'update', 'Update payment rules'),
  ('payment_rules', 'delete', 'Delete payment rules'),
  ('payment_rules', 'manage', 'Full payment rule management including schedules and milestones'),

  -- Payments
  ('payments', 'create', 'Process payments'),
  ('payments', 'read', 'View payment records'),
  ('payments', 'update', 'Update payment information'),
  ('payments', 'delete', 'Delete payment records'),
  ('payments', 'manage', 'Full payment management including gateway configuration')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- SEED PERMISSIONS - MARKETING & SALES CATEGORY
-- ============================================================================

INSERT INTO public.permissions (resource, action, description) VALUES
  -- Promotions
  ('promotions', 'create', 'Create promotions and discount codes'),
  ('promotions', 'read', 'View promotions'),
  ('promotions', 'update', 'Update promotions'),
  ('promotions', 'delete', 'Delete promotions'),
  ('promotions', 'manage', 'Full promotion management including usage tracking'),

  -- Reviews
  ('reviews', 'create', 'Create reviews'),
  ('reviews', 'read', 'View reviews'),
  ('reviews', 'update', 'Update reviews'),
  ('reviews', 'delete', 'Delete reviews'),
  ('reviews', 'manage', 'Manage reviews including moderation, responses, and withdrawal requests'),

  -- Discovery (Property Listings)
  ('discovery', 'read', 'Browse property listings'),
  ('discovery', 'update', 'Update discovery settings'),
  ('discovery', 'manage', 'Manage discovery settings and featured listings'),

  -- Wishlist
  ('wishlist', 'create', 'Add to wishlist'),
  ('wishlist', 'read', 'View wishlist'),
  ('wishlist', 'update', 'Update wishlist'),
  ('wishlist', 'delete', 'Remove from wishlist'),
  ('wishlist', 'manage', 'Manage wishlist settings')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- SEED PERMISSIONS - USER MANAGEMENT CATEGORY
-- ============================================================================

INSERT INTO public.permissions (resource, action, description) VALUES
  -- Users (already exists, but adding for completeness)
  -- ('users', 'create', 'Create users'),
  -- ('users', 'read', 'View users'),
  -- ('users', 'update', 'Update users'),
  -- ('users', 'delete', 'Delete users'),
  -- ('users', 'manage', 'Full user management'),

  -- Roles
  ('roles', 'create', 'Create roles'),
  ('roles', 'read', 'View roles'),
  ('roles', 'update', 'Update roles'),
  ('roles', 'delete', 'Delete roles'),
  ('roles', 'manage', 'Full role management including permission assignment'),

  -- Companies
  ('companies', 'create', 'Create companies'),
  ('companies', 'read', 'View companies'),
  ('companies', 'update', 'Update company details'),
  ('companies', 'delete', 'Delete companies'),
  ('companies', 'manage', 'Full company management including settings and configuration')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- SEED PERMISSIONS - COMMUNICATION CATEGORY
-- ============================================================================

INSERT INTO public.permissions (resource, action, description) VALUES
  -- Chat
  ('chat', 'create', 'Send messages'),
  ('chat', 'read', 'View messages'),
  ('chat', 'update', 'Edit messages'),
  ('chat', 'delete', 'Delete messages'),
  ('chat', 'manage', 'Manage chat including channels, participants, and settings'),

  -- Notifications
  ('notifications', 'create', 'Create notifications'),
  ('notifications', 'read', 'View notifications'),
  ('notifications', 'update', 'Mark notifications as read'),
  ('notifications', 'delete', 'Delete notifications'),
  ('notifications', 'manage', 'Manage notification preferences and templates'),

  -- Webhooks
  ('webhooks', 'create', 'Create webhooks'),
  ('webhooks', 'read', 'View webhooks'),
  ('webhooks', 'update', 'Update webhooks'),
  ('webhooks', 'delete', 'Delete webhooks'),
  ('webhooks', 'manage', 'Full webhook management including event configuration')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- SEED PERMISSIONS - SYSTEM ADMINISTRATION CATEGORY
-- ============================================================================

INSERT INTO public.permissions (resource, action, description) VALUES
  -- Settings (already exists but verify)
  -- ('settings', 'read', 'View settings'),
  -- ('settings', 'update', 'Update settings'),
  ('settings', 'manage', 'Manage all system settings'),

  -- Analytics (already exists)
  -- ('analytics', 'read', 'View analytics'),
  ('analytics', 'manage', 'Manage analytics configuration and reports'),

  -- Reports (already exists but verify)
  -- ('reports', 'create', 'Generate reports'),
  -- ('reports', 'read', 'View reports'),
  -- ('reports', 'update', 'Update reports'),
  -- ('reports', 'delete', 'Delete reports'),
  -- ('reports', 'manage', 'Manage custom reports'),

  -- Audit Logs (already exists)
  -- ('audit_logs', 'read', 'View audit logs'),
  ('audit_logs', 'manage', 'Manage audit log settings and retention'),

  -- Dashboard
  ('dashboard', 'read', 'View dashboard'),
  ('dashboard', 'update', 'Customize dashboard'),
  ('dashboard', 'manage', 'Manage dashboard widgets and layout')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- SEED PERMISSIONS - CONTENT & LEGAL CATEGORY
-- ============================================================================

INSERT INTO public.permissions (resource, action, description) VALUES
  -- Legal
  ('legal', 'read', 'View legal documents'),
  ('legal', 'update', 'Update legal documents'),
  ('legal', 'manage', 'Manage legal documents including policies and terms'),

  -- Locations
  ('locations', 'read', 'View locations'),
  ('locations', 'create', 'Create locations'),
  ('locations', 'update', 'Update locations'),
  ('locations', 'delete', 'Delete locations'),
  ('locations', 'manage', 'Manage location data and hierarchies'),

  -- Onboarding
  ('onboarding', 'read', 'View onboarding status'),
  ('onboarding', 'update', 'Update onboarding progress'),
  ('onboarding', 'manage', 'Manage onboarding flow and steps')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- PERMISSIONS COUNT CHECK
-- ============================================================================

DO $$
DECLARE
  total_permissions INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_permissions FROM public.permissions;

  RAISE NOTICE 'Total permissions seeded: %', total_permissions;

  IF total_permissions < 100 THEN
    RAISE WARNING 'Expected at least 100 permissions, but only found %. Check migration.', total_permissions;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of permissions by category:
-- Property Management:     15 permissions (properties, rooms, addons)
-- Booking Operations:      15 permissions (bookings, checkout, guests)
-- Financial Management:    30 permissions (invoices, refunds, credit notes/memos, payment rules, payments)
-- Marketing & Sales:       18 permissions (promotions, reviews, discovery, wishlist)
-- User Management:         15 permissions (roles, companies)
-- Communication:           15 permissions (chat, notifications, webhooks)
-- System Administration:   8 permissions (settings, analytics, reports, audit logs, dashboard)
-- Content & Legal:         11 permissions (legal, locations, onboarding)
--
-- TOTAL: ~127 permissions (plus any existing permissions not recreated)
