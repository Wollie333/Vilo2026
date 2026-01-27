# Email Setup Guide - Resend Integration

## 🎯 Quick Setup (5 minutes)

Your booking emails are now configured to send through **Resend** - a modern email API with a generous free tier.

## Step 1: Get Your Resend API Key

1. Go to **[https://resend.com](https://resend.com)**
2. Click **"Sign Up"** (or "Get Started")
3. Sign up with your email or GitHub
4. Once logged in, go to **API Keys** in the sidebar
5. Click **"Create API Key"**
6. Give it a name like "Vilo Development"
7. Copy the API key (starts with `re_`)

## Step 2: Update Your .env File

1. Open `backend/.env`
2. Find the line: `RESEND_API_KEY=re_123456789_YourResendAPIKeyHere`
3. Replace `re_123456789_YourResendAPIKeyHere` with your actual API key
4. Save the file

**Example:**
```bash
EMAIL_PROVIDER=resend
EMAIL_FROM=onboarding@resend.dev
RESEND_API_KEY=re_abc123xyz789_your_real_api_key_here
```

## Step 3: Restart Your Backend Server

Stop and restart your backend server to load the new environment variables:

```bash
# In backend terminal: Ctrl+C to stop, then:
cd backend
npm run dev
```

## Step 4: Test It!

Make a test booking and you should receive:
- ✅ **New users**: "Set Up Your Vilo Account" email with password setup link
- ✅ **Existing users**: "Booking Confirmed" email with login link

## 📧 What Emails Will Be Sent?

### For New Guest Bookings:
**Subject:** "Set Up Your Vilo Account - Booking [Reference]"
**Contains:**
- Welcome message
- Booking reference number
- "Set Up Password" button
- Link expires in 24 hours

### For Existing User Bookings:
**Subject:** "Booking Confirmed - [Reference]"
**Contains:**
- Booking confirmation
- Booking reference number
- "View Booking Details" button (login link)

## 🆓 Resend Free Tier

The free tier includes:
- **100 emails/day**
- **3,000 emails/month**
- Perfect for development and testing!

## 🔧 Troubleshooting

### Emails Not Sending?

1. **Check backend console logs** - Look for:
   - `✅ Password setup email sent successfully`
   - `⚠️ Email service not configured` (means API key is missing)

2. **Verify .env file**:
   ```bash
   # In backend directory
   cat .env | grep EMAIL
   ```
   Should show:
   ```
   EMAIL_PROVIDER=resend
   EMAIL_FROM=onboarding@resend.dev
   RESEND_API_KEY=re_... (your key)
   ```

3. **Check Resend Dashboard**:
   - Go to **[https://resend.com/emails](https://resend.com/emails)**
   - You should see your sent emails listed

### API Key Not Working?

- Make sure you copied the **entire key** (starts with `re_`)
- Make sure there are **no extra spaces** before or after the key
- The free tier uses `onboarding@resend.dev` as the sender
- **Restart the backend server** after changing .env

## 🎨 Customizing Emails

To customize the email templates, edit:
- `backend/src/services/booking-wizard.service.ts`
- Look for `emailContent` in:
  - `sendPasswordSetupEmail()` - New user welcome email
  - `sendExistingUserBookingEmail()` - Existing user confirmation

## 🚀 Production Setup

When deploying to production:

1. **Add your domain to Resend**:
   - Go to **Domains** in Resend dashboard
   - Add your domain (e.g., `yourdomain.com`)
   - Follow DNS setup instructions

2. **Update .env**:
   ```bash
   EMAIL_FROM=noreply@yourdomain.com
   ```

3. **Upgrade Resend plan** if needed (after 3,000 emails/month)

## ✅ You're All Set!

Once you've added your Resend API key and restarted the backend, booking emails will work automatically! 🎉
