# Property Creation Fix Guide

## What Was Done (Temporary Workaround)

I've modified the code to temporarily set `owner_id` to `null` when creating properties during onboarding. This bypasses the foreign key constraint issue and **allows you to continue working immediately**.

### Files Modified:
- `backend/src/services/onboarding.service.ts` (lines 355-419)
  - Changed `owner_id: userId` to `owner_id: null`
  - Changed property check from `owner_id` to `company_id`

## ✅ You Can Now Create Properties!

Restart your backend server and try creating a property in the onboarding flow. It should work now.

```bash
cd backend
npm run dev
```

---

## What Needs to Be Fixed in the Database

The root cause is a database constraint pointing to the wrong table:

**Current (WRONG):**
```
properties.owner_id → user_profiles.id  ❌
```

**Should Be:**
```
properties.owner_id → users.id  ✅
```

---

## How to Permanently Fix the Database

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `FIX_PROPERTY_OWNERS.sql` (located in your project root)
4. Run the entire script
5. You should see "FIXED - Now references users table"

### Option 2: Use Supabase CLI (If you have it set up)

```bash
cd backend
npx supabase db push --include-seed
```

---

## After Fixing the Database

Once the database constraint is fixed, you need to:

### 1. Update the Code Back to Normal

Edit `backend/src/services/onboarding.service.ts` around line 408:

**Change from:**
```typescript
owner_id: null, // Temporarily NULL until properties_owner_id_fkey is fixed
```

**Back to:**
```typescript
owner_id: userId,
```

### 2. Fix Existing Properties with NULL owner_id

The second part of `FIX_PROPERTY_OWNERS.sql` will automatically update all properties that were created with `owner_id = null` to have the correct owner from their company.

This SQL runs automatically when you execute the full script:
```sql
UPDATE public.properties p
SET owner_id = c.user_id
FROM public.companies c
WHERE p.company_id = c.id
AND p.owner_id IS NULL;
```

---

## Migration Files Created

I've created these migration files for future reference:
- `backend/migrations/133_fix_properties_owner_fkey.sql` - Fixes the constraint
- `FIX_PROPERTY_OWNERS.sql` - Quick fix script for immediate use
- `FIX_PROPERTIES_OWNER_FK.sql` - Alternative quick fix

---

## Testing After Fix

1. **Test Property Creation:**
   - Go through onboarding flow
   - Create a property
   - Verify it saves successfully

2. **Verify owner_id is Set:**
   ```sql
   SELECT id, name, owner_id, company_id
   FROM properties
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - All properties should have non-null `owner_id`

3. **Test Company Feature Still Works:**
   - Create/update a company
   - Should continue working normally (this fix doesn't affect companies)

---

## Why This Happened

At some point, the `properties` table's foreign key was created to reference `user_profiles` instead of `users`. The same issue affected `companies` (fixed in migration 132), but properties weren't updated.

---

## Need Help?

If you encounter any issues:
1. Check backend logs for error details
2. Verify the constraint was actually updated in your database
3. Make sure you restarted the backend server after code changes

---

## Summary

✅ **Immediate:** Properties can now be created (owner_id is null temporarily)
⏳ **Next Step:** Run `FIX_PROPERTY_OWNERS.sql` in Supabase SQL Editor
🔄 **Final Step:** Change code back to `owner_id: userId` after database is fixed
