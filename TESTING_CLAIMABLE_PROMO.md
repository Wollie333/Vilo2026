# Testing Guide: Claimable Promo Feature

## Overview
This guide provides step-by-step instructions to test the claimable promo feature implementation. This feature allows property owners to capture guest details as leads by requiring guests to provide their information before receiving promo codes.

---

## Prerequisites
- Backend server running (`npm run dev` in `/backend`)
- Frontend server running (`npm run dev` in `/frontend`)
- Property owner account with at least one active property
- Access to Supabase admin panel (for verification)

---

## Test Case 1: Create a Claimable Promotion

### Steps:
1. **Log in as property owner**
   - Navigate to login page
   - Enter property owner credentials
   - Verify successful login

2. **Navigate to Promotion Creation**
   - Go to property management
   - Select a property
   - Navigate to promotions section
   - Click "Create Promotion" or similar

3. **Create Claimable Promotion**
   - Fill in promotion details:
     - Name: "Summer Special 2026"
     - Code: "SUMMER2026"
     - Description: "Exclusive summer discount"
     - Discount Type: Percentage
     - Discount Value: 20
     - Valid dates: Set appropriate range
   - **Toggle "Make this a claimable promo" checkbox** ✅
   - Save promotion

### Expected Results:
- ✅ "Make this a claimable promo" checkbox is visible in form
- ✅ Helper text explains what claimable means
- ✅ Promotion saves successfully with `is_claimable: true`

### Verification:
- Check Supabase `room_promotions` table
- Find the created promotion
- Verify `is_claimable` column = `true`

---

## Test Case 2: View Claimable Promo on Public Page

### Steps:
1. **Navigate to public property page**
   - Open browser in incognito/private mode (not logged in)
   - Go to property detail page: `/directory/properties/{property-slug}`

2. **View Promotions Tab**
   - Scroll to promotions section
   - Locate the claimable promotion created in Test Case 1

### Expected Results:
- ✅ Promo code is **HIDDEN** (not visible)
- ✅ "Claim This Promo" button appears instead
- ✅ Helper text: "Provide your details to receive this exclusive offer"
- ✅ Non-claimable promos still show code directly

### Screenshot Locations:
- Promotions tab showing hidden code
- "Claim This Promo" button

---

## Test Case 3: Claim a Promotion (New Guest)

### Steps:
1. **Click "Claim This Promo" button**
   - Modal should open with form

2. **Fill in claim form**
   - Name: "Test Guest"
   - Email: "testguest@example.com" (use unique email)
   - Phone: "+1234567890"

3. **Submit claim**
   - Click "Claim Promo" button
   - Wait for processing

### Expected Results:
- ✅ Modal opens with form
- ✅ All fields are required (validation works)
- ✅ Form shows promo details (name, description, discount)
- ✅ Success message appears: "Promo claimed successfully. Please check your email to verify your account."
- ✅ Modal closes

### Backend Verification (Supabase):

**Check `auth.users` table:**
- ✅ New user created with email "testguest@example.com"
- ✅ `email_confirmed_at` is NULL (requires verification)
- ✅ `user_metadata` contains `full_name: "Test Guest"`

**Check `users` table:**
- ✅ Profile created for guest user
- ✅ `role` = 'guest'
- ✅ `email` = "testguest@example.com"
- ✅ `full_name` = "Test Guest"
- ✅ `phone` = "+1234567890"

**Check `customers` table:**
- ✅ Customer record created
- ✅ `user_id` matches guest user ID
- ✅ `source` = 'promo_claim'

**Check `chat_conversations` table:**
- ✅ New conversation created
- ✅ `type` = 'guest_inquiry'
- ✅ `title` contains "Promo Claim"
- ✅ `metadata` contains:
  ```json
  {
    "type": "promo_claim",
    "promotion_id": "<promo-id>",
    "is_new_lead": true
  }
  ```

**Check `chat_participants` table:**
- ✅ Two participants: guest and property owner
- ✅ Guest has `role` = 'guest' or 'member'

**Check `chat_messages` table:**
- ✅ Initial message exists
- ✅ `sender_id` = guest user ID
- ✅ Message content: "I would like to claim the promo: Summer Special 2026 - 20% OFF..."
- ✅ Promo code is NOT visible in message

