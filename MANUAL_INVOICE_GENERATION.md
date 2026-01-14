# Manual Invoice Generation - Fix for Missing Invoices

## Problem Summary

Some bookings show `payment_status: 'paid'` but have no invoice generated. The auto-generation logic exists in the code but fails silently when errors occur (e.g., missing company settings, PDF generation issues, etc.).

## Solution Implemented

Created a manual invoice generation endpoint that can be called to retry invoice generation for paid bookings without invoices.

## What Was Added

### 1. Backend Service Function
**File**: `backend/src/services/invoice.service.ts`

Added `manuallyGenerateBookingInvoice()` function that:
- ✅ Fetches booking with full details
- ✅ Verifies booking exists and user has access
- ✅ Validates booking is paid (`payment_status = 'paid'`)
- ✅ Checks if invoice already exists (returns existing if found)
- ✅ Calls `generateBookingInvoice()` to create the invoice
- ✅ Updates booking with `invoice_id` and `invoice_generated_at`
- ✅ Creates audit log entry
- ✅ Enhanced error logging with full details

### 2. Backend Controller
**File**: `backend/src/controllers/invoice.controller.ts`

Added `generateBookingInvoice()` controller function (lines 223-242)

### 3. Backend Route
**File**: `backend/src/routes/invoice.routes.ts`

Added admin endpoint (lines 156-164):
```
POST /api/invoices/admin/bookings/:bookingId/generate
```

## How to Use

### Step 1: Identify Bookings Without Invoices

Run this SQL query in Supabase to find paid bookings without invoices:

```sql
SELECT
  id,
  booking_reference,
  guest_name,
  check_in_date,
  check_out_date,
  total_amount,
  payment_status,
  invoice_id,
  created_at
FROM bookings
WHERE payment_status = 'paid'
  AND invoice_id IS NULL
ORDER BY created_at DESC;
```

### Step 2: Call the Endpoint for Each Booking

Use the admin endpoint to manually generate invoices:

**Endpoint**: `POST /api/invoices/admin/bookings/:bookingId/generate`

**Authentication**: Requires admin user with valid JWT token

**Example using curl**:
```bash
curl -X POST \
  http://localhost:3001/api/invoices/admin/bookings/{BOOKING_ID}/generate \
  -H "Authorization: Bearer {YOUR_ADMIN_JWT_TOKEN}" \
  -H "Content-Type: application/json"
```

**Example using Postman**:
1. Method: POST
2. URL: `http://localhost:3001/api/invoices/admin/bookings/{BOOKING_ID}/generate`
3. Headers:
   - `Authorization`: `Bearer {YOUR_ADMIN_JWT_TOKEN}`
   - `Content-Type`: `application/json`
4. Click Send

**Example Response (Success)**:
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": "abc123...",
      "invoice_number": "INV-2026-001",
      "booking_id": "xyz789...",
      "status": "paid",
      "total_cents": 150000,
      "currency": "ZAR",
      "pdf_url": "https://...",
      ...
    },
    "message": "Invoice generated successfully"
  }
}
```

**Example Response (Error - Not Paid)**:
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Booking BK-123456 is not fully paid. Payment status: pending"
  }
}
```

**Example Response (Already Has Invoice)**:
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": "existing-invoice-id",
      "invoice_number": "INV-2026-001",
      ...
    },
    "message": "Invoice generated successfully"
  }
}
```
(Note: If invoice already exists, it returns the existing one instead of creating a duplicate)

### Step 3: Verify Invoice Was Created

Check the booking in the database or UI to confirm:
- `invoice_id` is now set
- `invoice_generated_at` has a timestamp
- Invoice PDF exists in storage

Or query directly:
```sql
SELECT
  id,
  booking_reference,
  invoice_id,
  invoice_generated_at
