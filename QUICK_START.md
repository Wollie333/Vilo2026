# Quick Start: Access Email Management

## You're 3 Steps Away from Accessing Your Email Templates! 🚀

---

## Step 1: Find Your Email (30 seconds)

1. Open **Supabase SQL Editor**
2. Open the file: **`FIND_MY_EMAIL.sql`**
3. Click **Run**
4. Look at the results - find YOUR email address
5. **Copy your email** (you'll need it in the next step)

**Example output:**
```
| email              | full_name    | super_admin_status      |
|--------------------|--------------|-------------------------|
| john@example.com   | John Doe     | ❌ Not Super Admin Yet  |
| admin@example.com  | Admin User   | ✅ Already Super Admin  |
```

---

## Step 2: Grant Yourself Super Admin (1 minute)

1. Open the file: **`GRANT_SUPER_ADMIN_SIMPLE.sql`**
2. Find **line 18** (the one that says `v_user_email TEXT := 'YOUR_EMAIL_HERE';`)
3. **Replace** `'YOUR_EMAIL_HERE'` with your email from Step 1
   - Example: Change `'YOUR_EMAIL_HERE'` to `'john@example.com'`
   - **Keep the quotes!** ✅ `'john@example.com'` ❌ `john@example.com`
4. Find **line 64** (in the verification query)
5. **Replace** `'YOUR_EMAIL_HERE'` with your email again
6. Click **Run** in Supabase SQL Editor

**You should see:**
```
✅ Found user!
   Email: john@example.com
   User ID: abc-123-def-456

✅ super_admin role exists
🔐 Assigning super_admin role to user...
✅ Done!

🎉 SUCCESS! john@example.com is now a SUPER ADMIN
```

**And a verification table showing:**
```
| role_name    | role_display_name |
|--------------|-------------------|
| super_admin  | Super Admin       |
```

---

## Step 3: Refresh Your Session (30 seconds)

Your auth token needs to be refreshed to include the new super_admin role:

1. **Log out** of your application
2. **Log back in** with your credentials
3. Your JWT token will now include the super_admin role

---

## Step 4: Access Email Management! 🎉

Navigate to: **http://localhost:5173/admin/email**

You should now see:

### Email Templates Tab
- List of **16 email templates**
- Organized by category (Reviews, Bookings, Refunds, Auth)
- Edit, preview, and test any template

### Supabase Auth Tab
- **4 Supabase auth templates**
- Sync button to update Supabase

### Analytics & Audit Tab
- Usage statistics
- Send counts
- Change history

---

## Troubleshooting

### "User with email YOUR_EMAIL_HERE not found"
❌ **You forgot to replace YOUR_EMAIL_HERE with your actual email**

✅ **Solution:**
- Run `FIND_MY_EMAIL.sql` to see your email
- Open `GRANT_SUPER_ADMIN_SIMPLE.sql`
- Replace BOTH instances of `'YOUR_EMAIL_HERE'` (lines 18 and 64)
- Make sure to keep the single quotes around your email

### Still seeing "Unauthorized" page?
❌ **You didn't log out and log back in**

✅ **Solution:**
1. Click logout in your app
2. Log back in with your credentials
3. Try accessing /admin/email again

### "Forbidden" or other error?

**Check your roles in browser console:**
```javascript
// Open browser console (F12) and run:
const auth = JSON.parse(localStorage.getItem('auth'))
console.log('My email:', auth?.user?.email)
console.log('My roles:', auth?.user?.roles)
```

You should see `'super_admin'` in the roles array.

**If not:**
- Clear browser cache and cookies
- Log out and log back in
- Check the verification query output in Supabase

---

## Example: Complete Process

**Step 1 - Find Email:**
```sql
-- Run FIND_MY_EMAIL.sql
-- Results show: john@example.com
```

**Step 2 - Edit and Run:**
```sql
-- In GRANT_SUPER_ADMIN_SIMPLE.sql, change:
v_user_email TEXT := 'YOUR_EMAIL_HERE';  -- ❌ BEFORE

-- To:
v_user_email TEXT := 'john@example.com'; -- ✅ AFTER

-- Also change line 64:
WHERE u.email = 'YOUR_EMAIL_HERE'        -- ❌ BEFORE

-- To:
WHERE u.email = 'john@example.com'       -- ✅ AFTER

-- Click Run
```

**Step 3 - Logout & Login:**
```
1. Click "Logout" in app
2. Enter credentials and login
3. Navigate to /admin/email
```

**Success! 🎉**

---

## What You Can Do Now

✅ **Edit Email Templates** - Change subject lines and content
✅ **Use Variables** - Add `{{variable_name}}` for dynamic content
✅ **Preview Templates** - See how emails look before sending
✅ **Send Tests** - Email yourself to verify
✅ **Enable/Disable** - Turn templates on/off instantly
✅ **View Analytics** - Track sends and performance
✅ **Sync to Supabase** - Update auth email templates
✅ **View Changelog** - Full audit trail of all changes

---

## Need Help?

Check these files:
- **`EMAIL_MANAGEMENT_READY.md`** - Full feature overview
- **`EMAIL_MANAGEMENT_ACCESS_GUIDE.md`** - Detailed troubleshooting

Still stuck? Check:
1. Backend is running: `cd backend && npm run dev`
2. Frontend is running: `cd frontend && npm run dev`
3. Browser console for errors (F12)
4. Backend terminal for API logs

---

**Remember:** The templates are already there (16 of them!). You just need super admin access to see them.
