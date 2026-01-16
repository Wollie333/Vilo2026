# Migration Approval Process - Vilo Platform

## Overview

This document defines the review and approval workflow for all database migrations. Following this process ensures database changes are safe, tested, and properly documented.

**Version**: 1.0
**Last Updated**: 2026-01-16
**Applies to**: Migrations 099 and later

---

## Quick Reference

| Risk Level | Approvers Required | Testing Required | Deployment Window |
|------------|-------------------|------------------|-------------------|
| **LOW** | 1 developer | Unit tests pass | Anytime |
| **MEDIUM** | 1 senior developer | Unit + integration tests | Business hours |
| **HIGH** | 2 senior developers | Full test suite + staging validation | Maintenance window |

---

## Risk Classification Guide

### LOW Risk Migrations

**Definition**: Additive changes with no impact on existing data

**Examples**:
- Adding new columns (with default values or nullable)
- Creating new indexes on existing columns
- Adding new tables (not referenced by existing code)
- Creating or updating RLS policies
- Adding new enum values (append only)
- Creating new triggers or functions

**Characteristics**:
- ✅ Reversible without data loss
- ✅ No existing data modifications
- ✅ No schema renames or drops
- ✅ Idempotent (can run multiple times safely)

---

### MEDIUM Risk Migrations

**Definition**: Schema modifications affecting existing structures

**Examples**:
- Modifying column types (e.g., VARCHAR(50) → VARCHAR(100))
- Adding NOT NULL constraints to existing columns
- Renaming tables or columns (requires code coordination)
- Modifying existing indexes
- Changing foreign key constraints
- Data migrations (UPDATE statements on existing records)
- Removing enum values (if unused)

**Characteristics**:
- ⚠️ Affects existing data or schema
- ⚠️ Requires code changes to support
- ⚠️ May impact performance temporarily
- ⚠️ Reversible but with coordination

---

### HIGH Risk Migrations

**Definition**: Destructive operations or major refactors

**Examples**:
- Dropping columns or tables
- Dropping indexes used by queries
- Changing column types incompatibly (e.g., TEXT → INTEGER)
- Adding NOT NULL without default to existing data
- Splitting or merging tables
- Changing primary keys or foreign key relationships
- Major data transformations
- Schema architecture changes

**Characteristics**:
- 🔴 Potential for data loss
- 🔴 May cause downtime
- 🔴 Requires extensive testing
- 🔴 Difficult or impossible to reverse
- 🔴 Requires staging environment validation

---

## Migration Workflow

### Step 1: Create Migration File

**Requirements**:
1. Use sequential numbering: `099_descriptive_name.sql`
2. Follow DATABASE_STANDARDS.md format
3. Include all required sections:
   - Header (Migration, Description, Date, Author, Risk)
   - Pre-flight checks (MEDIUM/HIGH risk)
   - Backup creation (destructive ops)
   - Schema changes (idempotent)
   - Verification queries
   - Rollback instructions

**Example Header**:
```sql
-- Migration: 099_add_booking_tags.sql
-- Description: Add tags field to bookings for categorization
-- Date: 2026-01-16
-- Author: Developer Name
-- Risk: LOW
```

---

### Step 2: Automated Validation

**Pre-commit Hook** automatically runs:
```bash
npm run migration:validate   # Validates migration format
npm run schema:drift          # Checks for schema inconsistencies
```

**If validation fails**:
- ❌ Commit is blocked
- Fix errors shown in output
- Re-attempt commit

**If validation passes**:
- ✅ Commit succeeds
- Proceed to create Pull Request

---

### Step 3: Pull Request Creation

**PR Title Format**:
```
[DB] Migration 099: Add booking tags
```

