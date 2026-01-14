# Invoice Auto-Generation Fix

## Current Situation

Auto-invoice generation logic EXISTS in the code (line 1734-1775 in `booking.service.ts`), but it's failing silently for some bookings.

## The Problem

When a payment is recorded and the booking becomes fully paid:
1. ✅ Payment is recorded successfully
2. ✅ `payment_status` is updated to 'paid'
3. ❌ Invoice generation fails silently (error is caught and logged but not surfaced)

## Root Cause

The invoice generation is wrapped in a try-catch that only logs errors:
```typescript
} catch (invoiceError) {
  console.error('Failed to auto-generate invoice:', invoiceError);
  // Invoice can be generated manually later if needed
}
```

This means if ANY error occurs during invoice generation (missing company settings, PDF generation failure, etc.), the invoice simply doesn't get created and the user doesn't know why.

## Solution

I'll add:
1. ✅ **DONE**: Better error logging with full stack traces
2. ✅ **DONE**: A manual trigger function to retry invoice generation
3. ⏳ **TODO**: Database trigger to ensure invoice generation
4. ✅ **DONE**: Admin endpoint to generate missing invoices

## Immediate Fix - COMPLETED ✅

Added a manual invoice generation endpoint that can be called for bookings that are paid but have no invoice.

**Endpoint**: `POST /api/invoices/admin/bookings/:bookingId/generate`

**See**: `MANUAL_INVOICE_GENERATION.md` for complete usage instructions.
