# Payment Schema Fix Summary

## 🔍 Root Cause

The payment system was failing because of a **schema mismatch**:

### What Happened:
1. **Migration 020** (2026-01-04) simplified the billing schema:
   - Deprecated `billing_statuses` table
   - Added `status VARCHAR` field directly to `user_subscriptions`
   - New status values: 'active', 'trial', 'cancelled', 'expired', 'past_due'

2. **Migration 131** (2026-01-21) created `replace_user_subscription` function:
   - Still used old schema with `billing_status_id UUID`
   - Tried to look up from deprecated `billing_statuses` table

3. **Checkout service** was calling the function with old parameters:
   - Looking up `billing_status_id` from non-existent table
   - Passing UUID instead of status string

### Result:
❌ "Billing status 'paid' not found" error
❌ Payment succeeded on Paystack but subscription not created

---

## ✅ Fix Applied

### 1. Updated Database Function
**File:** `backend/migrations/134_update_replace_subscription_for_new_schema.sql`

Changed `replace_user_subscription` to:
- Accept `p_status VARCHAR` instead of `p_billing_status_id UUID`
- Store status directly on user_subscriptions
- Use values: 'active' or 'trial'

### 2. Updated Checkout Service
**File:** `backend/src/services/checkout.service.ts` (line 624-647)

Changed to:
- Use `status: 'active' | 'trial' = 'active'` (was 'paid')
- Removed lookup from billing_statuses table
- Pass `p_status: status` directly to function

---

## 🚀 Steps to Fix Now

### 1. Run SQL Fix (Required)
Open Supabase SQL Editor and run this:

```sql
DROP FUNCTION IF EXISTS replace_user_subscription(UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION replace_user_subscription(
  p_user_id UUID,
  p_subscription_type_id UUID,
  p_status VARCHAR,
  p_started_at TIMESTAMPTZ DEFAULT NOW(),
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_trial_ends_at TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  subscription_type_id UUID,
  status VARCHAR,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  is_active BOOLEAN,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_subscription_id UUID;
BEGIN
  DELETE FROM user_subscriptions WHERE user_subscriptions.user_id = p_user_id;

  INSERT INTO user_subscriptions (
    user_id, subscription_type_id, status, started_at, expires_at, trial_ends_at, is_active
  ) VALUES (
    p_user_id, p_subscription_type_id, p_status, p_started_at, p_expires_at, p_trial_ends_at, true
  )
  RETURNING user_subscriptions.id INTO v_new_subscription_id;

  RETURN QUERY
  SELECT us.id, us.user_id, us.subscription_type_id, us.status, us.started_at,
         us.expires_at, us.trial_ends_at, us.is_active, us.cancelled_at,
         us.cancellation_reason, us.created_at, us.updated_at
  FROM user_subscriptions us WHERE us.id = v_new_subscription_id;
END;
$$;
```

Or run the file: `FIX_PAYMENT_NOW.sql`

### 2. Restart Backend (Required)
```bash
# Stop backend (Ctrl+C)
cd backend
npm run dev
```

### 3. Test Payment
- Complete checkout with test card: **4084 0840 8408 4081**
- Payment should now succeed ✅
- Subscription should activate ✅

---

## 📋 Verification

After fix, verify in Supabase:

```sql
-- Check function exists with new signature
SELECT proname, proargtypes::regtype[]
FROM pg_proc
WHERE proname = 'replace_user_subscription';

-- Should show: replace_user_subscription(uuid, uuid, character varying, ...)

-- Check user_subscriptions table has status field
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_subscriptions' AND column_name = 'status';

-- Should show: status | character varying
```

---

## 🎯 What This Fixes

✅ Payment verification will complete successfully
✅ Subscription will be created with status 'active'
✅ User will be redirected to dashboard with active plan
✅ All subscription features will work

---

## 📚 Schema Reference

### user_subscriptions table (current schema)
```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_type_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'trial', 'cancelled', 'expired', 'past_due')),
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  ...
);
```

### Status Values
- **'active'** - Paid subscription (not in trial)
- **'trial'** - Currently in trial period
- **'cancelled'** - User cancelled subscription
- **'expired'** - Subscription expired
- **'past_due'** - Payment failed/overdue

---

## 🔧 Files Modified

1. `backend/src/services/checkout.service.ts` - Updated to use new schema
2. `backend/migrations/134_update_replace_subscription_for_new_schema.sql` - New migration
3. `FIX_PAYMENT_NOW.sql` - Quick fix SQL script

---

## ⚠️ Important Notes

- The `billing_statuses` table no longer exists (deprecated in migration 020)
- Status is now stored directly on `user_subscriptions` as VARCHAR
- Don't try to query or insert into `billing_statuses` - it will fail
- Use 'active' for paid subscriptions, not 'paid'
