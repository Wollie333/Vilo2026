# Subscription Control System - Testing Guide

## Overview
This guide provides step-by-step testing procedures for the complete subscription management system including admin controls, user notifications, and limits enforcement.

---

## Prerequisites

### Database Setup
1. Ensure all migrations are applied:
```bash
# Check current migration status
psql -d your_database -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# Verify the three subscription migrations exist:
# - 100_create_upgrade_requests.sql
# - 101_add_subscription_notification_templates.sql
# - 102_add_paused_reason.sql
```

2. Verify notification templates exist:
```sql
SELECT name, title_template, default_variant
FROM notification_templates
WHERE name LIKE 'subscription_%';
```

Expected output: 8 templates (upgrade_request, paused, cancelled, upgrade_confirmed, resumed, payment_required, upgrade_declined, upgrade_accepted_admin)

### Test Users Setup
Create test users with different subscription states:

```sql
-- User 1: Active subscription (for testing upgrade/pause/cancel)
-- User 2: No subscription (for testing new subscription)
-- User 3: Paused subscription (for testing resume)
-- User 4: Cancelled subscription (for testing reactivation)
```

### Admin Access
- Ensure you have a super admin account
- Verify admin can access `/admin/users/:userId` routes

---

## Test Suite 1: Admin Upgrade Flow

### Test 1.1: View Subscription Display

**Steps:**
1. Login as super admin
2. Navigate to `/admin/users/:userId` (pick a user with active subscription)
3. Click on "Subscription" tab (hash: `#subscription`)

**Expected Results:**
- ✅ Subscription tab loads without errors
- ✅ Displays plan name (e.g., "Pro Plan")
- ✅ Shows formatted price (e.g., "$49.00/mo")
- ✅ Shows billing interval label
- ✅ Shows next billing date
- ✅ Shows subscription status badge with correct color
- ✅ Shows days remaining (if applicable)
- ✅ Displays subscription limits (max_properties, max_rooms, etc.)
- ✅ Three action buttons visible: "Upgrade Plan", "Pause Subscription", "Cancel Subscription"
- ✅ Buttons are enabled/disabled based on subscription state

**Verification:**
```javascript
// In browser console:
console.log('Subscription data:', displayInfo);
```

---

### Test 1.2: Request Upgrade

**Steps:**
1. On subscription tab, click "Upgrade Plan" button
2. Modal should open with available higher-tier plans
3. Select a higher-tier plan (should be pre-selected)
4. Enter admin notes: "Upgrading to unlock more properties for growth"
5. Click "Send Upgrade Request"

**Expected Results:**
- ✅ Modal opens showing "Upgrade Subscription"
- ✅ Shows current plan in gray box
- ✅ Shows available higher-tier plans only (no lower-tier or same-tier)
- ✅ Each plan shows:
  - Display name
  - Description
  - Monthly/annual pricing
  - Limits (Properties, Rooms, Team Members, Bookings/mo)
- ✅ Plan selection works (visual feedback)
- ✅ Admin notes textarea accepts input
- ✅ "What happens next" preview is visible
- ✅ Submit button shows loading state
- ✅ Success alert: "Upgrade request sent successfully! [User] will receive a notification to confirm."
- ✅ Modal closes on success

**Verification:**
```sql
-- Check upgrade request created
SELECT id, user_id, status, admin_notes, expires_at
FROM subscription_upgrade_requests
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC
LIMIT 1;

-- Should show: status = 'pending', expires_at = 7 days from now
```

---

### Test 1.3: Verify Notifications Sent

**Check Email:**
- ✅ User receives email with subject "Subscription Upgrade Recommended - [Plan Name]"
- ✅ Email shows admin name, current plan, new plan, price difference
- ✅ Email includes admin notes
- ✅ Email has "Review Upgrade" button
- ✅ Email mentions 7-day expiry

**Check In-App Notification:**
```sql
SELECT title, message, variant, action_url
FROM notifications
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```
- ✅ Notification created with title "Subscription Upgrade Available"
- ✅ Variant is "info"
- ✅ Action URL is "/profile?tab=billing"