**PR Description Template**:
```markdown
## Migration Summary
**Migration Number**: 099
**Risk Level**: LOW | MEDIUM | HIGH
**Type**: Add Column | Create Table | Drop Column | etc.

## What Changes
- Describe what the migration does
- List tables/columns affected
- Explain why this change is needed

## Impact Assessment
- [ ] No existing data affected
- [ ] Backwards compatible with current code
- [ ] Requires code changes (link to related PR)
- [ ] May cause temporary performance impact

## Testing Checklist
- [ ] Migration runs successfully on clean database
- [ ] Migration is idempotent (can run twice safely)
- [ ] Rollback tested and documented
- [ ] Unit tests updated
- [ ] Integration tests pass
- [ ] Staging environment validated (HIGH risk only)

## Rollback Plan
Explain how to reverse this migration if needed.

## Related PRs
- Link to frontend/backend code changes if applicable
```

---

### Step 4: Code Review

**Review Checklist** (varies by risk level):

#### For ALL Migrations
- [ ] Migration file follows naming convention (`###_snake_case.sql`)
- [ ] Header complete (Migration, Description, Date, Author, Risk)
- [ ] SQL syntax is valid PostgreSQL
- [ ] Comments explain complex logic
- [ ] Idempotent (uses IF EXISTS/IF NOT EXISTS or DO $$ checks)
- [ ] Rollback instructions documented

#### For LOW Risk (+ all above)
- [ ] Changes are additive only
- [ ] No existing data affected
- [ ] No performance concerns

#### For MEDIUM Risk (+ all above)
- [ ] Pre-flight checks verify data state
- [ ] Related code changes identified (link to PR)
- [ ] Migration tested on copy of production data
- [ ] Performance impact assessed
- [ ] Deployment order documented (DB first or code first?)

#### For HIGH Risk (+ all above)
- [ ] Backup tables created before destructive ops
- [ ] Staged rollout plan (e.g., feature flag)
- [ ] Downtime window estimated
- [ ] Stakeholders notified
- [ ] Tested on staging environment with production data snapshot
- [ ] Monitoring plan for post-deployment
- [ ] Emergency rollback plan ready

---

### Step 5: Approval Requirements

| Risk Level | Who Can Approve | How Many Required |
|------------|----------------|-------------------|
| **LOW** | Any developer | 1 approval |
| **MEDIUM** | Senior developer | 1 approval |
| **HIGH** | Senior developer or tech lead | 2 approvals |

**Approval means**:
- ✅ Reviewer has read the migration SQL
- ✅ Reviewer verified checklist items
- ✅ Reviewer approves risk level assessment
- ✅ Reviewer approves rollback plan

---

### Step 6: Testing Requirements

#### LOW Risk
```bash
# Run migration on local dev database
psql -d vilo_dev -f backend/migrations/099_add_booking_tags.sql

# Verify change
psql -d vilo_dev -c "\d bookings"

# Run automated tests
npm run test:backend
```

#### MEDIUM Risk (+ LOW tests)
```bash
# Test on staging database
psql -d vilo_staging -f backend/migrations/099_*.sql

# Verify with real-ish data
# Run integration tests
npm run test:e2e

# Check application still works
npm run dev
# Manually test affected features
```

#### HIGH Risk (+ MEDIUM tests)
```bash
# Load production snapshot into staging
pg_restore -d vilo_staging production_snapshot.dump

# Run migration on production snapshot
psql -d vilo_staging -f backend/migrations/099_*.sql

# Validate data integrity
SELECT COUNT(*) FROM affected_table WHERE condition;

# Test rollback procedure
psql -d vilo_staging -f backend/migrations/099_rollback.sql

# Verify rollback worked
# Re-run migration to confirm idempotency
```

---

### Step 7: Merge and Deploy

**Merge Timing**:
- **LOW Risk**: Merge anytime after approval
- **MEDIUM Risk**: Merge during business hours (09:00-17:00 local time)
- **HIGH Risk**: Schedule merge during maintenance window

**Deployment Steps**:

