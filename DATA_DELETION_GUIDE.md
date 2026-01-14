# Complete Data Deletion Guide (Preserves Super Admin Business)

This guide will help you safely delete all data from your Vilo SaaS database while preserving your super admin account AND your business data (company, properties, rooms).

---

## 🚨 What This Does

This operation will **DELETE MOST DATA** except:
- ✅ Super admin users (your admin account)
- ✅ Super admin's company
- ✅ Super admin's properties
- ✅ Super admin's rooms
- ✅ Super admin's property addons, promotions, payment rules, seasonal rates
- ✅ System configuration (subscription types, user types, permissions)
- ✅ Location data (countries, provinces, cities)

### Data That Will Be Deleted:
- ❌ All non-admin users
- ❌ All non-admin companies and team members
- ❌ All non-admin properties and rooms
- ❌ All bookings and payments (including those for admin properties)
- ❌ All invoices and credit notes (transactional data)
- ❌ All reviews and ratings
- ❌ All wishlists and chats
- ❌ All notifications (except admin's)

---

## 💡 Key Point

**Your business structure stays intact!** This script deletes transactional data (bookings, invoices, reviews) but keeps your core business assets (properties, rooms, configuration).

---

## 📋 Pre-Flight Checklist

Before proceeding, ensure:

1. [ ] You have access to Supabase Dashboard
2. [ ] You know your super admin email/credentials
3. [ ] You understand bookings/invoices will be deleted (transactional data)
4. [ ] Your properties and rooms will be preserved
5. [ ] You have 10-15 minutes to complete the process
6. [ ] You're ready to proceed ☕

---

## 🛠️ Step-by-Step Instructions

### Step 1: Verify Super Admin & Business Data (CRITICAL) ✅

**Why:** Confirms your business data will be preserved

1. Open Supabase Dashboard
2. Go to: **SQL Editor**
3. Open file: `VERIFY_SUPER_ADMIN.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click **"Run"**

**Expected Result:**

You should see multiple sections:

**Section 1 - Super Admin Users:**
```
Email: admin@example.com
User Type: super_admin
Status: active
```

**Section 2 - Super Admin Companies:**
```
Name: My Company
Owner Email: admin@example.com
```

**Section 3 - Super Admin Properties:**
```
Name: Beachfront Villa
Company: My Company
Owner Email: admin@example.com
```

**Section 4 - Super Admin Rooms:**
```
Name: Ocean View Suite
Property: Beachfront Villa
Room Type: suite
```

**Section 5 - Summary:**
```
Super Admin Users: 1
Super Admin Companies: 1
Super Admin Properties: 2
Super Admin Rooms: 15
```

**⚠️ If Section 1 shows ZERO super admins:**
- STOP! Do not proceed
- You need to create a super admin first

---

### Step 2: Dry Run Preview 👀

**Why:** See exactly what will be kept vs deleted

1. Open file: `DRY_RUN_DATA_DELETION.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"**

**Expected Result:**

Two sections - **PRESERVED** and **DELETED**:

**PRESERVED (Green ✅):**
```
Category                        | Count | Action
-------------------------------|-------|------------------
✅ SUPER ADMIN USERS           | 1     | 🔒 WILL BE PRESERVED
✅ SUPER ADMIN COMPANIES       | 1     | 🔒 WILL BE PRESERVED
✅ SUPER ADMIN PROPERTIES      | 2     | 🔒 WILL BE PRESERVED
✅ SUPER ADMIN ROOMS           | 15    | 🔒 WILL BE PRESERVED
✅ SUPER ADMIN PROPERTY ADDONS | 5     | 🔒 WILL BE PRESERVED
✅ SUPER ADMIN PROMOTIONS      | 3     | 🔒 WILL BE PRESERVED
```

**DELETED (Red ❌):**
```
Category                        | Count | Action
-------------------------------|-------|------------------
❌ NON-ADMIN USERS             | 45    | 🗑️ WILL BE DELETED
❌ NON-ADMIN COMPANIES         | 12    | 🗑️ WILL BE DELETED
❌ NON-ADMIN PROPERTIES        | 38    | 🗑️ WILL BE DELETED
❌ NON-ADMIN ROOMS             | 156   | 🗑️ WILL BE DELETED
❌ ALL BOOKINGS                | 423   | 🗑️ WILL BE DELETED
❌ ALL INVOICES                | 189   | 🗑️ WILL BE DELETED
❌ ALL REVIEWS                 | 78    | 🗑️ WILL BE DELETED
❌ ALL WISHLISTS               | 34    | 🗑️ WILL BE DELETED
❌ ALL CHATS                   | 56    | 🗑️ WILL BE DELETED
```

**Review carefully!** Make sure:
- Your properties show up in the PRESERVED section
- You're okay deleting all the transactional data (bookings, invoices, etc.)

---

### Step 3: Create Database Backup 💾 (MANDATORY!)

**Why:** Allows you to restore if something goes wrong

1. In Supabase Dashboard, go to: **Settings** → **Database**
2. Scroll to **Backups** section
3. Click **"Create Backup"** button
4. Wait for confirmation (usually takes 1-3 minutes)
5. **Verify** the backup appears in the list with today's date

**Screenshot of location:**
```
Supabase Dashboard
└── Settings (left sidebar)
    └── Database
        └── Backups section
            └── [Create Backup] button
```

⚠️ **DO NOT PROCEED** without creating a backup!

---

### Step 4: Load the Deletion Function 🔧

**Why:** Installs the SQL functions that will perform the deletion

1. Open file: `DELETE_ALL_DATA_EXCEPT_ADMIN.sql`
2. Copy **entire contents** (it's long - about 730 lines)
3. Paste into Supabase SQL Editor
4. Click **"Run"**

**Expected Result:**
```
✅ Success. No rows returned
```

This means two functions were created:
- `is_super_admin_property()` - Helper to identify your properties
- `delete_all_data_except_super_admin()` - Main deletion function

**Note:** This step does NOT delete anything yet - it just prepares the functions.

---

### Step 5: Execute the Deletion 🔴

**Why:** This is the actual deletion operation

**⚠️ LAST CHANCE TO BACK OUT ⚠️**

**This will delete ALL transactional data but keep your business structure intact.**

1. In Supabase SQL Editor, run this command:

```sql
SELECT * FROM delete_all_data_except_super_admin();
```

2. Click **"Run"**

3. **Wait 2-10 minutes** depending on data volume
   - Don't close the browser
   - Don't navigate away
   - The progress will show in real-time

**Expected Result:**

A table showing each step:

```
Step | Step Name                              | Records Deleted | Status
-----|----------------------------------------|-----------------|----------
1    | booking_payments (all)                 | 423             | DELETED
2    | booking_addons (all)                   | 89              | DELETED
3    | bookings (all)                         | 156             | DELETED
4    | review_responses (all)                 | 34              | DELETED
5    | reviews (all)                          | 78              | DELETED
6    | invoice_line_items (all)               | 245             | DELETED
7    | invoices (all)                         | 189             | DELETED
...
18   | 🏠 rooms (non-admin only)              | 141             | DELETED
19   | property_promotions (non-admin)        | 23              | DELETED
20   | 🏢 properties (non-admin only)         | 38              | DELETED
21   | 🏭 companies (non-admin only)          | 12              | DELETED
...
26   | 👤 USERS (non-super-admin)             | 45              | DELETED
```

**At the end, you should see:**
```
✅ Selective Data Deletion Complete!
🔒 Super admin users preserved: 1
🔒 Companies preserved: 1
🔒 Properties preserved: 2
🔒 Rooms preserved: 15
```

Notice:
- **"(all)"** means ALL records deleted (bookings, invoices, reviews)
- **"(non-admin only)"** means only non-admin data deleted (properties, rooms, companies)

---

### Step 6: Verify Results ✅

**Why:** Confirm correct data was preserved

Run these queries in SQL Editor:

**Check Users (should only be super admin):**
```sql
SELECT
  u.email,
  ut.name as user_type,
  u.status
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
ORDER BY ut.name, u.email;
```

**Expected:** Only super admin users

---

**Check Companies (should be your company):**
```sql
SELECT
  c.name,
  c.slug,
  u.email as owner_email
FROM public.companies c
JOIN public.users u ON c.user_id = u.id;
```

**Expected:** Your company(ies)

---

**Check Properties (should be your properties):**
```sql
SELECT
  p.name,
  p.slug,
  c.name as company_name,
  p.is_active
FROM public.properties p
LEFT JOIN public.companies c ON p.company_id = c.id;
```

**Expected:** Your properties

---

**Check Rooms (should be your rooms):**
```sql
SELECT
  r.name,
  p.name as property_name,
  r.room_type,
  r.base_price,
  r.max_guests
FROM public.rooms r
JOIN public.properties p ON r.property_id = p.id
ORDER BY p.name, r.name;
```

**Expected:** All your rooms

---

**Check Bookings (should be empty):**
```sql
SELECT COUNT(*) as booking_count FROM public.bookings;
```

**Expected:** 0 (all bookings deleted)

---

**Check Non-Admin Data (should be empty):**
```sql
-- Check for non-admin users
SELECT COUNT(*) FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name != 'super_admin';

-- Check for non-admin companies
SELECT COUNT(*) FROM public.companies c
JOIN public.users u ON c.user_id = u.id
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name != 'super_admin';
```

**Expected:** Both should return 0

---

### Step 7: Clean Up (Optional) 🧹

**Why:** Remove the temporary functions to keep database clean

Run these commands:

```sql
DROP FUNCTION IF EXISTS delete_all_data_except_super_admin();
DROP FUNCTION IF EXISTS is_super_admin_property(UUID);
```

This removes the two functions we created in Step 4.

---

## ⚠️ Troubleshooting

### Error: "No super admin user found"
**Solution:** You need to create a super admin first
- Check user_types table has a 'super_admin' entry
- Create a user with user_type_id matching super_admin
- Re-run Step 1 to verify

### My properties aren't showing as preserved
**Solution:** Check property ownership
- Properties must be owned by super admin directly (user_id)
- OR owned by a company that belongs to super admin (company.user_id)
- Run Step 1 verification to see what will be preserved

### Error: "Foreign key constraint violation"
**Solution:** The script handles this automatically
- If you get this error, the script may be incomplete
- Ensure you copied the ENTIRE `DELETE_ALL_DATA_EXCEPT_ADMIN.sql` file
- Check that both functions were created (Step 4)

### Deletion is taking too long (>10 minutes)
**Solution:** This is normal for large databases
- Wait patiently
- Check Supabase dashboard for activity
- The function will complete eventually
- Each step is logged, so you can see progress

### I want to restore the data
**Solution:** Use the backup you created in Step 3
1. Go to: Settings → Database → Backups
2. Find the backup from today
3. Click "Restore"
4. Wait for restoration to complete (5-15 minutes)

### I accidentally ran it without backup
**Solution:** Check if Supabase has automatic backups
- Settings → Database → Backups
- Supabase keeps automatic backups for 7 days on paid plans
- If on free plan, data may be unrecoverable

### Some of my rooms are missing
**Solution:** Check if they belonged to non-admin properties
- Only rooms belonging to super admin properties are kept
- If a property is owned by a non-admin user, all its rooms are deleted
- Review the output of Step 1 to see what was preserved

---

## 📊 Summary

### What Gets Preserved:
- ✅ Super admin users
- ✅ Super admin companies
- ✅ Super admin properties
- ✅ Super admin rooms (all related data)
  - Room beds
  - Seasonal rates
  - Payment rule assignments
- ✅ Super admin property data
  - Property addons
  - Property promotions
  - Property payment rules
- ✅ System configuration
  - Subscription types
  - User types
  - Permissions & roles
  - Location data

### What Gets Deleted:
- ❌ All non-admin users
- ❌ All non-admin companies
- ❌ All non-admin properties & rooms
- ❌ **All bookings** (including admin property bookings)
- ❌ **All invoices** (transactional data)
- ❌ All reviews (user-generated content)
- ❌ All wishlists
- ❌ All chats
- ❌ Non-admin notifications
- ❌ Non-admin subscriptions

### Time Required:
- Verification: 2 minutes
- Dry run: 1 minute
- Backup creation: 2-5 minutes
- Deletion execution: 2-10 minutes (depends on data volume)
- **Total: ~15 minutes**

---

## 🎯 Use Cases

**When to use this:**
- Cleaning up test/demo data while keeping your property catalog
- Removing customer data for privacy compliance
- Resetting transactional data (bookings, payments) for new season
- Testing with fresh bookings but same properties

**When NOT to use this:**
- If you want to keep historical bookings
- If you need invoice records for accounting
- If you're unsure about what will be deleted

---

## 🔐 Security Notes

- The script includes a **safety check** that prevents execution if no super admin exists
- The script uses a **helper function** to identify admin properties (can't delete by mistake)
- The script **handles missing tables** gracefully (won't fail if a table doesn't exist)
- The deletion order respects **foreign key constraints** to prevent errors
- **Transactional integrity** - uses proper SQL transactions

---

## 📞 Need Help?

If you encounter issues:

1. Check the error message carefully
2. Verify you completed all prerequisite steps
3. Check Supabase logs: Dashboard → Logs → Database
4. Review the dry run output (Step 2) to understand what happened
5. If stuck, restore from backup and try again

---

## ✅ Post-Deletion Checklist

After successful deletion:

- [ ] Verify only super admin exists (Step 6 queries)
- [ ] Confirm your company exists
- [ ] Confirm your properties exist
- [ ] Confirm your rooms exist
- [ ] Confirm bookings are gone (transactional reset)
- [ ] Test login with super admin account
- [ ] Check dashboard loads correctly
- [ ] Properties display correctly in frontend
- [ ] Ready to create new users and accept bookings

---

## 🎉 What's Next?

After deletion, you have a clean system with:
- Your business structure intact (properties, rooms, pricing)
- No customer data or transactional records
- Fresh slate for new bookings and users

You can now:
1. Create new user accounts
2. Start accepting bookings
3. Generate new invoices
4. Test with clean data

---

**Remember:** This preserves your business assets while resetting transactional data. Always create a backup first! 💾
