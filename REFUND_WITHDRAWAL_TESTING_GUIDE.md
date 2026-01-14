# Refund Withdrawal Feature - Testing Guide

## ✅ Implementation Status: COMPLETE

All code has been implemented, database migration applied, and components verified.

---

## 🎯 Features Implemented

### 1. Refund Withdrawal
- Users can withdraw their own refund requests
- Allowed for statuses: `requested`, `under_review`, `approved`
- Not allowed for: `processing`, `completed`, `failed`, `rejected`, `withdrawn`
- API endpoint: `POST /api/refunds/:id/withdraw`

### 2. Booking Lock Mechanism
- Bookings become read-only when active refunds exist
- Lock triggers for statuses: `requested`, `under_review`, `approved`, `processing`
- Lock releases when ALL refunds are in terminal states: `completed`, `failed`, `rejected`, `withdrawn`
- Visual lock banner displays active refund information
- All edit/modify actions are disabled

### 3. Refund Status Pill
- Clickable pill in booking header (next to payment status)
- **Orange "Refund Pending"** - when active refunds exist
- **Green "Refunded"** - when fully refunded
- **Yellow "Partially Refunded"** - when partially refunded
- Clicking navigates to Refunds tab

### 4. Comprehensive History Timeline
- New "History" tab in booking detail page
- Shows all booking events:
  - Status changes
  - Payments
  - Refunds (requested, approved, withdrawn, completed)
  - Check-in/Check-out
  - Cancellations
  - Notes
  - Invoices
- Color-coded by event type
- Relative timestamps (e.g., "2 hours ago")
- Expandable metadata details

### 5. Security Enhancements
- Fixed RLS policies (users can only see their own refunds)
- Property owners can see refunds for their properties
- Admins can see all refunds

---

## 🧪 Manual Testing Instructions

### Prerequisites
1. Ensure dev servers are running:
   ```bash
   npm run dev
   ```
2. Have a user account with at least one paid booking
3. Open browser to http://localhost:5173

---

### Test Scenario 1: Basic Withdrawal Flow

#### Step 1: Create Refund Request
1. Login to the application
2. Navigate to **Dashboard** → **Bookings**
3. Select a booking with `payment_status = 'paid'` or `'partial'`
4. Click **Refunds** tab
5. Click **Request Refund** button
6. Fill in the form:
   - Reason: "Testing withdrawal feature"
   - Amount: (any amount ≤ paid amount)
7. Click **Submit**

**Expected Result:**
- Success message appears
- Refund request is created with status `requested`
- Refund appears in the list

#### Step 2: Verify Booking Lock
1. Look at the booking header (top section)
2. Check for **Orange "Refund Pending" pill** next to payment status
3. Look for **Lock Banner** above the tabs:
   - Should say "Booking Locked - Refund In Progress"
   - Should show count of active refunds
   - Should have "View Refund Requests →" link

4. Try to interact with disabled actions:
   - **Edit Booking** button should be disabled with lock icon
   - **Cancel Booking** button should be disabled
   - **Check-in** button should be disabled (if applicable)
   - Hover over disabled buttons to see tooltip: "Booking is locked due to active refund request"

**Expected Result:**
- Orange pill visible and clickable
- Lock banner displayed
- All modification buttons are disabled
- Tooltips explain why buttons are disabled

#### Step 3: Check History Tab
1. Click **History** tab
2. Verify you see a timeline of events
3. Look for the most recent event: "Refund Requested"
   - Should have orange color
   - Should show your name as actor
   - Should show timestamp
   - Should have expandable details

**Expected Result:**
- History tab loads without errors
- Refund requested event is visible
- Timeline is properly formatted

#### Step 4: Withdraw Refund
1. Go back to **Refunds** tab
2. Find the refund request you created (should be at top)
3. Verify the **Withdraw Request** button is visible (red outline button)
4. Click **Withdraw Request**
5. Wait for success message

**Expected Result:**
- Button shows loading spinner while processing
- Success message: "Refund request withdrawn successfully"
- Refund status changes to `withdrawn`
- Refund badge shows gray "Withdrawn"

#### Step 5: Verify Unlock
1. Check booking header:
   - **Orange "Refund Pending" pill should be GONE**
   - **Lock banner should be GONE**

2. Check action buttons:
   - **Edit Booking** button should be ENABLED
   - **Cancel Booking** button should be ENABLED
   - **Check-in** button should be ENABLED (if applicable)

**Expected Result:**
- No refund pill visible
- No lock banner
- All buttons are enabled and functional

#### Step 6: Verify History Updated
1. Go to **History** tab
2. Look for new event at top: "Refund Withdrawn"
   - Should show your name
   - Should show timestamp
   - Should be color-coded differently

**Expected Result:**
- Withdrawal event is recorded
- Timeline shows complete refund lifecycle

---

### Test Scenario 2: Multiple Refunds (Partial Lock)

#### Step 1: Create Two Refund Requests
1. Create refund request #1 (amount: $50)
2. Verify lock banner appears (1 active refund)
3. Create refund request #2 (amount: $30)
4. Verify lock banner updates (2 active refunds)

**Expected Result:**
- Lock banner shows "2 active refund requests"
- Booking remains locked

