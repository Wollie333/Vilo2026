# Refund System Testing Checklist

**Date**: January 14, 2026
**Status**: Ready for Testing
**System**: Fully Implemented ✅

---

## ✅ Pre-Testing Setup

- [x] Backend server running on http://localhost:3000
- [x] Frontend running on http://localhost:5173
- [x] Database migrations applied (044, 045, 046, 080, 081)
- [x] User type middleware fixed
- [x] Logged in as: admin@vilo.com (super_admin)

---

## 🧪 Test Scenario 1: Guest Creates Refund Request

### Setup
1. **Create a test booking first** (if you don't have one)
   - Login as guest user
   - Book a property
   - Ensure booking status is "confirmed"

### Test Steps
1. **Login as Guest** (e.g., mjjj@gmail.com)
   ```
   Email: mjjj@gmail.com
   User Type: guest
   ```

2. **Navigate to Bookings**
   - Go to "My Bookings" page
   - Click on a confirmed booking
   - Click on "Refunds" tab

3. **Request Refund**
   - Click "Request Refund" button
   - Enter refund amount (e.g., full amount or partial)
   - Enter reason: "Unable to travel due to emergency"
   - Click "Submit Request"

### ✅ Expected Results
- [ ] Refund request appears with status "requested"
- [ ] Success toast message appears
- [ ] Refund shows in the list with details
- [ ] Property owner receives email notification

### 🐛 If Errors Occur
Check browser console (F12) and backend logs for errors.

---

## 🧪 Test Scenario 2: Property Owner Views Refund (as Super Admin)

### Test Steps
1. **Login as Super Admin** (admin@vilo.com)

2. **Navigate to Admin Dashboard**
   - Go to `/admin/refunds` or Refund Manager
   - Check if you see the refund request

3. **View Refund Details**
   - Click on the refund request
   - Verify all details are visible:
     - Guest name
     - Booking reference
     - Requested amount
     - Reason
     - Status: "requested"

### ✅ Expected Results
- [ ] Refund appears in admin dashboard
- [ ] All refund details are visible
- [ ] "Approve" and "Reject" buttons are visible
- [ ] No permission errors

### 🐛 If "This action is restricted" error appears
- Clear browser cache
- Logout and login again
- Check backend logs for middleware errors

---

## 🧪 Test Scenario 3: Admin Approves Refund

### Test Steps
1. **As Super Admin**, view the pending refund

2. **Click "Approve" button**

3. **Fill Approval Form**
   - Approved Amount: (leave as requested or adjust)
   - Customer Notes: "Your refund has been approved. Processing will take 5-7 business days."
   - Internal Notes: "Approved per cancellation policy"
   - Notify Guest: ✅ (checked)
   - Click "Save"

### ✅ Expected Results
- [ ] Refund status changes to "approved"
- [ ] Success toast message appears
- [ ] Guest receives email notification
- [ ] Customer notes visible to guest
- [ ] Internal notes NOT visible to guest

---

## 🧪 Test Scenario 4: Admin Processes Refund

### Test Steps
1. **Find the approved refund**

2. **Click "Process Refund" button**

3. **View Payment Method Breakdown**
   - Check if proportional amounts are calculated correctly
   - Example: If booking paid 50% card, 50% PayPal
     - Card refund should be 50% of approved amount
     - PayPal refund should be 50% of approved amount

4. **Process Each Payment Method**
   - For **card/bank_transfer**:
     - Click "Process"
     - System calls Paystack API
   - For **PayPal**:
     - Click "Process"
     - System calls PayPal API
   - For **EFT/cash**:
     - Mark as manual processing required
     - Later: Click "Mark Complete" with reference

### ✅ Expected Results
- [ ] Status changes to "processing"
- [ ] Payment breakdown shows correctly
- [ ] Gateway API calls succeed (check backend logs)
- [ ] Guest receives "processing started" notification
- [ ] Gateway refund IDs are recorded

### 🐛 If Gateway Errors Occur
- Check backend logs for API errors
- Verify Paystack/PayPal credentials in .env
- Check if test mode keys are configured correctly

---

## 🧪 Test Scenario 5: Comment System

### Test Steps

**As Guest:**
1. Navigate to refund details
2. Go to "Comments" tab
3. Add comment: "When will I receive the refund?"
4. Submit

**As Admin:**
1. View same refund
2. Go to "Comments" tab
3. See guest's comment
4. Add reply: "Your refund will be processed within 5-7 business days"
5. Check "Internal" checkbox: NO (visible to guest)
6. Submit

**Add Internal Admin Note:**
1. Add another comment
2. Text: "Guest was understanding, no issues"
3. Check "Internal" checkbox: YES
4. Submit

**Back as Guest:**
1. View comments tab
2. Verify you see:
   - ✅ Your comment
   - ✅ Admin's reply
   - ❌ NOT the internal note

### ✅ Expected Results
- [ ] Guest receives notification when admin replies
- [ ] Admin receives notification when guest comments
- [ ] Internal comments only visible to admins
- [ ] Comment thread displays chronologically

---

## 🧪 Test Scenario 6: Document Upload

### Test Steps

**As Guest:**
1. Navigate to refund details
2. Go to "Documents" tab
3. Click "Upload Document"
4. Select file (PDF or image)
5. Document type: "Receipt"
6. Description: "Cancellation receipt from hotel"
7. Upload

**As Admin:**
1. View same refund
2. Go to "Documents" tab
3. See uploaded document with status "pending"
4. Click "Download" to view document
5. Click "Verify" button

**Back as Guest:**
1. Go to Documents tab
2. Verify document status is now "verified"

### ✅ Expected Results
- [ ] Document uploads successfully
- [ ] Admin receives notification about upload
- [ ] Admin can verify/reject documents
- [ ] Guest receives notification when verified
- [ ] Document status badges update correctly

---

## 🧪 Test Scenario 7: Refund Rejection

### Test Steps

**Create New Refund Request** (as guest)

**As Admin:**
1. View the new refund request
2. Click "Reject" button
3. Fill Rejection Form:
   - Customer Notes: "Refund cannot be approved as booking is within 48 hours of check-in per our cancellation policy."
   - Internal Notes: "Outside policy window"
   - Notify Guest: ✅
4. Click "Save"

**As Guest:**
1. View refund status
2. Read rejection reason

### ✅ Expected Results
- [ ] Refund status changes to "rejected"
- [ ] Guest receives rejection notification
- [ ] Customer notes visible to guest
- [ ] Internal notes NOT visible to guest
- [ ] No further action buttons shown

---

## 🧪 Test Scenario 8: Refund Status History

### Test Steps
1. **View any refund** (that has gone through multiple status changes)
2. Click "History" or "Activity" tab
3. View timeline

### ✅ Expected Results
- [ ] All status changes are logged:
   - null → requested (initial creation)
   - requested → approved (admin approval)
   - approved → processing (processing started)
   - processing → completed (refund complete)
- [ ] Each entry shows:
   - From status
   - To status
   - Changed by (user who made change)
   - Timestamp
   - Reason (if provided)

---

## 🧪 Test Scenario 9: Multi-Payment Method Refund

### Prerequisites
- Booking paid with multiple methods (e.g., 50% card, 50% PayPal)

### Test Steps
1. **Create refund request** for partial amount (e.g., 80% of total)
2. **Admin approves** the 80%
3. **Admin processes** refund
4. **View payment breakdown**:
   - Check if each method gets proportional refund
   - Example:
     - Original: R1000 card, R1000 PayPal (R2000 total)
     - Refund 80%: R800 to card, R800 to PayPal

### ✅ Expected Results
- [ ] Proportional calculation is correct
- [ ] Each payment method shows separate status
- [ ] Card/PayPal process automatically
- [ ] EFT/cash marked for manual processing
- [ ] All methods eventually show "completed"

---

## 🧪 Test Scenario 10: Notification System

### Test Steps
1. **Check email inbox** (for both guest and admin test accounts)
2. **Verify emails received** for:
   - [ ] Refund requested (to admin)
   - [ ] Refund approved (to guest)
   - [ ] Refund processing started (to guest)
   - [ ] Comment from guest (to admin)
   - [ ] Comment from admin (to guest)
   - [ ] Document uploaded (to admin)
   - [ ] Document verified (to guest)
   - [ ] Refund completed (to guest)

### ✅ Expected Results
- [ ] All notification emails arrive
- [ ] Email templates render correctly
- [ ] Variables replaced with actual data
- [ ] Links work (dashboard/portal URLs)
- [ ] No broken images or formatting

---

## 🧪 Test Scenario 11: Permission Checks

### Test Steps

**As Guest User:**
1. Try to access `/admin/refunds`
2. Try to approve a refund (shouldn't have button)

**As Admin User:**
1. Try to access `/admin/refunds` - should work
2. Try to approve refund for property you DON'T own - RLS should block it

### ✅ Expected Results
- [ ] Guest cannot access admin routes (403 error)
- [ ] Guest cannot see admin action buttons
- [ ] RLS blocks cross-property access
- [ ] Proper error messages shown

---

## 🧪 Test Scenario 12: Edge Cases

### 12.1 Withdraw Refund Request
**As Guest:**
1. Create refund request
2. Click "Withdraw" button
3. Confirm withdrawal

**Expected:**
- [ ] Status changes to "cancelled"
- [ ] Cannot be processed further
- [ ] Admin notified

### 12.2 Duplicate Refund Request
**As Guest:**
1. Create refund request
2. Try to create another for same booking

**Expected:**
- [ ] Error: "Booking already has an active refund"
- [ ] Cannot create duplicate

### 12.3 Invalid Refund Amount
**As Guest:**
1. Try to request refund > booking total

**Expected:**
- [ ] Validation error
- [ ] Cannot submit

### 12.4 Failed Gateway Processing
**Simulate gateway failure** (if possible in test mode)

**Expected:**
- [ ] Status changes to "failed"
- [ ] Error message logged
- [ ] Admin can retry
- [ ] Guest notified of failure

---

## 📊 Overall System Health Checks

### Database
- [ ] All refund tables exist (refund_requests, refund_comments, refund_status_history, refund_documents)
- [ ] RLS policies active
- [ ] Triggers working (status history auto-logs)
- [ ] No orphaned records

### Backend
- [ ] Server running without errors
- [ ] API endpoints respond correctly
- [ ] Logs show proper request/response flow
- [ ] No memory leaks or performance issues

### Frontend
- [ ] UI renders correctly
- [ ] No console errors
- [ ] Loading states work
- [ ] Toast notifications appear
- [ ] Dark mode works (if applicable)

### Notifications
- [ ] All 12 templates exist in database
- [ ] Emails being sent (check logs)
- [ ] SMTP configured correctly
- [ ] No bounced emails

### Payment Gateways
- [ ] Paystack integration working (test mode)
- [ ] PayPal integration working (sandbox)
- [ ] Webhooks registered
- [ ] Webhook signatures validated

---

## 🐛 Common Issues & Solutions

### Issue: "This action is restricted to: super_admin, property_manager, saas_team_member"
**Solution:**
- Logout and login again
- Clear browser cache
- Check user type in database
- Verify middleware fix applied

### Issue: Refund request creation fails
**Solution:**
- Check booking eligibility (status must be "confirmed")
- Verify booking belongs to logged-in user
- Check for existing refund on booking

### Issue: Gateway API errors
**Solution:**
- Verify API keys in backend/.env
- Check if test/sandbox mode is enabled
- Review gateway API logs
- Verify webhook endpoints registered

### Issue: Notifications not sending
**Solution:**
- Check notification_templates table
- Verify SMTP configuration
- Check user email preferences
- Review notification service logs

### Issue: Documents not uploading
**Solution:**
- Verify Supabase storage bucket exists
- Check RLS policies on storage
- Verify file size < 10MB
- Check allowed MIME types

---

## ✅ Test Results Summary

**Date Tested**: __________
**Tested By**: __________
**Environment**: Development / Staging / Production

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| 1. Guest Creates Refund | ⬜ Pass / ❌ Fail | |
| 2. Admin Views Refund | ⬜ Pass / ❌ Fail | |
| 3. Admin Approves Refund | ⬜ Pass / ❌ Fail | |
| 4. Admin Processes Refund | ⬜ Pass / ❌ Fail | |
| 5. Comment System | ⬜ Pass / ❌ Fail | |
| 6. Document Upload | ⬜ Pass / ❌ Fail | |
| 7. Refund Rejection | ⬜ Pass / ❌ Fail | |
| 8. Status History | ⬜ Pass / ❌ Fail | |
| 9. Multi-Payment Refund | ⬜ Pass / ❌ Fail | |
| 10. Notifications | ⬜ Pass / ❌ Fail | |
| 11. Permission Checks | ⬜ Pass / ❌ Fail | |
| 12. Edge Cases | ⬜ Pass / ❌ Fail | |

**Overall Result**: ⬜ PASS / ❌ FAIL
**Ready for Production**: ⬜ YES / ❌ NO

---

## 📝 Next Steps After Testing

If all tests pass:
- [ ] Document any issues found
- [ ] Create tickets for bugs
- [ ] Plan production deployment
- [ ] Prepare rollback plan
- [ ] Schedule deployment window
- [ ] Notify stakeholders

If tests fail:
- [ ] Document failures
- [ ] Fix critical issues
- [ ] Re-run failed tests
- [ ] Update documentation
- [ ] Schedule re-testing

---

**END OF TESTING CHECKLIST**
