# Property-Scoped Customer Management - Implementation Guide

## 🎯 What This Changes

**BEFORE (Company-Scoped):**
- One customer record per email per **company**
- Guest books Property A and Property B (same company) → 1 customer record
- Junction table tracks per-property stats

**AFTER (Property-Scoped):**
- One customer record per email per **property** ✅
- Guest books Property A and Property B → 2 separate customer records ✅
- Each property tracks its own customer lifecycle independently ✅
- Guest still has ONE user account (portal) for login ✅

## 📋 Implementation Steps

### Step 1: Apply Database Migration ⚠️ CRITICAL

**File:** `backend/migrations/138_migrate_to_property_scoped_customers.sql`

**What it does:**
1. Creates new `customers` table with `property_id` FK
2. Migrates existing data (splits customers per property)
3. Updates all triggers to be property-scoped
4. Updates RLS policies for property-aware access
5. Keeps old table as `customers_old_company_scoped` for rollback

**How to apply:**

```sql
-- In Supabase SQL Editor:
-- 1. Copy entire contents of 138_migrate_to_property_scoped_customers.sql
-- 2. Paste and click "Run"
-- 3. Review migration notices/warnings
```

**Expected output:**
```
NOTICE:  Migrated 450 customer records from company-scoped to property-scoped
NOTICE:  Migrated 12 lead customers (no bookings) to property-scoped
NOTICE:  ✅ Customer migration complete: customers are now property-scoped
NOTICE:  📊 Migration Statistics:
NOTICE:    - Old customer records (company-scoped): 350
NOTICE:    - New customer records (property-scoped): 450
NOTICE:    - Multiplication factor: 1.29x
```

### Step 2: Verify Migration ✅

**File:** `VERIFY_PROPERTY_SCOPED_MIGRATION.sql`

Run the verification script to ensure migration succeeded:

```sql
-- Run this script in Supabase SQL Editor
-- Should see "🎉 ✅ ALL CHECKS PASSED"
```

**If verification fails:**
- DO NOT proceed to code changes
- Review error messages
- Consider rollback (instructions at bottom of migration file)

### Step 3: Update Backend Code (After migration verified)

**Files to update:**

#### A. Types
**`backend/src/types/customer.types.ts`**
- Add `property_id` to Customer interface
- Keep `company_id` for querying

#### B. Service
**`backend/src/services/customer.service.ts`**

Key changes:
```typescript
// OLD: Find by email + company
findOrCreateCustomer(email: string, companyId: string)

// NEW: Find by email + property
findOrCreateCustomer(email: string, propertyId: string, companyId: string)
```

Update all queries to filter by `property_id` instead of `company_id`.

#### C. Controller
**`backend/src/controllers/customer.controller.ts`**

Add property-scoped endpoints:
```typescript
// Get customers for a specific property
router.get('/properties/:propertyId/customers', ...)

// Get all customers across company (admin only)
router.get('/companies/:companyId/customers', ...)
```

### Step 4: Update Frontend Code

**Files to update:**

#### A. Types
**`frontend/src/types/customer.types.ts`**
- Add `property_id` to Customer interface

#### B. Service
**`frontend/src/services/customer.service.ts`**
- Update API calls to include property_id

#### C. Pages
**`frontend/src/pages/customers/CustomerListPage.tsx`**
- Add property filter dropdown (for company admins)
- Default to current property for property managers

### Step 5: Test End-to-End

#### Test 1: New Booking Creates Property-Scoped Customer
1. Make a booking at Property A with email `test@example.com`
2. Check database: Should see customer record with `property_id = Property A`
3. Make another booking at Property B with SAME email
4. Check database: Should see 2 customer records (one per property)

#### Test 2: Customer List Filtering
1. Login as property manager
2. Go to Customers page
3. Should see only customers for their property
4. Login as company admin
5. Should see customers across all properties with filter option

#### Test 3: Guest Portal
1. Login as guest who booked multiple properties
2. Should see all bookings from all properties
3. Should have ONE user account (no duplicate logins)

## 🔄 How Property-Scoped Customers Work

### Automatic Customer Creation

**Booking Wizard Flow:**
1. Guest fills booking form with email `guest@example.com`
2. Booking wizard creates/finds User account (global, one per email)
3. Booking is saved with `property_id` and `guest_id`
4. Database trigger fires: `auto_create_customer_from_booking_property_scoped()`
5. Trigger creates customer record: `(email, property_id)` pair
6. If customer exists for this property → Update stats
7. If customer exists for OTHER property → Create new record

**Example:**
```
Guest books Property A → User created + Customer A created
Guest books Property B → User found + Customer B created
Guest books Property A again → User found + Customer A updated
```

### Customer Stats Per Property

Each customer record tracks stats for THAT property only:
- `total_bookings` - Bookings at this property
- `total_spent` - Money spent at this property
- `first_booking_date` - First booking at this property
- `last_booking_date` - Last booking at this property
- `status` - Customer lifecycle status at this property

