# Booking Schema Fix Summary

## Problem
The guest booking flow was failing with error:
```
ERROR: column "room_id" of relation "bookings" does not exist
```

## Root Cause
The `bookings` table **does NOT have a `room_id` column**. The booking system uses a **many-to-many architecture**:

- **`bookings` table**: Main booking record (no direct room_id)
- **`booking_rooms` table**: Junction table linking bookings to rooms (allows multiple rooms per booking)

The code was attempting to insert `room_id` directly into the `bookings` table, which doesn't have that column.

## Schema Architecture

### bookings table (main record)
```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL,  -- ✅ Has property_id
  -- NO room_id column!        -- ❌ No room_id
  guest_id UUID,
  booking_reference VARCHAR(20),
  check_in_date DATE,
  check_out_date DATE,
  total_amount DECIMAL,
  ...
);
```

### booking_rooms table (junction table)
```sql
CREATE TABLE public.booking_rooms (
  id UUID PRIMARY KEY,
  booking_id UUID NOT NULL,     -- Links to bookings
  room_id UUID NOT NULL,         -- Links to rooms
  room_name VARCHAR(255),
  adults INTEGER,
  children INTEGER,
  room_subtotal DECIMAL,
  ...
);
```

## Fix Applied

### File: `backend/src/services/website-public.service.ts`

**Before (BROKEN)**:
```typescript
const { data: booking } = await supabase
  .from('bookings')
  .insert({
    property_id: property.id,
    room_id: room.id,  // ❌ This column doesn't exist!
    guest_id: guestUserId,
    ...
  });
```

**After (FIXED)**:
```typescript
// 1. Create booking WITHOUT room_id
const { data: booking } = await supabase
  .from('bookings')
  .insert({
    property_id: property.id,
    guest_id: guestUserId,  // ✅ No room_id
    booking_reference: bookingReference,
    check_in_date: bookingData.checkInDate,
    check_out_date: bookingData.checkOutDate,
    ...
  })
  .select('id')
  .single();

// 2. Create booking_rooms entry (link room to booking)
await supabase
  .from('booking_rooms')
  .insert({
    booking_id: booking.id,
    room_id: room.id,       // ✅ Room linked here
    room_name: room.name,
    room_code: room.room_code || null,
    adults: bookingData.adults,
    children: bookingData.children || 0,
    pricing_mode: room.pricing_mode || 'per_night',
    nightly_rates: [],
    room_subtotal: basePrice,
    currency: property.currency || 'ZAR',
    unit_number: 1,
  });
```

### Also Fixed: Booking Query
```typescript
// BEFORE:
.select('*, property:properties(*), room:rooms(*)')  // ❌ Can't join room directly

// AFTER:
.select(`
  *,
  property:properties(*),
  booking_rooms(*, room:rooms(*))  // ✅ Join through booking_rooms
`)
```

## Changes Made

1. **Line 897-962**: Removed `room_id` from bookings INSERT, added separate `booking_rooms` INSERT
2. **Line 987-995**: Fixed booking query to join rooms via `booking_rooms` table
3. Added rollback logic: If `booking_rooms` insert fails, delete the booking

## Files Modified
- `backend/src/services/website-public.service.ts`

## Testing
After this fix, the complete guest booking flow should work:
1. ✅ Guest account created
2. ✅ Booking record created (without room_id)
3. ✅ Room linked via booking_rooms table
4. ✅ Add-ons attached
5. ✅ Email confirmation sent
6. ✅ Auto-login and redirect to guest portal

## Why This Architecture?
The many-to-many design allows:
- Multiple rooms per booking (families booking 2+ rooms)
- Same room booked multiple times (future recurring bookings)
- Proper inventory tracking per room unit
- Historical room snapshots at booking time
