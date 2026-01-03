-- Migration: 008_add_business_fields.sql
-- Description: Add VAT number and Company Registration fields to users table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================
-- ADD BUSINESS FIELDS TO USERS
-- ============================================

-- Add VAT Number field (South African format: 10 digits starting with 4)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS vat_number VARCHAR(20);

-- Add Company Registration field (South African format: YYYY/NNNNNN/NN)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_registration VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN users.vat_number IS 'South African VAT number (10 digits, starts with 4)';
COMMENT ON COLUMN users.company_registration IS 'South African company registration number (YYYY/NNNNNN/NN format)';
