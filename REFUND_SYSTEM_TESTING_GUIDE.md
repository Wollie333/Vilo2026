# Refund Management System - Complete Testing Guide

## Overview
This guide walks through testing the complete refund management system with all 4 phases implemented:
- Phase 1: UI Integration
- Phase 2: Notification System
- Phase 3: Payment Gateway Integration
- Phase 4: Authorization & Security

---

## Step 1: Database Setup (CRITICAL - Do this first!)

### 1.1 Apply Migration 080 (Notification Templates)

**In Supabase SQL Editor:**

```sql
-- Copy and paste the contents of:
-- backend/migrations/080_create_refund_notification_templates.sql

-- OR manually run:
```

Navigate to Supabase Dashboard → SQL Editor → New Query → Paste the entire contents of `backend/migrations/080_create_refund_notification_templates.sql` → Run

**Expected Result:**
- 12 new rows in `notification_templates` table
- Template keys: `refund_requested`, `refund_approved`, `refund_rejected`, etc.

**Verification:**
```sql
SELECT template_key, name, default_enabled
FROM notification_templates
WHERE template_key LIKE 'refund%'
ORDER BY template_key;
```

Should return 12 rows.

---

### 1.2 Apply Migration 081 (RLS Policies)

**In Supabase SQL Editor:**

```sql
-- Copy and paste the contents of:
-- backend/migrations/081_create_refund_rls_policies.sql

-- OR manually run:
```

Navigate to Supabase Dashboard → SQL Editor → New Query → Paste the entire contents of `backend/migrations/081_create_refund_rls_policies.sql` → Run

**Expected Result:**
- RLS enabled on `refund_requests`, `refund_comments`, `refund_documents`
- Multiple policies created for each table

**Verification:**
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('refund_requests', 'refund_comments', 'refund_documents');

-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('refund_requests', 'refund_comments', 'refund_documents')
ORDER BY tablename, policyname;
```

Should return:
- 3 tables with `rowsecurity = true`
- Multiple policies per table

---

### 1.3 Verify and Create Refund Permissions

**Run the verification script:**

```bash
node verify-refund-permissions.js
```

**If permissions DON'T exist, create them:**

```sql
-- In Supabase SQL Editor
INSERT INTO permissions (resource, action, description, category) VALUES
  ('refunds', 'read', 'View refund requests', 'financial'),
  ('refunds', 'manage', 'Approve, reject, and process refunds', 'financial')
ON CONFLICT (resource, action) DO NOTHING;
```

**Verification:**
```sql
SELECT id, resource, action, description, category
FROM permissions
WHERE resource = 'refunds'
ORDER BY action;
```

Should return 2 rows:
- `refunds:read`
- `refunds:manage`

---

### 1.4 Assign Permissions to User Types

**Assign to super_admin:**

```sql
-- Get the permission IDs
WITH refund_perms AS (
  SELECT id FROM permissions WHERE resource = 'refunds'
),
super_admin_type AS (
  SELECT id FROM user_types WHERE name = 'super_admin'
)
INSERT INTO user_type_permissions (user_type_id, permission_id)
SELECT
  super_admin_type.id,
  refund_perms.id
FROM super_admin_type
CROSS JOIN refund_perms
ON CONFLICT (user_type_id, permission_id) DO NOTHING;
```

**Assign to property_manager:**

```sql
-- Get the permission IDs
WITH refund_perms AS (
  SELECT id FROM permissions WHERE resource = 'refunds'
),
property_manager_type AS (
  SELECT id FROM user_types WHERE name = 'property_manager'
)
INSERT INTO user_type_permissions (user_type_id, permission_id)
SELECT
  property_manager_type.id,
  refund_perms.id
FROM property_manager_type
CROSS JOIN refund_perms
ON CONFLICT (user_type_id, permission_id) DO NOTHING;
```

**Verification:**
```sql
SELECT
  ut.name AS user_type,
  ut.display_name,
  p.resource || ':' || p.action AS permission
