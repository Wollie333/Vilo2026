# User Type & Subscription Permissions Fix

## Issues Identified

### Issue 1: Signup Assigns Wrong User Type
**Problem:** New signups were getting 'guest' user type instead of 'free'
- 'guest' = Public website bookings (cannot have subscriptions)
- 'free' = Registered users without paid subscriptions (can have subscriptions)
- 'paid' = Users with active paid subscriptions

**Root Cause:** `auth.service.ts` was querying for ANY customer type ordered by created_at, which returned 'guest' (the oldest customer type).

**Fix Applied:** Changed auth.service.ts line 70-75 to specifically query for 'free' type:
```typescript
// Before (WRONG - gets oldest customer type = 'guest')
.eq('category', 'customer')
.order('created_at', { ascending: true })
.limit(1)

// After (CORRECT - gets 'free' type)
.eq('name', 'free')
.eq('category', 'customer')
```

### Issue 2: Existing Users Still Have 'guest' Type
**Problem:** Users who signed up before the fix still have 'guest' type in the database

**Fix:** Run `FIX_GUEST_TO_FREE_USERS.sql` to migrate existing users:
- Users with 'guest' + active subscription → 'paid'
- Users with 'guest' + no subscription → 'free'

---

## Complete User Type Flow (After Fix)

### New Signup Flow
```
1. User signs up → Gets 'free' user type ✓
2. User completes payment → Upgraded to 'paid' ✓
3. Subscription expires/cancelled → Should downgrade to 'free' (TODO)
```

### Payment → User Type Upgrade
Location: `backend/src/services/checkout.service.ts` (lines 684-706)

When payment completes:
```typescript
// Query for 'paid' user type
const { data: paidUserType } = await supabase
  .from('user_types')
  .select('id')
  .eq('name', 'paid')
  .eq('category', 'customer')
  .single();

// Update user's user_type_id
await supabase
  .from('users')
  .update({ user_type_id: paidUserType.id })
  .eq('id', checkout.user_id);
```

---

## Subscription Permissions System

### How Permissions Work

**Current System (Role-Based):**
Users get permissions from:
1. **Roles** (user_roles → roles → role_permissions → permissions)
2. **Direct Permission Overrides** (user_permissions)

**NOT Loading From:**
- Subscription plans (subscription_types.permissions)

### Subscription Access Control

The system uses `getSubscriptionAccessStatus()` to determine access mode:

**Access Modes:**
- `full` - Active subscription or trial, can create/edit
- `readonly` - No subscription, can only view
- `paused` - Subscription paused
- `cancelled` - Subscription cancelled

**Location:** `backend/src/services/billing.service.ts` line 1376

### How to Apply Subscription Permissions

**Option 1: Middleware-Based (Current Approach)**
Use `subscription-access.middleware.ts` to block write actions if no subscription:
```typescript
// Routes requiring active subscription
router.post('/properties', subscriptionAccess('full'), propertyController.create);
router.put('/properties/:id', subscriptionAccess('full'), propertyController.update);
```

**Option 2: Permission Sync (Alternative)**
When subscription is created/updated, sync subscription plan permissions to user:
```typescript
// In checkout completion or subscription creation
const planPermissions = await getSubscriptionPlanPermissions(subscriptionTypeId);

// Create user_permissions entries with expiry matching subscription
for (const permission of planPermissions) {
  await supabase.from('user_permissions').insert({
    user_id: userId,
    permission_id: permission.id,
    granted: true,
    expires_at: subscriptionExpiresAt,
  });
}
```

---

## Action Items

### 1. Fix Existing Users (CRITICAL)
Run `FIX_GUEST_TO_FREE_USERS.sql` in Supabase SQL editor

**Expected Result:**
```
Updated X users from guest → paid (have active subscriptions)
Updated Y users from guest → free (no subscriptions)
```

### 2. Restart Backend (REQUIRED)
Backend needs restart to pick up auth.service.ts changes:
```bash
# Stop backend (Ctrl+C if running)
# Restart
cd backend && npm run dev
```

### 3. Verify User Type After Fix
Check the user in admin panel:
- Navigate to: http://localhost:5173/admin/users/b989c4d9-863a-4ff6-b455-995365ba0d09#overview
- User type should now show 'paid' (if they have subscription) or 'free' (if no subscription)

### 4. Test New Signup Flow
1. Sign up new user
2. Check backend logs: Should show "Found customer user type: free"
3. Complete payment checkout
4. Check backend logs: Should show "Updated user XXX to 'paid' user type"
5. Verify user has 'paid' type in admin panel

### 5. Verify Permissions Work
After user is 'paid':
- Check they can access subscription features
- Check middleware allows write operations
- Check read-only mode is disabled

---

## Files Modified

1. **backend/src/services/auth.service.ts** (Lines 65-86)
   - Changed signup to assign 'free' instead of 'guest'

2. **backend/src/services/checkout.service.ts** (Lines 684-706)
   - Upgrades user to 'paid' after successful payment (already existed)

3. **FIX_GUEST_TO_FREE_USERS.sql** (New file)
   - Migrates existing 'guest' users to correct type

---

## Expected Database State After Fix

### user_types Table (5 types)
| Name | Category | Can Have Subscription | Purpose |
|------|----------|----------------------|---------|
| super_admin | saas | No | Platform super admins |
| admin | saas | No | Platform admins |
| guest | customer | **No** | Public website bookings (no account) |
| free | customer | **Yes** | Registered users without subscription |
| paid | customer | **Yes** | Users with active subscription |

### users Table
All registered users should have:
- `user_type_id` → 'free' (if no subscription)
- `user_type_id` → 'paid' (if has active subscription)

**Should NOT have:**
- `user_type_id` → 'guest' (unless they're truly guest bookings from public website)

---

## Testing Checklist

After applying fixes:

- [ ] Run FIX_GUEST_TO_FREE_USERS.sql
- [ ] Restart backend server
- [ ] Check existing user now shows 'paid' type (user b989c4d9...)
- [ ] Sign up new user → Verify gets 'free' type
- [ ] Complete payment → Verify upgraded to 'paid' type
- [ ] Verify paid user has full subscription access
- [ ] Verify free user has readonly/limited access
- [ ] Check subscription plan permissions apply correctly

---

## Future Enhancements

### 1. Auto-Downgrade on Expiry
When subscription expires/cancels, downgrade user back to 'free':
```typescript
// In subscription cancellation handler
const { data: freeUserType } = await supabase
  .from('user_types')
  .select('id')
  .eq('name', 'free')
  .single();

await supabase
  .from('users')
  .update({ user_type_id: freeUserType.id })
  .eq('id', userId);
```

### 2. Permission Sync System
Automatically sync subscription plan permissions to user_permissions table with expiry dates.

### 3. User Type History Tracking
Track when and why user types change:
```sql
CREATE TABLE user_type_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  old_user_type_id UUID REFERENCES user_types(id),
  new_user_type_id UUID REFERENCES user_types(id),
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

**Status:** ✅ Fixed (pending SQL script execution and backend restart)
**Impact:** Users will now correctly flow through free → paid based on subscription status
**Testing Required:** Yes - verify existing user shows 'paid' type after SQL fix
