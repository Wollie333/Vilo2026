# Apply Migration 058 - Fix Booking Wizard Access

## Problem Found

The BookingWizardPage cannot load property data because the database has Row Level Security (RLS) policies that block anonymous users from viewing publicly listed properties.

The booking wizard uses an **anonymous client** (not logged in) to fetch public property data, but the RLS policies only allow **authenticated** users to view properties.

## Solution

Migration `058_add_public_property_access_policy.sql` adds RLS policies to allow anonymous users to view:
- Publicly listed properties (`is_listed_publicly = true`)
- Rooms for public properties
- Add-ons for public properties
- Reviews for public properties
- Location data (countries, provinces, cities)
- Companies (for branding)
- Room beds and seasonal rates

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `backend/migrations/058_add_public_property_access_policy.sql`
5. Paste into the SQL editor
6. Click **Run** button
7. You should see: "Success. No rows returned"

### Option 2: Using Supabase CLI

```bash
# From the backend directory
cd backend

# Apply the migration
supabase db push
```

## Verify It Worked

After applying the migration, test the booking wizard:

1. **Run the diagnostic test:**
   ```bash
   node test-booking-wizard.js
   ```

   You should see:
   - ✅ Found 1 properties
   - ✅ Property loaded successfully
   - Property title, image, rooms, and add-ons displayed

2. **Test in browser:**
   - Open: http://localhost:5173/accommodation/vilo/book
   - You should see:
     - Property title and featured image in the sidebar
     - Step 1: Date picker and room selection
     - All rooms displayed with images and pricing

## What This Migration Does

### Before Migration:
- Anonymous API calls to `/api/discovery/properties/vilo` → ❌ "Property not found"
- Booking wizard shows blank screen

### After Migration:
- Anonymous API calls to `/api/discovery/properties/vilo` → ✅ Returns full property data
- Booking wizard displays property info, rooms, and add-ons correctly

## Troubleshooting

If the test still fails after applying the migration:

1. **Check if RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('properties', 'rooms', 'add_ons');
   ```
   All should show `rowsecurity = true`

2. **Check if policies exist:**
   ```sql
   SELECT schemaname, tablename, policyname, roles
   FROM pg_policies
   WHERE tablename IN ('properties', 'rooms', 'add_ons')
   AND roles @> ARRAY['anon'];
   ```
   You should see policies for anonymous users

3. **Restart backend server:**
   ```bash
   cd backend
   npm run dev
   ```

## Next Steps

After migration is applied and verified:
1. The booking wizard should work perfectly
2. Test the complete booking flow
3. Move on to Refund Manager feature

---

**Created:** 2026-01-14
**Status:** Ready to apply
