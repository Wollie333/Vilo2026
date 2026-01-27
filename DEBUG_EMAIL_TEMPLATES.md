# Debug: Email Templates Not Loading

## Step-by-Step Debugging Guide

Let's figure out why templates aren't showing in the UI.

---

## Step 1: Verify Backend is Running and Responding

Open a new terminal and run:

```bash
curl http://localhost:3000/api/health
```

**Expected output:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "..."
  }
}
```

If this fails, your backend isn't running. Start it with:
```bash
cd backend
npm run dev
```

---

## Step 2: Check if You Have Super Admin Access

### Option A: Check in Database

Run this in **Supabase SQL Editor**:

```sql
-- Replace with YOUR email
SELECT
  u.email,
  u.full_name,
  ARRAY_AGG(ur.name) as roles
FROM users u
LEFT JOIN user_user_roles uur ON u.id = uur.user_id
LEFT JOIN user_roles ur ON uur.role_id = ur.id
WHERE u.email = 'YOUR_EMAIL_HERE'  -- 👈 CHANGE THIS
GROUP BY u.id, u.email, u.full_name;
```

**Look for:** `super_admin` in the roles array.

**If you DON'T see super_admin:**
1. Run `FIND_MY_EMAIL.sql` to get your email
2. Edit `GRANT_SUPER_ADMIN_SIMPLE.sql` (replace YOUR_EMAIL_HERE with your email)
3. Run it
4. Log out and log back in

### Option B: Check in Browser

1. Open your app: `http://localhost:5173`
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Run this:

```javascript
const auth = JSON.parse(localStorage.getItem('auth'))
console.log('Email:', auth?.user?.email)
console.log('Roles:', auth?.user?.roles)
```

**Look for:** `'super_admin'` in the roles array.

**If you DON'T see super_admin:**
- You need to grant yourself super admin access (see Option A above)
- Then log out and log back in

---

## Step 3: Check Browser Console for Errors

1. Go to: `http://localhost:5173/admin/email`
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for RED errors

**Common errors:**

### Error: "401 Unauthorized" or "403 Forbidden"
❌ **Problem:** You don't have super admin access
✅ **Solution:** Run Step 2 above

### Error: "Network Error" or "ERR_CONNECTION_REFUSED"
❌ **Problem:** Backend isn't running
✅ **Solution:** Start backend with `cd backend && npm run dev`

### Error: "Cannot read property of undefined"
❌ **Problem:** API response format issue
✅ **Solution:** Check backend logs (see Step 4)

---

## Step 4: Check Network Tab for API Calls

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Reload the page (Ctrl+R or Cmd+R)
4. Look for requests to `/api/admin/email/templates`

**Click on the request** and check:

### Request Tab
- URL should be: `http://localhost:3000/api/admin/email/templates`
- Method: `GET`
- Headers should include: `Authorization: Bearer [your-token]`

### Response Tab
- **If Status is 200:** Check the response body
  - Should have: `{ "success": true, "data": { "templates": [...] } }`
  - If templates array is empty, database issue
  - If templates array has data, frontend issue

- **If Status is 401:** You're not authenticated
  - Log out and log back in
  - Check your token in localStorage

- **If Status is 403:** You don't have super admin role
  - Run the super admin SQL script
  - Log out and log back in

- **If Status is 500:** Backend error
  - Check backend terminal for error logs

---

## Step 5: Check Backend Logs

Look at your backend terminal where you ran `npm run dev`.

When you load `/admin/email`, you should see logs like:

```
=== [ADMIN_EMAIL_CONTROLLER] listTemplates ===
[ADMIN_EMAIL_CONTROLLER] Query: {}
```

**If you DON'T see these logs:**
- The API endpoint isn't being called
- Check frontend is calling the correct URL
- Check Network tab (Step 4)

**If you see error logs:**
- Read the error message
- Common issues:
  - Database connection error
  - RLS policy blocking access
  - Missing email_templates table

---

## Step 6: Test API Directly with curl

Test the API outside the browser to isolate the issue.

### First, get your auth token:

1. Open browser console (F12)
2. Run:
```javascript
console.log(JSON.parse(localStorage.getItem('auth')).accessToken)
```
3. Copy the token

### Then test the API:

```bash
# Windows PowerShell
$token = "YOUR_TOKEN_HERE"
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/email/templates" -Headers @{"Authorization"="Bearer $token"}

# Mac/Linux/Git Bash
TOKEN="YOUR_TOKEN_HERE"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/email/templates
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "...",
        "template_key": "review_request_initial",
        "display_name": "Initial Review Request",
        ...
      },
      ...
    ],
    "total": 16
  }
}
```

**If this works but UI doesn't:**
- Frontend issue (not calling API correctly)
- Check console for JavaScript errors

**If this returns 401/403:**
- Your token doesn't have super admin access
- Run the super admin SQL script
- Get a fresh token after logging in again

**If this returns 500:**
- Backend error
- Check backend logs for details

---

## Step 7: Verify Database Tables and Data

Run this in **Supabase SQL Editor**:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'email_%';

-- Should return:
-- email_template_categories
-- email_templates
-- email_sends
-- email_template_changelog

-- Check template count
SELECT COUNT(*) as template_count FROM email_templates;
-- Should return: 16

-- Check if templates are active
SELECT
  template_key,
  display_name,
  is_active,
  template_type
FROM email_templates
ORDER BY display_name;
```

**If no tables exist:**
- Migration hasn't run
- Run: `backend/migrations/138_create_email_management_system.sql`

**If tables exist but no templates (count = 0):**
- Migration ran but seed data failed
- Re-run the migration

---

## Quick Diagnostic Script

Save this as `backend/diagnose.js` and run with `node backend/diagnose.js`:

```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Email Template System Diagnostics\n');

  // Check tables
  console.log('1. Checking tables...');
  const { data: templates, error: templatesError } = await supabase
    .from('email_templates')
    .select('id')
    .limit(1);

  if (templatesError) {
    console.log('   ❌ email_templates table missing or RLS blocking');
    console.log('   Error:', templatesError.message);
    return;
  }
  console.log('   ✅ email_templates table exists\n');

  // Count templates
  console.log('2. Counting templates...');
  const { count } = await supabase
    .from('email_templates')
    .select('*', { count: 'exact', head: true });
  console.log(`   ${count === 16 ? '✅' : '⚠️'} Found ${count} templates (expected 16)\n`);

  // List first 5
  console.log('3. Sample templates:');
  const { data: sampleTemplates } = await supabase
    .from('email_templates')
    .select('template_key, display_name, is_active')
    .limit(5);

  sampleTemplates.forEach(t => {
    console.log(`   - ${t.display_name} (${t.is_active ? 'active' : 'inactive'})`);
  });

  console.log('\n✅ Database looks good!');
  console.log('\nIf UI still not loading, check:');
  console.log('1. Do you have super_admin role?');
  console.log('2. Did you log out and log back in?');
  console.log('3. Check browser console for errors');
  console.log('4. Check Network tab for 401/403 errors');
}

diagnose().catch(console.error);
```

---

## Most Likely Issue

Based on your symptoms, **you probably don't have super admin access yet**.

### Quick Fix:

1. Run `FIND_MY_EMAIL.sql` in Supabase to get your email
2. Edit `GRANT_SUPER_ADMIN_SIMPLE.sql` - replace `YOUR_EMAIL_HERE` with your actual email (2 places: line 18 and line 64)
3. Run it in Supabase SQL Editor
4. **Log out of your app**
5. **Log back in**
6. Go to `/admin/email` again

The templates should now load! 🎉
