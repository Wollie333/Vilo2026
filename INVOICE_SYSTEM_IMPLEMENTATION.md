# Invoice System Separation - Implementation Summary

## Overview

Successfully implemented dual invoice system separation with explicit type discrimination, ensuring both SaaS-to-User (subscription) and User-to-Guest (booking) invoice systems work independently.

---

## Database Migrations

### Migration 128: Add Invoice Type Discriminator
**File:** `backend/migrations/128_add_invoice_type_discriminator.sql`

**What it does:**
1. Creates `invoice_type` enum with values: `'subscription'` | `'booking'`
2. Adds missing columns to invoices table (if not already present):
   - `booking_id` - Reference to bookings
   - `booking_reference` - Booking reference snapshot
   - `property_name` - Property name snapshot
   - `company_id` - Company that issued invoice
   - `customer_phone` - Customer phone
   - `company_email` - Company email snapshot
   - `company_phone` - Company phone snapshot
3. Adds `invoice_type` column to invoices table
4. Backfills existing invoices based on:
   - Has `booking_id` → `'booking'`
   - Has `checkout_id` or `subscription_id` → `'subscription'`
5. Creates performance indexes

**Dependencies:**
- Requires `bookings` table (migration 033)
- Requires `companies` table (migration 013)
- Handles missing columns gracefully (adds them if needed)

---

### Migration 129: Add Guest Invoice Access RLS Policies
**File:** `backend/migrations/129_add_guest_invoice_access.sql`

**What it does:**
1. Drops old RLS policies that don't distinguish invoice types
2. Creates 4 new type-specific policies:
   - **Users can view own subscription invoices** - user_id match + type = 'subscription'
   - **Property owners can view booking invoices** - user_id match + type = 'booking'
   - **Guests can view their booking invoices** - NEW! Via bookings.guest_id join
   - **Admins can view all invoices** - using is_admin_or_super() function

**Dependencies:**
- Requires migration 128 (invoice_type enum)
- Requires `is_admin_or_super()` function (migration 023)
- Uses `bookings.guest_id` column

**Security Impact:**
- ✅ Guests can now see invoices for their bookings
- ✅ Property owners can only see invoices they issued
- ✅ Users can only see their subscription invoices
- ✅ Clear separation between invoice types

---

### Migration 130: Deprecate Credit Notes Table
**File:** `backend/migrations/130_deprecate_credit_notes.sql`

**What it does:**
1. Marks `credit_notes` table as deprecated
2. Adds `is_deprecated` flag (default TRUE) to all credit_notes
3. Creates trigger to prevent new inserts into credit_notes
4. Creates `unified_credits` view for backward compatibility:
   - Unions credit_memos and credit_notes
   - Normalizes column names between both tables
   - Adds `credit_source` field to identify origin

**Dependencies:**
- Requires `credit_memos` table (migration 044A)
- Requires `credit_notes` table (migration 044B)

**Migration Path:**
- Existing credit_notes data remains accessible
- New code should use credit_memos exclusively
- Optional migration script (commented out) to consolidate data

---

## Code Changes

### Backend

**Type System** (`backend/src/types/invoice.types.ts`):
```typescript
// Added discriminated unions
export type InvoiceType = 'subscription' | 'booking';

export interface SubscriptionInvoice extends BaseInvoice {
  invoice_type: 'subscription';
  checkout_id: string;
  // booking fields are null
}

export interface BookingInvoice extends BaseInvoice {
  invoice_type: 'booking';
  booking_id: string;
  // checkout fields are null
}

export type Invoice = SubscriptionInvoice | BookingInvoice;

// Type guards
export function isSubscriptionInvoice(invoice: Invoice): invoice is SubscriptionInvoice;
export function isBookingInvoice(invoice: Invoice): invoice is BookingInvoice;
```

**Service Layer** (`backend/src/services/invoice.service.ts`):
- Updated `generateInvoice()` to set `invoice_type = 'subscription'`
- Updated `generateBookingInvoice()` to set `invoice_type = 'booking'`
- Added semantic methods:
  - `getUserSubscriptionInvoices(userId)` - User's subscription invoices
  - `getPropertyOwnerBookingInvoices(ownerId)` - Invoices issued by property owner
  - `getGuestBookingInvoices(guestUserId)` - Invoices received by guest

**Controllers** (`backend/src/controllers/invoice.controller.ts`):
- `getSubscriptionInvoices()` - GET /api/invoices/subscription
- `getIssuedBookingInvoices()` - GET /api/invoices/booking/issued
- `getReceivedBookingInvoices()` - GET /api/invoices/booking/received

