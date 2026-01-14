-- ============================================================================
-- DATABASE BACKUP SCRIPT
-- ============================================================================
-- Date: 2026-01-12
-- Run this in Supabase SQL Editor to generate backup INSERT statements
-- Save the output to restore your data later
-- ============================================================================

-- ============================================================================
-- BACKUP: USERS (Non-Super-Admin)
-- ============================================================================

SELECT 'BACKUP: Users (Non-Super-Admin)' as backup_section;

SELECT
  'INSERT INTO public.users (id, email, password_hash, first_name, last_name, user_type_id, phone, bio, social_links, is_active, is_email_verified, avatar_url, preferred_currency, created_at, updated_at) VALUES (' ||
  quote_literal(u.id) || ', ' ||
  quote_literal(u.email) || ', ' ||
  quote_literal(u.password_hash) || ', ' ||
  quote_literal(u.first_name) || ', ' ||
  quote_literal(u.last_name) || ', ' ||
  quote_literal(u.user_type_id) || ', ' ||
  COALESCE(quote_literal(u.phone), 'NULL') || ', ' ||
  COALESCE(quote_literal(u.bio), 'NULL') || ', ' ||
  COALESCE(quote_literal(u.social_links::text), 'NULL') || ', ' ||
  u.is_active || ', ' ||
  u.is_email_verified || ', ' ||
  COALESCE(quote_literal(u.avatar_url), 'NULL') || ', ' ||
  COALESCE(quote_literal(u.preferred_currency), 'NULL') || ', ' ||
  quote_literal(u.created_at::text) || ', ' ||
  quote_literal(u.updated_at::text) || ');' as backup_sql
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name != 'super_admin';

-- ============================================================================
-- BACKUP: COMPANIES
-- ============================================================================

SELECT 'BACKUP: Companies' as backup_section;

SELECT
  'INSERT INTO public.companies (id, name, owner_id, description, website, logo_url, phone, email, address, vat_number, registration_number, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal(owner_id) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  COALESCE(quote_literal(website), 'NULL') || ', ' ||
  COALESCE(quote_literal(logo_url), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  COALESCE(quote_literal(email), 'NULL') || ', ' ||
  COALESCE(quote_literal(address), 'NULL') || ', ' ||
  COALESCE(quote_literal(vat_number), 'NULL') || ', ' ||
  COALESCE(quote_literal(registration_number), 'NULL') || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');' as backup_sql
FROM public.companies;

-- ============================================================================
-- BACKUP: PROPERTIES
-- ============================================================================

SELECT 'BACKUP: Properties' as backup_section;

SELECT
  'INSERT INTO public.properties (id, owner_id, company_id, name, description, property_type, address, city, province, country, postal_code, latitude, longitude, check_in_time, check_out_time, cancellation_policy_id, amenities, house_rules, images, is_published, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(owner_id) || ', ' ||
  COALESCE(quote_literal(company_id), 'NULL') || ', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(property_type) || ', ' ||
  quote_literal(address) || ', ' ||
  quote_literal(city) || ', ' ||
  quote_literal(province) || ', ' ||
  quote_literal(country) || ', ' ||
  COALESCE(quote_literal(postal_code), 'NULL') || ', ' ||
  COALESCE(latitude::text, 'NULL') || ', ' ||
  COALESCE(longitude::text, 'NULL') || ', ' ||
  COALESCE(quote_literal(check_in_time), 'NULL') || ', ' ||
  COALESCE(quote_literal(check_out_time), 'NULL') || ', ' ||
  COALESCE(quote_literal(cancellation_policy_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(amenities::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(house_rules::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(images::text), 'NULL') || ', ' ||
  is_published || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');' as backup_sql
FROM public.properties;

-- ============================================================================
-- BACKUP: ROOMS
-- ============================================================================

SELECT 'BACKUP: Rooms' as backup_section;

SELECT
  'INSERT INTO public.rooms (id, property_id, name, description, room_type, base_price_cents, max_occupancy, size_sqm, images, amenities, is_available, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(property_id) || ', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(room_type) || ', ' ||
  base_price_cents || ', ' ||
  max_occupancy || ', ' ||
  COALESCE(size_sqm::text, 'NULL') || ', ' ||
  COALESCE(quote_literal(images::text), 'NULL') || ', ' ||
  COALESCE(quote_literal(amenities::text), 'NULL') || ', ' ||
  is_available || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');' as backup_sql
FROM public.rooms;

-- ============================================================================
-- BACKUP: BOOKINGS
-- ============================================================================

SELECT 'BACKUP: Bookings' as backup_section;

SELECT
  'INSERT INTO public.bookings (id, property_id, room_id, guest_id, check_in_date, check_out_date, num_guests, total_amount_cents, status, special_requests, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(property_id) || ', ' ||
  quote_literal(room_id) || ', ' ||
  quote_literal(guest_id) || ', ' ||
  quote_literal(check_in_date::text) || ', ' ||
  quote_literal(check_out_date::text) || ', ' ||
  num_guests || ', ' ||
  total_amount_cents || ', ' ||
  quote_literal(status) || ', ' ||
  COALESCE(quote_literal(special_requests), 'NULL') || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');' as backup_sql
FROM public.bookings;

-- ============================================================================
-- BACKUP: INVOICES
-- ============================================================================

SELECT 'BACKUP: Invoices' as backup_section;

SELECT
  'INSERT INTO public.invoices (id, booking_id, invoice_number, issue_date, due_date, subtotal_cents, tax_cents, total_cents, status, pdf_url, created_at, updated_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  COALESCE(quote_literal(booking_id), 'NULL') || ', ' ||
  quote_literal(invoice_number) || ', ' ||
  quote_literal(issue_date::text) || ', ' ||
  COALESCE(quote_literal(due_date::text), 'NULL') || ', ' ||
  subtotal_cents || ', ' ||
  tax_cents || ', ' ||
  total_cents || ', ' ||
  quote_literal(status) || ', ' ||
  COALESCE(quote_literal(pdf_url), 'NULL') || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');' as backup_sql
FROM public.invoices;

-- ============================================================================
-- BACKUP: CHECKOUTS
-- ============================================================================

SELECT 'BACKUP: Checkouts' as backup_section;

SELECT
  'INSERT INTO public.checkouts (id, user_id, subscription_type_id, amount_cents, billing_interval, payment_provider, status, provider_session_id, created_at, completed_at, expires_at) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(user_id) || ', ' ||
  quote_literal(subscription_type_id) || ', ' ||
  amount_cents || ', ' ||
  quote_literal(billing_interval) || ', ' ||
  quote_literal(payment_provider) || ', ' ||
  quote_literal(status) || ', ' ||
  COALESCE(quote_literal(provider_session_id), 'NULL') || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  COALESCE(quote_literal(completed_at::text), 'NULL') || ', ' ||
  quote_literal(expires_at::text) || ');' as backup_sql
FROM public.checkouts;

-- ============================================================================
-- BACKUP COMPLETE
-- ============================================================================

SELECT '-- ============================================================================' as backup_section
UNION ALL
SELECT '-- BACKUP COMPLETE - Save this output to restore your data'
UNION ALL
SELECT '-- To restore: Run these INSERT statements in order'
UNION ALL
SELECT '-- ============================================================================';