1. **Merge PR** to main branch
2. **Backup production database** (automatic on HIGH risk):
   ```bash
   pg_dump -Fc vilo_production > backup_$(date +%Y%m%d_%H%M%S).dump
   ```
3. **Run migration**:
   ```bash
   # Option A: Automated (via CI/CD)
   ./scripts/run-migration.sh 099

   # Option B: Manual (HIGH risk only)
   psql -d vilo_production -f backend/migrations/099_*.sql
   ```
4. **Verify migration succeeded**:
   ```bash
   psql -d vilo_production -c "SELECT * FROM migration_log WHERE number = '099';"
   ```
5. **Deploy code changes** (if migration requires code updates)
6. **Monitor for 24-48 hours**

---

### Step 8: Post-Deployment Monitoring

**Immediate** (first 5 minutes):
- [ ] Check application logs for errors
- [ ] Verify key user flows work
- [ ] Check database CPU/memory usage
- [ ] Verify no spike in error rate

**Short-term** (first 24 hours):
- [ ] Monitor slow query log
- [ ] Check for unexpected lock waits
- [ ] Review error tracking (Sentry/etc.)
- [ ] Watch user-reported issues

**Long-term** (48 hours - 1 week):
- [ ] Confirm performance is stable
- [ ] Verify backup tables can be dropped (if created)
- [ ] Update documentation if needed
- [ ] Schedule cleanup tasks (e.g., `DROP TABLE backup_xyz`)

---

## Emergency Rollback Procedure

**When to rollback**:
- 🚨 Migration caused production errors
- 🚨 Application is broken after deployment
- 🚨 Performance degraded significantly
- 🚨 Data corruption detected

**How to rollback**:

### Step 1: Assess Impact
```bash
# Check what's broken
psql -d vilo_production -c "SELECT COUNT(*) FROM affected_table;"

# Check application logs
tail -f /var/log/vilo/app.log
```

### Step 2: Execute Rollback
```bash
# Use documented rollback from migration file
psql -d vilo_production -f backend/migrations/099_rollback.sql

# OR restore from backup (HIGH risk)
pg_restore -d vilo_production -c backup_20260116_140500.dump
```

### Step 3: Verify Rollback
```bash
# Confirm schema is back to previous state
psql -d vilo_production -c "\d table_name"

# Test application functionality
curl http://localhost:3000/health
```

### Step 4: Revert Code Changes
```bash
# If code was deployed with migration
git revert abc123
git push origin main
# Redeploy application
```

### Step 5: Post-Mortem
- Document what went wrong
- Update migration to fix issue
- Re-test thoroughly before re-attempting

---

## Migration Coordination

### Scenario: Migration Requires Code Changes

**Two-Phase Deployment**:

#### Phase 1: Backwards-Compatible Migration
```sql
-- Add new column, keep old column
ALTER TABLE users ADD COLUMN email_address TEXT;

-- Backfill new column from old
UPDATE users SET email_address = old_email;

-- Add index
CREATE INDEX idx_users_email_address ON users(email_address);
```

**Code**: Update app to write to BOTH columns

#### Phase 2: Remove Old Column (2-4 weeks later)
```sql
-- Drop old column after code is fully migrated
ALTER TABLE users DROP COLUMN old_email;
```

---

### Scenario: Migration Affects Multiple Services

**Coordination Checklist**:
1. Identify all services that query affected tables
2. Create migrations for each service's database
3. Coordinate deployment order:
   - Service A migration → Service A code → Service B migration → Service B code
4. Document deployment sequence in PR

---

## Special Cases

### Zero-Downtime Migrations

For migrations that might lock tables:

1. **Use CONCURRENTLY for indexes**:
   ```sql
   CREATE INDEX CONCURRENTLY idx_bookings_property_id ON bookings(property_id);
   ```