#### Step 2: Withdraw One Refund
1. Go to **Refunds** tab
2. Withdraw refund #1
3. Check lock banner

**Expected Result:**
- Banner still visible
- Now shows "1 active refund request"
- Booking still locked

#### Step 3: Withdraw Second Refund
1. Withdraw refund #2
2. Check for unlock

**Expected Result:**
- Lock banner disappears
- Refund pill disappears
- Booking is now editable

---

### Test Scenario 3: Admin Approval Workflow

#### Step 1: Guest Creates Refund
1. Login as **Guest** user
2. Create refund request on their booking
3. Verify lock appears

#### Step 2: Admin Approves
1. Login as **Admin**
2. Go to **Admin** → **Refunds**
3. Find the refund request
4. Change status to `approved`

**Expected Result:**
- Booking remains locked (approved is still active)
- Guest can still withdraw

#### Step 3: Guest Withdraws After Approval
1. Switch back to **Guest** account
2. Go to booking → **Refunds** tab
3. Verify **Withdraw Request** button still visible
4. Click withdraw

**Expected Result:**
- Withdrawal succeeds even after admin approval
- Booking unlocks
- Admin is notified (check notification templates)

---

### Test Scenario 4: Withdrawal Restrictions

#### Step 1: Try to Withdraw Processing Refund
1. Create refund request
2. As admin, change status to `processing`
3. As guest, try to withdraw

**Expected Result:**
- **Withdraw Request** button is HIDDEN
- Cannot withdraw refunds in processing state

#### Step 2: Try to Withdraw Completed Refund
1. Change refund status to `completed`
2. Check if withdraw button appears

**Expected Result:**
- **Withdraw Request** button is HIDDEN
- Cannot withdraw completed refunds

---

## 🔍 API Testing (Optional)

If you want to test the API directly:

### 1. Get Auth Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### 2. Create Refund
```bash
curl -X POST http://localhost:3001/api/bookings/{bookingId}/refunds \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test","requested_amount":50}'
```

### 3. Withdraw Refund
```bash
curl -X POST http://localhost:3001/api/refunds/{refundId}/withdraw \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### 4. Get Booking History
```bash
curl http://localhost:3001/api/bookings/{bookingId}/history \
  -H "Authorization: Bearer {token}"
```

### 5. Check has_active_refunds
```sql
SELECT has_active_refunds('{booking-id}'::uuid);
```

---

## 📊 Verification Checklist

Use this checklist to ensure everything is working:

### Database
- [x] Migration 046 applied successfully
- [x] `withdrawn` status exists in enum
- [x] `has_active_refunds()` function created
- [x] RLS policies updated
- [x] Notification template added

### Backend API
- [ ] POST /api/refunds/:id/withdraw responds with 200
- [ ] GET /api/bookings/:id/history returns timeline
- [ ] Booking lock validation prevents updates
- [ ] Only refund owner can withdraw
- [ ] Cannot withdraw processing/completed refunds

### Frontend Components
- [x] RefundStatusPill component exists
- [x] BookingLockBanner component exists
- [x] BookingTimeline component exists
- [x] Components imported in BookingDetailPage
- [x] withdrawRefund() in refund.service
- [x] getBookingHistory() in booking.service

### UI Functionality
- [ ] Refund pill appears when active refunds exist
- [ ] Pill click navigates to Refunds tab
- [ ] Lock banner displays with correct count
- [ ] Action buttons disabled when locked
- [ ] Withdraw button visible for eligible refunds
- [ ] Withdrawal succeeds and updates UI
- [ ] History tab shows all events
- [ ] Timeline is properly formatted
- [ ] Booking unlocks after withdrawal

---

## 🐛 Known Issues / Edge Cases

### Issue: Lock Not Working
**Symptom:** Can still edit booking despite active refund
**Check:** Verify `validateBookingRefundLock()` is called in booking service update methods
**Solution:** Ensure all update endpoints call the validation

### Issue: Withdraw Button Not Appearing
**Check:**
1. Verify refund status is `requested`, `under_review`, or `approved`
2. Verify logged-in user matches `requested_by` field
3. Check browser console for errors

### Issue: History Tab Empty
**Check:**
1. Verify API endpoint returns 200
2. Check browser network tab for errors
3. Verify booking has events (payments, status changes)

---

## 📝 Success Criteria

Implementation is successful if:

✅ Users can withdraw their own refund requests
✅ Bookings lock when active refunds exist
✅ Bookings unlock when all refunds are terminal
✅ Visual indicators (pill, banner) work correctly
✅ History timeline shows all events
✅ No TypeScript errors
✅ No runtime errors in browser console
✅ Audit logs capture withdrawal events

---

## 🎉 Next Steps

After testing is complete:

1. **Deploy to staging** (if you have one)
2. **Update user documentation** to explain withdrawal feature
3. **Train support team** on new workflow
4. **Monitor** for any issues in production
5. **Consider** adding email notification when guest withdraws refund

---

## 📞 Support

If you encounter any issues during testing:
1. Check browser console for errors
2. Check backend server logs
3. Verify database migration was successful
4. Review this guide for expected behavior

**All implementation is complete and ready for manual UI testing!**
