# Email Management Access Guide

## Problem Identified

✅ **Templates exist in database** (16 templates confirmed)
✅ **Backend API working** (routes registered correctly)
✅ **Frontend code working** (all components implemented)
❌ **User doesn't have super admin access** (cannot view the page)

## Solution: Grant Super Admin Access

The Email Management page at `/admin/email` requires the `super_admin` role. Follow these steps to grant yourself super admin access.

---

## Step 1: Check Your Current User ID

First, find your user ID by logging into your app and checking the browser console:

```javascript
// In browser console (F12)
console.log(JSON.parse(localStorage.getItem('auth')))
```

Or run this query in Supabase SQL Editor to see all users:

```sql
SELECT id, email, full_name FROM users;
```

**Copy your user ID** - you'll need it in the next step.

---

## Step 2: Grant Super Admin Role

Run this SQL in **Supabase SQL Editor**:

```sql
-- Replace YOUR_USER_ID_HERE with your actual user ID from Step 1
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE'; -- 👈 REPLACE THIS
  v_super_admin_role_id UUID;
BEGIN
  -- Get or create super_admin role
  SELECT id INTO v_super_admin_role_id
  FROM user_roles
  WHERE name = 'super_admin';

  -- If super_admin role doesn't exist, create it
  IF v_super_admin_role_id IS NULL THEN
    INSERT INTO user_roles (name, display_name, description, permissions)
    VALUES (
      'super_admin',
      'Super Admin',
      'Full system access including email management',
      '{"*": ["*"]}'::jsonb
    )
    RETURNING id INTO v_super_admin_role_id;

    RAISE NOTICE 'Created super_admin role: %', v_super_admin_role_id;
  END IF;

  -- Assign super_admin role to user (if not already assigned)
  INSERT INTO user_user_roles (user_id, role_id)
  VALUES (v_user_id, v_super_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE 'User % is now a super admin', v_user_id;
END $$;
```

---

## Step 3: Verify Super Admin Access

Run this query to confirm you have the super_admin role:

```sql
-- Check your roles (replace YOUR_EMAIL_HERE)
SELECT
  u.email,
  u.full_name,
  ur.name as role_name,
  ur.display_name as role_display_name
FROM users u
JOIN user_user_roles uur ON u.id = uur.user_id
JOIN user_roles ur ON uur.role_id = ur.id
WHERE u.email = 'YOUR_EMAIL_HERE'; -- 👈 REPLACE THIS
```

You should see a row with `role_name = 'super_admin'`.

---

## Step 4: Log Out and Log Back In

The authentication token needs to be refreshed to include the new role:

1. **Log out** of your application
2. **Log back in** with your credentials
3. Your new super_admin role will now be in your JWT token

---

## Step 5: Access Email Management

1. Navigate to: **http://localhost:5173/admin/email** (or your frontend URL)
2. You should now see the Email Management page with 3 tabs:
   - **Email Templates** - List of 16 templates
   - **Supabase Auth** - 4 Supabase auth templates
   - **Analytics & Audit** - Usage statistics

---

## Troubleshooting

### Still seeing "Unauthorized" page?

**Check browser console:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for any errors when the page loads

**Verify your auth token:**
```javascript
// In browser console
const auth = JSON.parse(localStorage.getItem('auth'))
console.log('Roles:', auth?.user?.roles)
// Should include 'super_admin'
```

**Clear cache and hard reload:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Templates not loading in the list?

**Check browser console for API errors:**
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try loading the page
4. Look for failed requests to `/api/admin/email/templates`

**Check backend logs:**
- The backend should show logs like:
  ```
  === [ADMIN_EMAIL_CONTROLLER] listTemplates ===
  [ADMIN_EMAIL_CONTROLLER] Query: {}
  ```

### Backend not running?

Make sure your backend is running:
```bash
cd backend
npm run dev
```

---

## Quick Verification Script

Run this Node.js script to verify everything is set up:

```bash
node backend/check-email-tables.js
```

**Expected output:**
```
✅ Email management tables exist!
📧 Found 5 templates:
  - Initial Review Request (review_request_initial)
  - 30-Day Review Reminder (review_request_30d_reminder)
  - 80-Day Final Review Request (review_request_80d_final)
  - Manual Review Request (review_request_manual)
  - Booking Confirmation (booking_confirmation)
📊 Total templates in database: 16
```

---

## Summary

The email management system is **fully implemented and working**. The only issue is access control - you need the `super_admin` role to view it.

**What's already working:**
- ✅ Database tables created (email_templates, email_template_categories, email_sends, email_template_changelog)
- ✅ 16 email templates seeded
- ✅ Backend API endpoints functional
- ✅ Frontend UI implemented
- ✅ All email services migrated with template support

**All you need to do:**
1. Run the SQL from Step 2 to grant yourself super_admin role
2. Log out and log back in
3. Navigate to /admin/email

---

## Next Steps After Access

Once you have access, you can:

1. **View Templates** - See all 16 email templates
2. **Edit Templates** - Modify subject lines and email content
3. **Use Variables** - Insert `{{variable_name}}` placeholders
4. **Preview** - See how emails look with test data
5. **Send Tests** - Send test emails to yourself
6. **Enable/Disable** - Turn templates on/off without code changes
7. **View Analytics** - See send counts and history
8. **Sync to Supabase** - Update Supabase Auth email templates

Enjoy your new email management system! 🎉
