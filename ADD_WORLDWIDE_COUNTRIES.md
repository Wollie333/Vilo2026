# Add Worldwide Countries to Location Selector

## What This Does
Adds 50+ popular countries worldwide to your location database, including:
- **Africa**: Egypt, Kenya, Morocco, Tanzania
- **Americas**: USA, Canada, Mexico, Brazil, Argentina, and more
- **Asia**: Japan, Thailand, Singapore, UAE, Vietnam, and more
- **Europe**: UK, France, Germany, Spain, Italy, Greece, and more
- **Oceania**: Australia, New Zealand, Fiji

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of:
   ```
   backend/migrations/062_add_worldwide_countries.sql
   ```
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)
7. You should see: "Success. No rows returned"

### Option 2: Command Line (if you have psql installed)

```bash
# From project root
psql -h your-supabase-host -U postgres -d postgres -f backend/migrations/062_add_worldwide_countries.sql
```

## Verify It Worked

1. Go to your app's **Listing Details** page
2. Click on the **Location** section
3. Open the **Country** dropdown
4. You should now see 50+ countries instead of just "South Africa"

## What's Included

The migration adds countries in alphabetical order within regions:
- ✅ All major tourism destination countries
- ✅ Popular vacation rental markets
- ✅ ISO country codes (both 2-letter and 3-letter)
- ✅ Sorted for easy discovery

## Need More Countries?

If you need additional countries that aren't included, you can:
1. Edit `backend/migrations/062_add_worldwide_countries.sql`
2. Add more INSERT statements following the same format
3. Re-run the migration

Example format:
```sql
('Country Name', 'XXX', 'XX', 500),
```
Where:
- 'Country Name' = Full country name
- 'XXX' = ISO 3166-1 alpha-3 code (3 letters)
- 'XX' = ISO 3166-1 alpha-2 code (2 letters)
- 500 = Sort order (higher numbers appear later)

## Technical Notes

- Uses `ON CONFLICT (code) DO UPDATE` to safely re-run
- Preserves existing South Africa data
- Updates `updated_at` timestamp if country already exists
- Sort order determines dropdown sequence