FROM bookings
WHERE id = '{BOOKING_ID}';
```

## Error Scenarios & Solutions

### Error: "Booking not found"
**Cause**: Invalid booking ID
**Solution**: Double-check the booking ID from the database query

### Error: "You do not have access to this booking"
**Cause**: User doesn't own the property
**Solution**: Use the property owner's admin token, or update function to allow super_admin access

### Error: "Booking is not fully paid"
**Cause**: `payment_status != 'paid'`
**Solution**: Only call endpoint for fully paid bookings. Check payment records.

### Error: PDF generation failure
**Cause**: Missing company settings, invalid data, storage issues
**Solution**: Check backend logs for detailed error. The enhanced error logging will show:
- Booking ID and reference
- Full error message
- Stack trace
- Company ID (if applicable)

## Enhanced Error Logging

The auto-generation error logging was also improved in `booking.service.ts` (lines 1771-1781):

**Before**:
```typescript
} catch (invoiceError) {
  console.error('Failed to auto-generate invoice:', invoiceError);
}
```

**After**:
```typescript
} catch (invoiceError) {
  console.error('❌ Failed to auto-generate invoice for booking:', bookingId, invoiceError);
  console.error('Invoice generation error details:', {
    bookingId,
    bookingReference: booking.booking_reference,
    error: invoiceError instanceof Error ? invoiceError.message : String(invoiceError),
    stack: invoiceError instanceof Error ? invoiceError.stack : undefined,
  });
}
```

## Complete Fix Chain

### Layer 1: Enhanced Auto-Generation Error Logging ✅
When payment makes booking paid, auto-generation now logs detailed errors.

### Layer 2: Manual Generation Endpoint ✅
Admin can manually trigger invoice generation for any paid booking.

### Layer 3: Validation & Safety ✅
- Checks booking is paid before generating
- Prevents duplicate invoices
- Returns existing invoice if already created
- Creates audit log for manual generations

## Testing the Fix

### Test Case 1: Generate Invoice for Paid Booking Without Invoice
1. Find a booking with `payment_status = 'paid'` and `invoice_id = NULL`
2. Call the endpoint with the booking ID
3. Verify invoice is created and PDF is uploaded
4. Check audit logs show `invoice.manually_generated` action

### Test Case 2: Call Endpoint for Booking That Already Has Invoice
1. Use a booking ID that already has an invoice
2. Call the endpoint
3. Verify it returns the existing invoice (doesn't create duplicate)

### Test Case 3: Call Endpoint for Unpaid Booking
1. Use a booking ID with `payment_status != 'paid'`
2. Call the endpoint
3. Verify it returns error: "Booking is not fully paid"

## Audit Trail

Manual invoice generations are logged with:
- **Action**: `invoice.manually_generated`
- **Entity Type**: `invoice`
- **Entity ID**: Created invoice ID
- **User ID**: Admin who triggered generation
- **Metadata**:
  - `booking_id`
  - `booking_reference`
  - `invoice_number`
  - `generated_by: 'manual_endpoint'`

Query audit logs:
```sql
SELECT *
FROM audit_logs
WHERE action = 'invoice.manually_generated'
ORDER BY created_at DESC;
```

## Frontend Integration (Optional)

You can add a "Generate Invoice" button to the booking detail page for admins:

**Location**: `frontend/src/pages/bookings/BookingDetailPage.tsx`

**Example**:
```tsx
{booking.payment_status === 'paid' && !booking.invoice_id && isAdmin && (
  <Button
    variant="primary"
    onClick={handleGenerateInvoice}
    isLoading={isGeneratingInvoice}
  >
    Generate Invoice
  </Button>
)}
```

**Handler**:
```typescript
const handleGenerateInvoice = async () => {
  setIsGeneratingInvoice(true);
  try {
    const response = await invoiceService.generateBookingInvoice(booking.id);
    toast.success('Invoice generated successfully');
    // Refresh booking data
    await loadBooking();
  } catch (error) {
    toast.error('Failed to generate invoice');
    console.error(error);
  } finally {
    setIsGeneratingInvoice(false);
  }
};
```

## Root Cause Investigation

To find why auto-generation is failing, check backend logs when recording a payment:

1. Record a payment that makes a booking fully paid
2. Check backend console for:
   - `❌ Failed to auto-generate invoice for booking:`
   - `Invoice generation error details:` with full stack trace
3. Common causes:
   - Missing invoice settings (company_id reference invalid)
   - Missing company details
   - PDF generation library errors
   - Storage bucket permission issues
   - Database constraint violations

## Next Steps

1. ✅ **Immediate**: Use the manual endpoint to generate invoices for the two existing paid bookings
2. ⏳ **Monitor**: Watch backend logs for detailed error info on next auto-generation
3. 🔍 **Investigate**: Fix the root cause based on error logs
4. 🛠️ **Optional**: Add frontend UI button for admin convenience
5. 🔄 **Long-term**: Consider database trigger as failsafe backup

## Summary

**Endpoint Added**: `POST /api/invoices/admin/bookings/:bookingId/generate`

**Purpose**: Manually generate invoices for paid bookings that failed auto-generation

**Access**: Admin only

**Safe to Use**: Yes - prevents duplicates, validates payment status, logs actions

**Ready to Use**: Yes - deploy backend changes and call endpoint for each affected booking