FROM user_type_permissions utp
JOIN user_types ut ON utp.user_type_id = ut.id
JOIN permissions p ON utp.permission_id = p.id
WHERE p.resource = 'refunds'
ORDER BY ut.name, p.action;
```

Should show both `super_admin` and `property_manager` have both permissions.

---

## Step 2: Backend Server Startup

### 2.1 Start the Backend

```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running on port 3000
✓ Database connected
✓ Refund routes loaded
✓ Webhook routes loaded
```

**Verify Routes Loaded:**

Check terminal output for:
- `GET /api/bookings/:bookingId/refunds`
- `POST /api/admin/refunds/:id/approve`
- `POST /api/webhooks/paystack/refund`
- `POST /api/webhooks/paypal/refund`

---

### 2.2 Verify Authentication Middleware

**Test with curl (should fail without auth):**

```bash
curl -X GET http://localhost:3000/api/admin/refunds
```

**Expected Response:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

✅ This confirms auth middleware is working!

---

## Step 3: Frontend Setup

### 3.1 Start the Frontend

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

---

### 3.2 Verify No Build Errors

```bash
npm run build
```

**Expected:** No TypeScript errors related to refund components.

---

## Step 4: End-to-End Testing Scenarios

### Scenario 1: Guest Creates Refund Request

**Prerequisites:**
- Logged in as guest user
- Have a booking with `status = 'confirmed'` or `'checked_out'`
- Booking has at least one completed payment

**Steps:**

1. **Navigate to Booking Detail Page**
   - Go to `/bookings/{booking_id}`
   - Click "Refunds" tab

2. **Request Refund**
   - Should see "Request Refund" card
   - Click "New Refund Request" button
   - Form expands with orange/amber gradient background
   - Fill in:
     - Requested amount (max = total paid)
     - Reason for refund
   - Click "Submit Request"

**Expected Results:**
- ✅ Form submits successfully
- ✅ Toast notification: "Refund request submitted"
- ✅ New refund appears in "All Refund Requests" section
- ✅ Status badge shows "Requested" (yellow/orange)
- ✅ Admin receives email notification (`refund_requested`)

**Backend Logs to Check:**
```
[INFO] Refund request created: {refund_id}
[INFO] Sending notification: refund_requested to [admin_ids]
```

**Database Verification:**
```sql
SELECT
  id,
  booking_id,
  requested_amount,
  status,
  reason,
  requested_by,
  requested_at
FROM refund_requests
WHERE booking_id = '{your_booking_id}'
ORDER BY requested_at DESC
LIMIT 1;
```

---

### Scenario 2: Guest Adds Comment

**Steps:**

1. **Expand Refund Card**
   - Click on the refund card to expand
   - Click "Comments" tab

2. **Add Comment**
   - Type comment in text area
   - Ensure "Internal Note" checkbox is UNCHECKED (guests can't create internal notes)
   - Click "Add Comment"

**Expected Results:**
- ✅ Comment appears in thread
- ✅ Comment has blue background (guest comment)
- ✅ No "Internal" badge visible
- ✅ Admin receives email notification (`refund_comment_from_guest`)

**Database Verification:**
```sql
SELECT
  id,
  refund_id,
  user_id,
  comment_text,
  is_internal,
  created_at
FROM refund_comments
WHERE refund_id = '{your_refund_id}'
ORDER BY created_at DESC
LIMIT 1;
```

`is_internal` should be `false` for guest comments.

---

### Scenario 3: Guest Uploads Document

**Steps:**

1. **Navigate to Documents Tab**
   - Click "Documents" tab in expanded refund card

2. **Upload Document**
   - Click "Upload Document" button
   - Select file (PDF, PNG, or JPG - max 10MB)
   - Fill in document type (e.g., "Receipt", "Bank Statement")
   - Add optional description
   - Click "Upload"

**Expected Results:**
- ✅ Document uploads successfully
- ✅ Document appears in grid with "Pending" badge
- ✅ Admin receives email notification (`refund_document_uploaded`)

**Database Verification:**
```sql
SELECT
  id,
  refund_id,
  file_name,
  document_type,
  verification_status,
  uploaded_by,
  created_at
FROM refund_documents
WHERE refund_id = '{your_refund_id}'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Scenario 4: Admin Approves Refund

**Prerequisites:**
- Logged in as `super_admin` or `property_manager`
- Have a refund with `status = 'requested'`

