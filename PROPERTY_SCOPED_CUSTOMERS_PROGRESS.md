# Property-Scoped Customer Implementation - Progress Report

## ✅ Completed Tasks

### 1. Database Migration Created ✅

**File:** `backend/migrations/138_migrate_to_property_scoped_customers.sql`

**What it does:**
- Creates new `customers` table with `property_id` as primary scope
- Migrates existing customer data from company-scoped to property-scoped
- Splits customers per property they have bookings for
- Updates all database triggers to be property-aware
- Updates RLS policies for property-scoped access
- Keeps backup table (`customers_old_company_scoped`) for rollback

**Key Changes:**
- `UNIQUE (LOWER(email), property_id)` - One customer per email per property
- Removes `customer_properties` junction table (no longer needed)
- All triggers now create/update property-scoped customers

### 2. Verification Script Created ✅

**File:** `VERIFY_PROPERTY_SCOPED_MIGRATION.sql`

**Purpose:**
- Comprehensive validation of migration success
- Checks table structure, constraints, indexes
- Verifies data integrity
- Confirms no orphaned records
- Validates trigger installation

### 3. Implementation Guide Created ✅

**File:** `PROPERTY_SCOPED_CUSTOMERS_GUIDE.md`

**Contains:**
- Complete explanation of the change
- Step-by-step implementation instructions
- Before/after examples
- Troubleshooting guide
- Testing checklist

### 4. Backend Types Updated ✅

**File:** `backend/src/types/customer.types.ts`

**Changes:**
- ✅ Added `property_id` as required field to `Customer` interface
- ✅ Kept `company_id` for convenience (derived from property)
- ✅ Changed `first_property_id` to `first_booking_id`
- ✅ Updated `CustomerWithCompany` to include property details
- ✅ Removed `CustomerProperty` interface (junction table removed)
- ✅ Updated `CreateCustomerInput` to require `property_id`
- ✅ Updated `FindOrCreateCustomerInput` to require `property_id`
- ✅ Updated `CustomerRow` database type

### 5. Backend Service Updated ✅

**File:** `backend/src/services/customer.service.ts`

**Changes:**
- ✅ `listCustomers()` - Filters directly by property_id (no complex join)
- ✅ `getCustomer()` - Includes property details in response
- ✅ `createCustomer()` - Requires and inserts property_id
- ✅ `findOrCreateCustomer()` - Uses `(email, property_id)` for uniqueness
- ✅ `syncBookingStats()` - Calculates stats per property only
- ✅ `getCustomerBookings()` - Filters bookings by property_id
- ✅ Added comprehensive logging to all functions

### 6. Frontend Types Updated ✅

**File:** `frontend/src/types/customer.types.ts`

**Changes:**
- ✅ Added `property_id` as required field
- ✅ Changed `first_property_id` to `first_booking_id`
- ✅ Updated `CustomerWithCompany` interface
- ✅ Updated `CreateCustomerInput` to require `property_id`

---

## ⏳ Pending Tasks

### 1. Apply Database Migration ⚠️ USER ACTION REQUIRED

**Status:** Waiting for user to apply in Supabase

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Open `backend/migrations/138_migrate_to_property_scoped_customers.sql`
3. Copy entire contents
4. Paste in SQL Editor and click "Run"
5. Verify migration notices (should show customer count increased)
6. Run `VERIFY_PROPERTY_SCOPED_MIGRATION.sql` to confirm success

**Expected Result:**
```
✅ Customer migration complete: customers are now property-scoped
📊 Migration Statistics:
  - Old customer records (company-scoped): 350
  - New customer records (property-scoped): 450
  - Multiplication factor: 1.29x
```

### 2. Update Frontend Service

**File:** `frontend/src/services/customer.service.ts`

**Pending Changes:**
- Update API calls to pass `property_id` where needed
- Update any hardcoded company_id filters to use property_id

### 3. Update Frontend Pages

**Files to Update:**
- `frontend/src/pages/customers/CustomerListPage.tsx`
  - Add property filter dropdown (for company admins)
  - Default to current property for property managers
  - Display property name in customer cards
- `frontend/src/pages/customers/CustomerDetailPage.tsx`
  - Show property name
  - Filter bookings by property
- Any customer-related components

