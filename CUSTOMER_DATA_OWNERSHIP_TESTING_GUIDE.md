# Customer Data Ownership & Synchronization - Testing Guide

## ✅ Implementation Complete!

Your customer data ownership and synchronization system has been successfully implemented!

---

## 🎯 What Was Implemented

### Phase 1: Customer Validators ✅
**File:** `backend/src/validators/customer.validators.ts` (NEW)

- ✅ Property owner schema - Restricts to property-owned fields only
- ✅ Guest schema - Allows contact fields + property fields
- ✅ Validation middleware exports

### Phase 2: Access Control in Controller ✅
**File:** `backend/src/controllers/customer.controller.ts` (MODIFIED)

- ✅ Checks if user is guest (owns customer record)
- ✅ Allows guests to update contact fields
- ✅ Rejects property owners trying to update contact fields (403 error)
- ✅ Allows property owners to update property-owned fields
- ✅ Comprehensive logging for debugging

### Phase 3: User-to-Customer Sync Service ✅
**File:** `backend/src/services/customer-sync.service.ts` (NEW)

- ✅ `syncGuestContactToCustomers()` - Syncs name, phone, marketing_consent
- ✅ `syncGuestEmailToCustomers()` - Handles email changes with unique constraint
- ✅ Comprehensive error handling and logging

### Phase 4: User Service Integration ✅
**File:** `backend/src/services/users.service.ts` (MODIFIED)

