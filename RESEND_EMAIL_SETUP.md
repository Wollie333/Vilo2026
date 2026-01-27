# Resend Email Integration - Setup Guide

## ✅ What's Been Integrated

All email notifications now use Resend:

### 1. **Review Request Emails** ✅
- 24-hour review request after checkout
- 30-day reminder
- 80-day final urgent reminder
- Manual review requests

### 2. **Booking Emails** ✅ (Fixed)
- Booking confirmation
- Booking cancellation
- New booking notification to host

### 3. **Refund Emails** ✅ (NEW)
- Refund requested (to admin)
- Refund approved (to guest)
- Refund rejected (to guest)
- Refund completed (to guest)

---

## 🔧 Configuration Required

### Step 1: Set Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Step 2: Get Your Resend API Key

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Copy and paste into `.env`

### Step 3: Verify Domain (For Production)

1. Go to https://resend.com/domains
2. Add your domain
3. Add the DNS records to your domain provider
4. Verify the domain

**For Development/Testing:**
- You can use `onboarding@resend.dev` as the FROM email
- Set `EMAIL_FROM=onboarding@resend.dev` in `.env`
- This lets you test without domain verification

---

## 🧪 Testing Emails Locally

### Test Review Request Email:

```bash
# 1. Create a test booking
# 2. Set it to checked_out status
# 3. Run the cron job manually (if you have an endpoint)

# OR simulate by calling the email function directly in your code
```

### Test Environment Variables:

```bash
# backend/.env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_test_key
EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
```

---

## 📧 Email Templates Created

### Review Emails (`review-emails.service.ts`)
- `sendInitialReviewRequestEmail()` - Initial request
- `send30DayReminderEmail()` - 30-day reminder
- `send80DayFinalReminderEmail()` - Final reminder
- `sendManualReviewRequestEmail()` - Manual trigger

### Refund Emails (`refund-emails.service.ts`)
- `sendRefundRequestedEmailToAdmin()` - Notify admin
- `sendRefundApprovedEmailToGuest()` - Approval notification
- `sendRefundRejectedEmailToGuest()` - Rejection notification
- `sendRefundCompletedEmailToGuest()` - Completion notification

### Booking Emails (`booking-notifications.service.ts`)
- `sendBookingConfirmationEmail()` - Already exists
- `sendBookingCancellationEmail()` - Already exists
- `notifyHostNewBooking()` - Already exists

---

## 🔄 Integration Points

### Review Emails
Automatically triggered by cron jobs in `booking-cron.service.ts`:
- **24h after checkout**: `sendInitialReviewRequests()`
- **30 days**: `send30DayReviewReminders()`
- **80 days**: `send80DayFinalReminders()`

### Booking Emails
Triggered in `booking.service.ts` when:
- Booking is confirmed
- Booking is cancelled
- New booking is created

### Refund Emails
**TODO**: Need to add calls in `refund.service.ts` at:
- Line ~250: After creating refund → call `sendRefundRequestedEmailToAdmin()`
- Line ~700: After approving refund → call `sendRefundApprovedEmailToGuest()`
- Line ~800: After rejecting refund → call `sendRefundRejectedEmailToGuest()`
- Line ~1400: After completing refund → call `sendRefundCompletedEmailToGuest()`

---

## 📊 Email Delivery Status

All email functions return `Promise<boolean>`:
- `true` = Email sent successfully
- `false` = Email failed (check logs)

Failures are logged but don't block the main operation:
```typescript
await sendInitialReviewRequestEmail(data)
  .catch(err => console.error('Email failed:', err));
// App continues even if email fails
```

---

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Add `RESEND_API_KEY` to production environment variables
- [ ] Verify domain in Resend dashboard
- [ ] Update `EMAIL_FROM` to your verified domain email
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Test all email types in staging environment
- [ ] Set up email monitoring/alerts

---

## 🐛 Troubleshooting

### Email not sending?

1. **Check environment variables:**
   ```bash
   # Verify these are set:
   echo $EMAIL_PROVIDER  # Should be "resend"
   echo $RESEND_API_KEY  # Should start with "re_"
   ```

2. **Check logs:**
   - Look for "Email sent successfully" in backend logs
   - Look for "Failed to send email" errors

3. **Verify Resend API key:**
   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "onboarding@resend.dev",
       "to": "youremail@example.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

### Using development email?

Set this in `.env` for testing without domain verification:
```bash
EMAIL_FROM=onboarding@resend.dev
```

### Emails going to spam?

- Verify your domain in Resend
- Add SPF, DKIM, and DMARC records
- Use a professional FROM email (not noreply)

---

## 📝 Next Steps

1. **Set up environment variables** (see Step 1)
2. **Test review emails** by triggering a checkout
3. **Integrate refund emails** (add calls to refund.service.ts)
4. **Set up cron scheduler** for automated review requests
5. **Deploy to production** with verified domain

---

## 💡 Tips

- **Development**: Use `onboarding@resend.dev` as FROM email
- **Production**: Use your verified domain (e.g., `noreply@yourdomain.com`)
- **Testing**: Check Resend dashboard for delivery logs
- **Styling**: All emails use the base template from `wrapInEmailTemplate()`
- **Customization**: Modify templates in `*-emails.service.ts` files

---

## 📞 Support

- **Resend Docs**: https://resend.com/docs
- **Resend Dashboard**: https://resend.com/emails
- **API Reference**: https://resend.com/docs/api-reference/emails/send-email
