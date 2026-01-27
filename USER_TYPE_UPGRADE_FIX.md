# User Type Upgrade After Payment - Fix Summary

## Issue

After completing payment successfully, users remained as 'guest' or 'free' user types instead of being upgraded to 'paid' status.

**Symptom:**
- User signs up → Gets 'free' user type ✓
- User completes payment → Subscription created ✓
- User's user_type_id → Still 'free' ❌ (should be 'paid')

## Root Cause

The checkout completion flow was creating the subscription but **not updating the user's `user_type_id`** to reflect their paid status.

**File**: `backend/src/services/checkout.service.ts`

**Before Fix:**
```typescript
// Create subscription
const subscription = await billingService.createUserSubscription({...});

// Update checkout to completed
await supabase.from('checkouts').update({...});

// ❌ Missing: Update user's user_type_id to 'paid'
```

---

## User Types Architecture

### Customer User Types (category='customer')

From migration `066_add_category_to_user_types.sql`:

| Name | Display Name | Purpose | Can Have Subscription |
|------|--------------|---------|----------------------|
| **free** | Free Customer | Users without paid subscription | Yes |
| **paid** | Paid Customer | Users with active paid subscriptions | Yes |
| **guest** | Guest | Public website bookings | No (created by migration 116) |

### Upgrade Path

```
Signup → 'free' user type
   ↓
Complete Payment
   ↓
'paid' user type ✓
```

---

## Solution

**Modified**: `backend/src/services/checkout.service.ts` (Lines 684-706)

### Added User Type Upgrade

After creating subscription, added code to upgrade user to 'paid' type:

```typescript
// Create new subscription
const subscription = await billingService.createUserSubscription({
  user_id: checkout.user_id,
  subscription_type_id: checkout.subscription_type_id,
  status,
  expires_at: expiresAt?.toISOString(),
  trial_ends_at: trialEndsAt?.toISOString(),
}, actorId || checkout.user_id);

// NEW: Update user's user_type_id to 'paid' after successful subscription purchase
// Users start as 'free' during signup, upgrade to 'paid' after payment
const { data: paidUserType } = await supabase
  .from('user_types')
  .select('id')
  .eq('name', 'paid')
  .eq('category', 'customer')
  .single();

if (paidUserType) {
  await supabase
    .from('users')
    .update({ user_type_id: paidUserType.id })
    .eq('id', checkout.user_id);

  logger.info(
    `Updated user ${checkout.user_id} to 'paid' user type after successful subscription payment`
  );
} else {
  logger.warn(
    `Could not find 'paid' user type - user ${checkout.user_id} remains with current user type`
  );
}

// Update checkout to completed
await supabase.from('checkouts').update({...});
```

---

## Verification

### 1. Check Paid User Type Exists

Run `VERIFY_PAID_USER_TYPE.sql` to check if 'paid' user type exists. If not, the script will create it.

Expected output:
```
✓ Paid user type already exists
```

### 2. Test Payment Flow

**Steps:**
1. Sign up new user → Check they have 'free' user type
2. Complete payment checkout
3. Check backend logs for:
   ```
   Updated user [user-id] to 'paid' user type after successful subscription payment
   ```
4. Verify user's user_type_id in database is now 'paid'

**SQL to verify:**
```sql
SELECT
  u.id,
  u.email,
  u.full_name,
  ut.name as user_type_name,
  ut.category,
  us.status as subscription_status,
  st.name as subscription_plan
FROM users u
LEFT JOIN user_types ut ON u.user_type_id = ut.id
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_types st ON us.subscription_type_id = st.id
WHERE u.email = 'test@example.com';
```

Expected result:
- `user_type_name` = 'paid'
- `category` = 'customer'
- `subscription_status` = 'active' or 'trial'
- `subscription_plan` = plan name (e.g., 'Plus')

---

## Permission Implications

### Before Fix (user_type = 'free')
- User gets permissions from 'free' user type
- Limited feature access

### After Fix (user_type = 'paid')
- User gets permissions from 'paid' user type
- Full feature access based on subscription

**Note**: The actual permissions come from the **subscription plan**, but the user_type affects what features/UI elements are accessible.

---

## Edge Cases Handled

### 1. Paid User Type Missing
If 'paid' user type doesn't exist:
- Warning logged to console
- Subscription still created successfully
- User keeps current user_type_id
- System continues to function

**Fix**: Run `VERIFY_PAID_USER_TYPE.sql` to create it

### 2. User Already Has Paid Type
If user already has 'paid' type (from previous payment):
- Update still executes (idempotent)
- No errors
- User_type_id remains 'paid'

### 3. Subscription Cancelled/Expired
**Not Handled Yet** - Future enhancement:

Should downgrade user back to 'free' when:
- Subscription expires
- Subscription is cancelled
- Payment fails

**TODO**: Add webhook/cron job to handle downgrades

---

## Files Modified

1. **`backend/src/services/checkout.service.ts`** (Lines 684-706)
   - Added user type upgrade after subscription creation
   - Added logging for upgrade success/failure

2. **`VERIFY_PAID_USER_TYPE.sql`** (New file)
   - SQL script to verify/create 'paid' user type

---

## Testing Checklist

After restarting backend:

- [ ] Sign up new user
- [ ] Verify user has 'free' user type initially
- [ ] Complete payment checkout
- [ ] Check backend logs show upgrade message
- [ ] Verify user now has 'paid' user type
- [ ] Verify subscription is active
- [ ] Test that user has full feature access

---

## Production Migration

### For Existing Paid Users

If production already has users with paid subscriptions but still marked as 'free':

```sql
-- Update all users with active subscriptions to 'paid' type
WITH paid_users AS (
  SELECT DISTINCT us.user_id
  FROM user_subscriptions us
  WHERE us.is_active = true
    AND us.status IN ('active', 'trial')
),
paid_type AS (
  SELECT id FROM user_types
  WHERE name = 'paid' AND category = 'customer'
  LIMIT 1
)
UPDATE users u
SET user_type_id = (SELECT id FROM paid_type)
WHERE u.id IN (SELECT user_id FROM paid_users)
  AND u.user_type_id != (SELECT id FROM paid_type);

-- Log results
SELECT
  COUNT(*) as users_upgraded,
  'Updated to paid type' as action
FROM users u
JOIN user_subscriptions us ON u.id = us.user_id
JOIN user_types ut ON u.user_type_id = ut.id
WHERE ut.name = 'paid'
  AND us.is_active = true;
```

---

## Future Enhancements

### 1. Automatic Downgrade on Cancellation

Add to subscription cancellation flow:

```typescript
// When subscription is cancelled/expired
const { data: freeUserType } = await supabase
  .from('user_types')
  .select('id')
  .eq('name', 'free')
  .eq('category', 'customer')
  .single();

if (freeUserType) {
  await supabase
    .from('users')
    .update({ user_type_id: freeUserType.id })
    .eq('id', userId);
}
```

### 2. User Type History

Track user type changes over time:

```sql
CREATE TABLE user_type_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_user_type_id UUID REFERENCES user_types(id),
  new_user_type_id UUID REFERENCES user_types(id),
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

**Status**: ✅ Fixed
**Testing**: Restart backend and test payment flow with new user
**Impact**: Users now properly upgraded to 'paid' type after successful payment