### Company-Wide Queries

Company admins can query all customers:
```typescript
// Get all customers across all company properties
const customers = await customerService.getByCompany(companyId);

// Shows all unique guests across all properties
// A guest who booked 3 properties appears 3 times (once per property)
```

## 📊 Data Examples

### Before Migration (Company-Scoped)

```sql
-- customers table
| email               | company_id | total_bookings |
|---------------------|------------|----------------|
| guest@example.com   | company-1  | 5              |
```

```sql
-- customer_properties junction
| email               | property_id | total_bookings |
|---------------------|-------------|----------------|
| guest@example.com   | property-a  | 3              |
| guest@example.com   | property-b  | 2              |
```

### After Migration (Property-Scoped)

```sql
-- customers table (junction table removed)
| email               | property_id | company_id | total_bookings |
|---------------------|-------------|------------|----------------|
| guest@example.com   | property-a  | company-1  | 3              |
| guest@example.com   | property-b  | company-1  | 2              |
```

**Result:** Simpler model, stats directly on customer record, no junction table needed!

## 🚨 Important Notes

### 1. Breaking Change
This is a **breaking change** for any code that queries customers. All customer queries must be updated to filter by `property_id`.

### 2. Backward Compatibility
The migration keeps `company_id` on the customers table for convenience:
- Property managers filter by `property_id`
- Company admins can filter by `company_id` to see all properties

### 3. User Accounts Unchanged
User accounts (for login/portal) remain **globally scoped**:
- One user account per email across entire platform ✅
- Multiple customer records (one per property) linked to same user ✅

### 4. Rollback Available
If issues occur, rollback is possible:
```sql
DROP TABLE customers;
ALTER TABLE customers_old_company_scoped RENAME TO customers;
-- Then restore old triggers from migration 085
```

**BUT:** Only rollback BEFORE making code changes. Once backend/frontend are updated, rollback requires code revert too.

## ✅ Success Criteria

**Database:**
- [x] Migration 138 applied successfully
- [x] Verification script passes all checks
- [x] Old table backed up as `customers_old_company_scoped`
- [x] Triggers creating property-scoped customers

**Backend:**
- [ ] Customer service uses `property_id` in all queries
- [ ] `findOrCreateCustomer()` accepts `property_id`
- [ ] API endpoints property-aware
- [ ] No errors in backend logs

**Frontend:**
- [ ] Customer list shows property filter
- [ ] Property managers see only their customers
- [ ] Company admins see all customers
- [ ] No UI errors

**Integration:**
- [ ] New bookings create property-scoped customers
- [ ] Guest who books 2 properties has 2 customer records
- [ ] Guest portal shows all bookings (single login)
- [ ] Stats accurate per property

## 📅 Timeline

- **Step 1-2 (Migration):** 30 minutes (careful review + verification)
- **Step 3 (Backend):** 2-3 hours (update services, controllers, types)
- **Step 4 (Frontend):** 2-3 hours (update pages, filters, API calls)
- **Step 5 (Testing):** 1-2 hours (end-to-end testing)

**Total:** ~1 day of careful implementation

## 🆘 Troubleshooting

### Issue: Migration fails with "duplicate key" error

**Cause:** Existing customers already have property_id conflicts

**Fix:**
```sql
-- Check for existing duplicates
SELECT LOWER(email), property_id, COUNT(*)
FROM customers
GROUP BY LOWER(email), property_id
HAVING COUNT(*) > 1;

-- Manually resolve duplicates before migration
```

### Issue: Verification shows orphaned customers

**Cause:** Customers reference non-existent properties

**Fix:**
```sql
-- Find orphaned records
SELECT * FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = c.property_id);

-- Delete or reassign to valid property
```

### Issue: Booking stats don't match

**Cause:** Trigger not recalculating correctly

**Fix:**
```sql
-- Manually recalculate stats for a customer
UPDATE customers SET
  total_bookings = (
    SELECT COUNT(*) FROM bookings b
    WHERE LOWER(b.guest_email) = LOWER(customers.email)
    AND b.property_id = customers.property_id
    AND b.booking_status NOT IN ('cancelled', 'no_show')
  ),
  total_spent = (...)
WHERE id = 'customer-id';
```

## 🎉 Benefits After Implementation

✅ **Better Property Isolation**
- Each property tracks its own customers independently
- Property managers see only their guests

✅ **Simpler Data Model**
- No junction table needed
- Stats directly on customer record

✅ **Accurate Per-Property Analytics**
- Repeat guest rate per property
- Revenue per customer per property
- Lifecycle tracking per property

✅ **Single Guest Portal**
- Guest has one login
- Sees all bookings across all properties
- Manages all reservations in one place

---

**Ready to proceed?** Apply migration 138 in Supabase, then run verification script! 🚀