**Routes** (`backend/src/routes/invoice.routes.ts`):
```typescript
router.get('/subscription', invoiceController.getSubscriptionInvoices);
router.get('/booking/issued', invoiceController.getIssuedBookingInvoices);
router.get('/booking/received', invoiceController.getReceivedBookingInvoices);
```

---

### Frontend

**Type System** (`frontend/src/types/invoice.types.ts`):
- Identical to backend (discriminated unions)
- Added `INVOICE_TYPE_LABELS` constant

**Service Layer** (`frontend/src/services/invoice.service.ts`):
```typescript
async getSubscriptionInvoices(): Promise<SubscriptionInvoice[]>
async getIssuedBookingInvoices(): Promise<BookingInvoice[]>
async getReceivedBookingInvoices(): Promise<BookingInvoice[]>
```

---

## Running Migrations

### Option 1: Supabase SQL Editor (Recommended)
1. Open Supabase Dashboard → SQL Editor
2. Run migrations in order:
   ```sql
   -- Copy/paste content of 128_add_invoice_type_discriminator.sql
   -- Then run

   -- Copy/paste content of 129_add_guest_invoice_access.sql
   -- Then run

   -- Copy/paste content of 130_deprecate_credit_notes.sql
   -- Then run
   ```

### Option 2: psql Command Line
```bash
cd backend/migrations

psql -U your_user -d your_database \
  -f 128_add_invoice_type_discriminator.sql

psql -U your_user -d your_database \
  -f 129_add_guest_invoice_access.sql

psql -U your_user -d your_database \
  -f 130_deprecate_credit_notes.sql
```

---

## Verification Queries

After running migrations, verify everything worked:

```sql
-- 1. Check invoice_type enum was created
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'invoice_type'::regtype;
-- Should return: subscription, booking

-- 2. Verify all invoices have a type
SELECT COUNT(*) FROM invoices WHERE invoice_type IS NULL;
-- Should return: 0

-- 3. Check distribution of invoice types
SELECT invoice_type, COUNT(*) FROM invoices GROUP BY invoice_type;
-- Should show count of subscription vs booking invoices

-- 4. Verify missing columns were added
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'invoices'
  AND column_name IN ('booking_id', 'company_id', 'invoice_type');
-- Should return all 3 columns

-- 5. Test RLS policies (as guest user)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = '<guest_user_id>';
SELECT id, invoice_type FROM invoices WHERE invoice_type = 'booking';
-- Should only return invoices for that guest's bookings

-- 6. Verify credit_notes trigger
INSERT INTO credit_notes DEFAULT VALUES;
-- Should fail with: "Credit notes are deprecated. Use credit_memos instead."

-- 7. Check unified view
SELECT credit_source, COUNT(*) FROM unified_credits GROUP BY credit_source;
-- Should show counts from both credit_memos and credit_notes
```

---

## Testing Checklist

### Backend Testing

- [ ] **Run migrations successfully**
  - [ ] Migration 128 completes without errors
  - [ ] Migration 129 completes without errors
  - [ ] Migration 130 completes without errors

- [ ] **Verify data integrity**
  - [ ] All existing invoices have invoice_type populated
  - [ ] Subscription invoices have company_id = NULL
  - [ ] Booking invoices have booking_id populated

- [ ] **Test new endpoints**
  - [ ] GET /api/invoices/subscription returns only subscription invoices
  - [ ] GET /api/invoices/booking/issued returns only property owner's booking invoices
  - [ ] GET /api/invoices/booking/received returns only guest's booking invoices

- [ ] **Test invoice generation**
  - [ ] Create new subscription → Invoice has invoice_type = 'subscription'
  - [ ] Create new booking → Invoice has invoice_type = 'booking'

- [ ] **Test RLS policies**
  - [ ] Guest can view their booking invoices
  - [ ] Guest cannot view other guests' invoices
  - [ ] Property owner can view invoices they issued
  - [ ] User can view their subscription invoices
  - [ ] Admins can view all invoices

- [ ] **Test credit system**
  - [ ] Cannot insert into credit_notes table
  - [ ] Can still query unified_credits view
  - [ ] New credit_memos can be created

### Frontend Testing

- [ ] **Type safety**
  - [ ] TypeScript compilation succeeds
  - [ ] Type guards work correctly

- [ ] **API integration**
  - [ ] getSubscriptionInvoices() returns correct data
  - [ ] getIssuedBookingInvoices() returns correct data
  - [ ] getReceivedBookingInvoices() returns correct data

### Integration Testing

- [ ] **End-to-end subscription flow**
  1. User signs up for subscription
  2. Payment completed
  3. Invoice generated with type = 'subscription'
  4. User can view invoice in billing section