**Check Chat Message:**
```sql
SELECT cm.message_text, cm.message_type, cc.subject
FROM chat_messages cm
JOIN chat_conversations cc ON cm.conversation_id = cc.id
JOIN chat_participants cp ON cc.id = cp.conversation_id
WHERE cp.user_id = 'USER_ID'
  AND cc.subject = 'Subscription Management'
ORDER BY cm.created_at DESC
LIMIT 1;
```
- ✅ System message created in "Subscription Management" conversation
- ✅ Message includes admin name, plan names, and admin notes

---

## Test Suite 2: User Upgrade Response Flow

### Test 2.1: User Views Pending Upgrade

**Steps:**
1. Logout from admin
2. Login as the user who received the upgrade request
3. Navigate to dashboard or profile

**Expected Results:**
- ✅ **PendingUpgradeNotification** banner appears at top of page
- ✅ Banner shows:
  - Admin name who requested upgrade
  - Current plan → New plan
  - Price comparison (current vs new)
  - Price difference highlighted
  - Admin notes in white card
  - Days remaining badge
  - "Accept" and "Decline" buttons
  - Dismiss (X) button

**Verification:**
```javascript
// In browser console:
billingService.getPendingUpgrade().then(console.log);
```

---

### Test 2.2: User Accepts Upgrade

**Steps:**
1. In PendingUpgradeNotification, click "Accept" button
2. UpgradeConfirmationModal should open
3. Review the plan comparison
4. Optionally add response notes
5. Click "Confirm Upgrade"

**Expected Results:**
- ✅ Modal opens with title "Confirm Plan Upgrade"
- ✅ Shows admin info and notes in blue box
- ✅ Side-by-side plan comparison:
  - Left: Current plan (gray border)
  - Right: New plan (primary border, highlighted)
- ✅ Shows price increase warning if applicable
- ✅ Shows new plan limits with checkmarks
- ✅ Shows effective date (next billing cycle)
- ✅ User notes textarea optional
- ✅ "Confirm Upgrade" button shows loading state
- ✅ Success message and modal closes
- ✅ Banner disappears from dashboard

**Verification:**
```sql
-- Check upgrade request status updated
SELECT status, responded_at, user_response_notes
FROM subscription_upgrade_requests
WHERE id = 'REQUEST_ID';

-- Should show: status = 'accepted', responded_at = now
```

---

### Test 2.3: User Declines Upgrade

**Alternative Test:**
1. Click "Decline" instead of "Accept"
2. Confirm decline action

**Expected Results:**
- ✅ Confirmation prompt appears
- ✅ On confirm, banner disappears
- ✅ Request status = 'declined'
- ✅ Admin receives notification (if implemented)

---

## Test Suite 3: Pause Subscription Flow

### Test 3.1: Admin Pauses Subscription

**Steps:**
1. Login as admin
2. Go to user's subscription tab
3. Click "Pause Subscription" button
4. In ConfirmDialog, enter reason: "Payment overdue - customer requested pause"
5. Click "Confirm"

**Expected Results:**
- ✅ ConfirmDialog opens with warning text
- ✅ Reason textarea is required (validation)
- ✅ Submit button shows loading state
- ✅ Success alert: "Subscription paused successfully"
- ✅ Subscription display refreshes
- ✅ Status badge shows "Paused" (yellow/warning)
- ✅ Shows "Paused by: [Admin Name]"
- ✅ Shows pause reason
- ✅ "Pause Subscription" button is hidden
- ✅ "Resume Subscription" button is now visible

**Verification:**
```sql
-- Check subscription updated
SELECT status, paused_reason, paused_by_admin_id
FROM user_subscriptions
WHERE user_id = 'USER_ID';

-- Should show: status = 'paused', paused_reason filled, paused_by_admin_id set
```

---

### Test 3.2: User Sees Paused State

**Steps:**
1. Login as the paused user
2. Try to create a property (or any write action)

**Expected Results:**
- ✅ **PausedAccountModal** appears immediately
- ✅ Modal shows yellow warning icon
- ✅ Title: "Your Account is Paused"
- ✅ Shows pause reason from admin
- ✅ Shows "Paused by: [Admin Name]"
- ✅ Explains read-only access and billing stopped
- ✅ Two buttons:
  - "Pay Subscription" (primary)
  - "Contact Support" (outline)
- ✅ Modal cannot be closed (no X button, no overlay click)
- ✅ User cannot perform write actions

---

### Test 3.3: User Clicks "Pay Subscription"

