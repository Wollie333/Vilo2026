# Currency System

> **Status**: Partially Implemented
> **Last Updated**: 2026-01-04

## Overview

The Vilo platform uses a hierarchical currency system where currency settings cascade down from user to company to property to room, with each level able to override the inherited value.

---

## Currency Inheritance Chain

```
User (default_currency)
  └── Company (default_currency) - inherits from User, can override
        └── Property (currency) - inherits from Company, can override
              └── Room (currency) - inherits from Property, can override
```

---

## Implementation Status

| Entity | Field Name | Type | Default | Status |
|--------|------------|------|---------|--------|
| user_profiles | `default_currency` | VARCHAR(3) | 'ZAR' | Implemented |
| companies | `default_currency` | VARCHAR(3) | 'ZAR' | Implemented |
| properties | `currency` | VARCHAR(3) | NULL | Implemented |
| rooms | `currency` | VARCHAR(3) | NULL | **TODO** - Table doesn't exist yet |

---

## Currency Field Details

### User Profile (`user_profiles.default_currency`)
- **Purpose**: System-wide default currency for the user
- **Default**: 'ZAR' (South African Rand - SaaS system default)
- **Format**: ISO 4217 3-letter currency code
- **Inheritance**: Top of the chain, no inheritance

### Company (`companies.default_currency`)
- **Purpose**: Default currency for all company operations
- **Default**: 'ZAR' (inherits from system default)
- **Format**: ISO 4217 3-letter currency code
- **Inheritance**: Should inherit from user's default_currency if not specified

### Property (`properties.currency`)
- **Purpose**: Currency for property pricing and bookings
- **Default**: NULL (inherits from company)
- **Format**: ISO 4217 3-letter currency code
- **Inheritance**: Inherits from company's default_currency if NULL

### Room (`rooms.currency`) - TODO
- **Purpose**: Currency for room-specific pricing
- **Default**: NULL (inherits from property)
- **Format**: ISO 4217 3-letter currency code
- **Inheritance**: Inherits from property's currency if NULL

---

## Inheritance Resolution Logic

When determining the effective currency for an entity:

```typescript
function getEffectiveCurrency(entity: Entity): string {
  // 1. Check entity's own currency
  if (entity.currency) return entity.currency;

  // 2. Check parent's currency (recursively)
  if (entity.parent) {
    return getEffectiveCurrency(entity.parent);
  }

  // 3. Ultimate fallback (SaaS system default)
  return 'ZAR';
}
```

### Example Resolution

```
User: default_currency = 'EUR'
  └── Company A: default_currency = NULL → Effective: 'EUR'
        └── Property 1: currency = 'GBP' → Effective: 'GBP'
        │     └── Room 1a: currency = NULL → Effective: 'GBP'
        │     └── Room 1b: currency = 'CHF' → Effective: 'CHF'
        └── Property 2: currency = NULL → Effective: 'EUR'
              └── Room 2a: currency = NULL → Effective: 'EUR'
```

---

## Database Migrations

- **Migration 014**: Added `default_currency` to companies table
- **Migration 016**: Added `default_currency` to user_profiles and `currency` to properties

---

## Future Work

### Room Currency (When rooms table is created)
```sql
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

COMMENT ON COLUMN public.rooms.currency IS 'Room currency override (ISO 4217 code). Inherits from property currency if null.';
```

### Helper Function for Currency Resolution
Consider creating a database function to resolve effective currency:
```sql
CREATE FUNCTION get_effective_currency(entity_type TEXT, entity_id UUID)
RETURNS VARCHAR(3) AS $$
  -- Resolve currency through inheritance chain
$$ LANGUAGE plpgsql;
```

---

## Supported Currencies

Common ISO 4217 currency codes:
- USD - US Dollar
- EUR - Euro
- GBP - British Pound
- CHF - Swiss Franc
- JPY - Japanese Yen
- CAD - Canadian Dollar
- AUD - Australian Dollar
- NZD - New Zealand Dollar
- ZAR - South African Rand
- (Add more as needed)
