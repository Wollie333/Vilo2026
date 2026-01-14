# How to Backup Your Database

## Option 1: Use Supabase Built-in Backup (Recommended)

### Where to Find It:

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project
3. In the left sidebar, look for **"Database"** and click it
4. You should see tabs at the top - click **"Backups"** tab
   - If you don't see "Backups" tab, it might be under **"Settings"** → **"Database"** → **"Backups"**

### Alternative Path:
1. Go to **"Project Settings"** (gear icon in left sidebar)
2. Click **"Database"** in the settings menu
3. Scroll down to find backup options

### Note:
- **Free plan**: Manual backups might not be available
- **Paid plans**: You can create manual backups and schedule them

---

## Option 2: Export Data Using SQL Script (Works on Free Plan)

### Step 1: Run the Backup Script

1. Open the file: `BACKUP_DATABASE.sql` (I just created it)
2. Copy the entire contents
3. Go to **Supabase SQL Editor**
4. Paste and click **Run**

### Step 2: Save the Output

The script will generate INSERT statements. Save the entire output to a file:

**Save as:** `database_backup_2026-01-12.sql`

---

## Option 3: Export to JSON (Easiest)

Run this script in Supabase SQL Editor and save the output:

```sql
-- Export all data to JSON format
SELECT jsonb_build_object(
  'backup_date', NOW(),
  'users', (SELECT jsonb_agg(row_to_json(u)) FROM (
    SELECT * FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name != 'super_admin'
  ) u),
  'companies', (SELECT jsonb_agg(row_to_json(c)) FROM public.companies c),
  'properties', (SELECT jsonb_agg(row_to_json(p)) FROM public.properties p),
  'rooms', (SELECT jsonb_agg(row_to_json(r)) FROM public.rooms r),
  'bookings', (SELECT jsonb_agg(row_to_json(b)) FROM public.bookings b),
  'invoices', (SELECT jsonb_agg(row_to_json(i)) FROM public.invoices i),
  'checkouts', (SELECT jsonb_agg(row_to_json(c)) FROM public.checkouts c)
) as backup_json;
```

**Save the output to:** `database_backup_2026-01-12.json`

---

## Option 4: Use pg_dump (If You Have Database URL)

If you have your database connection string:

```bash
# Get connection string from Supabase Dashboard → Project Settings → Database
pg_dump "your-connection-string-here" > backup_2026-01-12.sql
```

---

## Which Option Should You Use?

### For Your Situation (Small Dataset):
**Use Option 3 (JSON Export)** - It's the simplest and works on all plans.

1. Run the JSON export query in SQL Editor
2. Copy the entire JSON output
3. Save it to a file: `C:\Users\Wollie\Desktop\Vilo\ViloNew\backup_2026-01-12.json`

This gives you a complete backup you can restore from if needed.

---

## After Backing Up

Once you have the backup saved:

1. ✅ Verify the file exists and has content
2. ✅ Proceed with the system reset
3. ✅ Keep the backup file safe

---

## To Restore From Backup Later

If you need to restore:

### From JSON backup:
You'll need to write INSERT statements based on the JSON data.

### From SQL backup:
Just run the SQL file in Supabase SQL Editor.

---

## Quick Backup Now

**Fastest way:**

1. Open Supabase SQL Editor
2. Run this simple query:

```sql
COPY (
  SELECT row_to_json(t)
  FROM (
    SELECT
      (SELECT json_agg(u) FROM public.users u WHERE user_type_id IN (SELECT id FROM user_types WHERE name != 'super_admin')) as users,
      (SELECT json_agg(c) FROM public.companies c) as companies,
      (SELECT json_agg(p) FROM public.properties p) as properties,
      (SELECT json_agg(r) FROM public.rooms r) as rooms,
      (SELECT json_agg(b) FROM public.bookings b) as bookings,
      (SELECT json_agg(i) FROM public.invoices i) as invoices,
      (SELECT json_agg(ch) FROM public.checkouts ch) as checkouts
  ) t
) TO STDOUT;
```

3. Copy the output
4. Save to: `backup_2026-01-12.json`

---

## Your Data is Small

You're only backing up:
- 1 user
- 1 company
- 1 property
- 3 rooms
- 4 bookings
- 2 invoices
- 11 checkouts

This will take less than 1 minute to backup and the file will be small (< 100KB).