### Console Verification:
Check backend console for log messages:
```
🎟️ [PromoClaimController] Received claim request
🎟️ [PromoClaimService] Processing claim for promotion
✅ [PromoClaimService] Promotion validated
✅ [PromoClaimService] Guest account created
✅ [PromoClaimService] User profile created
✅ [PromoClaimService] Customer record created
✅ [PromoClaimService] Property owner found
💬 [PromoClaimService] Creating chat conversation
✅ [PromoClaimService] Chat conversation created
📧 [PromoClaimService] Email verification link generated
🎉 [PromoClaimService] Promo claim completed successfully
```

---

## Test Case 4: Claim a Promotion (Existing Guest)

### Steps:
1. **Repeat Test Case 3 with same email**
   - Use email: "testguest@example.com" (from Test Case 3)
   - Different promotion or same one

### Expected Results:
- ✅ No duplicate account created
- ✅ New conversation created with existing guest
- ✅ Backend logs show: "Using existing user"

### Verification:
- Check `auth.users` - only ONE user with that email
- Check `chat_conversations` - TWO conversations for that guest

---

## Test Case 5: Property Owner Receives Lead

### Steps:
1. **Log in as property owner** (the one who owns the property)
   - Navigate to Chat section
   - Go to "Guest" tab

2. **Locate new lead**
   - Find conversation labeled with promotion name

### Expected Results:
- ✅ Conversation appears in Guest tab
- ✅ **"New Lead" badge** visible (blue)
- ✅ **"Promo Claim" badge** visible (green)
- ✅ Initial message from guest is visible
- ✅ Message contains promo details but NOT the promo code

### Screenshot Locations:
- Chat list showing badges
- Conversation view with initial message

---

## Test Case 6: Send Promo Code to Guest

### Steps:
1. **Open promo claim conversation**
   - Click on the conversation from Test Case 5

2. **Check for "Send Promo Code" button**
   - Look in chat header (next to participants button)
   - Button should be visible and labeled "Send Promo Code" with tag icon

3. **Click "Send Promo Code" button**
   - Button should trigger sending template message

### Expected Results:
- ✅ "Send Promo Code" button visible in header (primary blue button)
- ✅ Button only appears for promo claim conversations
- ✅ Clicking button sends template message (if handler implemented)

**Template Message Should Include:**
- Promo code (e.g., "SUMMER2026")
- Instructions on how to use the code
- Discount details
- Validity dates
- Minimum nights (if applicable)

### Note:
The `onSendPromoCode` handler needs to be implemented in the parent component (ChatPage). The button UI is in place but the actual message sending logic needs to be wired up.

**Handler Implementation Needed:**
```typescript
const handleSendPromoCode = async () => {
  if (!conversation.metadata?.promotion_id) return;

  // 1. Fetch promotion details
  const promo = await propertyService.getPromotion(
    conversation.metadata.promotion_id
  );

  // 2. Create template message
  const message = `Thank you for your interest! Here's your exclusive promo code:

**Promo Code:** ${promo.code}

**How to use:**
1. Visit our booking page
2. Select your dates and room
3. Enter the promo code at checkout
4. Enjoy your discount!

**Discount:** ${
    promo.discount_type === 'percentage'
      ? `${promo.discount_value}% OFF`
      : promo.discount_type === 'fixed_amount'
      ? `$${promo.discount_value} OFF`
      : `${promo.discount_value} Free Nights`
  }
${promo.valid_until ? `**Valid until:** ${new Date(promo.valid_until).toLocaleDateString()}` : ''}
${promo.min_nights ? `**Minimum stay:** ${promo.min_nights} nights` : ''}

Looking forward to hosting you!`;

  // 3. Send message
  await chatService.sendMessage(conversation.id, message);
};
```

---

## Test Case 7: Email Verification Flow

### Steps:
1. **Check guest email**
   - Access email for "testguest@example.com"
   - Look for verification email from Supabase

2. **Click verification link**
   - Open verification email
   - Click the verification link

3. **Set password**
   - Follow prompts to set password
   - Complete account setup

4. **Log in as guest**
   - Use verified email and new password
   - Access guest portal

5. **View chat**
   - Navigate to chat section
   - Find conversation with property owner

