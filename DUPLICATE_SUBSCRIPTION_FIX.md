# Duplicate Subscription Error - Fix Summary

## Issue

After completing payment checkout, users got this error:
```
duplicate key value violates unique constraint "user_subscriptions_user_id_key"
```

## Root Cause

The `user_subscriptions` table has a **unique constraint on `user_id`**, meaning each user can only have **ONE row** in the table (regardless of `is_active` status).

### The Problem Flow

1. **First checkout**: User completes payment → Subscription created ✓
2. **Second checkout** (testing again):
   - Code finds active subscription → Deactivates it (`is_active = false`) ✓
   - Code tries to create new subscription ✓
3. **Third checkout** (testing again):
   - Code queries for active subscription (`is_active = true`) → Finds nothing (subscription is inactive)
   - Code thinks user has no subscription
   - Code tries to create new subscription → **FAILS** ❌
   - Error: Inactive subscription still exists in database, violates unique constraint

### Code Issue

**File**: `backend/src/services/checkout.service.ts` (Line 633-638)

**Before:**
```typescript
// Only checked for ACTIVE subscriptions
const { data: existingSubscription } = await supabase
  .from('user_subscriptions')
  .select('...')
  .eq('user_id', checkout.user_id)
  .eq('is_active', true)  // ❌ Missed inactive subscriptions
  .single();

// Only deactivated, didn't delete
if (existingSubscription) {
  await supabase.from('user_subscriptions')
    .update({ is_active: false, ... })  // ❌ Leaves row in database
    .eq('id', existingSubscription.id);
}
```

**Why It Failed:**
- Deactivating sets `is_active = false` but **row still exists**
- Unique constraint `user_subscriptions_user_id_key` applies to **all rows**, not just active ones
- On subsequent checkouts, inactive rows block new subscription creation

---

## Solution

**Modified**: `backend/src/services/checkout.service.ts` (Lines 632-673)

### Changes Made

1. **Query ALL subscriptions** (active AND inactive):
   ```typescript
   const { data: existingSubscriptions } = await supabase
     .from('user_subscriptions')
     .select('...')
     .eq('user_id', checkout.user_id);
     // Removed .eq('is_active', true) to get ALL subscriptions
   ```

2. **DELETE all existing subscriptions** before creating new:
   ```typescript
   if (existingSubscriptions && existingSubscriptions.length > 0) {
     for (const existingSub of existingSubscriptions) {
       // Log what's being deleted
       logger.info(
         `Deleting ${existingSub.is_active ? 'active' : 'inactive'} subscription...`
       );

       // Audit log
       await createAuditLog({ ... });

       // DELETE (not deactivate)
       await supabase
         .from('user_subscriptions')
         .delete()
         .eq('id', existingSub.id);
     }
   }
   ```

3. **Then create new subscription**:
   ```typescript
   // Now safe to create - no existing subscriptions in database
   const subscription = await billingService.createUserSubscription({
     user_id: checkout.user_id,
     subscription_type_id: checkout.subscription_type_id,
     ...
   }, actorId);
   ```

### Additional Safeguard

**Modified**: `backend/src/services/billing.service.ts` (Lines 846-855)

Added clearer warning message in `createUserSubscription`:
```typescript
const existing = await getUserSubscription(input.user_id);
if (existing) {
  console.warn(
    `Attempted to create subscription for user who already has one. ` +
    'Caller should delete existing subscriptions first.'
  );
  throw new AppError('CONFLICT', 'User already has an active subscription. Delete existing subscription first.');
}
```

---

## Why DELETE Instead of Deactivate?

**Option 1: Deactivate** (original approach)
- ✗ Leaves row in database
- ✗ Violates unique constraint on subsequent creates
- ✗ Accumulates inactive records over time

**Option 2: DELETE** (new approach) ✓
- ✅ Removes row from database completely
- ✅ No unique constraint violations
- ✅ Keeps database clean
- ✅ Audit log preserves history before deletion

---

## Testing Flow

### Before Fix

1. User signs up → Completes first checkout ✓
2. User tests again → Second checkout ✓ (deactivates first subscription)
3. User tests third time → **FAILS** ❌ (inactive subscription still in DB)

### After Fix

1. User signs up → Completes first checkout ✓
2. User tests again → Second checkout ✓ (deletes first subscription, creates new)
3. User tests third time → **WORKS** ✓ (deletes second subscription, creates new)
4. User tests N times → **WORKS** ✓ (always deletes old, creates new)

---

## Database Schema Reference

### Unique Constraint

```sql
-- From user_subscriptions table
CONSTRAINT "user_subscriptions_user_id_key" UNIQUE (user_id)
```

This prevents multiple rows for the same `user_id`, regardless of any other column values (including `is_active`).

### Alternative Approach (Not Implemented)

Could change constraint to allow multiple subscriptions per user (only one active):

```sql
-- Drop existing constraint
ALTER TABLE user_subscriptions DROP CONSTRAINT user_subscriptions_user_id_key;

-- Add partial unique index (only on active subscriptions)
CREATE UNIQUE INDEX user_subscriptions_user_id_active_idx
  ON user_subscriptions(user_id)
  WHERE is_active = true;
```

**Decision**: Kept DELETE approach instead because:
- Simpler logic (one subscription per user at any time)
- Cleaner database (no accumulation of old subscriptions)
- Audit logs preserve history before deletion

---

## Files Modified

1. **`backend/src/services/checkout.service.ts`** (Lines 632-673)
   - Changed to query ALL subscriptions (not just active)
   - Changed to DELETE all existing subscriptions before creating new
   - Added detailed logging for each deletion

2. **`backend/src/services/billing.service.ts`** (Lines 846-855)
   - Improved warning message for duplicate subscription attempts
   - Added note explaining checkout flow handles deletion

---

## Verification

After fix, check backend logs during checkout:

### Expected Log Output

```
Deleting inactive subscription abc123... (Plus plan) for user xyz789 - replacing with Enterprise
Deleted 1 existing subscription(s) for user xyz789
```

### No Errors

Should NOT see:
```
❌ duplicate key value violates unique constraint "user_subscriptions_user_id_key"
```

---

## Production Considerations

### For Existing Production Users

If production users already have multiple inactive subscriptions, run cleanup:

```sql
-- Find users with multiple subscriptions
SELECT user_id, COUNT(*) as subscription_count
FROM user_subscriptions
GROUP BY user_id
HAVING COUNT(*) > 1;

-- For each user, keep only the most recent subscription
WITH ranked_subs AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_subscriptions
)
DELETE FROM user_subscriptions
WHERE id IN (
  SELECT id FROM ranked_subs WHERE rn > 1
);
```

### Future Enhancement

Consider adding a database trigger to prevent accidental duplicates:

```sql
CREATE OR REPLACE FUNCTION prevent_duplicate_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = NEW.user_id
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'User already has a subscription. Delete existing subscription first.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_duplicate_subscription
  BEFORE INSERT ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_subscriptions();
```

---

**Status**: ✅ Fixed
**Testing**: Complete checkout flow now works for repeated checkouts
**Impact**: Prevents duplicate subscription errors during payment verification