**Steps:**

1. **Navigate to Booking Detail Page**
   - Go to `/bookings/{booking_id}`
   - Click "Refunds" tab

2. **Approve Refund**
   - Should see "Pending Approvals" section
   - Click "Approve" button on refund card
   - Form expands with GREEN gradient background
   - Review suggested amount
   - Can adjust approved amount if needed
   - Add optional internal notes
   - Ensure "Notify Guest" is checked
   - Click "Approve Refund"

**Expected Results:**
- ✅ Refund status changes to "Approved" (green badge)
- ✅ Approved amount displayed
- ✅ Guest receives email notification (`refund_approved`)
- ✅ Refund moves to "Approved Refunds" section

**Backend Logs:**
```
[INFO] Refund {refund_id} approved by {user_id}
[INFO] Sending notification: refund_approved to [{guest_id}]
```

**Database Verification:**
```sql
SELECT
  id,
  status,
  approved_amount,
  approved_by,
  approved_at,
  admin_notes
FROM refund_requests
WHERE id = '{your_refund_id}';
```

Status should be `'approved'`.

---

### Scenario 5: Admin Processes Refund (Automatic)

**Prerequisites:**
- Refund is approved
- Booking has Paystack or PayPal payments

**Steps:**

1. **Process Refund**
   - In "Approved Refunds" section
   - Click "Process Refund" button
   - Processing panel expands showing payment method breakdown
   - Click "Process" next to each payment method

**Expected Results:**
- ✅ Payment gateway API called
- ✅ Status changes to "Processing"
- ✅ Gateway refund ID recorded
- ✅ Guest and admin receive notification (`refund_processing_started`)

**Backend Logs:**
```
[INFO] Processing refund {refund_id}
[INFO] Calling Paystack refund API for payment {payment_id}
[INFO] Gateway refund initiated: {gateway_refund_id}
[INFO] Sending notification: refund_processing_started
```

**Database Verification:**
```sql
SELECT
  id,
  status,
  refund_breakdown,
  processed_by,
  processed_at
FROM refund_requests
WHERE id = '{your_refund_id}';
```

Check `refund_breakdown` JSONB field has `gateway_refund_id` populated.

---

### Scenario 6: Webhook Updates Refund Status

**Prerequisites:**
- Refund is processing
- Payment gateway has processed the refund

**Simulate Webhook (for testing):**

**Paystack Webhook:**
```bash
curl -X POST http://localhost:3000/api/webhooks/paystack/refund \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: {your_signature}" \
  -d '{
    "event": "refund.processed",
    "data": {
      "id": "{gateway_refund_id}",
      "reference": "{gateway_refund_id}",
      "status": "success",
      "amount": 50000
    }
  }'
```

**PayPal Webhook:**
```bash
curl -X POST http://localhost:3000/api/webhooks/paypal/refund \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "PAYMENT.CAPTURE.REFUNDED",
    "resource": {
      "id": "{gateway_refund_id}",
      "status": "COMPLETED"
    }
  }'
```

**Expected Results:**
- ✅ Webhook handler finds refund by gateway ID
- ✅ Refund status updated to "Completed"
- ✅ Guest receives email notification (`refund_completed`)

**Backend Logs:**
```
[INFO] Paystack refund webhook received: refund.processed
[INFO] Refund {refund_id} marked as completed
[INFO] Sending notification: refund_completed to [{guest_id}]
```

**Database Verification:**
```sql
SELECT
  id,
  status,
  completed_at,
  refunded_amount
FROM refund_requests
WHERE id = '{your_refund_id}';
```

Status should be `'completed'`.

---

### Scenario 7: Admin Rejects Refund

**Prerequisites:**
- Logged in as admin
- Have a refund with `status = 'requested'`

**Steps:**

1. **Reject Refund**
   - In "Pending Approvals" section
   - Click "Reject" button
   - Form expands with RED gradient background
   - Enter rejection reason (required)
   - Add optional internal notes
   - Ensure "Notify Guest" is checked
   - Click "Reject Refund"

**Expected Results:**
- ✅ Status changes to "Rejected" (red badge)
- ✅ Guest receives email notification (`refund_rejected`)

