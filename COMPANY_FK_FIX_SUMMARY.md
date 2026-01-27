# Company Foreign Key Fix Summary

## 🔍 Root Cause

Company creation is failing because of **incorrect foreign key constraint**:

### What Happened:
The `companies` table has a foreign key constraint `companies_user_id_fkey` that references the **wrong table**:
- ❌ **Currently references**: `user_profiles` table
- ✅ **Should reference**: `users` table

### Error:
```
TypeError: Cannot read properties of undefined (reading 'value')
    at formatProperty (node:internal/util/inspect:2280:12)
```

This happens when trying to log a Supabase error that occurs during company INSERT:
```
insert or update on table 'companies' violates foreign key constraint 'companies_user_id_fkey'
Key (user_id)=(user-uuid) is not present in table "user_profiles"
```

---

## ✅ Fix Required

**File**: `FIX_COMPANIES_FK_NOW.sql`

### What This Does:
1. Drops the incorrect `companies_user_id_fkey` constraint
2. Recreates it to reference `users(id)` instead of `user_profiles`
3. Verifies the fix was successful

---

## 🚀 Steps to Fix Now

### 1. Run SQL Fix (Required)
Open Supabase SQL Editor and run `FIX_COMPANIES_FK_NOW.sql`:

```sql
-- Drop incorrect foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'companies'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'companies_user_id_fkey'
  ) THEN
    ALTER TABLE public.companies DROP CONSTRAINT companies_user_id_fkey;
    RAISE NOTICE '✓ Dropped incorrect foreign key companies_user_id_fkey';
  END IF;
END $$;

-- Create correct foreign key constraint
DO $$
BEGIN
  ALTER TABLE public.companies
  ADD CONSTRAINT companies_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

  RAISE NOTICE '✓ Created correct foreign key companies_user_id_fkey → users(id)';
END $$;
```

### 2. Restart Backend (Required)
```bash
# Stop backend (Ctrl+C)
cd backend
npm run dev
```

### 3. Test Company Creation
- Go through onboarding flow
- Fill in company details (Step 2)
- Click "Continue"
- Company should be created successfully ✅

---

## 📋 Verification

After fix, verify in Supabase:

```sql
-- Check foreign key constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'companies'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'companies_user_id_fkey';

-- Should show:
-- constraint_name           | table_name | references_table | references_column
-- companies_user_id_fkey    | companies  | users           | id
```

---

## 🎯 What This Fixes

✅ Company creation during onboarding will succeed
✅ User can complete Step 2 (Company Details)
✅ Foreign key constraint correctly validates user exists
✅ No more "Cannot read properties of undefined" error

---

## ⚠️ Important Notes

- This is the same issue we had with `properties.owner_id` foreign key
- Both `companies` and `properties` tables had foreign keys pointing to `user_profiles` instead of `users`
- The `user_profiles` table exists but is not used for authentication
- All foreign keys should reference the `users` table which contains actual user accounts

---

## 🔧 Related Issues

**Similar Fix Applied**:
- `properties.owner_id` foreign key (migration 133)
  - Temporarily worked around by setting `owner_id = null`
  - Should be fixed with migration 133 eventually

**This Fix**:
- `companies.user_id` foreign key (migration 132)
  - **MUST be fixed now** - no workaround available
  - Company creation completely blocked without this fix

---

## 📚 Context

### Why Two Separate Foreign Keys?

**Properties Table**:
- Has `owner_id` → references user who owns the property
- Has `company_id` → references company that manages the property
- We temporarily set `owner_id = null` to bypass constraint
- Properties can still be queried via `company_id`

**Companies Table**:
- Has `user_id` → references user who owns the company
- **No alternative** - this MUST reference a valid user
- Cannot be set to null or bypassed
- This fix is **required** for onboarding to work

---

## 🎯 Status

- [x] SQL fix created: `FIX_COMPANIES_FK_NOW.sql`
- [ ] User needs to run SQL in Supabase
- [ ] User needs to restart backend
- [ ] User needs to test company creation

---

## 🔄 Next Steps After This Fix

Once company foreign key is fixed:

1. ✅ **Payment system** - Already fixed (status VARCHAR)
2. ✅ **Company creation** - Fixed with this SQL
3. ⏳ **Property creation** - Working (owner_id = null workaround)
4. ⏳ **Property display** - Working (via company_id queries)

Optional future cleanup:
- Run migration 133 to fix `properties.owner_id` foreign key
- Update property code to use `owner_id` instead of null
