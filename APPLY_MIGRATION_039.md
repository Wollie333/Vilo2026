# How to Apply Migration 039

## ⚠️ CRITICAL: This migration MUST be run before testing or production

## Option 1: Using Supabase Dashboard (RECOMMENDED)

1. Go to https://app.supabase.com
2. Open your project: `bzmyilqkrtpxhswtpdtc`
3. Navigate to: **SQL Editor**
4. Click: **New Query**
5. Copy the contents of: `backend/migrations/039_add_property_id_to_payment_rules.sql`
6. Paste into the editor
7. Click: **Run** (or press Ctrl+Enter)
8. Verify success message

## Option 2: Using psql Command Line

```bash
# Install PostgreSQL client if needed
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Run the migration
psql "postgresql://postgres:[YOUR_PASSWORD]@db.bzmyilqkrtpxhswtpdtc.supabase.co:5432/postgres" \
  -f backend/migrations/039_add_property_id_to_payment_rules.sql
```

## Option 3: Using Node.js Script

Create and run this script:

```javascript
// run-migration.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://bzmyilqkrtpxhswtpdtc.supabase.co';
const supabaseKey = 'sb_secret_7u2GwAuUBxC7iS4eTo_ISw_yFNwm3fe';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const sql = fs.readFileSync('backend/migrations/039_add_property_id_to_payment_rules.sql', 'utf8');

  // Split by semicolons and run each statement
  const statements = sql.split(';').filter(s => s.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      if (error) {
        console.error('Error:', error);
        break;
      }
    }
  }

  console.log('Migration completed!');
}

runMigration();
```

## Verification After Running

Run these queries to verify the migration succeeded:

```sql
-- Check column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'room_payment_rules'
AND column_name = 'property_id';

-- Check data was backfilled
SELECT COUNT(*) as total_rules,
       COUNT(property_id) as rules_with_property_id,
       COUNT(room_id) as rules_with_room_id
FROM room_payment_rules;

-- Check indexes created
SELECT indexname
FROM pg_indexes
WHERE tablename = 'room_payment_rules'
AND indexname LIKE '%property_id%';

-- Check RLS policies updated
SELECT policyname
FROM pg_policies
WHERE tablename = 'room_payment_rules';
```

## Expected Results

✅ `property_id` column exists in both tables
✅ All existing rules have `property_id` populated
✅ New indexes created successfully
✅ RLS policies updated (4 policies per table)
✅ Check constraints added

## If Migration Fails

1. Check error message
2. Verify you have admin/service role access
3. Try running statements one at a time
4. Contact database administrator

## After Migration

You can then:
- Test creating property-level payment rules
- Test creating property-level promo codes
- Complete all API endpoint tests
- Deploy to production
