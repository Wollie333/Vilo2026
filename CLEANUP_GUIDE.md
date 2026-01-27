# Database Cleanup Guide

## Quick Start

**Purpose**: Clean all transactional data (bookings, invoices, messages, users) while keeping super admin and system configuration.

---

## What Gets Deleted ❌

- ❌ All bookings and booking-related data
- ❌ All invoices (subscription + booking)
- ❌ All credit memos and credit notes
- ❌ All payments and checkouts
- ❌ All messages and conversations
- ❌ All reviews
- ❌ All properties and rooms
- ❌ All non-admin users
- ❌ All companies (except super admin's)
- ❌ All promotions
- ❌ All add-ons
- ❌ All support tickets
- ❌ All wishlists
- ❌ All customers
- ❌ All subscriptions (except super admin's)

---

## What Gets Preserved ✅

- ✅ Super admin user(s)
- ✅ Subscription plans
- ✅ Member types
- ✅ Website templates
- ✅ Roles and permissions
- ✅ System configuration
- ✅ Invoice settings (global)
- ✅ Reference data (locations, amenities)

---

## How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `CLEANUP_DATABASE.sql`
3. Paste into SQL Editor
4. **REVIEW THE SCRIPT** - Make sure you understand what will be deleted
5. Click "Run"
6. Check the output:
   - Should show "Found X super admin account(s)"
   - Should show "CLEANUP COMPLETE!"
   - Should show remaining users (only super admin)

### Option 2: Command Line (psql)

```bash
# Connect to your database
psql -U your_user -d your_database

# Run the cleanup script
\i CLEANUP_DATABASE.sql

# Or one-liner
psql -U your_user -d your_database -f CLEANUP_DATABASE.sql
```

---

## Safety Features

### 1. Transaction Wrapped
The script runs in a transaction (BEGIN...COMMIT), so if anything goes wrong, nothing is committed.

### 2. Super Admin Check
Script will ABORT if no super admin is found:
```
ERROR: No super admin found! Create one before running cleanup.
```

### 3. Verification Step
After cleanup, the script shows:
- Remaining users (should only be super admin)
- Count of bookings (should be 0)
- Count of invoices (should be 0)
- Count of properties (should be 0)
- Count of messages (should be 0)

### 4. Rollback Option
If you want to test first without committing:

```sql
-- Change the last line from:
COMMIT;

-- To:
ROLLBACK;
```

This will show you what would be deleted but NOT actually delete it.

---

## Before You Run

### Checklist

- [ ] **Backup your database** (if this is production or has any data you care about)
- [ ] **Confirm you have a super admin account**
- [ ] **Review the script** - Make sure you understand what will be deleted
- [ ] **This is a development/testing database** (NOT production)
- [ ] **You're okay losing ALL user data**

---

## Verification Queries

### Check Super Admin Exists
```sql
SELECT id, email, full_name, is_super_admin
FROM public.users
WHERE is_super_admin = TRUE;
```

Should return at least one user.

### After Cleanup - Verify Data Removed
```sql
-- Should all return 0
SELECT COUNT(*) FROM public.bookings;      -- 0
SELECT COUNT(*) FROM public.invoices;      -- 0
SELECT COUNT(*) FROM public.messages;      -- 0
SELECT COUNT(*) FROM public.properties;    -- 0
SELECT COUNT(*) FROM public.reviews;       -- 0

-- Should only return super admin(s)
SELECT COUNT(*) FROM public.users;
SELECT email, is_super_admin FROM public.users;

-- Should still have plans
SELECT COUNT(*) FROM public.subscription_plans;  -- Should have plans

-- Should still have templates
SELECT COUNT(*) FROM public.website_templates;   -- Should have templates
```

---

## What If Something Goes Wrong?

### Issue: "No super admin found!"

**Solution**: Create a super admin first:

```sql
-- Option 1: Make existing user a super admin
UPDATE public.users
SET is_super_admin = TRUE, is_admin = TRUE
WHERE email = 'your-email@example.com';

-- Option 2: Run migration 123 to create permanent super admin
-- See: backend/migrations/123_create_permanent_super_admin.sql
```

### Issue: Foreign Key Constraint Errors

**Cause**: Script tries to delete data in wrong order.

**Solution**: The script deletes in bottom-up order (children before parents). If you get FK errors:
1. Note which table is causing the issue
2. Find references to that table
3. Add delete statement for referencing table before the one failing

### Issue: Want to Keep Some Data

**Modify the script**:

```sql
-- Example: Keep properties for super admin
DELETE FROM public.properties
WHERE owner_id NOT IN (
  SELECT id FROM public.users WHERE is_super_admin = TRUE
);
```

---

## Additional Cleanup Options

### Clean Invoice Settings Too

```sql
-- Add this to the script if you want to reset invoice settings
DELETE FROM public.invoice_settings WHERE company_id IS NOT NULL;
```

### Clean Legal Pages

```sql
-- Add this if you want fresh legal pages
DELETE FROM public.legal_pages;
```

### Clean Everything Including Templates

```sql
-- ⚠️ NUCLEAR OPTION - Removes templates too
DELETE FROM public.template_sections;
DELETE FROM public.template_pages;
DELETE FROM public.website_templates;
```

---

## After Cleanup - Fresh Start

### What You'll Have

✅ Clean database with:
- Super admin account (can login)
- All subscription plans available
- All website templates available
- No test data cluttering the system

### Next Steps

1. **Login as super admin**
2. **Create a test property owner user** (via `/admin/users`)
3. **Create test properties** (as property owner)
4. **Create test bookings** (as guest)
5. **Test invoice generation**
6. **Test all features fresh**

### Creating Test Users

```sql
-- Quick SQL to create test users (run as super admin in Supabase)

-- Test Property Owner
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'owner@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Then create profile in public.users via your signup flow
```

Or use the frontend signup page: `http://localhost:5173/signup`

---

## Frequency

**When to run this cleanup:**

- ✅ Before major testing sessions
- ✅ After completing a feature to start fresh
- ✅ When database is cluttered with test data
- ✅ Before demoing the system
- ❌ NEVER in production
- ❌ NEVER without a backup

---

## Summary

**Script**: `CLEANUP_DATABASE.sql`
**Safe**: Yes (transaction-wrapped, super admin protected)
**Reversible**: Yes (if you use ROLLBACK instead of COMMIT)
**Time**: ~5 seconds to run

**Command**:
```bash
# In Supabase SQL Editor
# Just copy/paste CLEANUP_DATABASE.sql and run
```

You'll have a clean system with:
- 1 super admin user
- All system configuration intact
- Zero transactional data
- Ready for fresh testing

---

## Questions?

- Check script comments for detailed explanations
- Review verification queries above
- Test with ROLLBACK first if unsure
- Always backup production databases

**Ready to start fresh? Run CLEANUP_DATABASE.sql in Supabase SQL Editor!**