**Backend Logs:**
```
[INFO] Refund {refund_id} rejected by {user_id}
[INFO] Sending notification: refund_rejected to [{guest_id}]
```

---

### Scenario 8: Manual Refund (EFT/Cash)

**Prerequisites:**
- Approved refund
- Booking paid with EFT or cash

**Steps:**

1. **Process Manual Refund**
   - Click "Process Refund"
   - System shows "Manual Processing Required" for EFT/cash payments
   - Admin processes refund outside the system (bank transfer, etc.)
   - Click "Mark as Complete"
   - Enter refund reference number
   - Click "Confirm"

**Expected Results:**
- ✅ Status changes to "Completed"
- ✅ Manual refund reference recorded
- ✅ Guest receives completion notification

---

## Step 5: Authorization Testing

### Test 1: Guest Cannot Access Admin Endpoints

**As logged-in guest:**

```bash
# Try to list all refunds (admin endpoint)
curl -X GET http://localhost:3000/api/admin/refunds \
  -H "Authorization: Bearer {guest_token}"
```

**Expected Response:**
```json
{
  "error": "FORBIDDEN",
  "message": "This action is restricted to: super_admin, property_manager, saas_team_member"
}
```

✅ Authorization working!

---

### Test 2: Guest Cannot See Internal Comments

**Prerequisites:**
- Admin has added internal comment to refund

**Steps:**
1. Guest views refund comments tab
2. Internal comments should NOT appear

**Database-Level Check:**
```sql
-- Try to query as guest (simulate RLS)
SET ROLE authenticated;
SET request.jwt.claim.sub = '{guest_user_id}';

SELECT * FROM refund_comments
WHERE refund_id = '{refund_id}'
AND is_internal = true;
```

Should return 0 rows (RLS blocks internal comments from guests).

---

### Test 3: Property Manager Can Only See Own Properties

**Prerequisites:**
- Have 2 property managers with different properties
- Each has refunds on their properties

**Steps:**
1. Login as Property Manager A
2. Go to admin refunds list
3. Should only see refunds for properties they own

**Database-Level Check:**
```sql
-- RLS should filter results
SET ROLE authenticated;
SET request.jwt.claim.sub = '{property_manager_a_id}';

SELECT * FROM refund_requests;
```

Should only return refunds for properties owned by Property Manager A.

---

## Step 6: Notification Testing

### Verify Email Delivery

**Check Supabase Logs:**
- Go to Supabase Dashboard → Logs → Functions
- Filter by "notifications"

**Expected Log Entries:**
```
[INFO] Sending notification: refund_requested
[INFO] Recipients: [{admin_id}]
[INFO] Template: refund_requested
[SUCCESS] Email sent successfully
```

### Test Each Notification Type

| Trigger | Template Key | Recipients |
|---------|-------------|------------|
| Guest creates refund | `refund_requested` | Admins |
| Admin approves | `refund_approved` | Guest |
| Admin rejects | `refund_rejected` | Guest |
| Processing starts | `refund_processing_started` | Both |
| Processing completes | `refund_processing_completed` | Guest |
| Processing fails | `refund_processing_failed` | Both |
| Refund completed | `refund_completed` | Guest |
| Refund cancelled | `refund_cancelled` | Both |
| Guest adds comment | `refund_comment_from_guest` | Admins |
| Admin adds comment | `refund_comment_from_admin` | Guest |
| Document uploaded | `refund_document_uploaded` | Admins |
| Document verified | `refund_document_verified` | Uploader |

---

## Step 7: Common Issues & Troubleshooting

### Issue 1: "Permission denied" when creating refund

**Cause:** RLS policies not applied

**Fix:**
```sql
-- Re-apply RLS policies
\i backend/migrations/081_create_refund_rls_policies.sql
```

---

### Issue 2: Admin routes return 403 Forbidden

**Cause:** Permissions not assigned to user type

**Fix:**
```sql
-- Verify user's user_type has refund permissions
SELECT
  ut.name,
  p.resource || ':' || p.action AS permission
FROM users u
JOIN user_types ut ON u.user_type_id = ut.id
LEFT JOIN user_type_permissions utp ON utp.user_type_id = ut.id
LEFT JOIN permissions p ON utp.permission_id = p.id
WHERE u.id = '{your_user_id}'
AND p.resource = 'refunds';
```

