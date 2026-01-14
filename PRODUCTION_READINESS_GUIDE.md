# 🚀 Refund System - Production Readiness Guide

**Date**: January 14, 2026
**Current Status**: 95% Complete - 3 Critical Tasks Remaining

---

## 📊 Current System Status

### ✅ **Complete** (100%)
- ✅ Database schema (all 4 refund tables)
- ✅ Backend services and APIs
- ✅ Notification integration (12 lifecycle points)
- ✅ Payment gateway API integration (Paystack, PayPal)
- ✅ Webhook handlers (both gateways)
- ✅ RLS security policies (migration 081)
- ✅ Frontend components
- ✅ Permissions and authorization
- ✅ Audit logging and history tracking

### ⚠️ **Needs Action** (3 items)
1. ❌ Apply notification templates migration (CRITICAL)
2. ⚠️ Fix storage bucket MIME types (MEDIUM)
3. ⚠️ Add missing environment variables (MEDIUM)

---

## 🎯 Tasks to Complete

### **Task 1: Apply Notification Templates** (CRITICAL - 5 minutes)

**Why**: Without this, NO email notifications will be sent to users or admins.

**Steps**:
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New query**
4. Copy ALL content from: `backend/migrations/080_create_refund_notification_templates.sql`
5. Paste into SQL Editor
6. Click **Run**

**Expected Result**: ✅ "Success. No rows returned"

**Verify**:
```bash
node verify-production-readiness.js
```
Should show 12/12 templates found.

---

### **Task 2: Fix Storage Bucket MIME Types** (MEDIUM - 2 minutes)

**Why**: Document uploads currently fail due to restrictive MIME type settings.

**Steps**:
1. Open Supabase Dashboard
2. Go to **Storage** → **refund-documents** bucket
3. Click **Configuration** (gear icon)
4. Under **Allowed MIME types**, add:
   ```
   image/jpeg
   image/png
   image/gif
   application/pdf
   ```
5. Click **Save**

**Verify**: Upload test document through UI should work.

---

### **Task 3: Add Environment Variables** (MEDIUM - 3 minutes)

**Why**: Notification emails need proper URLs for links back to the dashboard.

**File**: `backend/.env`

**Add these variables**:
```bash
# Frontend URLs for notifications
DASHBOARD_URL=http://localhost:5173
PORTAL_URL=http://localhost:5173

# SMTP Configuration (for email notifications)
# Use your SMTP provider (Gmail, SendGrid, Mailgun, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@vilo.com
```

**For Gmail**:
1. Enable 2FA on your Google account
2. Generate an app-specific password: https://myaccount.google.com/apppasswords
3. Use that password as `SMTP_PASS`

**For Production**: Use professional SMTP service (SendGrid recommended)

**Verify**: Restart backend server, notifications should send emails.

---

## ✅ Verification Checklist

After completing all 3 tasks, run:

```bash
node verify-production-readiness.js
```

**Expected Results**:
- ✅ All 4 database tables accessible
- ✅ 12/12 notification templates found
- ✅ Storage bucket upload test passes
- ✅ Permissions exist (refunds:read, refunds:manage)
- ✅ All environment variables set

**Success Rate Target**: 90%+ (some failures expected for payment integrations in dev mode)

---

## 🧪 Manual Testing Guide

Once verification passes, test the refund workflow:

### Test Scenario 1: Guest Creates Refund Request

1. **Login as Guest**
   - Email: mjjj@gmail.com (or create test guest account)

2. **Navigate to a Booking**
   - Go to "My Bookings"
   - Click on any confirmed booking
   - Click "Refunds" tab

3. **Request Refund**
   - Click "Request Refund" button
   - Enter amount (full or partial)
   - Enter reason: "Unable to travel due to emergency"
   - Click "Submit Request"

**✅ Expected**:
- Request appears with status "requested"
- Success toast message shown
- Email sent to property owner

### Test Scenario 2: Property Owner Approves Refund

1. **Login as Property Owner**
   - Email: admin@vilo.com (super_admin)

2. **View Refund Request**
   - Go to booking detail page
   - Navigate to "Refunds" tab
   - See pending refund request

3. **Approve Refund**
   - Click "Approve" button
   - Form expands with green gradient background
   - Review approved amount
   - Add customer notes: "Your refund has been approved"
   - Check "Notify Guest"
   - Click "Save Changes"

**✅ Expected**:
- Status changes to "approved"
- Success toast shown
- Email sent to guest
- Green status badge visible

### Test Scenario 3: Process Refund (Simulated)

1. **As Property Owner**
   - Click "Process Refund" button
   - View payment method breakdown

2. **Processing**
   - System calls payment gateway APIs
   - Status updates to "processing"