**Steps:**
1. In PausedAccountModal, click "Pay Subscription"

**Expected Results:**
- ✅ Navigates to `/pricing` or `/profile?tab=billing`
- ✅ User can select a plan
- ✅ On successful payment, subscription reactivates
- ✅ Modal disappears
- ✅ Full access restored

---

### Test 3.4: User Clicks "Contact Support"

**Steps:**
1. In PausedAccountModal, click "Contact Support"

**Expected Results:**
- ✅ Creates support ticket or opens chat
- ✅ Subject pre-filled: "Paused Subscription - Account Reactivation Request"
- ✅ User info auto-populated
- ✅ Navigates to chat/support page

---

### Test 3.5: Admin Resumes Subscription

**Steps:**
1. Login as admin
2. Go to paused user's subscription tab
3. Click "Resume Subscription"
4. Confirm action

**Expected Results:**
- ✅ ConfirmDialog appears
- ✅ On confirm, success alert
- ✅ Status changes to "Active"
- ✅ "Resume" button hidden, "Pause" button visible
- ✅ Paused reason cleared
- ✅ User receives notification (email + in-app + chat)

**Verify User Access:**
- ✅ User can now perform write actions
- ✅ PausedAccountModal no longer appears
- ✅ AuthContext `hasWriteAccess` = true

---

## Test Suite 4: Cancel Subscription Flow

### Test 4.1: Admin Cancels Subscription

**Steps:**
1. Login as admin
2. Go to user's subscription tab
3. Click "Cancel Subscription"
4. Enter reason: "User requested cancellation due to switching to competitor"
5. Confirm

**Expected Results:**
- ✅ ConfirmDialog shows warning: "Access will remain until [end date]"
- ✅ Reason textarea required
- ✅ Success alert includes access end date
- ✅ Status shows "Cancelled"
- ✅ Shows "Cancelled by: [Admin Name]"
- ✅ Shows cancel reason
- ✅ Shows "Access ends: [Date]"
- ✅ Days remaining indicator shows time until access ends

**Verification:**
```sql
SELECT status, cancelled_reason, cancelled_by_admin_id, current_period_end
FROM user_subscriptions
WHERE user_id = 'USER_ID';

-- status = 'cancelled', current_period_end = access end date
```

---

### Test 4.2: User Has Continued Access

**Steps:**
1. Login as cancelled user
2. Try to use the application

**Expected Results:**
- ✅ User has FULL access (not read-only)
- ✅ Can create, edit, delete as normal
- ✅ Dashboard shows cancelled status with end date
- ✅ Receives notification about cancellation

---

### Test 4.3: Access Expires

**Simulate expiry:**
```sql
-- Manually set current_period_end to past date
UPDATE user_subscriptions
SET current_period_end = NOW() - INTERVAL '1 day'
WHERE user_id = 'USER_ID';
```

**Steps:**
1. Login as user
2. Try to perform write action

**Expected Results:**
- ✅ User has read-only access
- ✅ Subscription access check returns `accessMode: 'readonly'`
- ✅ User sees modal/banner prompting to resubscribe

---

## Test Suite 5: Subscription Limits Display

### Test 5.1: View Limits in Admin Tab

**Steps:**
1. Login as admin
2. View user subscription tab
3. Check limits display

**Expected Results:**
- ✅ Limits section shows all limits from subscription type
- ✅ Each limit shows:
  - Label (e.g., "Properties", "Rooms")
  - Current usage / limit
  - Visual indicator or badge
- ✅ Unlimited limits show "∞" or "Unlimited"

---

### Test 5.2: Test LimitDisplay Component

**Steps:**
1. Navigate to a page with limits (e.g., property list page)
2. Add `<LimitDisplay limitKey="max_properties" used={3} limit={10} />` to a test page

**Expected Results:**
- ✅ Shows "3/10 properties"
- ✅ Progress bar at 30% (green)
- ✅ No warning message

**Test Near Limit:**
```tsx
<LimitDisplay limitKey="max_properties" used={9} limit={10} />
```
- ✅ Progress bar at 90% (yellow/warning)
- ✅ Shows warning: "You're approaching your properties limit. 1 remaining."

**Test At Limit:**
```tsx
<LimitDisplay limitKey="max_properties" used={10} limit={10} />
```
- ✅ Progress bar at 100% (red/danger)
- ✅ Shows "10/10 (Full)"
- ✅ Shows warning: "You've reached your properties limit. Please upgrade your plan to add more."