- ✅ Detects contact field changes in user profile updates
- ✅ Automatically triggers sync to all customer instances
- ✅ Handles email changes separately
- ✅ Graceful error handling (doesn't block user profile updates)

### Phase 5: Frontend Visual Badges ✅
**File:** `frontend/src/pages/customers/CustomerDetailPage.tsx` (MODIFIED)

- ✅ "Guest-controlled" badges on Email, Phone, Full Name fields
- ✅ Explanatory text: "Contact details can only be updated by the guest"
- ✅ Visual clarity about field ownership

---

## 📊 Data Ownership Matrix

| Field | Guest Can Update | Property Owner Can Update | Auto-Synced from User Profile |
|-------|-----------------|---------------------------|-------------------------------|
| **email** | ✅ (via profile) | ❌ (403 error) | ✅ Yes |
| **full_name** | ✅ (via profile) | ❌ (403 error) | ✅ Yes |
| **phone** | ✅ (via profile) | ❌ (403 error) | ✅ Yes |
| **marketing_consent** | ✅ (via profile) | ❌ (403 error) | ✅ Yes |
| **notes** | ✅ (own record) | ✅ (their instance) | ❌ No |
| **internal_notes** | ❌ (property staff only) | ✅ (their instance) | ❌ No |
| **tags** | ✅ (own record) | ✅ (their instance) | ❌ No |
| **preferred_room_types** | ✅ (own record) | ✅ (their instance) | ❌ No |
| **special_requirements** | ✅ (own record) | ✅ (their instance) | ❌ No |
| **status** | ❌ (auto or manual) | ✅ (if manual mode) | ❌ No |

---

## 🧪 Testing Checklist

### Test 1: Property Owner Cannot Update Contact Fields ❌→403

**Goal:** Verify property owners are blocked from updating guest contact details.

**Steps:**
1. Login as a property owner (not super admin)
2. Navigate to Customers page
3. Open any customer detail page
4. Open browser DevTools → Network tab
5. Try to update customer via API directly (or wait for UI update feature):
   ```bash
   # Using curl or Postman
   PATCH /api/customers/{customer-id}
   Headers: Authorization: Bearer {property-owner-token}
   Body: {
     "full_name": "New Name",
     "phone": "123456789"
   }
   ```

**Expected Result:**
- ❌ Request rejected with 403 Forbidden
- Error message: "Contact details (name, phone, marketing consent) can only be updated by the guest. You can only update notes, tags, and preferences for this customer."

**Backend Logs:**
```
[CUSTOMER_CONTROLLER] Property owner attempted to update contact fields
[CUSTOMER_CONTROLLER] Attempted fields: { full_name: "New Name", phone: "123456789" }
[CUSTOMER_CONTROLLER] Update failed: AppError: FORBIDDEN
```

---

### Test 2: Property Owner Can Update Property Fields ✅

**Goal:** Verify property owners can update notes, tags, and preferences.

**Steps:**
1. Login as a property owner
2. Navigate to customer detail page
3. Go to "Notes & Tags" tab
4. Click "Edit"
5. Update notes: "VIP guest - prefers quiet rooms"
6. Click "Save Changes"

**Expected Result:**
- ✅ Update successful
- Success message: "Customer updated successfully"
- Notes saved and visible

**Backend Logs:**
```
[CUSTOMER_CONTROLLER] Property owner update - restricted to property fields
[CUSTOMER_CONTROLLER] Update input: { "notes": "VIP guest - prefers quiet rooms" }
[CUSTOMER_CONTROLLER] Update successful: {customer-id}
```

---

### Test 3: Guest Name Change Syncs to All Customer Instances ✅

**Goal:** Verify guest profile changes propagate to all customer records.

**Setup:**
1. Create a test guest with customer instances at 2-3 different properties:
   - Make bookings at Property A, Property B, Property C using `testguest@example.com`
   - Verify 3 customer records exist (one per property)

**Test Steps:**
1. Login as the guest (`testguest@example.com`)
2. Go to Profile/Settings page
3. Change full_name from "Test Guest" to "Updated Guest Name"
4. Save profile

**Verify Sync with SQL:**
```sql
SELECT
  c.id,
  c.property_id,
  p.name as property_name,
  c.full_name,
  c.email
FROM customers c
JOIN properties p ON p.id = c.property_id
WHERE c.email = 'testguest@example.com'
ORDER BY p.name;
```

**Expected Result:**
```
id     | property_id | property_name | full_name           | email
-------|-------------|---------------|---------------------|---------------------
cust-1 | prop-a      | Property A    | Updated Guest Name  | testguest@example.com
cust-2 | prop-b      | Property B    | Updated Guest Name  | testguest@example.com
cust-3 | prop-c      | Property C    | Updated Guest Name  | testguest@example.com
```

**✅ All 3 customer instances updated!**

**Backend Logs:**
```
[USER_SERVICE] Update user profile
[USER_SERVICE] full_name changed: Test Guest -> Updated Guest Name
[USER_SERVICE] Syncing contact updates to customer instances...
[CUSTOMER_SYNC] Syncing guest contact to all customer instances
[CUSTOMER_SYNC] Customer instances to update: 3
[CUSTOMER_SYNC] Successfully synced to 3 customer instances
[USER_SERVICE] Contact sync completed successfully
```

---

### Test 4: Guest Phone Change Syncs to All Instances ✅

**Goal:** Verify phone number changes sync across all properties.

**Steps:**
1. Login as guest
2. Update phone from "+27123456789" to "+27987654321"
3. Save profile

**Verify with SQL:**
```sql
SELECT
  property_id,
  phone
FROM customers
WHERE email = 'testguest@example.com';
```

**Expected Result:**
```
property_id | phone
------------|---------------
prop-a      | +27987654321
prop-b      | +27987654321
prop-c      | +27987654321
```

**✅ All instances have the new phone number!**

---

### Test 5: Guest Email Change Syncs to All Instances ✅

**Goal:** Verify email changes propagate while maintaining unique constraint.

**Setup:**
- Guest has customer instances at Property A and Property B
- Email: `oldguest@example.com`

**Steps:**
1. Login as guest
2. Change email from `oldguest@example.com` to `newguest@example.com`
3. Save profile

**Verify with SQL:**
```sql
-- Check new email exists
SELECT
  property_id,
  email
FROM customers
WHERE user_id = '{guest-user-id}';
```

**Expected Result:**
```
property_id | email
------------|-------------------
prop-a      | newguest@example.com
prop-b      | newguest@example.com
```

```sql
-- Verify old email is gone
SELECT COUNT(*) FROM customers WHERE email = 'oldguest@example.com';
-- Expected: 0
```

**Backend Logs:**
```
[USER_SERVICE] Email changed - syncing to customer instances...
[CUSTOMER_SYNC] Syncing email change to all customer instances
[CUSTOMER_SYNC] Old email: oldguest@example.com
[CUSTOMER_SYNC] New email: newguest@example.com
[CUSTOMER_SYNC] Found 2 customer instances to update
[CUSTOMER_SYNC] Updating customer: cust-1 property: prop-a
[CUSTOMER_SYNC] Successfully updated customer: cust-1
[CUSTOMER_SYNC] Updating customer: cust-2 property: prop-b
[CUSTOMER_SYNC] Successfully updated customer: cust-2
[CUSTOMER_SYNC] Email sync complete
[CUSTOMER_SYNC] Successes: 2 / 2
[USER_SERVICE] Email sync completed successfully
```

---

### Test 6: Property Owner Edits Are Isolated ✅

**Goal:** Verify property-owned fields are NOT synced between properties.

**Setup:**
- Guest has customer instances at Property A and Property B

**Steps:**
1. Login as Property Owner A
2. Go to customer detail for the guest
3. Edit notes: "This guest prefers sea-facing rooms"
4. Add tags: ["VIP", "repeat-guest"]
5. Save changes

**Verify with SQL:**
```sql
SELECT
  p.name as property_name,
  c.notes,
  c.tags
FROM customers c
JOIN properties p ON p.id = c.property_id
WHERE c.email = 'testguest@example.com'
ORDER BY p.name;
```

**Expected Result:**
```
property_name | notes                                  | tags
--------------|----------------------------------------|-------------------
Property A    | This guest prefers sea-facing rooms    | ["VIP", "repeat-guest"]
Property B    | [original notes or null]               | [original tags or empty array]
```

**✅ Property A changes did NOT affect Property B!**

---

### Test 7: Frontend Visual Badges Display ✅

**Goal:** Verify UI shows guest-controlled badges.

**Steps:**
1. Login as property owner
2. Navigate to any customer detail page
3. View the "Overview" tab → "Contact Information" card

**Expected UI:**
- Email field shows "Guest-controlled" badge (blue)
- Phone field shows "Guest-controlled" badge (blue)
- Full Name field shows "Guest-controlled" badge (blue)
- Property field has NO badge (editable by property owner via property settings)
- Footer text: "Contact details can only be updated by the guest. You can edit notes, tags, and preferences below."

**Visual Check:**
- ✅ Badges are visible and styled correctly
- ✅ Text is clear and informative
- ✅ Dark mode support working

---

## 🐛 Troubleshooting

### Issue: Contact fields not syncing after profile update

**Debug Steps:**
1. Check backend logs for sync service execution
2. Verify user service is calling sync functions
3. Check for errors in customer-sync.service.ts

**Common Causes:**
- User profile update doesn't include contact fields
- Sync service failing silently (check logs)
- User ID mismatch between users and customers tables

**SQL Debug:**
```sql
-- Check if customer records have user_id set
SELECT id, email, user_id FROM customers WHERE email = 'test@example.com';

-- If user_id is NULL, customer sync won't work
-- Fix: Update customer records with correct user_id
UPDATE customers SET user_id = 'correct-user-id' WHERE email = 'test@example.com';
```

---

### Issue: Property owner getting 403 when updating ANY field

**Possible Cause:**
- Property owner is trying to update contact fields inadvertently
- Request body includes `full_name`, `phone`, or `marketing_consent` even if unchanged

**Fix:**
- Ensure frontend only sends changed fields
- Check request body in Network tab
- Verify `isUpdatingContactFields` logic in controller

---

### Issue: Email sync failing with unique constraint error

**Possible Cause:**
- New email already exists for the same property
- Sequential update logic not working

**Debug SQL:**
```sql
-- Check for duplicate email/property combinations
SELECT
  LOWER(email) as email,
  property_id,
  COUNT(*) as count
FROM customers
GROUP BY LOWER(email), property_id
HAVING COUNT(*) > 1;
```

**Fix:**
- Ensure email sync uses sequential updates (not batch)
- Check for race conditions
- Verify unique constraint: `idx_customers_new_email_property_unique`

---

## ✅ Success Criteria Checklist

Mark each test as complete:

- [ ] **Test 1:** Property owner blocked from updating contact fields (403)
- [ ] **Test 2:** Property owner can update notes/tags successfully
- [ ] **Test 3:** Guest name change syncs to all customer instances
- [ ] **Test 4:** Guest phone change syncs to all instances
- [ ] **Test 5:** Guest email change syncs to all instances
- [ ] **Test 6:** Property owner edits are isolated per property
- [ ] **Test 7:** Frontend badges display correctly

**🎉 All tests passed? Your customer data ownership system is working perfectly!**

---

## 📝 Quick Reference

### Guest-Owned Fields (Auto-Sync)
- ✅ `email`
- ✅ `full_name`
- ✅ `phone`
- ✅ `marketing_consent`

### Property-Owned Fields (Isolated)
- ✅ `notes`
- ✅ `tags`
- ✅ `internal_notes`
- ✅ `preferred_room_types`
- ✅ `special_requirements`
- ✅ `status` (if manual mode)
- ✅ `status_mode`
- ✅ `last_contact_date`

---

## 🚀 Next Steps (Optional Enhancements)

1. **Guest Profile Page**
   - Allow guests to edit their own contact details in profile
   - Show sync confirmation: "Changes synced to all your bookings"

2. **Admin Override**
   - Super admins can update contact fields (with warning)
   - Audit log for admin changes

3. **Batch Sync Endpoint**
   - Manual sync trigger: `POST /api/customers/:id/sync-from-user`
   - Useful for data migrations or fixing inconsistencies

4. **Sync Status Indicator**
   - Show last sync time in customer detail
   - Visual indicator if sync is out of date

---

## 📞 Support

If you encounter issues during testing:
1. Check backend logs for detailed error messages
2. Verify database schema (property_id, user_id columns exist)
3. Ensure migrations are applied
4. Check that backend server was restarted after code changes

**System Status:** READY FOR TESTING ✅

Your customer data ownership and synchronization system is fully implemented and ready to test!
