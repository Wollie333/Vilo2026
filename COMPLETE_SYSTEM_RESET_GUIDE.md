# Complete System Reset Guide

**Date:** 2026-01-12
**Purpose:** Delete ALL data from the system except super admin users

---

## ⚠️ CRITICAL WARNING

This operation will **PERMANENTLY DELETE**:
- ✅ All bookings and related data
- ✅ All properties, rooms, and seasonal rates
- ✅ All companies and team members
- ✅ All reviews and ratings
- ✅ All invoices and financial records
- ✅ All checkouts and payment records
- ✅ All wishlists
- ✅ All chat messages
- ✅ All non-super-admin users

**ONLY KEEPS:**
- ✅ Super admin users
- ✅ System configuration (subscription types, user types, permissions)

---

## Prerequisites

1. **You MUST have a super admin user** in the system
2. **Create a backup** before proceeding (see Step 2)
3. Access to Supabase SQL Editor or database connection

---

## Step-by-Step Instructions

### Step 1: Dry Run - Review What Will Be Deleted

Open Supabase SQL Editor and run this query to see counts:

```sql
SELECT
  'Users to delete' as category,
  COUNT(*) as count
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name != 'super_admin'

UNION ALL

SELECT 'Properties to delete', COUNT(*) FROM public.properties
UNION ALL
SELECT 'Companies to delete', COUNT(*) FROM public.companies
UNION ALL
SELECT 'Bookings to delete', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'Rooms to delete', COUNT(*) FROM public.rooms
UNION ALL
SELECT 'Reviews to delete', COUNT(*) FROM public.reviews
UNION ALL
SELECT 'Invoices to delete', COUNT(*) FROM public.invoices
UNION ALL
SELECT 'Checkouts to delete', COUNT(*) FROM public.checkouts
UNION ALL
SELECT 'Wishlists to delete', COUNT(*) FROM public.wishlists
UNION ALL
SELECT 'User subscriptions to delete', COUNT(*) FROM public.user_subscriptions;
```

**Expected Output:**
```
category                          | count
----------------------------------|-------
Users to delete                   | 150
Properties to delete              | 45
Companies to delete               | 30
Bookings to delete                | 200
... etc
```

Review these numbers carefully before proceeding.

---

### Step 2: Create Backup (MANDATORY!)

**Option A: Using Supabase Dashboard**
1. Go to Supabase Dashboard → Settings → Database
2. Click "Create a backup"
3. Wait for backup to complete
4. Download the backup file

**Option B: Using pg_dump (if you have direct access)**
```bash
pg_dump -U your_user -d your_database -F c -b -v -f "backup_before_reset_$(date +%Y%m%d_%H%M%S).backup"
```

**⛔ DO NOT PROCEED without a backup!**

---

### Step 3: Load the Reset Function

Copy the entire contents of `backend/migrations/TEMP_075_complete_system_reset.sql` and paste into Supabase SQL Editor.

Click **"Run"** to create the functions.

You should see:
```
✅ Safety check passed: Super admin user exists
```

If you see an error about no super admin, **STOP** - you need to ensure at least one super admin user exists first.

---

### Step 4: Execute the Complete Reset

Run this query in Supabase SQL Editor:

```sql
SELECT * FROM complete_system_reset();
```

**This will take 30-60 seconds depending on data volume.**

You'll see output like:

```
step_number | step_name                              | records_deleted | status
------------|----------------------------------------|-----------------|----------
1           | Delete booking_payments                | 350             | COMPLETED
2           | Delete booking_addons                  | 120             | COMPLETED
3           | Delete bookings                        | 200             | COMPLETED
4           | Delete review_responses                | 45              | COMPLETED
5           | Delete reviews                         | 89              | COMPLETED
... (continues for all 31 steps)
31          | Delete users (non-super-admin)         | 150             | COMPLETED
```

---

### Step 5: Verify the Results

Run these queries to confirm the reset worked:

**Check remaining users (should only be super admins):**
```sql
SELECT u.email, ut.name as user_type, u.is_active
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
ORDER BY ut.name, u.email;
```

**Expected Output:**
```
email                  | user_type   | is_active
-----------------------|-------------|----------
admin@vilo.com         | super_admin | true
```