**✅ Expected**:
- Status badge shows "processing"
- Logs show gateway API calls
- In production: webhook updates status to "completed"
- In dev: manually mark as completed

---

## 📋 Optional: Payment Integration Setup (For Production)

### Paystack Configuration

1. **Get API Keys**:
   - Login to Paystack Dashboard
   - Go to Settings → API Keys & Webhooks
   - Copy **Secret Key**

2. **Configure Webhook**:
   - Webhook URL: `https://your-domain.com/api/webhooks/paystack/refund`
   - Events to subscribe: `refund.processed`, `refund.completed`
   - Copy webhook secret

3. **Add to Database**:
   ```sql
   INSERT INTO payment_integrations (
     provider,
     is_active,
     config,
     webhook_secret
   ) VALUES (
     'paystack',
     true,
     '{"public_key": "pk_live_...", "secret_key": "sk_live_..."}'::jsonb,
     'your_webhook_secret'
   );
   ```

### PayPal Configuration

1. **Get API Credentials**:
   - Login to PayPal Developer Dashboard
   - Create REST API app
   - Copy Client ID and Secret

2. **Configure Webhook**:
   - Webhook URL: `https://your-domain.com/api/webhooks/paypal/refund`
   - Events: `PAYMENT.CAPTURE.REFUNDED`
   - Copy webhook ID

3. **Add to Database**:
   ```sql
   INSERT INTO payment_integrations (
     provider,
     is_active,
     config,
     webhook_secret
   ) VALUES (
     'paypal',
     true,
     '{"client_id": "...", "client_secret": "...", "mode": "live"}'::jsonb,
     'your_webhook_id'
   );
   ```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Template not found" error

**Cause**: Migration 080 not applied
**Fix**: Follow Task 1 above

### Issue 2: Document upload fails

**Cause**: MIME type restrictions
**Fix**: Follow Task 2 above

### Issue 3: Notification emails not sending

**Causes**:
- SMTP credentials not set → Follow Task 3
- Firewall blocking port 587 → Use port 465 (SSL)
- Gmail blocking "less secure apps" → Use app-specific password

### Issue 4: "This action is restricted" error

**Cause**: User type mismatch (already fixed)
**Verify**: User should be 'super_admin' or 'admin' type

### Issue 5: Refund stays in "processing" indefinitely

**Cause**: Webhooks not configured (expected in dev)
**Workaround**: Manually mark as completed using admin UI
**Production Fix**: Configure payment gateway webhooks

---

## 📈 Production Deployment Checklist

When ready to deploy to production:

### Before Deployment
- [ ] All 3 tasks above completed
- [ ] Manual testing completed successfully
- [ ] All TypeScript errors fixed (currently 72 errors in other controllers)
- [ ] Environment variables updated for production URLs
- [ ] SMTP configured with production service (SendGrid/Mailgun)
- [ ] Payment gateway production API keys added
- [ ] Webhook URLs registered with Paystack and PayPal

### During Deployment
- [ ] Apply migration 080 to production database
- [ ] Apply migration 081 (RLS policies) to production database
- [ ] Create storage bucket: `refund-documents`
- [ ] Configure bucket MIME types
- [ ] Set bucket to private (RLS enforced)
- [ ] Update environment variables in hosting platform
- [ ] Test webhook endpoints are publicly accessible
- [ ] Verify SSL certificates on webhook URLs

### After Deployment
- [ ] Test refund creation as guest
- [ ] Test refund approval as property owner
- [ ] Verify emails are being sent
- [ ] Test payment gateway refund in sandbox mode first
- [ ] Monitor webhook logs for incoming events
- [ ] Test full refund lifecycle end-to-end
- [ ] Set up monitoring/alerts for refund processing failures

---

## 🎉 Success Criteria

System is production-ready when:

✅ **Verification script shows 90%+ pass rate**
✅ **All 12 notification templates exist**
✅ **Storage bucket allows PDF and image uploads**
✅ **SMTP sends test emails successfully**
✅ **Guest can create refund request**
✅ **Property owner can approve/reject requests**
✅ **Email notifications arrive for all actions**
✅ **Payment gateway sandbox refunds work**
✅ **Webhook handlers update refund status**

---

## 📞 Need Help?

**Error Logs**:
- Backend: Check terminal where `npm run dev` is running
- Database: Supabase Dashboard → Logs
- Emails: Check spam folder, verify SMTP logs

**Verification Commands**:
```bash
# Check overall readiness
node verify-production-readiness.js

# Check migration 080 status
node apply-migration-080.js

# Check user types
node check-user-type.js

# Test notification system
node test-refund-system-quick.js
```

---

**Next Step**: Complete Task 1 (notification templates) - this is the most critical blocker.
