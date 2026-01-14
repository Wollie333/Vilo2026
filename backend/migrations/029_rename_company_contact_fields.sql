-- Migration: Rename company contact fields
-- Rename email and phone to contact_email and contact_phone for clarity

ALTER TABLE companies RENAME COLUMN email TO contact_email;
ALTER TABLE companies RENAME COLUMN phone TO contact_phone;
