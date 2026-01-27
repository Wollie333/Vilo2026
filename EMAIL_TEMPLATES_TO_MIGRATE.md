# Email Templates to Migrate to Email Management System

## 📋 Status: Pending Migration

When implementing the Email Management System (from the existing plan), these email templates need to be added to the centralized management interface.

## 🎯 Booking Wizard Emails (NEWLY ADDED)

### 1. `booking_guest_password_setup`
**Location:** `backend/src/services/booking-wizard.service.ts` - `sendPasswordSetupEmail()`
**Type:** Application Email (Transactional)
**Category:** Bookings → Guest Welcome
**Trigger:** New guest completes booking (no existing account)
**Subject:** "Set Up Your Vilo Account - Booking {{booking_reference}}"

**Variables:**
- `{{full_name}}` - Guest's full name
- `{{booking_reference}}` - Booking reference number
- `{{setup_link}}` - Password setup URL (Supabase recovery link)

**Current Template:**
```html
<h1>Welcome to Vilo!</h1>
<p>Hi {{full_name}},</p>
<p>Thank you for your booking (Reference: <strong>{{booking_reference}}</strong>)!</p>
<p>To access your booking details and manage your account, please set up your password:</p>
<p style="text-align: center; margin: 30px 0;">
  <a href="{{setup_link}}"
     style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
    Set Up Password
  </a>
</p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't make this booking, please ignore this email.</p>
<p>Best regards,<br>The Vilo Team</p>
```

---

### 2. `booking_existing_user_confirmation`
**Location:** `backend/src/services/booking-wizard.service.ts` - `sendExistingUserBookingEmail()`
**Type:** Application Email (Transactional)
**Category:** Bookings → Confirmations
**Trigger:** Existing user completes booking
**Subject:** "Booking Confirmed - {{booking_reference}}"

**Variables:**
- `{{full_name}}` - User's full name
- `{{booking_reference}}` - Booking reference number
- `{{login_url}}` - Login URL with email pre-filled

**Current Template:**
```html
<h1>Booking Confirmed!</h1>
<p>Hi {{full_name}},</p>
<p>Thank you for your booking! Your booking reference is: <strong>{{booking_reference}}</strong></p>
<p>To view your booking details and manage your reservation, please log in to your account:</p>
<p style="text-align: center; margin: 30px 0;">
  <a href="{{login_url}}"
     style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
    View Booking Details
  </a>
</p>
<p>You can also access your booking from the dashboard after logging in.</p>
<p>If you have any questions about your booking, please don't hesitate to contact us.</p>
<p>Best regards,<br>The Vilo Team</p>
```

---

## 📧 Complete Email Template Inventory

### Booking Emails (6 templates)
1. ✅ `booking_guest_password_setup` - **NEW** (see above)
2. ✅ `booking_existing_user_confirmation` - **NEW** (see above)
3. ⏳ `booking_confirmation` - Booking confirmed
4. ⏳ `booking_confirmation_temp_password` - With temporary password
5. ⏳ `booking_cancelled` - Booking cancelled
6. ⏳ `booking_checkin_reminder` - 24h before check-in

### Review Emails (4 templates)
1. ⏳ `review_request_initial` - 24h after checkout
2. ⏳ `review_request_30d_reminder` - 30 days after checkout
3. ⏳ `review_request_80d_final` - 80 days after checkout
4. ⏳ `review_request_manual` - Manual request from admin

### Refund Emails (4 templates)
1. ⏳ `refund_requested` - Refund request submitted
2. ⏳ `refund_approved` - Refund approved by admin
3. ⏳ `refund_rejected` - Refund denied
4. ⏳ `refund_completed` - Refund processed

### Supabase Auth Emails (4 templates)
1. ⏳ `auth_confirm_signup` - Email verification
2. ⏳ `auth_reset_password` - Password reset
3. ⏳ `auth_magic_link` - Passwordless login
4. ⏳ `auth_invite_user` - User invitation

**Total:** 18 email templates

---

## 🔄 Migration Process

When implementing the Email Management System:

1. **Create Database Migration** with all 18 email templates
2. **Seed Initial Templates** including the 2 new booking wizard emails
3. **Update Services** to use `emailTemplateService.sendEmailFromTemplate()`:
   ```typescript
   // Instead of hardcoded HTML in booking-wizard.service.ts:
   await emailTemplateService.sendEmailFromTemplate({
     template_key: 'booking_guest_password_setup',
     recipient_email: email,
     variables: {
       full_name: fullName,
       booking_reference: bookingReference,
       setup_link: resetData.properties.action_link,
     }
   });
   ```

4. **Keep Fallback** for backward compatibility during migration
5. **Test Thoroughly** before removing fallback code

---

## 📝 Notes

- ✅ Booking wizard emails are currently **working** with hardcoded templates
- ✅ Using Resend API for sending
- ⏳ Need to migrate to centralized email management when that system is implemented
- ⏳ SaaS admin will then be able to edit these templates via admin UI

---

## 🎯 Next Steps

When you're ready to implement the Email Management System:
1. Resume from the existing plan at `.claude/plans/async-imagining-parrot.md`
2. Add these 2 new templates to the migration seed data
3. Update the total count from 16 to 18 templates
4. Follow the phased implementation approach from the plan