### Expected Results:
- ✅ Verification email received
- ✅ Verification link works
- ✅ Password can be set
- ✅ Guest can log in
- ✅ Guest can access chat conversation
- ✅ Guest can see property owner's messages
- ✅ Guest can reply in chat

### Note:
Email sending is currently logged to console. In production, integrate with email service (Resend, SendGrid, etc.)

---

## Test Case 8: Regular (Non-Claimable) Promotions Still Work

### Steps:
1. **Create regular promotion**
   - Create promotion WITHOUT toggling "Make this a claimable promo"
   - Save with `is_claimable: false`

2. **View on public page**
   - Navigate to property detail page
   - Check promotions tab

### Expected Results:
- ✅ Promo code is **VISIBLE** directly
- ✅ No "Claim Promo" button appears
- ✅ Guests can see and copy the code immediately

---

## Test Case 9: Edit Existing Promotion

### Steps:
1. **Edit claimable promotion**
   - Open promotion editor for existing claimable promo
   - Verify checkbox is checked
   - Make changes (e.g., update description)
   - Save

2. **Toggle claimable off**
   - Edit promotion again
   - Uncheck "Make this a claimable promo"
   - Save

3. **View on public page**
   - Verify promo code now visible
   - "Claim Promo" button no longer appears

### Expected Results:
- ✅ Existing claimable state is preserved when editing
- ✅ Can toggle claimable on/off
- ✅ Changes reflect immediately on public page

---

## Test Case 10: Validation & Error Handling

### Test Invalid Email:
- Try claiming with invalid email (e.g., "notanemail")
- ✅ Validation error shown: "Invalid email format"

### Test Empty Fields:
- Try claiming with empty name/email/phone
- ✅ Validation errors shown for each field

### Test Inactive Promotion:
- Deactivate a claimable promotion
- Try accessing claim URL directly
- ✅ Error: "This promotion is no longer active"

### Test Non-Claimable Promotion:
- Try calling claim API for non-claimable promo
- ✅ Error: "This promotion is not claimable"

---

## Performance Checks

### Database Queries:
- ✅ No N+1 query issues
- ✅ Promotions loaded with single query in discovery service
- ✅ `is_claimable` field included in all promotion queries

### API Response Times:
- ✅ Claim endpoint responds within 2 seconds
- ✅ Public property page loads with promotions within 1 second

---

## Cleanup After Testing

1. **Delete test data:**
   - Remove test guest accounts from `auth.users`
   - Delete test conversations from `chat_conversations`
   - Delete test promotions from `room_promotions`
   - Clean up test customer records

2. **Reset database:**
   - If needed, restore from backup
   - Re-run migrations if testing corrupted data

---

## Known Limitations / Future Enhancements

1. **Email Service Integration:**
   - Currently logs verification link to console
   - Production needs integration with Resend/SendGrid

2. **Send Promo Code Handler:**
   - Button UI is complete
   - Parent component needs to implement `onSendPromoCode` handler
   - Needs to fetch promotion and send template message

3. **Promo Code Usage Tracking:**
   - System doesn't automatically increment `current_uses` when guest books
   - Needs integration with booking flow

4. **Guest Notification:**
   - Guest doesn't get notified when property owner sends promo code
   - Could add email notification or push notification

---

## Success Criteria

✅ All 10 test cases pass without errors
✅ Property managers can create claimable promos
✅ Claimable promos hide code on public pages
✅ "Claim Promo" button appears and works
✅ Guest accounts auto-created with email verification
✅ Chat conversations created with correct metadata
✅ Badges appear in chat list ("New Lead", "Promo Claim")
✅ "Send Promo Code" button appears in chat header
✅ Regular promotions still work normally
✅ No regressions in existing functionality

---

## Testing Completed By:
- **Name:** _________________
- **Date:** _________________
- **Test Environment:** _________________
- **Issues Found:** _________________

---

## Bug Report Template

If you find issues during testing, use this template:

**Test Case:** [Number and name]
**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Logs:**
[Attach screenshots or paste error logs]

**Severity:** [Critical / High / Medium / Low]

---

## Additional Notes

- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices (responsive design)
- Test with different property types and configurations
- Test edge cases (special characters in names, very long promo codes, etc.)
