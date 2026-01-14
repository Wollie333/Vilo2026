-- ============================================================================
-- Migration: Add Worldwide Countries
-- Description: Adds popular countries worldwide for international property listings
-- Date: 2026-01-11
-- ============================================================================

-- Insert popular worldwide countries (sorted alphabetically)
INSERT INTO countries (name, code, code_2, sort_order) VALUES
  -- Africa
  ('Egypt', 'EGY', 'EG', 10),
  ('Kenya', 'KEN', 'KE', 20),
  ('Morocco', 'MAR', 'MA', 30),
  ('Tanzania', 'TZA', 'TZ', 40),

  -- Americas
  ('Argentina', 'ARG', 'AR', 50),
  ('Brazil', 'BRA', 'BR', 60),
  ('Canada', 'CAN', 'CA', 70),
  ('Chile', 'CHL', 'CL', 80),
  ('Colombia', 'COL', 'CO', 90),
  ('Costa Rica', 'CRI', 'CR', 100),
  ('Mexico', 'MEX', 'MX', 110),
  ('Peru', 'PER', 'PE', 120),
  ('United States', 'USA', 'US', 130),

  -- Asia
  ('China', 'CHN', 'CN', 140),
  ('India', 'IND', 'IN', 150),
  ('Indonesia', 'IDN', 'ID', 160),
  ('Japan', 'JPN', 'JP', 170),
  ('Malaysia', 'MYS', 'MY', 180),
  ('Singapore', 'SGP', 'SG', 190),
  ('South Korea', 'KOR', 'KR', 200),
  ('Thailand', 'THA', 'TH', 210),
  ('United Arab Emirates', 'ARE', 'AE', 220),
  ('Vietnam', 'VNM', 'VN', 230),

  -- Europe
  ('Austria', 'AUT', 'AT', 240),
  ('Belgium', 'BEL', 'BE', 250),
  ('Croatia', 'HRV', 'HR', 260),
  ('Czech Republic', 'CZE', 'CZ', 270),
  ('Denmark', 'DNK', 'DK', 280),
  ('Finland', 'FIN', 'FI', 290),
  ('France', 'FRA', 'FR', 300),
  ('Germany', 'DEU', 'DE', 310),
  ('Greece', 'GRC', 'GR', 320),
  ('Hungary', 'HUN', 'HU', 330),
  ('Iceland', 'ISL', 'IS', 340),
  ('Ireland', 'IRL', 'IE', 350),
  ('Italy', 'ITA', 'IT', 360),
  ('Netherlands', 'NLD', 'NL', 370),
  ('Norway', 'NOR', 'NO', 380),
  ('Poland', 'POL', 'PL', 390),
  ('Portugal', 'PRT', 'PT', 400),
  ('Romania', 'ROU', 'RO', 410),
  ('Spain', 'ESP', 'ES', 420),
  ('Sweden', 'SWE', 'SE', 430),
  ('Switzerland', 'CHE', 'CH', 440),
  ('Turkey', 'TUR', 'TR', 450),
  ('United Kingdom', 'GBR', 'GB', 460),

  -- Oceania
  ('Australia', 'AUS', 'AU', 470),
  ('Fiji', 'FJI', 'FJ', 480),
  ('New Zealand', 'NZL', 'NZ', 490)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  code_2 = EXCLUDED.code_2,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Comment
COMMENT ON TABLE countries IS 'Worldwide countries for international property listings. Initially seeded with 50+ popular tourism destinations.';