**Verify all data is cleared:**
```sql
SELECT 'Properties' as table_name, COUNT(*) as remaining FROM public.properties
UNION ALL
SELECT 'Bookings', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'Companies', COUNT(*) FROM public.companies
UNION ALL
SELECT 'Rooms', COUNT(*) FROM public.rooms
UNION ALL
SELECT 'Reviews', COUNT(*) FROM public.reviews
UNION ALL
SELECT 'Users (non-admin)', COUNT(*) FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name != 'super_admin';
```

**Expected Output (all zeros except last row):**
```
table_name          | remaining
--------------------|----------
Properties          | 0
Bookings            | 0
Companies           | 0
Rooms               | 0
Reviews             | 0
Users (non-admin)   | 0
```

---

### Step 6: Clean Up (Optional)

Remove the temporary functions:

```sql
DROP FUNCTION IF EXISTS complete_system_reset();
DROP FUNCTION IF EXISTS backup_system_data();
```

---

## What Gets Deleted (Complete List)

### Booking System
- booking_payments
- booking_addons
- bookings

### Reviews & Ratings
- review_responses
- reviews

### Financial Records
- invoice_line_items
- credit_notes
- invoices
- checkouts

### Social Features
- wishlists
- chat_messages
- chat_participants
- chats

### Property Management
- room_payment_rule_assignments
- property_payment_rules
- room_assignments
- seasonal_rates
- room_beds
- rooms
- property_promotions
- property_addons
- properties

### Company Management
- company_team_members
- companies

### User Data (Non-Super-Admin)
- user_subscriptions
- user_permissions
- notification_preferences
- notifications
- audit_logs (for non-admin actors)
- users (non-super-admin only)

---

## What Gets KEPT

### System Configuration
- user_types (super_admin, customer, property_owner, etc.)
- subscription_types (Free Tier, Basic, Premium, etc.)
- subscription_type_permissions
- permissions
- user_type_permissions
- payment_integrations
- cancellation_policies
- countries, provinces, cities (location data)

### Super Admin Users
- All users where user_type = 'super_admin'
- Their permissions and subscriptions

---

## Troubleshooting

### Error: "No super admin user found"

**Solution:**
1. Check if super admin exists:
```sql
SELECT u.email, ut.name
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name = 'super_admin';
```

2. If no results, you need to promote a user to super admin first:
```sql
-- Find super_admin user_type_id
SELECT id FROM public.user_types WHERE name = 'super_admin';

-- Update a user to be super admin (replace USER_ID and USER_TYPE_ID)
UPDATE public.users
SET user_type_id = 'USER_TYPE_ID_HERE'
WHERE id = 'USER_ID_HERE';
```

### Error: Foreign key constraint violation

**Solution:** The script should handle all foreign keys, but if you get this error:
1. Note which table is mentioned in the error
2. Check if that table needs to be added to the deletion sequence
3. Contact support or manually delete that table's records first

### Script runs but data still exists

**Solution:**
1. Check for errors in the function output
2. Verify you ran `SELECT * FROM complete_system_reset();` not just created the function
3. Check if RLS policies are blocking deletions (script uses admin client so should bypass RLS)

---

## Recovery

If you need to restore after the reset:

**Using Supabase Dashboard:**
1. Go to Settings → Database → Backups
2. Select the backup created in Step 2
3. Click "Restore"

**Using pg_restore:**
```bash
pg_restore -U your_user -d your_database -v "backup_file.backup"
```

---

## After Reset: Fresh Start

With a clean system, you can:

1. **Create test users** - Use the signup flow or create via admin panel
2. **Add properties** - Test property creation flow
3. **Create bookings** - Test the booking system
4. **Verify permissions** - Ensure new users have correct access based on subscription plan

The system configuration (subscription plans, permissions, user types) is still intact, so all the functionality remains - you just have a clean slate of data.

---

## Safety Features

✅ **Super Admin Protection** - Cannot delete super admin users
✅ **Existence Check** - Aborts if no super admin exists
✅ **Dry Run Available** - Review counts before execution
✅ **Step-by-Step Output** - See exactly what's being deleted
✅ **Transaction Safety** - All deletions in proper order to avoid FK violations

---

**Questions?** Review the SQL file at `backend/migrations/TEMP_075_complete_system_reset.sql` for detailed comments and logic.
