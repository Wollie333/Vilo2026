# Apply Review Manager Migrations

## Quick Steps

### Migration 049: Create Reviews Schema

1. **Go to Supabase Dashboard**
   - Open your project dashboard
   - Click **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New query** button
   - Name it: "049 - Create Reviews Schema"

3. **Copy Migration SQL**
   - Open: `backend/migrations/049_create_reviews_schema.sql`
   - Select ALL content (Ctrl+A)
   - Copy (Ctrl+C)

4. **Paste and Run**
   - Paste into SQL Editor (Ctrl+V)
   - Click **Run** button (or press Ctrl+Enter)
   - Wait for "Success" message

### Migration 050: Create Review Storage

1. **Create New Query**
   - Click **New query** button again
   - Name it: "050 - Create Review Storage"

2. **Copy Migration SQL**
   - Open: `backend/migrations/050_create_review_storage.sql`
   - Select ALL content (Ctrl+A)
   - Copy (Ctrl+C)

3. **Paste and Run**
   - Paste into SQL Editor (Ctrl+V)
   - Click **Run** button (or press Ctrl+Enter)
   - Wait for "Success" message

---

## Verify Migrations Applied

After running both migrations, verify they worked:

```bash
node verify-review-tables.js
```

You should see:
- ✅ property_reviews table exists
- ✅ review_sent_at column exists on bookings table
- ✅ review-photos bucket exists

---

## What These Migrations Do

### Migration 049 (Reviews Schema)
- Creates `property_reviews` table with 5 category ratings
- Adds computed `rating_overall` column (average of 5 categories)
- Creates indexes for performance
- Sets up RLS policies for guests, property owners, and admins
- Adds `review_sent_at` column to `bookings` table

### Migration 050 (Review Storage)
- Creates `review-photos` storage bucket (5MB file limit)
- Allows: JPEG, JPG, PNG, WebP, HEIC images
- Sets up storage RLS policies for photo uploads
- Public bucket so review photos are accessible via URL

---

## If You Get Errors

### "relation already exists"
- This is OK - means migration already partially applied
- Continue to next migration

### "column role_name does not exist"
- This is FIXED in the current migration files
- Make sure you're using the latest version from backend/migrations/

### Other errors
- Copy the error message
- Share with Claude for troubleshooting

---

## Next Steps After Migrations

Once both migrations are applied successfully:
1. ✅ Backend API is ready (already created)
2. ⏭️ Test backend endpoints
3. ⏭️ Create email templates
4. ⏭️ Build frontend UI components