If no results, assign permissions (see Step 1.4).

---

### Issue 3: Notifications not sending

**Cause:** Notification templates not created

**Fix:**
```sql
-- Verify templates exist
SELECT COUNT(*) FROM notification_templates WHERE template_key LIKE 'refund%';
```

Should return 12. If not, re-apply migration 080.

---

### Issue 4: Gateway refund fails

**Possible Causes:**
1. Missing gateway credentials
2. Invalid payment reference
3. Gateway API error

**Debug Steps:**

1. Check payment integration configured:
```sql
SELECT provider, is_enabled, config
FROM payment_integrations
WHERE provider IN ('paystack', 'paypal');
```

2. Check backend logs for detailed error:
```
[ERROR] Gateway refund failed for {payment_id}: {error_message}
```

3. Verify payment record has gateway reference:
```sql
SELECT
  id,
  payment_method,
  gateway_reference,
  payment_reference
FROM booking_payments
WHERE id = '{payment_id}';
```

---

### Issue 5: Webhook not updating status

**Possible Causes:**
1. Webhook signature verification failing
2. Gateway refund ID not matching
3. Webhook URL not configured

**Debug Steps:**

1. Check webhook endpoint is accessible:
```bash
curl http://localhost:3000/api/webhooks/paystack/refund
```

Should return 200 (even if signature invalid).

2. Check backend logs for webhook receipt:
```
[INFO] Paystack refund webhook received: {event}
```

3. Verify gateway refund ID in database matches webhook:
```sql
SELECT
  id,
  refund_breakdown
FROM refund_requests
WHERE refund_breakdown::text LIKE '%{gateway_refund_id}%';
```

---

## Step 8: Performance Testing

### Load Test: Multiple Refunds

**Create 10 refunds rapidly:**

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/bookings/{booking_id}/refunds \
    -H "Authorization: Bearer {token}" \
    -H "Content-Type: application/json" \
    -d '{"requested_amount": 100, "reason": "Test refund '$i'"}' &
done
wait
```

**Expected:**
- All 10 refunds created
- No database deadlocks
- Notifications queued properly

---

## Step 9: Security Audit Checklist

- [ ] RLS enabled on all refund tables
- [ ] Guest cannot view other users' refunds
- [ ] Guest cannot see internal comments
- [ ] Guest cannot access admin endpoints
- [ ] Property manager cannot see other properties' refunds
- [ ] Webhook signatures verified
- [ ] File uploads validated (type, size)
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (sanitized inputs)

---

## Step 10: Final Verification

### Run Complete Test Suite

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Verify All Features Working

- [ ] Guest can create refund request
- [ ] Guest can view own refunds
- [ ] Guest can add comments
- [ ] Guest can upload documents
- [ ] Guest can withdraw refund
- [ ] Admin can view all refunds
- [ ] Admin can approve refunds
- [ ] Admin can reject refunds
- [ ] Admin can process refunds
- [ ] Admin can add internal notes
- [ ] Admin can verify documents
- [ ] Payment gateway refunds work
- [ ] Webhooks update status
- [ ] All 12 notifications send
- [ ] RLS policies prevent unauthorized access
- [ ] Permission checks block unauthorized actions

---

## Success Criteria

✅ **All migrations applied successfully**
✅ **All permissions created and assigned**
✅ **All 12 notification templates exist**
✅ **RLS policies active on all tables**
✅ **Authorization middleware blocks unauthorized access**
✅ **Guest can create and manage refunds**
✅ **Admin can approve and process refunds**
✅ **Payment gateways successfully process refunds**
✅ **Webhooks update refund status**
✅ **Notifications sent at all lifecycle events**
✅ **No security vulnerabilities detected**

---

## Support

If you encounter issues not covered in this guide:

1. Check backend logs: `backend/logs/`
2. Check Supabase logs: Dashboard → Logs
3. Review the implementation plan: `CURRENT_PLAN.md`
4. Check the session log: `.claude/SESSION_LOG.md`

---

**Testing Complete!** 🎉

The refund management system is production-ready once all tests pass.