2. **Add NOT NULL in stages**:
   ```sql
   -- Stage 1: Add nullable column with default
   ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending';

   -- Stage 2: Backfill existing rows
   UPDATE bookings SET status = 'pending' WHERE status IS NULL;

   -- Stage 3: Add NOT NULL constraint (separate deployment)
   ALTER TABLE bookings ALTER COLUMN status SET NOT NULL;
   ```

3. **Use pg_repack** for large table changes (consult DBA)

---

### Data Migrations

For migrations that UPDATE large amounts of data:

**Best Practices**:
```sql
-- Process in batches to avoid locks
DO $$
DECLARE
  batch_size INTEGER := 1000;
  rows_updated INTEGER;
BEGIN
  LOOP
    UPDATE bookings
    SET total_price = total_price * 1.1
    WHERE id IN (
      SELECT id FROM bookings
      WHERE total_price IS NOT NULL
      AND updated_at < '2026-01-01'
      LIMIT batch_size
    );

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;

    RAISE NOTICE 'Updated % rows', rows_updated;
    COMMIT;
  END LOOP;
END $$;
```

**Monitoring**:
- Run during low-traffic hours
- Monitor database CPU and lock waits
- Pause if locks exceed threshold

---

## Troubleshooting

### Migration Stuck on Validation

**Issue**: Pre-commit hook blocks commit

**Solution**:
1. Read error output carefully
2. Fix issues listed in validation report
3. For false positives, discuss with team
4. Never use `--no-verify` to bypass without team approval

---

### Migration Fails on Staging

**Issue**: Migration succeeds locally but fails in staging/production

**Possible Causes**:
- Different PostgreSQL version (check compatibility)
- Existing data violates new constraints
- Missing extensions or permissions
- Schema already modified manually

**Solution**:
1. Check staging database state
2. Add pre-flight checks to migration
3. Test with production data snapshot
4. Update migration to handle edge cases

---

### Slow Migration Locks Production

**Issue**: Migration takes too long, causes timeouts

**Solution**:
1. Kill migration (if safe): `SELECT pg_cancel_backend(pid);`
2. Rollback transaction if needed
3. Optimize migration:
   - Create indexes CONCURRENTLY
   - Process data in smaller batches
   - Schedule during maintenance window
4. Re-attempt with optimized version

---

## Frequently Asked Questions

**Q: Can I modify an existing migration file?**
A: No. Once merged, migrations are immutable. Create a new "fix" migration (e.g., `099A_fix_booking_tags.sql`).

**Q: How do I test a migration without committing?**
A: Run it on your local dev database, verify changes, then rollback before committing.

**Q: What if I need to deploy urgently?**
A: For LOW risk migrations, standard process is fine. For MEDIUM/HIGH, get verbal approval from tech lead, deploy, then follow up with proper PR documentation.

**Q: Can I skip the approval process?**
A: Only for emergencies (production down). Get approval retroactively within 24 hours.

**Q: How long until I can delete backup tables?**
A: Wait 30 days after deployment. Confirm no issues reported before dropping.

---

## Tools and Resources

**Validation**:
- `npm run migration:validate` - Check migration format
- `npm run schema:drift` - Detect schema inconsistencies
- `npm run schema:generate-docs` - Update schema documentation

**Database Operations**:
- `psql -d vilo_dev -f migration.sql` - Run migration locally
- `pg_dump -Fc vilo_prod > backup.dump` - Backup database
- `pg_restore -d vilo_staging backup.dump` - Restore backup

**Documentation**:
- `DATABASE_STANDARDS.md` - Naming and format standards
- `MIGRATION_HISTORY.md` - Complete migration inventory
- `SCHEMA.md` - Auto-generated schema docs

---

## Contacts

For questions or approvals:
- **Database Team**: [Slack channel or email]
- **Tech Lead**: [Name and contact]
- **On-Call Engineer**: [Pager or phone]

---

**Document Version**: 1.0
**Last Updated**: 2026-01-16
**Maintained by**: Database Team
