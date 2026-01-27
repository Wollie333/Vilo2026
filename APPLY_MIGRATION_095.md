# URGENT: Apply Database Migration 095

## Issue

The subscription plan slug and customization fields are not saving because **migration 095 hasn't been applied to your database yet**.

## Migration File

The migration file exists at: `backend/migrations/095_add_subscription_cms_fields.sql`

## What This Migration Does

Adds the following columns to the `subscription_types` table:
- `slug` (VARCHAR, unique, required)
- `custom_headline` (TEXT)
- `custom_description` (TEXT)
- `custom_features` (JSONB array)
- `custom_cta_text` (VARCHAR)
- `checkout_badge` (VARCHAR)
- `checkout_accent_color` (VARCHAR)

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to the **SQL Editor**

2. **Open the Migration File**
   - Open `backend/migrations/095_add_subscription_cms_fields.sql`
   - Copy the entire contents

3. **Run the Migration**
   - Paste the SQL into the Supabase SQL Editor
   - Click **RUN** to execute

4. **Verify Success**
   - Check the output for success messages
   - Should see: "Migration 095: Add subscription CMS fields - COMPLETED"

### Option 2: Using psql Command Line

```bash
# Connect to your database
psql -h <your-supabase-host> -U postgres -d postgres

# Run the migration
\i backend/migrations/095_add_subscription_cms_fields.sql

# Verify the columns were added
\d subscription_types
```

### Option 3: Manual Column Addition

If you prefer, you can add the columns manually:

```sql
ALTER TABLE subscription_types
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_headline TEXT,
  ADD COLUMN IF NOT EXISTS custom_description TEXT,
  ADD COLUMN IF NOT EXISTS custom_features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_cta_text VARCHAR(100) DEFAULT 'Get Started',
  ADD COLUMN IF NOT EXISTS checkout_badge VARCHAR(50),
  ADD COLUMN IF NOT EXISTS checkout_accent_color VARCHAR(20);

-- Generate slugs from existing plan names
UPDATE subscription_types
SET slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi'))
WHERE slug = '' OR slug IS NULL;

-- Make slug unique and required
ALTER TABLE subscription_types
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT subscription_types_slug_key UNIQUE (slug);
```

## Verify Migration Was Applied

After running the migration, verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscription_types'
  AND column_name IN ('slug', 'custom_headline', 'custom_description', 'custom_features', 'custom_cta_text', 'checkout_badge', 'checkout_accent_color');

-- Should return 7 rows
```

## After Applying Migration

Once the migration is applied:

1. **Restart your backend server** (if running)
2. **Refresh the admin billing page** in your browser
3. **Try editing a plan** and changing the slug
4. **Click Save**
5. **Refresh the page** - changes should now persist! ✅

## Important Notes

- This migration is **safe** to run - it uses `IF NOT EXISTS` and won't break existing data
- Existing plans will automatically get slugs generated from their names
- The migration includes backfills and integrity checks
- All constraints are added safely

## Need Help?

If you encounter any errors during migration:
1. Check the error message
2. Verify you have database admin permissions
3. Check if the columns already exist (might have been added manually)
4. Make sure Supabase connection is active

After this migration is applied, the UI updates will work correctly!