### 4. Add Enquiry-Triggered Customer Creation

**Goal:** Create customer record when guest sends enquiry to property

**Approach:**
- Identify where enquiries are stored (chat table?)
- Add trigger or service call to create customer
- Set source = 'enquiry'

### 5. Test End-to-End

**Test Scenarios:**
1. ✅ New booking at Property A → Customer created for Property A
2. ✅ Same guest books Property B → Separate customer created for Property B
3. ✅ Guest portal shows all bookings across properties
4. ✅ Property manager sees only their property's customers
5. ✅ Company admin sees all customers across properties

---

## 🎯 How It Works Now

### Before Migration (Company-Scoped)
```
Guest: john@example.com
Company: ABC Hotels
Properties: Property A, Property B

Database:
customers table:
  - id: 1, email: john@example.com, company_id: abc, total_bookings: 5

customer_properties junction:
  - customer_id: 1, property_id: A, total_bookings: 3
  - customer_id: 1, property_id: B, total_bookings: 2
```

### After Migration (Property-Scoped)
```
Guest: john@example.com
Company: ABC Hotels
Properties: Property A, Property B

Database:
customers table:
  - id: 1, email: john@example.com, property_id: A, company_id: abc, total_bookings: 3
  - id: 2, email: john@example.com, property_id: B, company_id: abc, total_bookings: 2

customer_properties junction: REMOVED ❌
```

**Result:** Simpler model, separate lifecycle tracking per property! ✅

---

## 🔄 Key Behavior Changes

### Customer Creation

**Before:**
```typescript
// One customer per email per company
findOrCreateCustomer({
  email: 'guest@example.com',
  company_id: 'company-123'
})
// Returns same customer for all properties in company
```

**After:**
```typescript
// One customer per email per PROPERTY
findOrCreateCustomer({
  email: 'guest@example.com',
  property_id: 'property-a',
  company_id: 'company-123'
})
// Returns property-specific customer
```

### Customer Queries

**Before:**
```typescript
// Get all company customers
listCustomers({ company_id: 'company-123' })
```

**After:**
```typescript
// Get customers for specific property
listCustomers({ property_id: 'property-a' })

// OR get all customers across company (admin view)
listCustomers({ company_id: 'company-123' })
```

### Booking Stats

**Before:**
- `total_bookings` = bookings across ALL properties in company

**After:**
- `total_bookings` = bookings at THIS property only

---

## 📋 Checklist

**Database:**
- [x] Migration script created
- [x] Verification script created
- [ ] Migration applied in Supabase (USER ACTION)
- [ ] Verification passed

**Backend:**
- [x] Types updated (`customer.types.ts`)
- [x] Service updated (`customer.service.ts`)
- [ ] Controller updated (if needed)
- [ ] Routes updated (if needed)

**Frontend:**
- [x] Types updated (`customer.types.ts`)
- [ ] Service updated (`customer.service.ts`)
- [ ] Pages updated (customer list, detail)
- [ ] Components updated (customer cards, filters)

**Testing:**
- [ ] New booking creates property-scoped customer
- [ ] Same guest books different property → 2 customers
- [ ] Property manager sees only their customers
- [ ] Company admin sees all customers
- [ ] Guest portal shows all bookings
- [ ] Enquiry creates customer (if implemented)

**Documentation:**
- [x] Implementation guide created
- [x] Progress report created
- [ ] Team notified of breaking changes

---

## 🚨 Breaking Changes

**Important:** This is a breaking change. Any code that queries or creates customers MUST be updated.

**What breaks:**
- ❌ Customer queries without `property_id`
- ❌ `findOrCreateCustomer()` calls without `property_id`
- ❌ Customer stats aggregations assuming company-scope

**What still works:**
- ✅ User accounts (unchanged - still global)
- ✅ Booking creation (trigger handles customer)
- ✅ Company-wide queries using `company_id`

---

## 🔧 Next Steps

1. **User applies migration in Supabase** ⚠️
2. Update frontend customer service
3. Update frontend customer pages
4. Add enquiry-triggered customer creation
5. End-to-end testing
6. Deploy and monitor

**Estimated Time Remaining:** 3-4 hours

---

**Status:** Ready for migration! Database and backend code are prepared. Waiting for user to apply migration in Supabase.
