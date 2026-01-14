# Fix Wishlist/Favorites Issue

## Problem
When you click the heart icon to favorite a property, it doesn't show up in the wishlist page at `/wishlist`.

## Root Cause
The `user_wishlists` table likely hasn't been created in your Supabase database yet.

## Solution

### Option 1: Run Migration Script (Recommended)

1. **Stop your backend server** (Ctrl+C in the backend terminal)

2. **Run the migration script:**
   ```bash
   node apply-wishlist-migration.js
   ```

3. **Restart your backend:**
   ```bash
   cd backend
   npm run dev
   ```

### Option 2: Manual Migration (If Script Fails)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the **entire contents** of:
   ```
   backend/migrations/054_create_wishlist_schema.sql
   ```
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)
7. You should see: "Success. No rows returned"

## Verify It's Working

### Test 1: Check the Table Exists
1. In Supabase Dashboard → **Table Editor**
2. Look for a table called `user_wishlists`
3. It should have columns: `id`, `user_id`, `property_id`, `notes`, `created_at`

### Test 2: Add to Wishlist
1. Go to your frontend: `http://localhost:5173/search`
2. Click the **heart icon** on any property
3. The heart should turn **red** (filled)
4. Check browser console - should see no errors

### Test 3: View Wishlist Page
1. Navigate to: `http://localhost:5173/wishlist`
2. You should see the property you just favorited
3. If empty, check:
   - Are you logged in?
   - Is the property `is_listed_publicly = true`?
   - Is the property `is_active = true`?

## Troubleshooting

### Issue: "Property added but doesn't show in wishlist"

**Possible causes:**

1. **Property not publicly listed:**
   - Go to property management
   - Navigate to "Listing Details" → "Public Listing" tab
   - Toggle "List Property Publicly" to **ON**

2. **Property not active:**
   - Check property settings
   - Ensure `is_active` is set to true

3. **RLS Policy Issue:**
   - The migration creates RLS policies
   - Make sure you're logged in when testing
   - User ID must match between auth and database

### Issue: "Heart icon doesn't toggle"

**Check browser console for errors:**

```javascript
// Should see this after clicking heart:
POST http://localhost:3000/api/wishlist
Status: 201 Created
```

If you see a 401 error:
- You're not authenticated
- Log out and log back in
- Clear browser cookies

If you see a 500 error:
- Check backend console for details
- Likely a database issue
- Run the migration again

### Issue: "Table already exists error"

This is fine! It means the table was already created. Just verify:

```sql
-- Run this in Supabase SQL Editor
SELECT COUNT(*) FROM user_wishlists;
```

Should return a number (even 0 is fine).

## What the Migration Creates

1. **Table:** `user_wishlists`
   - Stores which properties users have favorited
   - Includes optional notes field

2. **Indexes:**
   - Fast lookups by user ID
   - Fast lookups by property ID
   - Optimized for wishlist checks

3. **RLS Policies:**
   - Users can only view/modify their own wishlist
   - Secure by default

4. **Helper Function:**
   - `get_property_wishlist_count()` - Shows how many users saved a property

## Testing Commands

### Backend Test (from project root):
```bash
# Check if migration exists
ls backend/migrations/054_create_wishlist_schema.sql

# Run migration script
node apply-wishlist-migration.js
```

### API Test (with curl):
```bash
# Add to wishlist (replace TOKEN and PROPERTY_ID)
curl -X POST http://localhost:3000/api/wishlist \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"property_id": "PROPERTY_UUID"}'

# Get wishlist
curl http://localhost:3000/api/wishlist \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Expected Behavior After Fix

1. Click heart icon → Heart fills with red color
2. Navigate to `/wishlist` → Property appears in list
3. Click heart again → Property removed from wishlist
4. Refresh wishlist page → Property is gone

## Still Having Issues?

Check these common mistakes:

1. **Not logged in** - Wishlist requires authentication
2. **Backend not running** - Start with `npm run dev` in backend folder
3. **Wrong database** - Check `SUPABASE_URL` in backend/.env
4. **RLS enabled but no user** - Make sure you're using authenticated requests
5. **Property deleted or inactive** - Only active, publicly listed properties show up

## Need Help?

If issues persist:
1. Check backend console for errors
2. Check browser console for errors
3. Verify migration was applied: Look for `user_wishlists` table in Supabase
4. Test with a simple property that you know is active and public
