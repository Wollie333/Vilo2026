# Booking Management System

A comprehensive booking management system for vacation rental properties with rooms, add-ons, bookings, and refunds functionality.

---

## Table of Contents

1. [Feature 1: Rooms](#feature-1-rooms)
2. [Feature 2: Add-ons](#feature-2-add-ons)
3. [Feature 3: Bookings](#feature-3-bookings)
4. [Feature 4: Refunds](#feature-4-refunds)

---

# Feature 1: Rooms

## Overview

Room management system supporting multiple pricing models, seasonal rates, inventory tracking, and image galleries.

## Database Schema

### `rooms` Table

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  room_code VARCHAR(50) UNIQUE,

  -- Bed Configuration (JSONB array for flexibility)
  beds JSONB DEFAULT '[]',
  -- Legacy fields (for backwards compatibility)
  bed_type VARCHAR(50),
  bed_count INTEGER DEFAULT 1,

  -- Room Details
  room_size_sqm DECIMAL(10,2),
  amenities TEXT[] DEFAULT '{}',
  extra_options JSONB DEFAULT '[]',

  -- Guest Capacity
  max_guests INTEGER DEFAULT 2,
  max_adults INTEGER,
  max_children INTEGER,

  -- Pricing Configuration
  pricing_mode VARCHAR(20) DEFAULT 'per_unit',
  base_price_per_night DECIMAL(10,2) NOT NULL,
  additional_person_rate DECIMAL(10,2) DEFAULT 0,
  child_price_per_night DECIMAL(10,2),
  child_free_until_age INTEGER,
  child_age_limit INTEGER DEFAULT 12,
  currency VARCHAR(3) DEFAULT 'ZAR',

  -- Stay Constraints
  min_stay_nights INTEGER DEFAULT 1,
  max_stay_nights INTEGER,

  -- Inventory Management
  inventory_mode VARCHAR(20) DEFAULT 'single_unit',
  total_units INTEGER DEFAULT 1,

  -- Images
  images JSONB DEFAULT '{"featured": null, "gallery": []}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rooms_tenant_id ON rooms(tenant_id);
CREATE INDEX idx_rooms_is_active ON rooms(is_active);
CREATE INDEX idx_rooms_room_code ON rooms(room_code);
```

### `seasonal_rates` Table

```sql
CREATE TABLE seasonal_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Rate Details
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Pricing Overrides (nullable = use room default)
  price_per_night DECIMAL(10,2),
  pricing_mode VARCHAR(20),
  additional_person_rate DECIMAL(10,2),

  -- Priority (higher = takes precedence)
  priority INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seasonal_rates_room_id ON seasonal_rates(room_id);
CREATE INDEX idx_seasonal_rates_dates ON seasonal_rates(start_date, end_date);
```

## Pricing Modes

### 1. `per_unit` (Default)
Flat rate for entire room regardless of guest count.

```typescript
// Example: R1,500/night for any number of guests
totalPrice = base_price_per_night * numberOfNights
```

### 2. `per_person`
Price multiplied by number of guests.

```typescript
// Example: R500/person/night
totalPrice = base_price_per_night * numberOfGuests * numberOfNights
```

### 3. `per_person_sharing`
Base rate for first person + additional rate for each extra guest.

```typescript
// Example: R800 first person + R400 additional
// 1 guest: R800/night, 2 guests: R1,200/night, 3 guests: R1,600/night
totalPrice = (base_price_per_night + (additionalGuests * additional_person_rate)) * numberOfNights
```

## Inventory Modes

### 1. `single_unit`
Room represents a single physical room. Only one booking per date range.

### 2. `room_type`
Room represents a category with multiple units. Multiple bookings allowed up to `total_units`.

## Bed Configuration Schema

```typescript
interface BedConfig {
  bed_type: 'single' | 'double' | 'queen' | 'king' | 'bunk' | 'sofa_bed';
  quantity: number;
}

// Example beds array
[
  { "bed_type": "king", "quantity": 1 },
  { "bed_type": "single", "quantity": 2 }
]
```

## Images Schema

```typescript
interface RoomImages {
  featured: {
    url: string;
    alt?: string;
    public_id?: string; // For cloud storage reference
  } | null;
  gallery: Array<{
    url: string;
    alt?: string;
    public_id?: string;
  }>;
}
```

## API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms/public/tenant/:tenantId` | List all active rooms for a property |
| GET | `/api/rooms/public/by-code/:roomCode` | Get room by unique code |
| GET | `/api/rooms/public/by-id/:roomId` | Get room by UUID |

### Admin Endpoints (Require `x-tenant-id` Header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | List all rooms (with filters) |
| GET | `/api/rooms/:id` | Get single room |
| POST | `/api/rooms` | Create room |
| PUT | `/api/rooms/:id` | Update room |
| DELETE | `/api/rooms/:id` | Delete room (soft/hard) |

### Pricing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms/:id/price?date=YYYY-MM-DD` | Get effective price for specific date |
| GET | `/api/rooms/:id/prices?start_date=...&end_date=...` | Get batch prices for date range |

### Seasonal Rates Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms/:id/rates` | List seasonal rates |
| POST | `/api/rooms/:id/rates` | Create seasonal rate |
| PUT | `/api/rooms/:id/rates/:rateId` | Update seasonal rate |
| DELETE | `/api/rooms/:id/rates/:rateId` | Delete seasonal rate |

### Image Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/rooms/:id/images` | Update featured + gallery images (max 10) |

## Request/Response Examples

### Create Room

```typescript
// POST /api/rooms
// Headers: { "x-tenant-id": "uuid" }

// Request
{
  "name": "Ocean View Suite",
  "description": "Luxury suite with ocean views",
  "room_code": "OVS-001",
  "beds": [{ "bed_type": "king", "quantity": 1 }],
  "room_size_sqm": 45,
  "max_guests": 2,
  "max_adults": 2,
  "max_children": 1,
  "amenities": ["wifi", "air_conditioning", "mini_bar", "ocean_view"],
  "pricing_mode": "per_unit",
  "base_price_per_night": 2500,
  "currency": "ZAR",
  "min_stay_nights": 2,
  "inventory_mode": "single_unit",
  "is_active": true
}

// Response
{
  "id": "uuid",
  "name": "Ocean View Suite",
  // ... all fields
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Get Batch Prices

```typescript
// GET /api/rooms/:id/prices?start_date=2024-03-01&end_date=2024-03-05

// Response
{
  "subtotal": 12500,
  "night_count": 5,
  "currency": "ZAR",
  "nights": [
    { "date": "2024-03-01", "price": 2500, "rate_name": null },
    { "date": "2024-03-02", "price": 2500, "rate_name": null },
    { "date": "2024-03-03", "price": 3000, "rate_name": "Peak Season" },
    { "date": "2024-03-04", "price": 3000, "rate_name": "Peak Season" },
    { "date": "2024-03-05", "price": 2500, "rate_name": null }
  ]
}
```

## Price Calculation Algorithm

```typescript
function getEffectivePrice(room: Room, date: Date): { price: number; rateName: string | null } {
  // 1. Get all active seasonal rates for this room
  const seasonalRates = await getSeasonalRates(room.id, date);

  // 2. Filter rates that include this date
  const applicableRates = seasonalRates.filter(rate =>
    date >= rate.start_date && date <= rate.end_date && rate.is_active
  );

  // 3. Sort by priority (highest first)
  applicableRates.sort((a, b) => b.priority - a.priority);

  // 4. Return highest priority rate or base price
  if (applicableRates.length > 0) {
    const rate = applicableRates[0];
    return {
      price: rate.price_per_night ?? room.base_price_per_night,
      rateName: rate.name
    };
  }

  return {
    price: room.base_price_per_night,
    rateName: null
  };
}
```

## Frontend Components

### Pages

| Component | Path | Description |
|-----------|------|-------------|
| `Rooms.tsx` | `/dashboard/rooms` | Room list with search, filters, actions |
| `RoomDetail.tsx` | `/dashboard/rooms/:id` | View/edit single room |
| `RoomForm.tsx` | `/dashboard/rooms/new` | Create new room |

### Key Components

| Component | Description |
|-----------|-------------|
| `RoomCard` | Display room in grid/list view |
| `RoomPricingSection` | Pricing mode selector and rate inputs |
| `SeasonalRatesManager` | CRUD for seasonal rates |
| `RoomImageUploader` | Featured + gallery image management |
| `BedConfigEditor` | Add/remove bed configurations |
| `AmenitySelector` | Multi-select amenities picker |

---

# Feature 2: Add-ons

## Overview

Add-ons are optional extras that guests can add to their booking (e.g., breakfast, airport transfer, late checkout).

## Database Schema

### `addons` Table

```sql
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  pricing_type VARCHAR(30) DEFAULT 'per_booking',
  currency VARCHAR(3) DEFAULT 'ZAR',

  -- Availability
  applicable_room_ids UUID[] DEFAULT '{}', -- Empty = all rooms
  is_active BOOLEAN DEFAULT true,

  -- Display
  display_order INTEGER DEFAULT 0,
  image_url TEXT,

  -- Constraints
  max_quantity INTEGER, -- NULL = unlimited

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_addons_tenant_id ON addons(tenant_id);
CREATE INDEX idx_addons_is_active ON addons(is_active);
```

## Pricing Types

### 1. `per_booking`
Flat fee per booking regardless of guests or nights.

```typescript
// Example: R150 airport transfer (one-time)
total = price * quantity
```

### 2. `per_night`
Multiplied by number of nights.

```typescript
// Example: R50/night for parking
total = price * numberOfNights * quantity
```

### 3. `per_guest`
Multiplied by number of guests.

```typescript
// Example: R200/person for spa package
total = price * numberOfGuests * quantity
```

### 4. `per_guest_per_night`
Multiplied by both guests and nights.

```typescript
// Example: R150/person/night for breakfast
total = price * numberOfGuests * numberOfNights * quantity
```

## Add-on Selection Schema (Stored in Booking Notes)

```typescript
interface BookingAddon {
  id: string;
  name: string;
  price: number;
  pricing_type: 'per_booking' | 'per_night' | 'per_guest' | 'per_guest_per_night';
  quantity: number;
  total: number; // Calculated based on pricing_type
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/addons` | List all add-ons for tenant |
| GET | `/api/addons/:id` | Get single add-on |
| POST | `/api/addons` | Create add-on |
| PUT | `/api/addons/:id` | Update add-on |
| DELETE | `/api/addons/:id` | Delete add-on |
| GET | `/api/addons/public/tenant/:tenantId` | Public: List active add-ons |

## Request/Response Examples

### Create Add-on

```typescript
// POST /api/addons
// Headers: { "x-tenant-id": "uuid" }

// Request
{
  "name": "Breakfast Buffet",
  "description": "Full English breakfast buffet served 7am-10am",
  "price": 150,
  "pricing_type": "per_guest_per_night",
  "currency": "ZAR",
  "applicable_room_ids": [], // Available for all rooms
  "is_active": true,
  "max_quantity": 10
}

// Response
{
  "id": "uuid",
  "name": "Breakfast Buffet",
  // ... all fields
}
```

## Add-on Calculation Logic

```typescript
function calculateAddonTotal(
  addon: Addon,
  quantity: number,
  numberOfNights: number,
  numberOfGuests: number
): number {
  switch (addon.pricing_type) {
    case 'per_booking':
      return addon.price * quantity;

    case 'per_night':
      return addon.price * numberOfNights * quantity;

    case 'per_guest':
      return addon.price * numberOfGuests * quantity;

    case 'per_guest_per_night':
      return addon.price * numberOfGuests * numberOfNights * quantity;

    default:
      return addon.price * quantity;
  }
}
```

## Frontend Components

### Pages

| Component | Path | Description |
|-----------|------|-------------|
| `Addons.tsx` | `/dashboard/addons` | Add-on list management |
| `AddonForm.tsx` | `/dashboard/addons/new` | Create/edit add-on |

### Key Components

| Component | Description |
|-----------|-------------|
| `AddonCard` | Display add-on in list |
| `AddonSelector` | Multi-select with quantity for booking flow |
| `AddonQuantityControl` | +/- buttons for quantity adjustment |
| `AddonPricingDisplay` | Shows price with pricing type label |

---

# Feature 3: Bookings

## Overview

Complete booking management with lifecycle tracking, payment processing, conflict detection, and automated notifications.

## Database Schema

### `bookings` Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Guest Information
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255),
  guest_phone VARCHAR(50),
  customer_id UUID REFERENCES customers(id), -- For registered customers

  -- Room Information
  room_id UUID NOT NULL REFERENCES rooms(id),
  room_name VARCHAR(255), -- Denormalized for display

  -- Dates
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,

  -- Guests
  guests INTEGER DEFAULT 1, -- Can also be JSONB for detailed breakdown

  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',

  -- Pricing
  total_amount DECIMAL(10,2) NOT NULL,
  subtotal_before_discount DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'ZAR',

  -- Payment Tracking
  payment_method VARCHAR(20), -- paystack, paypal, eft, manual
  payment_reference VARCHAR(255),
  payment_completed_at TIMESTAMP WITH TIME ZONE,

  -- Coupon/Discount
  coupon_id UUID REFERENCES coupons(id),
  coupon_code VARCHAR(100),

  -- Notes (stores add-ons, nightly rates, special requests as JSON)
  notes TEXT, -- JSON string with structured data
  internal_notes TEXT, -- Staff-only notes

  -- FOB Integration (multi-channel sync)
  source VARCHAR(50) DEFAULT 'vilo',
  external_id VARCHAR(255),
  external_url TEXT,
  synced_at TIMESTAMP WITH TIME ZONE,

  -- Failed Booking Recovery
  checkout_data JSONB, -- Full checkout state for recovery

  -- Cancellation Tracking
  cancellation_reason VARCHAR(100),
  cancellation_details TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_ticket_id UUID,
  refund_requested BOOLEAN DEFAULT false,

  -- Review Tracking
  review_request_sent BOOLEAN DEFAULT false,
  review_request_sent_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Indexes
CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
```

### `archived_bookings` Table (For Recovery)

```sql
CREATE TABLE archived_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Original booking data
  original_booking_id UUID,
  booking_data JSONB NOT NULL, -- Full snapshot
  checkout_data JSONB,

  -- Archive reason
  archive_reason VARCHAR(50), -- 'cart_abandoned', 'payment_failed', 'deleted'
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Recovery tracking
  recovered_at TIMESTAMP WITH TIME ZONE,
  recovered_booking_id UUID,
  recovered_by UUID
);
```

## Status Values

### Booking Status
| Status | Description |
|--------|-------------|
| `pending` | Booking created, awaiting confirmation |
| `confirmed` | Booking confirmed by admin |
| `checked_in` | Guest has arrived |
| `checked_out` | Guest has departed |
| `completed` | Post-checkout workflow complete |
| `cancelled` | Booking cancelled |
| `payment_failed` | Payment declined/error |
| `cart_abandoned` | Checkout abandoned by customer |

### Payment Status
| Status | Description |
|--------|-------------|
| `pending` | Payment not yet received |
| `partial` | Partial payment received |
| `paid` | Full payment received |
| `refunded` | Payment refunded |

### Status Constraints

```sql
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out',
                    'cancelled', 'completed', 'payment_failed', 'cart_abandoned'));

ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded'));
```

## Booking Notes Schema (JSON String)

```typescript
interface BookingNotes {
  // Guest breakdown
  guests?: number;
  adults?: number;
  children?: number;
  children_ages?: number[];

  // Add-ons
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    pricing_type: string;
    quantity: number;
    total: number;
  }>;

  // Coupon
  coupon?: {
    id: string;
    code: string;
    name: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
    discount_value: number;
    discount_amount: number;
  };

  // Special requests
  special_requests?: string;

  // Nightly pricing breakdown
  nightly_rates?: Array<{
    date: string;
    base_price: number;
    effective_price: number;
    override_price?: number;
    seasonal_rate?: string;
  }>;

  // Reference
  booking_reference?: string; // e.g., "VILO-ABC123"
  booked_online?: boolean;
}
```

## Booking Sources (FOB Integration)

| Source | Description |
|--------|-------------|
| `vilo` | Native Vilo booking |
| `website` | Website/discovery booking |
| `manual` | Manual admin entry |
| `airbnb` | Synced from Airbnb |
| `booking_com` | Synced from Booking.com |
| `lekkerslaap` | Synced from Lekkerslaap |
| `expedia` | Synced from Expedia |
| `tripadvisor` | Synced from TripAdvisor |
| `block` | Room block (not a guest booking) |
| `blocked` | Room blocked |
| `maintenance` | Maintenance period |

## Cancellation Reasons

| Code | Display Label |
|------|---------------|
| `change_of_plans` | Change of Plans |
| `alternative_accommodation` | Found Alternative Accommodation |
| `health_emergency` | Health Emergency |
| `travel_restrictions` | Travel Restrictions |
| `financial_reasons` | Financial Reasons |
| `duplicate_booking` | Duplicate Booking |
| `property_expectations` | Property Didn't Meet Expectations |
| `other` | Other |

## API Endpoints

### CRUD Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List all bookings with filters |
| GET | `/api/bookings/:id` | Get single booking |
| POST | `/api/bookings` | Create booking |
| PUT | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Delete booking |

### Availability & Conflicts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/check-conflicts` | Check for date conflicts |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/:id/send-confirmation` | Send confirmation email |
| POST | `/api/bookings/:id/send-update` | Send update notification |

### Customer Portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portal/bookings` | Get customer's bookings |
| POST | `/api/portal/bookings/:id/cancel` | Cancel booking |

## Request/Response Examples

### Create Booking

```typescript
// POST /api/bookings
// Headers: { "x-tenant-id": "uuid" }

// Request
{
  "guest_name": "John Smith",
  "guest_email": "john@example.com",
  "guest_phone": "+27821234567",
  "room_id": "room-uuid",
  "room_name": "Ocean View Suite",
  "check_in": "2024-03-15",
  "check_out": "2024-03-18",
  "guests": 2,
  "total_amount": 7500,
  "currency": "ZAR",
  "status": "pending",
  "payment_status": "pending",
  "notes": "{\"adults\":2,\"children\":0,\"addons\":[{\"id\":\"addon-uuid\",\"name\":\"Breakfast\",\"price\":150,\"pricing_type\":\"per_guest_per_night\",\"quantity\":1,\"total\":900}],\"special_requests\":\"Late check-in please\"}",
  "source": "vilo",
  "coupon_code": "SUMMER20",
  "subtotal_before_discount": 8400,
  "discount_amount": 900
}

// Response
{
  "id": "booking-uuid",
  "guest_name": "John Smith",
  // ... all fields
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Check Conflicts

```typescript
// POST /api/bookings/check-conflicts
// Headers: { "x-tenant-id": "uuid" }

// Request
{
  "room_id": "room-uuid",
  "check_in": "2024-03-15",
  "check_out": "2024-03-18",
  "exclude_booking_id": "booking-uuid" // Optional: exclude when editing
}

// Response (no conflicts)
{
  "hasConflict": false,
  "conflicts": []
}

// Response (with conflicts)
{
  "hasConflict": true,
  "conflicts": [
    {
      "id": "conflicting-booking-uuid",
      "guest_name": "Jane Doe",
      "source": "airbnb",
      "check_in": "2024-03-14",
      "check_out": "2024-03-17",
      "status": "confirmed"
    }
  ]
}
```

## Conflict Detection Algorithm

```typescript
async function checkConflicts(
  tenantId: string,
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflicts: Booking[] }> {
  // Overlap condition: existing.check_in < new.check_out AND existing.check_out > new.check_in
  const query = `
    SELECT * FROM bookings
    WHERE tenant_id = $1
      AND room_id = $2
      AND status NOT IN ('cancelled', 'payment_failed', 'cart_abandoned')
      AND check_in < $4
      AND check_out > $3
      ${excludeBookingId ? 'AND id != $5' : ''}
  `;

  const conflicts = await db.query(query, [tenantId, roomId, checkIn, checkOut, excludeBookingId]);

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}
```

## Price Calculation Logic

```typescript
interface PriceCalculation {
  roomTotal: number;
  addonsTotal: number;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  nights: Array<{ date: string; price: number; rateName?: string }>;
}

async function calculateBookingPrice(
  room: Room,
  checkIn: Date,
  checkOut: Date,
  guests: { adults: number; children: number },
  addons: Array<{ addon: Addon; quantity: number }>,
  coupon?: Coupon
): Promise<PriceCalculation> {
  // 1. Calculate room total with pricing mode
  const nights = [];
  let roomTotal = 0;

  for (let date = checkIn; date < checkOut; date = addDays(date, 1)) {
    const { price, rateName } = await getEffectivePrice(room, date);

    let nightPrice = price;
    if (room.pricing_mode === 'per_person') {
      nightPrice = price * (guests.adults + guests.children);
    } else if (room.pricing_mode === 'per_person_sharing') {
      const additionalGuests = Math.max(0, guests.adults + guests.children - 1);
      nightPrice = price + (additionalGuests * room.additional_person_rate);
    }

    nights.push({ date: formatDate(date), price: nightPrice, rateName });
    roomTotal += nightPrice;
  }

  // 2. Calculate add-ons
  const numberOfNights = differenceInDays(checkOut, checkIn);
  const numberOfGuests = guests.adults + guests.children;

  let addonsTotal = 0;
  for (const { addon, quantity } of addons) {
    addonsTotal += calculateAddonTotal(addon, quantity, numberOfNights, numberOfGuests);
  }

  // 3. Calculate subtotal
  const subtotal = roomTotal + addonsTotal;

  // 4. Apply coupon discount
  let discountAmount = 0;
  if (coupon && coupon.is_active) {
    if (coupon.discount_type === 'percentage') {
      discountAmount = subtotal * (coupon.discount_value / 100);
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = coupon.discount_value;
    }
    // Cap discount at subtotal
    discountAmount = Math.min(discountAmount, subtotal);
  }

  return {
    roomTotal,
    addonsTotal,
    subtotal,
    discountAmount,
    grandTotal: subtotal - discountAmount,
    nights
  };
}
```

## Booking Lifecycle & Notifications

### Status Transitions

```
pending ─────────────► confirmed ─────────────► checked_in ─────────────► checked_out ─────────────► completed
    │                      │                        │                          │
    │                      │                        │                          │
    ▼                      ▼                        ▼                          ▼
cancelled              cancelled                cancelled                  cancelled
```

### Notification Events

```typescript
// When booking created
await notifyNewBooking(tenantId, booking);
await logActivity('booking_created', tenantId, booking);

// When status changes to 'confirmed'
await notifyCustomerBookingConfirmed(tenantId, customerId, booking);

// When status changes to 'checked_in'
await notifyCheckIn(tenantId, booking);

// When status changes to 'checked_out'
await notifyCheckOut(tenantId, booking);

// When status changes to 'cancelled'
await notifyBookingCancelled(tenantId, booking);
await notifyCustomerBookingCancelled(tenantId, customerId, booking);

// When payment_status changes to 'paid'
await generateInvoice(bookingId, tenantId);
await notifyPaymentReceived(tenantId, paymentData);
await notifyCustomerPaymentConfirmed(tenantId, customerId, paymentData);

// When booking modified
await notifyBookingModified(tenantId, changesSummary);
await notifyCustomerBookingModified(tenantId, customerId, changesSummary);
```

## Invoice Generation

### Invoice Data Structure

```typescript
interface Invoice {
  id: string;
  tenant_id: string;
  booking_id: string;
  invoice_number: string; // Format: INV-000001
  invoice_date: string;
  payment_date: string;

  business: {
    name: string;
    logo_url?: string;
    address?: string;
    vat_number?: string;
    company_registration_number?: string;
    email?: string;
    phone?: string;
  };

  customer: {
    name: string;
    email: string;
    phone?: string;
    business_name?: string;
    business_vat_number?: string;
    business_registration_number?: string;
    business_address?: string;
  };

  booking: {
    id: string;
    reference: string; // VILO-XXXX
    room_name: string;
    check_in: string;
    check_out: string;
    nights: number;
  };

  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;

  subtotal: number;
  vat_rate: number; // e.g., 15
  vat_amount: number;
  discount_amount?: number;
  total_amount: number;
  currency: string;
}
```

### Auto-Generate on Payment

```typescript
// In booking update handler
if (previousPaymentStatus !== 'paid' && newPaymentStatus === 'paid') {
  const existingInvoice = await getInvoiceByBookingId(bookingId);
  if (!existingInvoice) {
    await generateInvoice(bookingId, tenantId);
  }
}
```

## Frontend Components

### Pages

| Component | Path | Description |
|-----------|------|-------------|
| `Bookings.tsx` | `/dashboard/bookings` | Booking list with filters |
| `BookingDetail.tsx` | `/dashboard/bookings/:id` | View/manage single booking |
| `BookingWizard.tsx` | `/dashboard/bookings/new` | Multi-step booking creation |
| `BookingWizard.tsx` | `/dashboard/bookings/:id/edit` | Edit existing booking |
| `CustomerBookings.tsx` | `/portal/bookings` | Customer's booking list |
| `Checkout.tsx` | `/accommodation/:slug/checkout` | Public checkout flow |

### Key Components

| Component | Description |
|-----------|-------------|
| `BookingForm` | Main booking form with all fields |
| `BookingPreviewCard` | Summary preview in wizard |
| `BookingStatusBadge` | Status display with colors |
| `PaymentStatusBadge` | Payment status display |
| `DateRangePicker` | Check-in/out date selection |
| `GuestSelector` | Adults/children input |
| `AddonSelector` | Add-on selection with quantities |
| `CouponInput` | Coupon code input and validation |
| `PricingBreakdown` | Nightly rate breakdown table |
| `QuickActionsBar` | Status transition buttons |
| `ActivityTimeline` | Booking event history |
| `InvoiceActions` | Generate, download, email invoice |

### Booking Wizard Steps

```typescript
const wizardSections = [
  { id: 'room', title: 'Room Selection', icon: BedDouble },
  { id: 'dates', title: 'Check-in & Check-out', icon: Calendar },
  { id: 'guest', title: 'Guest Information', icon: User },
  { id: 'guests', title: 'Number of Guests', icon: Users },
  { id: 'requests', title: 'Special Requests', icon: MessageSquare },
  { id: 'pricing', title: 'Pricing', icon: DollarSign },
  { id: 'addons', title: 'Add-ons', icon: Plus },
  { id: 'status', title: 'Booking Status', icon: CheckCircle },
  { id: 'terms', title: 'Terms & Conditions', icon: FileText }
];
```

### Checkout Flow Steps (Public)

```typescript
const checkoutSteps = [
  { id: 'dates-room', title: 'Dates & Room', component: DateRoomStep },
  { id: 'addons', title: 'Extras', component: AddonsStep },
  { id: 'guest-details', title: 'Your Details', component: GuestDetailsStep },
  { id: 'payment', title: 'Payment', component: PaymentStep }
];
```

---

# Feature 4: Refunds

## Overview

Complete refund management system with cancellation policies, approval workflow, and payment processor integration.

## Database Schema

### `refunds` Table

```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),

  -- Amounts
  original_amount DECIMAL(10,2) NOT NULL, -- Original booking amount
  eligible_amount DECIMAL(10,2) NOT NULL, -- Policy-calculated amount
  approved_amount DECIMAL(10,2), -- Staff-approved amount
  processed_amount DECIMAL(10,2), -- Actually refunded
  currency VARCHAR(3) DEFAULT 'ZAR',

  -- Policy Application
  policy_applied JSONB, -- Snapshot of policy at time of request
  days_before_checkin INTEGER,
  refund_percentage INTEGER,

  -- Status
  status VARCHAR(20) DEFAULT 'requested',

  -- Payment Info
  payment_method VARCHAR(20), -- Original payment method
  original_payment_reference VARCHAR(255),
  refund_reference VARCHAR(255), -- Transaction ID of refund

  -- Decision Tracking
  rejection_reason TEXT,
  staff_notes TEXT,
  override_reason TEXT, -- If approved amount differs from eligible

  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_refunds_tenant_id ON refunds(tenant_id);
CREATE INDEX idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_customer_id ON refunds(customer_id);
```

### `refund_status_history` Table

```sql
CREATE TABLE refund_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_id UUID NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,

  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_by UUID,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refund_history_refund_id ON refund_status_history(refund_id);
```

## Refund Status Workflow

```
requested ─────► under_review ─────► approved ─────► processing ─────► completed
                      │                  │              │
                      │                  │              ▼
                      ▼                  │            failed
                  rejected               │
                                         │
                                         ▼
                                    (direct completion for non-card refunds)
```

| Status | Description |
|--------|-------------|
| `requested` | Customer requested refund |
| `under_review` | Staff reviewing request |
| `approved` | Refund approved, pending processing |
| `rejected` | Refund rejected by staff |
| `processing` | Refund being processed via payment gateway |
| `completed` | Refund successfully completed |
| `failed` | Refund processing failed |

## Cancellation Policy Configuration

```typescript
interface CancellationPolicy {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;

  // Policy tiers (ordered by days_before descending)
  tiers: Array<{
    days_before: number;      // Days before check-in
    refund_percentage: number; // 0-100
    label: string;            // Display label
  }>;

  is_default: boolean;
  is_active: boolean;
}

// Example policy
const flexiblePolicy: CancellationPolicy = {
  name: "Flexible",
  tiers: [
    { days_before: 14, refund_percentage: 100, label: "Full refund" },
    { days_before: 7, refund_percentage: 50, label: "50% refund" },
    { days_before: 3, refund_percentage: 25, label: "25% refund" },
    { days_before: 0, refund_percentage: 0, label: "No refund" }
  ]
};
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/refunds` | List refunds with filters |
| GET | `/api/refunds/stats` | Get refund statistics |
| GET | `/api/refunds/:id` | Get single refund |
| GET | `/api/refunds/:id/history` | Get status history |
| POST | `/api/refunds/calculate` | Preview eligible refund |
| POST | `/api/refunds/:id/review` | Mark as under review |
| POST | `/api/refunds/:id/approve` | Approve refund |
| POST | `/api/refunds/:id/reject` | Reject refund |
| POST | `/api/refunds/:id/process` | Process refund via gateway |
| POST | `/api/refunds/:id/complete` | Mark as completed |
| PATCH | `/api/refunds/:id/notes` | Update staff notes |

## Request/Response Examples

### Calculate Eligible Refund (Preview)

```typescript
// POST /api/refunds/calculate
// Headers: { "x-tenant-id": "uuid" }

// Request
{
  "booking_id": "booking-uuid",
  "cancellation_date": "2024-03-10"
}

// Response
{
  "original_amount": 7500,
  "eligible_amount": 3750,
  "refund_percentage": 50,
  "days_before_checkin": 5,
  "policy_applied": {
    "name": "Flexible",
    "tier_matched": {
      "days_before": 7,
      "refund_percentage": 50,
      "label": "50% refund"
    }
  }
}
```

### Approve Refund with Override

```typescript
// POST /api/refunds/:id/approve
// Headers: { "x-tenant-id": "uuid" }

// Request
{
  "approved_amount": 5000, // Override eligible amount
  "override_reason": "Loyal customer, approved additional goodwill refund"
}

// Response
{
  "id": "refund-uuid",
  "status": "approved",
  "eligible_amount": 3750,
  "approved_amount": 5000,
  "override_reason": "Loyal customer, approved additional goodwill refund",
  "approved_at": "2024-03-10T14:30:00Z",
  "approved_by": "staff-uuid"
}
```

## Refund Calculation Algorithm

```typescript
function calculateEligibleRefund(
  bookingAmount: number,
  checkInDate: Date,
  cancellationDate: Date,
  policy: CancellationPolicy
): { eligibleAmount: number; percentage: number; daysBefore: number; tierMatched: PolicyTier } {
  // Calculate days between cancellation and check-in
  const daysBefore = differenceInDays(checkInDate, cancellationDate);

  // Sort tiers by days_before descending
  const sortedTiers = [...policy.tiers].sort((a, b) => b.days_before - a.days_before);

  // Find first tier where daysBefore >= tier.days_before
  let matchedTier = sortedTiers[sortedTiers.length - 1]; // Default to last (lowest)

  for (const tier of sortedTiers) {
    if (daysBefore >= tier.days_before) {
      matchedTier = tier;
      break;
    }
  }

  const eligibleAmount = bookingAmount * (matchedTier.refund_percentage / 100);

  return {
    eligibleAmount: Math.round(eligibleAmount * 100) / 100,
    percentage: matchedTier.refund_percentage,
    daysBefore,
    tierMatched: matchedTier
  };
}
```

## Create Refund from Cancellation

```typescript
async function createRefundFromCancellation(
  bookingId: string,
  tenantId: string,
  cancellationData: {
    reason: string;
    details?: string;
    refundRequested: boolean;
  }
): Promise<Refund | null> {
  // 1. Get booking
  const booking = await getBooking(bookingId, tenantId);
  if (!booking) throw new Error('Booking not found');

  // 2. Update booking with cancellation info
  await updateBooking(bookingId, tenantId, {
    status: 'cancelled',
    cancellation_reason: cancellationData.reason,
    cancellation_details: cancellationData.details,
    cancelled_at: new Date(),
    refund_requested: cancellationData.refundRequested
  });

  // 3. If refund requested and booking was paid
  if (cancellationData.refundRequested && booking.payment_status === 'paid') {
    // Get applicable policy
    const policy = await getCancellationPolicy(tenantId);

    // Calculate eligible amount
    const calculation = calculateEligibleRefund(
      booking.total_amount,
      new Date(booking.check_in),
      new Date(),
      policy
    );

    // Create refund record
    const refund = await createRefund({
      tenant_id: tenantId,
      booking_id: bookingId,
      customer_id: booking.customer_id,
      original_amount: booking.total_amount,
      eligible_amount: calculation.eligibleAmount,
      currency: booking.currency,
      policy_applied: {
        name: policy.name,
        tier_matched: calculation.tierMatched
      },
      days_before_checkin: calculation.daysBefore,
      refund_percentage: calculation.percentage,
      status: 'requested',
      payment_method: booking.payment_method,
      original_payment_reference: booking.payment_reference,
      requested_at: new Date()
    });

    // Update booking with refund reference
    await updateBooking(bookingId, tenantId, {
      refund_id: refund.id,
      refund_status: 'requested'
    });

    // Send notifications
    await notifyRefundRequested(tenantId, booking.customer_id, refund);

    return refund;
  }

  return null;
}
```

## Refund Processing

```typescript
async function processRefund(refundId: string, tenantId: string): Promise<Refund> {
  const refund = await getRefund(refundId, tenantId);

  if (refund.status !== 'approved') {
    throw new Error('Refund must be approved before processing');
  }

  // Update status
  await updateRefundStatus(refundId, 'processing');

  try {
    // Process based on payment method
    if (refund.payment_method === 'paystack') {
      const result = await processPaystackRefund(
        refund.original_payment_reference,
        refund.approved_amount
      );

      await updateRefund(refundId, {
        status: 'completed',
        refund_reference: result.transaction_id,
        processed_amount: refund.approved_amount,
        processed_at: new Date(),
        completed_at: new Date()
      });
    } else {
      // EFT/manual - mark as completed directly
      await updateRefund(refundId, {
        status: 'completed',
        processed_amount: refund.approved_amount,
        processed_at: new Date(),
        completed_at: new Date()
      });
    }

    // Update booking
    await updateBooking(refund.booking_id, tenantId, {
      payment_status: 'refunded',
      refund_status: 'completed'
    });

    // Notify customer
    await notifyRefundCompleted(tenantId, refund.customer_id, refund);

    return await getRefund(refundId, tenantId);

  } catch (error) {
    await updateRefund(refundId, {
      status: 'failed',
      failed_at: new Date(),
      failure_reason: error.message
    });

    throw error;
  }
}
```

## Refund Notifications

```typescript
// When refund requested
await notifyRefundRequested(tenantId, customerId, refund);

// When refund approved
await notifyRefundApproved(tenantId, customerId, refund);

// When refund rejected
await notifyRefundRejected(tenantId, customerId, refund);

// When refund completed
await notifyRefundCompleted(tenantId, customerId, refund);

// Escalation (if pending too long)
await notifyRefundEscalation(tenantId, refund);
```

## Frontend Components

### Pages

| Component | Path | Description |
|-----------|------|-------------|
| `Refunds.tsx` | `/dashboard/refunds` | Refund list with filters |
| `RefundDetail.tsx` | `/dashboard/refunds/:id` | View/manage single refund |

### Key Components

| Component | Description |
|-----------|-------------|
| `RefundStatusBadge` | Status display with workflow colors |
| `RefundTimeline` | Status change history |
| `RefundApprovalForm` | Amount input, override reason |
| `RefundRejectionForm` | Rejection reason input |
| `PolicyDisplay` | Show applicable policy tier |
| `RefundStats` | Dashboard statistics |

### Customer Portal

| Component | Description |
|-----------|-------------|
| `CancellationModal` | Cancel booking with refund option |
| `RefundStatusCard` | Show refund progress in bookings |

---

# Appendix

## Notification Types

```typescript
// Booking notifications
'booking_created' | 'booking_cancelled' | 'booking_modified' |
'booking_checked_in' | 'booking_checked_out'

// Payment notifications
'payment_received' | 'payment_proof_uploaded' | 'payment_failed'

// Customer notifications
'booking_confirmed' | 'booking_modified_customer' | 'booking_reminder' |
'payment_confirmed' | 'payment_overdue' | 'cart_abandoned_customer'

// Refund notifications
'refund_requested' | 'refund_approved' | 'refund_rejected' |
'refund_completed' | 'refund_escalation'
```

## Payment Methods

| Method | Description |
|--------|-------------|
| `paystack` | Paystack payment gateway |
| `paypal` | PayPal payments |
| `eft` | Electronic Funds Transfer (bank) |
| `manual` | Manual/cash payment |

## Currency Support

```typescript
const supportedCurrencies = ['ZAR', 'USD', 'EUR', 'GBP', 'NGN'];
```

## Multi-Tenant Architecture

All tables include `tenant_id` column for multi-tenant isolation. All API requests require `x-tenant-id` header for admin endpoints.

```typescript
// Middleware
app.use('/api/*', (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId && !isPublicRoute(req.path)) {
    return res.status(401).json({ error: 'Tenant ID required' });
  }
  req.tenantId = tenantId;
  next();
});
```
