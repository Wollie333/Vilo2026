-- ============================================================================
-- Migration: Focus on African Countries Only
-- Description: Remove non-African countries and complete data for target countries
-- Date: 2026-01-12
-- ============================================================================

-- Target countries: South Africa, Lesotho, Botswana, Zimbabwe, Kenya, Namibia, Eswatini, Mozambique

-- ============================================================================
-- STEP 1: DELETE NON-AFRICAN COUNTRIES
-- ============================================================================

-- Delete cities first (foreign key constraint)
DELETE FROM cities
WHERE province_id IN (
  SELECT p.id FROM provinces p
  JOIN countries c ON p.country_id = c.id
  WHERE c.code NOT IN ('ZAF', 'LSO', 'BWA', 'ZWE', 'KEN', 'NAM', 'SWZ', 'MOZ')
);

-- Delete provinces (foreign key constraint)
DELETE FROM provinces
WHERE country_id IN (
  SELECT id FROM countries
  WHERE code NOT IN ('ZAF', 'LSO', 'BWA', 'ZWE', 'KEN', 'NAM', 'SWZ', 'MOZ')
);

-- Delete non-African countries
DELETE FROM countries
WHERE code NOT IN ('ZAF', 'LSO', 'BWA', 'ZWE', 'KEN', 'NAM', 'SWZ', 'MOZ');

-- ============================================================================
-- STEP 2: ADD MISSING COUNTRIES
-- ============================================================================

-- Add Lesotho
INSERT INTO countries (name, code, code_2, sort_order) VALUES
  ('Lesotho', 'LSO', 'LS', 2)
ON CONFLICT (code) DO NOTHING;

-- Add Eswatini (Swaziland)
INSERT INTO countries (name, code, code_2, sort_order) VALUES
  ('Eswatini', 'SWZ', 'SZ', 8)
ON CONFLICT (code) DO NOTHING;

-- Update sort order for consistency
UPDATE countries SET sort_order = 1 WHERE code = 'ZAF';
UPDATE countries SET sort_order = 2 WHERE code = 'LSO';
UPDATE countries SET sort_order = 3 WHERE code = 'BWA';
UPDATE countries SET sort_order = 4 WHERE code = 'ZWE';
UPDATE countries SET sort_order = 5 WHERE code = 'NAM';
UPDATE countries SET sort_order = 6 WHERE code = 'KEN';
UPDATE countries SET sort_order = 7 WHERE code = 'MOZ';
UPDATE countries SET sort_order = 8 WHERE code = 'SWZ';

-- ============================================================================
-- STEP 3: LESOTHO - Districts
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Maseru', 'A', 1 FROM countries WHERE code = 'LSO'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Berea', 'B', 2 FROM countries WHERE code = 'LSO'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Leribe', 'C', 3 FROM countries WHERE code = 'LSO'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Mafeteng', 'E', 4 FROM countries WHERE code = 'LSO'
ON CONFLICT DO NOTHING;

