# Final Setup Steps - Email Management System

## ✅ What's Already Done

- ✅ Database migration created with 18 email templates
- ✅ Backend API fully implemented
- ✅ Frontend admin UI fully implemented
- ✅ Routes registered (backend & frontend)
- ✅ Booking wizard integrated with template system (with fallback)

## 🎯 Final Steps (5-10 minutes)

### Step 1: Apply Database Migration

**Run this in Supabase SQL Editor:**

1. Go to your Supabase Dashboard → SQL Editor
2. Paste the contents of: `backend/migrations/138_create_email_management_system.sql`
3. Click "Run"
4. You should see: "Success. No rows returned"

**Verify it worked:**

Run `CHECK_EMAIL_SYSTEM.sql` - Should show:
- ✅ All 4 tables exist
- ✅ 5 categories
- ✅ 18 templates
- ✅ 2 new booking templates

### Step 2: Restart Backend Server

The booking wizard service was updated to use templates. Restart to load changes:

```bash
# In backend terminal: Ctrl+C to stop
cd backend
npm run dev
```

### Step 3: Test the System

#### Test 1: View Email Templates (Admin UI)

1. Log in as **super admin**
2. Navigate to `/admin/email`
3. You should see:
   - 18 email templates listed
   - Grouped by category (Reviews, Bookings, Refunds, Authentication)
   - Search and filter functionality

#### Test 2: Edit a Template

1. Click on "Guest Password Setup" template
2. Edit the subject or HTML
3. Click "Save"
4. You should see: "Template saved successfully"
5. Check the changelog tab - should show your change

#### Test 3: Send Test Email

1. On the template editor page
2. Fill in test variables (full_name, booking_reference, setup_link)
3. Enter your email address
4. Click "Send Test Email"
5. Check your inbox - you should receive the email

#### Test 4: Make a Test Booking (End-to-End)

1. Go to `/book/pandokkie-house` (or your property slug)
2. Complete a booking with a **new email address**
3. Check backend logs - should see:
   ```
   [BOOKING_WIZARD] Attempting to send via email template system...
   ✅ [BOOKING_WIZARD] Password setup email sent via template system
   ```
4. Check your email - should receive password setup email
5. Check `/admin/email` → Click the template → Analytics tab
   - Should show 1 email sent

## 🎨 Customizing Email Templates

### Via Admin UI (Recommended)

1. Go to `/admin/email`
2. Click any template
3. Edit the content:
   - Use `{{variable_name}}` for dynamic content
   - Variables list is shown on the right
   - Preview before saving
4. Save and test

### Example Edit:

**Before:**
```html
<h1>Welcome to Vilo!</h1>
<p>Hi {{full_name}},</p>
```

**After:**
```html
<h1>Welcome to Vilo! 🎉</h1>
<p>Hi {{full_name}},</p>
<p>We're excited to have you!</p>
```

## 📊 Features Now Available

### For Super Admin:

1. **Email Template Management** (`/admin/email`)
   - View all 18 email templates
   - Edit any template content
   - Enable/disable templates
   - Preview with test variables
   - Send test emails
   - View analytics (send count, last sent)
   - View full changelog of all changes

2. **Template Variables**
   - Auto-documented for each template
   - Shows type, description, required, example
   - Validated before sending

3. **Audit Trail**
   - Every change logged automatically
   - See who changed what and when
   - View previous versions

4. **Analytics**
   - Total sends per template
   - Send status breakdown
   - Recent sends list
   - Last sent timestamp

### For Developers:

**Send email from any service:**

```typescript
import { sendEmailFromTemplate } from './email-template.service';

await sendEmailFromTemplate({
  template_key: 'booking_guest_password_setup',
  recipient_email: 'user@example.com',
  recipient_name: 'John Doe',
  variables: {
    full_name: 'John Doe',
    booking_reference: 'BK-12345',
    setup_link: 'https://...',
  },
  context_type: 'booking',
  context_id: bookingId,
});
```

**Automatic fallback:**
- If template doesn't exist → Uses hardcoded HTML
- If template system fails → Falls back gracefully
- Zero downtime deployment

## 🔄 Migration Strategy

The booking wizard now:

1. **Tries template system first** (`booking_guest_password_setup`, `booking_existing_user_confirmation`)
2. **Falls back to hardcoded** if template doesn't exist or fails
3. **Logs everything** so you can debug

This means:
- ✅ Emails work even if migration not applied
- ✅ No breaking changes
- ✅ Gradual rollout possible
- ✅ Easy to revert if needed

## 🐛 Troubleshooting

### Templates Not Showing in Admin UI

**Check:**
1. Migration applied? Run `CHECK_EMAIL_SYSTEM.sql`
2. Logged in as super admin? Check `is_super_admin()` function
3. Backend restarted? Restart to load new routes

### Emails Still Using Hardcoded HTML

**Check backend logs:**
- ✅ `[BOOKING_WIZARD] Attempting to send via email template system...`
  - Template system was attempted
- ⚠️ `[BOOKING_WIZARD] Template system failed, using fallback`
  - Template doesn't exist or has error
- ✅ `✅ [BOOKING_WIZARD] Password setup email sent via template system`
  - SUCCESS - using templates!

**If seeing fallback:**
1. Check migration applied (templates exist in database)
2. Check template is active (`is_active = true`)
3. Check template key matches exactly (`booking_guest_password_setup`)

### Can't Access `/admin/email`

**Check:**
1. Are you logged in?
2. Are you a **super admin**? (Not just property owner)
3. Check user role in database:
   ```sql
   SELECT id, email, full_name, is_super_admin() as is_super
   FROM users
   WHERE email = 'your@email.com';
   ```

## 🎉 You're Done!

Once the migration is applied:
- ✅ All 18 email templates are in the database
- ✅ Admin UI is accessible at `/admin/email`
- ✅ Booking emails use templates (with fallback)
- ✅ Full audit trail and analytics
- ✅ No code deployment needed to change emails

## 📚 What's Next?

1. **Test all email templates** - Make test bookings, refunds, reviews
2. **Customize your templates** - Add your branding, adjust wording
3. **Migrate other emails** - Reviews, refunds can use templates too
4. **Set up Supabase auth sync** - Sync auth templates to Supabase
5. **Remove fallback code** - After 1 week of stable operation

Enjoy your new email management system! 🚀