**Test Unlimited:**
```tsx
<LimitDisplay limitKey="max_properties" used={50} limit={-1} />
```
- ✅ Shows "50"
- ✅ No progress bar
- ✅ No warning

---

## Test Suite 6: Notification Delivery

### Test 6.1: Email Notifications

**For each subscription action (upgrade request, pause, cancel, resume):**

1. Trigger the action
2. Check email inbox (or email logs)

**Verify:**
- ✅ Email sent to user's registered email
- ✅ Subject line correct
- ✅ HTML template renders correctly
- ✅ All placeholders replaced (no {{variable}} left)
- ✅ Links work and point to correct URLs
- ✅ Buttons render with correct styling
- ✅ Responsive design (test on mobile)

---

### Test 6.2: In-App Notifications

**Steps:**
1. Trigger subscription action
2. Check notification center

**Verify:**
```sql
SELECT n.*, nt.name as type_name
FROM notifications n
JOIN notification_types nt ON n.notification_type_id = nt.id
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC;
```

- ✅ Notification created
- ✅ Correct notification type ('subscription')
- ✅ Correct variant (info, warning, success, danger)
- ✅ Title and message rendered correctly
- ✅ Action URL and label set correctly
- ✅ Priority set appropriately

---

### Test 6.3: Chat Notifications

**Steps:**
1. Trigger subscription action
2. Login as user
3. Go to chat/messages

**Verify:**
- ✅ New message in "Subscription Management" conversation
- ✅ Message type is "system"
- ✅ Message formatted correctly (markdown)
- ✅ Contains all relevant information
- ✅ Conversation created if didn't exist

---

## Test Suite 7: Edge Cases & Error Handling

### Test 7.1: Duplicate Upgrade Requests

**Steps:**
1. Create upgrade request for user
2. Try to create another upgrade request for same user

**Expected Results:**
- ✅ Error message: "User already has a pending upgrade request"
- ✅ Only one pending request exists in database
- ✅ Previous request not overwritten

---

### Test 7.2: Expired Upgrade Requests

**Steps:**
1. Create upgrade request
2. Manually set `expires_at` to past date:
```sql
UPDATE subscription_upgrade_requests
SET expires_at = NOW() - INTERVAL '1 day'
WHERE id = 'REQUEST_ID';
```
3. Try to accept the request

**Expected Results:**
- ✅ Error: "Upgrade request has expired"
- ✅ Request not processed
- ✅ Status remains 'pending' or changes to 'expired'

---

### Test 7.3: Pause Already Paused

**Steps:**
1. Pause a subscription
2. Try to pause it again

**Expected Results:**
- ✅ Error or graceful handling
- ✅ Button disabled in UI (prevent double-click)
- ✅ No duplicate notifications sent

---

### Test 7.4: Invalid Plan Upgrade (Lower Tier)

**Steps:**
1. Try to request upgrade to a lower-tier plan

**Expected Results:**
- ✅ Lower-tier plans not shown in upgrade modal
- ✅ Backend validation rejects lower-tier upgrades
- ✅ Error message clear

---

### Test 7.5: Non-Admin Trying Admin Actions

**Steps:**
1. Login as regular user
2. Try to access `/admin/users/:userId/subscription` API endpoints directly

**Expected Results:**
- ✅ 403 Forbidden error
- ✅ Clear error message
- ✅ No data exposed

---

## Test Suite 8: AuthContext Integration

### Test 8.1: Check Subscription Flags

**Steps:**
1. Login as user with active subscription
2. Open browser console:

```javascript
// Get auth context
const auth = useAuth(); // Or access via React DevTools

console.log('Subscription Access:', {
  subscriptionAccess: auth.subscriptionAccess,
  isPaused: auth.isPaused,
  isCancelled: auth.isCancelled,
  hasWriteAccess: auth.hasWriteAccess,
});
```

**Expected for Active Subscription:**
- ✅ `isPaused: false`
- ✅ `isCancelled: false`
- ✅ `hasWriteAccess: true`
- ✅ `subscriptionAccess.accessMode: 'full'`