-- Lesotho Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Maseru', ARRAY['100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'LSO' AND p.code = 'A'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Teyateyaneng', ARRAY['200'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'LSO' AND p.code = 'B'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Hlotse', ARRAY['300'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'LSO' AND p.code = 'C'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Mafeteng', ARRAY['400'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'LSO' AND p.code = 'E'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: ESWATINI (Swaziland) - Regions
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Hhohho', 'HH', 1 FROM countries WHERE code = 'SWZ'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Manzini', 'MA', 2 FROM countries WHERE code = 'SWZ'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Shiselweni', 'SH', 3 FROM countries WHERE code = 'SWZ'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Lubombo', 'LU', 4 FROM countries WHERE code = 'SWZ'
ON CONFLICT DO NOTHING;

-- Eswatini Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Mbabane', ARRAY['H100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'SWZ' AND p.code = 'HH'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Manzini', ARRAY['M200'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'SWZ' AND p.code = 'MA'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Nhlangano', ARRAY['S300'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'SWZ' AND p.code = 'SH'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Siteki', ARRAY['L400'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'SWZ' AND p.code = 'LU'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 5: ZIMBABWE - Provinces
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Harare', 'HA', 1 FROM countries WHERE code = 'ZWE'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Bulawayo', 'BU', 2 FROM countries WHERE code = 'ZWE'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Manicaland', 'MA', 3 FROM countries WHERE code = 'ZWE'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Mashonaland Central', 'MC', 4 FROM countries WHERE code = 'ZWE'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Matabeleland North', 'MN', 5 FROM countries WHERE code = 'ZWE'
ON CONFLICT DO NOTHING;

-- Zimbabwe Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Harare', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'ZWE' AND p.code = 'HA'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Chitungwiza', ARRAY['0000'], 2
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'ZWE' AND p.code = 'HA'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Bulawayo', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'ZWE' AND p.code = 'BU'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Mutare', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'ZWE' AND p.code = 'MA'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Bindura', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'ZWE' AND p.code = 'MC'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Hwange', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'ZWE' AND p.code = 'MN'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 6: NAMIBIA - Regions
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Khomas', 'KH', 1 FROM countries WHERE code = 'NAM'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Erongo', 'ER', 2 FROM countries WHERE code = 'NAM'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Oshana', 'ON', 3 FROM countries WHERE code = 'NAM'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Otjozondjupa', 'OT', 4 FROM countries WHERE code = 'NAM'
ON CONFLICT DO NOTHING;

-- Namibia Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Windhoek', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'NAM' AND p.code = 'KH'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Swakopmund', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'NAM' AND p.code = 'ER'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Walvis Bay', ARRAY['0000'], 2
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'NAM' AND p.code = 'ER'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Oshakati', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'NAM' AND p.code = 'ON'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Otjiwarongo', ARRAY['0000'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'NAM' AND p.code = 'OT'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 7: MOZAMBIQUE - Provinces
-- ============================================================================

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Maputo', 'MPM', 1 FROM countries WHERE code = 'MOZ'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Gaza', 'G', 2 FROM countries WHERE code = 'MOZ'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Inhambane', 'I', 3 FROM countries WHERE code = 'MOZ'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Sofala', 'S', 4 FROM countries WHERE code = 'MOZ'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Nampula', 'N', 5 FROM countries WHERE code = 'MOZ'
ON CONFLICT DO NOTHING;

-- Mozambique Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Maputo', ARRAY['1100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'MOZ' AND p.code = 'MPM'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Matola', ARRAY['1200'], 2
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'MOZ' AND p.code = 'MPM'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Xai-Xai', ARRAY['1300'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'MOZ' AND p.code = 'G'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Inhambane', ARRAY['1400'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'MOZ' AND p.code = 'I'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Beira', ARRAY['2100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'MOZ' AND p.code = 'S'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Nampula', ARRAY['3100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'MOZ' AND p.code = 'N'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 8: KENYA - Add More Provinces
-- ============================================================================

-- Kenya already has Nairobi and Mombasa, add more regions
INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Nakuru', 'NK', 3 FROM countries WHERE code = 'KEN'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Kisumu', 'KS', 4 FROM countries WHERE code = 'KEN'
ON CONFLICT DO NOTHING;

INSERT INTO provinces (country_id, name, code, sort_order)
SELECT id, 'Eldoret', 'EL', 5 FROM countries WHERE code = 'KEN'
ON CONFLICT DO NOTHING;

-- Kenya Cities
INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Nakuru', ARRAY['20100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'KEN' AND p.code = 'NK'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Kisumu', ARRAY['40100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'KEN' AND p.code = 'KS'
ON CONFLICT DO NOTHING;

INSERT INTO cities (province_id, name, postal_codes, sort_order)
SELECT p.id, 'Eldoret', ARRAY['30100'], 1
FROM provinces p JOIN countries c ON p.country_id = c.id
WHERE c.code = 'KEN' AND p.code = 'EL'
ON CONFLICT DO NOTHING;
