# Database Cleanup Guide - Quick Reference

**Date:** 2026-01-12
**Issue:** Duplicate free tier subscription plans blocking deletion + need to bulk remove users

---

## 🎯 Recommended Cleanup Order

### Step 1: Fix Duplicate Free Tier Plans (REQUIRED FIRST)

This will merge duplicate free tier subscription plans so you can manage them properly.

**Run this SQL in Supabase SQL Editor:**

```sql
-- Execute the cleanup script
SELECT * FROM public.merge_duplicate_free_tier_plans();
```

**Expected Output:**
```
kept_plan_id: <uuid>
deleted_plan_ids: [<uuid>, <uuid>, ...]
migrated_subscriptions: <number>
```

**Verify it worked:**
```sql
-- Should only show 1 free tier plan now
SELECT id, name, display_name, price_cents
FROM public.subscription_types
WHERE name = 'free_tier' OR LOWER(display_name) LIKE '%free%';
```

---

### Step 2: Clean Up Users (Choose ONE option)

#### Option A: Deactivate Users (RECOMMENDED - Reversible)

**Safer approach** - Users are deactivated but not deleted. You can undo this.

```sql
-- Deactivate all non-admin users
SELECT * FROM public.bulk_deactivate_non_admin_users(
  p_confirm_deactivation := true
);
```

**Verify:**
```sql
-- Check active users (should only be admins)
SELECT u.email, u.is_active, ut.name as user_type
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE u.is_active = true;
```

**To undo (if needed):**
```sql
SELECT public.reactivate_all_users();
```

---

#### Option B: Delete Users (DESTRUCTIVE - Cannot undo)

**⚠️ WARNING:** This permanently deletes users and all their data!

**First, see what will be deleted (DRY RUN):**
```sql
-- Just inspect, nothing deleted yet
-- Run the first section of TEMP_073_bulk_delete_users_except_admin.sql
```

**Then execute deletion:**
```sql
-- DESTRUCTIVE - Only run if you're 100% sure!
SELECT * FROM public.bulk_delete_non_admin_users(
  p_confirm_deletion := true,
  p_require_password := 'DELETE_ALL_USERS'
);
```

---

## 📋 Full Cleanup Checklist

### Before You Start
- [ ] Backup your database (Supabase → Settings → Backups)
- [ ] Verify you have super admin access
- [ ] Review the impact analysis

### Execute Cleanup
1. [ ] Run Step 1: Fix duplicate free tier plans
2. [ ] Verify only 1 free tier plan exists
3. [ ] Choose Option A (deactivate) or Option B (delete)
4. [ ] Run your chosen option
5. [ ] Verify the results

### After Cleanup
- [ ] Test login as super admin
- [ ] Check subscription plans page
- [ ] Verify new user signup works (creates free tier)
- [ ] Clean up temporary functions (see below)

---

## 🧹 Cleanup Temporary Functions

After you're done and verified everything works:

```sql
-- Remove temporary cleanup functions
DROP FUNCTION IF EXISTS public.bulk_delete_non_admin_users;
DROP FUNCTION IF EXISTS public.bulk_deactivate_non_admin_users;
DROP FUNCTION IF EXISTS public.reactivate_all_users;
DROP FUNCTION IF EXISTS public.merge_duplicate_free_tier_plans;
```

Delete the temporary migration files:
- `backend/migrations/TEMP_073_bulk_delete_users_except_admin.sql`
- `backend/migrations/TEMP_074_bulk_deactivate_users.sql`

---

## 🔍 Verification Queries

### Check remaining users
```sql
SELECT u.email, u.is_active, ut.name as user_type, ut.category
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
ORDER BY u.created_at;
```

### Check subscription plans
```sql
SELECT
  st.id,
  st.name,
  st.display_name,
  st.price_cents,
  COUNT(us.id) as active_subscriptions
FROM public.subscription_types st
LEFT JOIN public.user_subscriptions us ON us.subscription_type_id = st.id AND us.is_active = true
GROUP BY st.id
ORDER BY st.name;
```

### Check active subscriptions
```sql
SELECT
  u.email,
  st.name as plan_name,
  us.status,
  us.is_active,
  us.started_at
FROM public.user_subscriptions us
JOIN public.users u ON us.user_id = u.id
JOIN public.subscription_types st ON us.subscription_type_id = st.id
WHERE us.is_active = true
ORDER BY us.started_at DESC;
```

---

## 🆘 If Something Goes Wrong

### If you locked yourself out:
1. Use Supabase SQL Editor (doesn't require app login)
2. Check if super admin user still exists:
   ```sql
   SELECT * FROM public.users u
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.name = 'super_admin';
   ```
3. Restore from backup if needed

### If users were accidentally deleted:
- Restore from database backup (Supabase → Settings → Backups → Restore)

### If you used deactivation and want to undo:
```sql
SELECT public.reactivate_all_users();
```

---

## 📞 Quick Reference Commands

```sql
-- 1. Fix duplicate free tiers
SELECT * FROM public.merge_duplicate_free_tier_plans();

-- 2A. Deactivate users (SAFE)
SELECT * FROM public.bulk_deactivate_non_admin_users(p_confirm_deactivation := true);

-- 2B. Delete users (DESTRUCTIVE)
SELECT * FROM public.bulk_delete_non_admin_users(
  p_confirm_deletion := true,
  p_require_password := 'DELETE_ALL_USERS'
);

-- Verify
SELECT u.email, ut.name FROM users u JOIN user_types ut ON u.user_type_id = ut.id;

-- Cleanup
DROP FUNCTION IF EXISTS public.bulk_delete_non_admin_users;
DROP FUNCTION IF EXISTS public.bulk_deactivate_non_admin_users;
DROP FUNCTION IF EXISTS public.reactivate_all_users;
DROP FUNCTION IF EXISTS public.merge_duplicate_free_tier_plans;
```

---

**Pro Tip:** Start with the deactivation approach (Option A). Test everything works, then if you still want to delete, you can run Option B later.
