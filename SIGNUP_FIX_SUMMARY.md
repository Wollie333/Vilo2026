# Signup Issues - Fix Summary

## Issue 1: "Email already registered" Error

**Cause**: The `DELETE_ALL_DATA.sql` script only deleted from `public.users` table but not from Supabase's `auth.users` table.

**Symptom**:
- UI shows only 1 user (super admin)
- Database has 55 users in `auth.users`
- Signup fails with "email already registered"

**Fix**: Run `CLEANUP_AUTH_USERS.sql`

**Result**: ✓ Fixed - Auth table cleaned, only super admin remains

---

## Issue 2: "Failed to create user profile" Error

**Cause**: The `user_type_id` column in `users` table has a NOT NULL constraint, but no customer user type exists or is active.

**Error Details**:
```
null value in column "user_type_id" of relation "users" violates not-null constraint
```

**What Happens During Signup**:
1. Auth user created in `auth.users` ✓
2. Code tries to create profile in `public.users` ✗
3. Code looks for a user type with `category = 'customer'` AND `is_active = true`
4. If not found, `user_type_id` stays null
5. Database rejects the insert due to NOT NULL constraint
6. Signup fails and rolls back

**Code Reference** (`backend/src/services/auth.service.ts`, lines 78-97):
```typescript
// Get default customer user type
const { data: customerType } = await supabase
  .from('user_types')
  .select('id')
  .eq('category', 'customer')  // <-- Needs this
  .eq('is_active', true)        // <-- And this
  .order('created_at', { ascending: true })
  .limit(1)
  .single();

if (customerType) {
  await supabase
    .from('users')
    .update({ user_type_id: customerType.id })
    .eq('id', authData.user.id);
} else {
  console.error('No customer user type found - user created without user_type_id');
  // ⚠️ This is the problem - continues without user_type_id
}
```

**Database Schema Requirement**:
```sql
-- From users table definition
user_type_id UUID NOT NULL REFERENCES user_types(id)
```

---

## Solution

Run `FIX_GUEST_USER_TYPE.sql` to:
1. Create or update 'guest' user type
2. Set `category = 'customer'` (required for signup)
3. Set `is_active = TRUE` (required for signup)
4. Grant basic permissions for guests

### What the Script Does

```sql
-- Creates/updates guest type with correct configuration
INSERT INTO public.user_types (
  name: 'guest',
  category: 'customer',    -- ← Needed by signup code
  is_active: TRUE,          -- ← Needed by signup code
  ...
)
ON CONFLICT (name) DO UPDATE SET
  category = 'customer',
  is_active = TRUE;
```

---

## Verification Steps

### 1. Check user_types table:
```sql
SELECT id, name, category, is_active
FROM public.user_types
WHERE category = 'customer' AND is_active = TRUE;
```

**Expected**: At least one row (e.g., 'guest' with category='customer')

### 2. Test signup:
1. Go to `/pricing`
2. Click "Subscribe Now"
3. Fill out signup form
4. Should succeed without "Failed to create user profile" error

---

## Why This Happened

1. **Database cleanup removed auth users**: `DELETE_ALL_DATA.sql` didn't clean `auth.users`
2. **Migration 116 incomplete**: Created 'guest' user type but may not have set category properly
3. **Migration 066 default**: Sets `DEFAULT 'customer'` on category column, but if guest type existed before this migration, it might not have been updated

---

## Related Migrations

- `066_add_category_to_user_types.sql` - Adds category field
- `116_create_guest_user_type.sql` - Creates guest user type

---

## Future Prevention

Consider updating `auth.service.ts` to fail more explicitly:

```typescript
if (!customerType) {
  // Instead of logging and continuing, throw an error
  throw new AppError('INTERNAL_ERROR',
    'No customer user type configured. Please contact support.');
}
```

This would make the issue more obvious during development.

---

## Testing After Fix

After running `FIX_GUEST_USER_TYPE.sql`:

1. ✅ Verify customer user types exist (script outputs this)
2. ✅ Test signup with new email
3. ✅ Verify user created in both `auth.users` and `public.users`
4. ✅ Verify `user_type_id` is populated
5. ✅ Test full flow: pricing → signup → checkout

---

## Files Created for Fixes

1. `CHECK_ALL_USERS.sql` - Diagnose auth.users vs public.users mismatch
2. `CLEANUP_AUTH_USERS.sql` - Remove ghost auth records
3. `CHECK_USER_TYPES.sql` - Check what user types exist
4. `FIX_GUEST_USER_TYPE.sql` - Ensure guest type is properly configured
5. `SIGNUP_FIX_SUMMARY.md` - This document