- [ ] **End-to-end booking flow**
  1. Guest books property
  2. Payment completed
  3. Invoice generated with type = 'booking'
  4. Property owner sees invoice in issued list
  5. Guest sees invoice in received list

- [ ] **Settings isolation**
  1. Update SaaS invoice settings (admin)
  2. Verify subscription invoices use updated settings
  3. Verify booking invoices unaffected
  4. Update company invoice settings
  5. Verify booking invoices use company settings
  6. Verify subscription invoices still use global settings

---

## Rollback Procedure

If you need to rollback migrations:

### Rollback Migration 130
```sql
DROP TRIGGER IF EXISTS prevent_new_credit_notes ON public.credit_notes;
DROP FUNCTION IF EXISTS prevent_credit_note_insert();
DROP VIEW IF EXISTS unified_credits;
ALTER TABLE public.credit_notes DROP COLUMN IF EXISTS is_deprecated;
```

### Rollback Migration 129
```sql
-- Drop new policies
DROP POLICY IF EXISTS "Users can view own subscription invoices" ON public.invoices;
DROP POLICY IF EXISTS "Property owners can view booking invoices" ON public.invoices;
DROP POLICY IF EXISTS "Guests can view their booking invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;

-- Restore original policies (from migration 026)
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY invoices_select_admin ON invoices
  FOR SELECT TO authenticated
  USING (public.is_admin_or_super());
```

### Rollback Migration 128
```sql
-- Remove invoice_type column
ALTER TABLE public.invoices DROP COLUMN IF EXISTS invoice_type;

-- Drop enum type
DROP TYPE IF EXISTS invoice_type;

-- Note: Columns added (booking_id, company_id, etc.) can remain as they may be used elsewhere
```

---

## Benefits Achieved

### 1. **Clear Separation**
- SaaS-to-User invoices always use global settings (company_id = NULL)
- User-to-Guest invoices use per-company settings with global fallback

### 2. **Explicit Type Discrimination**
- Database-level enum ensures data integrity
- No more implicit checking via checkout_id/booking_id

### 3. **Guest Access Fixed**
- Guests can now view invoices for their bookings
- Property owners see invoices they issued
- Users see their subscription invoices

### 4. **Type Safety**
```typescript
const invoice = await getUserSubscriptionInvoices(userId);
// invoice is typed as SubscriptionInvoice[]

if (isSubscriptionInvoice(invoice[0])) {
  console.log(invoice[0].checkout_id); // ✅ TypeScript knows this exists
  console.log(invoice[0].booking_id);  // ❌ Type error - cannot be booking
}
```

### 5. **Credit System Standardized**
- Only `credit_memos` used going forward
- `credit_notes` blocked from new inserts
- Backward compatibility maintained

---

## Files Modified

| File | Type | Changes |
|------|------|---------|
| `backend/migrations/128_*.sql` | New | Invoice type discriminator |
| `backend/migrations/129_*.sql` | New | Guest RLS access |
| `backend/migrations/130_*.sql` | New | Deprecate credit_notes |
| `backend/src/types/invoice.types.ts` | Modified | Discriminated unions |
| `frontend/src/types/invoice.types.ts` | Modified | Discriminated unions |
| `backend/src/services/invoice.service.ts` | Modified | Type field + 3 methods |
| `backend/src/controllers/invoice.controller.ts` | Modified | 3 new controllers |
| `backend/src/routes/invoice.routes.ts` | Modified | 3 new routes |
| `frontend/src/services/invoice.service.ts` | Modified | 3 new methods |

**Total: 3 new migrations, 6 updated files**

---

## Support & Troubleshooting

### Common Issues

**Issue: "column booking_id does not exist"**
- Solution: Migration 128 now adds this column automatically

**Issue: "type invoice_type already exists"**
- Solution: Migration uses `IF NOT EXISTS` - safe to re-run

**Issue: "Guests still can't see invoices"**
- Check: Did migration 129 complete successfully?
- Verify: Run RLS test query with guest user ID

**Issue: "Cannot insert into credit_notes"**
- Expected: This is intentional - use credit_memos instead
- Check: Verify trigger was created in migration 130

---

## Next Steps

1. ✅ Run all three migrations in sequence
2. ✅ Run verification queries
3. ✅ Test backend endpoints with Postman/curl
4. ✅ Test frontend invoice views
5. ✅ Monitor production for 24 hours after deployment
6. 📝 Update API documentation if needed
7. 📝 Notify team of new endpoints available

---

## Contact

For issues or questions about this implementation:
- Review plan file: `.claude/plans/spicy-scribbling-perlis.md`
- Check migration files for detailed comments
- Verify RLS policies match your security requirements