**Expected for Paused Subscription:**
- ✅ `isPaused: true`
- ✅ `hasWriteAccess: false`
- ✅ `subscriptionAccess.accessMode: 'readonly'`

---

### Test 8.2: Context Updates on State Change

**Steps:**
1. Login as user
2. Have admin pause subscription (in separate session)
3. Refresh user's page or wait for poll

**Expected Results:**
- ✅ AuthContext updates
- ✅ `isPaused` changes to `true`
- ✅ `hasWriteAccess` changes to `false`
- ✅ PausedAccountModal appears

---

## Test Suite 9: Performance & UX

### Test 9.1: Loading States

**Verify all components show loading states:**
- ✅ UserSubscriptionTab shows spinner while fetching
- ✅ UpgradeSubscriptionModal shows spinner
- ✅ Button shows loading spinner during submit
- ✅ No double-submit possible

---

### Test 9.2: Error States

**Test network errors:**
1. Disconnect network
2. Try to perform subscription action

**Expected:**
- ✅ Error message shown to user
- ✅ No app crash
- ✅ User can retry

---

### Test 9.3: Responsive Design

**Test on different screen sizes:**
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

**Verify:**
- ✅ Modals scale correctly
- ✅ Tables/cards stack on mobile
- ✅ Buttons accessible on small screens
- ✅ Text readable

---

## Test Suite 10: Database Integrity

### Test 10.1: Audit Trail

**Verify all admin actions are logged:**

```sql
-- Check paused_by_admin_id tracking
SELECT
  us.id,
  us.user_id,
  us.status,
  us.paused_by_admin_id,
  us.cancelled_by_admin_id,
  admin.full_name as admin_name
FROM user_subscriptions us
LEFT JOIN users admin ON us.paused_by_admin_id = admin.id
WHERE us.status IN ('paused', 'cancelled');
```

- ✅ Admin IDs tracked
- ✅ Reasons stored
- ✅ Timestamps accurate

---

### Test 10.2: Data Consistency

**Verify foreign key relationships:**

```sql
-- Check upgrade requests reference valid subscriptions and plans
SELECT
  sur.id,
  sur.user_id,
  sur.current_subscription_id,
  sur.requested_subscription_type_id,
  sur.requested_by_admin_id,
  us.id as sub_exists,
  st.id as plan_exists,
  admin.id as admin_exists
FROM subscription_upgrade_requests sur
LEFT JOIN user_subscriptions us ON sur.current_subscription_id = us.id
LEFT JOIN subscription_types st ON sur.requested_subscription_type_id = st.id
LEFT JOIN users admin ON sur.requested_by_admin_id = admin.id
WHERE us.id IS NULL OR st.id IS NULL OR admin.id IS NULL;
```

- ✅ No orphaned records
- ✅ All FKs valid

---

## Final Checklist

### Code Quality
- ✅ No console errors in browser
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ Components follow CLAUDE.md conventions
- ✅ All files use proper exports/imports

### Functionality
- ✅ Admin can upgrade users
- ✅ Admin can pause users
- ✅ Admin can cancel users
- ✅ Admin can resume users
- ✅ Users receive all notifications
- ✅ Users can accept/decline upgrades
- ✅ Paused users see modal
- ✅ Cancelled users keep access until expiry
- ✅ Limits display correctly
- ✅ AuthContext provides correct flags

### UX
- ✅ Loading states work
- ✅ Error messages clear
- ✅ Confirmation dialogs prevent accidents
- ✅ Modals closeable (except PausedAccountModal)
- ✅ Responsive on all devices
- ✅ Dark mode supported

### Backend
- ✅ All migrations applied successfully
- ✅ API endpoints secured
- ✅ Services handle errors gracefully
- ✅ Notifications sent reliably
- ✅ Database constraints enforced

---

## Reporting Issues

If you find issues during testing, please document:

1. **Test**: Which test failed
2. **Steps**: Exact steps to reproduce
3. **Expected**: What should happen
4. **Actual**: What actually happened
5. **Logs**: Console errors, network errors, database errors
6. **Environment**: Browser, OS, screen size

---

## Next Steps After Testing

1. Fix any issues found
2. Performance testing with large datasets
3. Load testing for concurrent admin actions
4. Security audit of permissions
5. Accessibility audit (WCAG compliance)
6. User acceptance testing (UAT)
7. Deploy to staging environment
8. Production deployment plan
