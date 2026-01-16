# Database Standards - Vilo Platform

## Overview

This document establishes **mandatory standards** for all database schema changes in the Vilo platform.

**Version**: 1.0  
**Last Updated**: 2026-01-16  
**Status**: ENFORCED via automated validation

---

## Quick Reference

### Naming Conventions

```
Tables:      snake_case, plural       →  bookings, user_permissions
Columns:     snake_case               →  user_id, created_at, is_active
Indexes:     idx_{table}_{column}     →  idx_bookings_user_id
Constraints: {table}_{column}_{type}  →  users_email_unique
FKs:         fk_{source}_{target}     →  fk_bookings_users
Enums:       {context}_{name}         →  booking_status, payment_method
```

### Data Type Standards

| Type | Use | Don't Use |
|------|-----|-----------|
| IDs | `UUID DEFAULT uuid_generate_v4()` | SERIAL, BIGSERIAL |
| Timestamps | `TIMESTAMPTZ` | TIMESTAMP (no timezone) |
| Money | `INTEGER` (cents) | FLOAT, DECIMAL |
| JSON | `JSONB` | JSON |
| Booleans | `BOOLEAN NOT NULL DEFAULT false` | NULL booleans |
| Text | `TEXT` | VARCHAR without length reason |

### Migration File Format

```
###[A-Z]_descriptive_snake_case.sql

Example: 099_add_booking_tags.sql
Example: 030A_create_cancellation_policies.sql (duplicate with suffix)
```

---

## Detailed Standards

See the approved plan at `.claude/plans/zippy-dazzling-pebble.md` for complete standards including:

- Foreign Key Standards (always specify ON DELETE/UPDATE)
- Index Standards (when to create, types)
- RLS Policy Standards (naming, templates)
- Column Addition/Removal Process (4-week deprecation)
- Migration File Required Sections (header, pre-flight, backup, changes, verification, rollback)
- Idempotency Patterns (IF EXISTS, IF NOT EXISTS)

---

## Validation

All migrations are automatically validated:

```bash
# Validate migrations
npm run migration:validate

# Check for schema drift
npm run schema:drift
```

**Pre-commit hook**: Blocks commits with invalid migrations

**Important**: Migrations 001-098 are grandfathered in (created before standards). Only NEW migrations (099+) must follow these standards. The pre-commit hook will flag old migrations but this is expected - it ensures all future migrations are compliant.

---

## Examples

### Add Column (Idempotent)

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR(50);
  END IF;
END $$;
```

### Create Table with Foreign Keys

```sql
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  guest_id UUID REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  total_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_confirmed BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
```

### Enable RLS

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookings_owner_policy
ON bookings
FOR ALL
TO authenticated
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);
```

---

## Pre-Commit Checklist

Before committing a migration:

- [ ] File name: `###_snake_case.sql`
- [ ] Header with: Migration, Description, Date, Author, Risk
- [ ] Idempotent (IF EXISTS/IF NOT EXISTS)
- [ ] Foreign keys have ON DELETE/UPDATE
- [ ] Indexes for foreign keys
- [ ] RLS policies for new tables
- [ ] Verification section
- [ ] Rollback instructions
- [ ] Backup for destructive ops
- [ ] `npm run migration:validate` passes

---

**For complete standards documentation, see the governance plan.**
