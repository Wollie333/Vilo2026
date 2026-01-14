# Apply Subscription Manager Migrations

## Quick Start

These 2 migrations add multi-billing support and granular permissions to your subscription manager.

### Migration 064: Multi-Billing Support
**File**: `backend/migrations/064_enhance_subscription_pricing_and_billing.sql`

**What it does:**
- Adds `billing_types` column (monthly, annual, one-off flags)
- Adds `pricing_tiers` column (detailed config per billing type)
- Migrates existing plans to new format automatically
- Adds validation constraint (at least one billing type must be enabled)

### Migration 065: Granular Permissions
**File**: `backend/migrations/065_seed_comprehensive_permissions.sql`

**What it does:**
- Seeds 140+ permissions across 8 categories
- Covers all major features (properties, bookings, payments, reviews, etc.)
- Each resource gets 5 actions: create, read, update, delete, manage

---

## Option 1: Apply via Supabase Dashboard (RECOMMENDED)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Vilo project
   - Click "SQL Editor" in left sidebar

2. **Apply Migration 064**
   - Click "+ New Query"
   - Copy entire contents of `backend/migrations/064_enhance_subscription_pricing_and_billing.sql`
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - ✅ You should see "Success" message

3. **Apply Migration 065**
   - Click "+ New Query"
   - Copy entire contents of `backend/migrations/065_seed_comprehensive_permissions.sql`
   - Paste into SQL Editor
   - Click "Run"
   - ✅ You should see "Success. No rows returned"

4. **Verify**
   ```sql
   -- Check new columns exist
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'subscription_types'
   AND column_name IN ('billing_types', 'pricing_tiers');

   -- Check permissions were created
   SELECT COUNT(*) as permission_count FROM permissions;
   -- Should return 140+
   ```

---

## Option 2: Apply via Supabase CLI

```bash
# Make sure you have Supabase CLI installed
supabase migration new apply_064_065

# Copy migrations content to the new file
# Then push
supabase db push
```

---

## Option 3: Apply via psql

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f backend/migrations/064_enhance_subscription_pricing_and_billing.sql

psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f backend/migrations/065_seed_comprehensive_permissions.sql
```

---

## Verification

After applying migrations, verify in Supabase Dashboard → Table Editor:

### Check subscription_types table:
- Should have new columns: `billing_types`, `pricing_tiers`
- Existing plans should have migrated data

### Check permissions table:
- Should have 140+ rows
- Run: `SELECT resource, COUNT(*) FROM permissions GROUP BY resource ORDER BY resource;`
- Should show permissions for: properties, rooms, bookings, etc.

---

## Rollback (if needed)

If something goes wrong:

```sql
-- Rollback Migration 064
ALTER TABLE public.subscription_types
DROP COLUMN IF EXISTS billing_types,
DROP COLUMN IF EXISTS pricing_tiers;

ALTER TABLE public.subscription_types
DROP CONSTRAINT IF EXISTS chk_at_least_one_billing_type;

-- Rollback Migration 065
DELETE FROM public.permissions
WHERE resource IN (
  'properties', 'rooms', 'addons', 'bookings', 'checkout',
  'invoices', 'refunds', 'credit_notes', 'payment_rules',
  'promotions', 'reviews', 'discovery', 'wishlist',
  'users', 'roles', 'companies', 'chat', 'notifications',
  'webhooks', 'settings', 'analytics', 'reports', 'audit_logs',
  'dashboard', 'legal', 'locations', 'onboarding'
);
```

---

## Next Steps

Once migrations are applied:

1. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to Billing Settings**:
   - Go to http://localhost:5173/admin/billing
   - Click on "Subscription Plans" tab

3. **Create a test plan**:
   - Click "Create New Plan"
   - Try the new tabbed interface:
     - Basic Info: Enter plan details
     - Pricing: Check multiple billing types (monthly + annual)
     - Limits: Set unlimited limits with checkboxes
     - Permissions: Select granular permissions by category

---

## Troubleshooting

### "relation does not exist"
- Make sure you're running migrations in correct order
- Check that previous migrations (001-063) are applied

### "permission denied"
- Make sure you're using service role key (not anon key)
- Check RLS policies if using anon key

### "duplicate key value violates unique constraint"
- Migration 065 has `ON CONFLICT DO NOTHING`
- Safe to run multiple times

### Need help?
- Check Supabase logs: Dashboard → Logs → Postgres Logs
- Review migration files for comments
