# 🔧 Fix Room Availability Checking

## Problem
Rooms with existing bookings can still be booked again because the database function `check_room_availability` has a bug. It counts `DISTINCT unit_number` which doesn't work correctly for single-unit rooms.

## Solution
The fix has been created in: `backend/migrations/046_fix_availability_checking.sql`

## How to Apply the Fix

### Option 1: Supabase SQL Editor (Recommended - Easy!)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Open your Vilo project

2. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Copy the SQL**
   - Open file: `backend/migrations/046_fix_availability_checking.sql`
   - Copy ALL the contents (Ctrl+A, Ctrl+C)

4. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" button
   - You should see "Success. No rows returned"

5. **Done!**
   - The availability checking is now fixed
   - Test by trying to book a room on dates that already have a booking

### Option 2: Command Line (If you prefer)

```bash
# Install pg module first
npm install pg --save-dev

# Then run the migration script
cd backend
node apply-migration-046.js
```

## What Was Fixed

**Before (Buggy):**
```sql
-- Counted DISTINCT unit_numbers - broken for single unit rooms
SELECT COUNT(DISTINCT br.unit_number) ...
```

**After (Fixed):**
```sql
-- For single_unit rooms: Count ALL bookings
-- For multiple_units rooms: Count distinct unit numbers
IF v_room.inventory_mode = 'single_unit' THEN
  SELECT COUNT(*) ...
ELSE
  SELECT COUNT(DISTINCT br.unit_number) ...
END IF;
```

## How to Test

1. **Find an existing booking** in your calendar
2. **Try to create a new booking** for the SAME room on OVERLAPPING dates
3. **Expected result**:
   - Room should show "Not Available" badge (red)
   - Room card should be grayed out
   - Clicking room should do nothing
   - If you somehow submit, backend should reject with error

## What Happens Now

✅ **Frontend already blocks unavailable rooms** (opacity, red badge, disabled click)
✅ **Backend already validates availability** (throws CONFLICT error if unavailable)
❌ **Database function was broken** (returning wrong availability status)
✅ **Database function is now fixed** (after applying this migration)

Once you apply the migration, the entire system will work correctly and prevent double-booking!
