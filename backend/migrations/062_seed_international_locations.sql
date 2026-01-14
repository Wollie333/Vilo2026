-- ============================================================================
-- Migration: Seed International Location Data
-- Description: Adds multiple countries with their states/provinces and cities
-- ============================================================================

-- ============================================================================
-- COUNTRIES (Let database generate UUIDs)
-- ============================================================================

INSERT INTO countries (name, code, code_2, sort_order) VALUES
  ('Botswana', 'BWA', 'BW', 2),
  ('Namibia', 'NAM', 'NA', 3),
  ('Zimbabwe', 'ZWE', 'ZW', 4),
  ('Mozambique', 'MOZ', 'MZ', 5),
  ('Kenya', 'KEN', 'KE', 6),
  ('Tanzania', 'TZA', 'TZ', 7),
  ('United Kingdom', 'GBR', 'GB', 10),
  ('France', 'FRA', 'FR', 11),
  ('Spain', 'ESP', 'ES', 12),
  ('Italy', 'ITA', 'IT', 13),
  ('Germany', 'DEU', 'DE', 14),
  ('Portugal', 'PRT', 'PT', 15),
  ('Greece', 'GRC', 'GR', 16),
  ('United States', 'USA', 'US', 20),
  ('Canada', 'CAN', 'CA', 21),
  ('Mexico', 'MEX', 'MX', 22),
  ('Brazil', 'BRA', 'BR', 23),
  ('Australia', 'AUS', 'AU', 30),
  ('New Zealand', 'NZL', 'NZ', 31),
  ('Thailand', 'THA', 'TH', 40),
  ('Indonesia', 'IDN', 'ID', 41),
  ('Malaysia', 'MYS', 'MY', 42),
  ('Singapore', 'SGP', 'SG', 43),
  ('United Arab Emirates', 'ARE', 'AE', 44)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- BOTSWANA - Districts
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'South-East', 'SE', 1 FROM countries WHERE code = 'BWA'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'North-West', 'NW', 2 FROM countries WHERE code = 'BWA'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'North-East', 'NE', 3 FROM countries WHERE code = 'BWA'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Chobe', 'CH', 4 FROM countries WHERE code = 'BWA'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Gaborone', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'BWA' AND p.code = 'SE'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Lobatse', ARRAY['0000'], 2
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'BWA' AND p.code = 'SE'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Maun', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'BWA' AND p.code = 'NW'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Francistown', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'BWA' AND p.code = 'NE'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Kasane', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'BWA' AND p.code = 'CH'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UNITED STATES - Major States
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'California', 'CA', 1 FROM countries WHERE code = 'USA'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Florida', 'FL', 2 FROM countries WHERE code = 'USA'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'New York', 'NY', 3 FROM countries WHERE code = 'USA'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Texas', 'TX', 4 FROM countries WHERE code = 'USA'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Nevada', 'NV', 5 FROM countries WHERE code = 'USA'
ON CONFLICT DO NOTHING;

-- California Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Los Angeles', ARRAY['90001'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'USA' AND p.code = 'CA'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'San Francisco', ARRAY['94102'], 2
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'USA' AND p.code = 'CA'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'San Diego', ARRAY['92101'], 3
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'USA' AND p.code = 'CA'
ON CONFLICT DO NOTHING;

-- Florida Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Miami', ARRAY['33101'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'USA' AND p.code = 'FL'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Orlando', ARRAY['32801'], 2
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'USA' AND p.code = 'FL'
ON CONFLICT DO NOTHING;

-- New York Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'New York City', ARRAY['10001'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'USA' AND p.code = 'NY'
ON CONFLICT DO NOTHING;

-- Texas Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Houston', ARRAY['77002'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'USA' AND p.code = 'TX'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Austin', ARRAY['73301'], 2
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'USA' AND p.code = 'TX'
ON CONFLICT DO NOTHING;

-- Nevada Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Las Vegas', ARRAY['89101'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'USA' AND p.code = 'NV'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UNITED KINGDOM - Countries/Regions
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'England', 'ENG', 1 FROM countries WHERE code = 'GBR'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Scotland', 'SCT', 2 FROM countries WHERE code = 'GBR'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Wales', 'WLS', 3 FROM countries WHERE code = 'GBR'
ON CONFLICT DO NOTHING;

-- England Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'London', ARRAY['SW1A 1AA'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'GBR' AND p.code = 'ENG'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Manchester', ARRAY['M1 1AA'], 2
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'GBR' AND p.code = 'ENG'
ON CONFLICT DO NOTHING;

-- Scotland Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Edinburgh', ARRAY['EH1 1AA'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'GBR' AND p.code = 'SCT'
ON CONFLICT DO NOTHING;

-- Wales Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Cardiff', ARRAY['CF1 1AA'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'GBR' AND p.code = 'WLS'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AUSTRALIA - States
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'New South Wales', 'NSW', 1 FROM countries WHERE code = 'AUS'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Victoria', 'VIC', 2 FROM countries WHERE code = 'AUS'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Queensland', 'QLD', 3 FROM countries WHERE code = 'AUS'
ON CONFLICT DO NOTHING;

-- Australia Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Sydney', ARRAY['2000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'AUS' AND p.code = 'NSW'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Melbourne', ARRAY['3000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'AUS' AND p.code = 'VIC'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Brisbane', ARRAY['4000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'AUS' AND p.code = 'QLD'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- THAILAND - Regions
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Central Thailand', 'C', 1 FROM countries WHERE code = 'THA'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Southern Thailand', 'S', 2 FROM countries WHERE code = 'THA'
ON CONFLICT DO NOTHING;

-- Thailand Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Bangkok', ARRAY['10100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'THA' AND p.code = 'C'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Phuket', ARRAY['83000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'THA' AND p.code = 'S'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KENYA - Counties
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Nairobi', 'NBI', 1 FROM countries WHERE code = 'KEN'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Mombasa', 'MBA', 2 FROM countries WHERE code = 'KEN'
ON CONFLICT DO NOTHING;

-- Kenya Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Nairobi', ARRAY['00100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'KEN' AND p.code = 'NBI'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Mombasa', ARRAY['80100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'KEN' AND p.code = 'MBA'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UNITED ARAB EMIRATES - Emirates
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Dubai', 'DU', 1 FROM countries WHERE code = 'ARE'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Abu Dhabi', 'AZ', 2 FROM countries WHERE code = 'ARE'
ON CONFLICT DO NOTHING;

-- UAE Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Dubai', ARRAY['00000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'ARE' AND p.code = 'DU'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Abu Dhabi', ARRAY['00000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'ARE' AND p.code = 'AZ'
ON CONFLICT DO NOTHING;
