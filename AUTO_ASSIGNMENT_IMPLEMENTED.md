# Auto-Assignment Implementation Complete

## Summary

Implemented automatic assignment of property-level payment rules to ensure they're always linked to the appropriate rooms via the junction table `room_payment_rule_assignments`.

## What Was Fixed

### The Original Problem
- Payment rules were created at the property level (with `property_id` but no `room_id`)
- These property-level rules weren't being assigned in the junction table `room_payment_rule_assignments`
- The backend only queries the junction table, so it returned an empty array
- Payment rule types weren't showing on the room detail page

### The Solution
1. **Backfilled existing assignments**: Created and ran a script to assign all existing property-level payment rules to all rooms in their respective properties
2. **Auto-assignment on rule creation**: When a new property-level payment rule is created, it automatically gets assigned to all existing rooms in that property
3. **Auto-assignment on room creation**: When a new room is created, it automatically gets assigned all property-level payment rules for that property

## Changes Made

### 1. Backend - Payment Rules Service (`backend/src/services/payment-rules.service.ts`)

**Function: `createPaymentRuleGlobal`** (Line ~750)
- Added auto-assignment logic after creating a property-level payment rule
- Fetches all rooms for the property
- Creates assignments in `room_payment_rule_assignments` junction table
- Uses `upsert` with conflict handling to avoid duplicates

```typescript
// AUTO-ASSIGN: Get all rooms for this property and assign them to this rule
const { data: rooms, error: roomsError } = await getAdminClient()
  .from('rooms')
  .select('id')
  .eq('property_id', propertyId);

if (!roomsError && rooms && rooms.length > 0) {
  const assignments = rooms.map((room) => ({
    room_id: room.id,
    payment_rule_id: createdRule.id,
    assigned_by: userId,
  }));

  await getAdminClient()
    .from('room_payment_rule_assignments')
    .upsert(assignments, { onConflict: 'room_id,payment_rule_id', ignoreDuplicates: true });
}
```

### 2. Backend - Room Service (`backend/src/services/room.service.ts`)

**Function: `createRoom`** (Line ~249)
- Added auto-assignment logic after creating a room
- Fetches all property-level payment rules for the property
- Creates assignments in `room_payment_rule_assignments` junction table
- Uses `upsert` with conflict handling to avoid duplicates

```typescript
// AUTO-ASSIGN: Get all property-level payment rules and assign this room to them
const { data: propertyRules, error: rulesError } = await supabase
  .from('room_payment_rules')
  .select('id')
  .eq('property_id', input.property_id)
  .is('room_id', null);  // Property-level rules only

if (!rulesError && propertyRules && propertyRules.length > 0) {
  const ruleAssignments = propertyRules.map((rule) => ({
    room_id: data.id,
    payment_rule_id: rule.id,
    assigned_by: userId,
  }));

  await supabase
    .from('room_payment_rule_assignments')
    .upsert(ruleAssignments, { onConflict: 'room_id,payment_rule_id', ignoreDuplicates: true });
}
```

### 3. Frontend - Room Detail Page

- Added defensive check to only show payment rule type badge if the data exists
- This prevents UI errors when data is missing

## Testing

### Manual Testing Steps

1. **Test Auto-Assignment on Rule Creation**:
   - Go to payment rules management
   - Create a new property-level payment rule
   - Check each room detail page in that property
   - Verify the new rule appears on all rooms

2. **Test Auto-Assignment on Room Creation**:
   - Note the existing payment rules for a property
   - Create a new room in that property
   - Go to the new room's detail page
   - Verify all existing property-level payment rules are assigned

3. **Verify No Duplicates**:
   - Try creating duplicate assignments (shouldn't be possible)
   - The `UNIQUE` constraint on `(room_id, payment_rule_id)` prevents duplicates
   - The `upsert` with `ignoreDuplicates: true` handles this gracefully

## Database Schema

The junction table structure ensures proper relationships:

```sql
CREATE TABLE public.room_payment_rule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  payment_rule_id UUID NOT NULL REFERENCES public.room_payment_rules(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  assigned_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_room_payment_rule UNIQUE(room_id, payment_rule_id)
);
```

## Benefits

1. **No More Manual Assignment Required**: Property-level rules automatically apply to all rooms
2. **Consistent Behavior**: New rooms automatically inherit all property-level rules
3. **Data Integrity**: Junction table properly maintains many-to-many relationships
4. **No Duplicates**: Unique constraint and upsert logic prevent duplicate assignments
5. **Graceful Error Handling**: Assignment failures don't prevent rule/room creation

## Future Considerations

- Consider adding a UI toggle to disable auto-assignment for specific cases
- Consider adding bulk unassign functionality
- Consider adding assignment history/audit trail
- Consider similar auto-assignment for add-ons and promotions if they follow the same pattern

## Related Files

- `backend/src/services/payment-rules.service.ts` - Payment rules CRUD with auto-assignment
- `backend/src/services/room.service.ts` - Room creation with auto-assignment
- `frontend/src/pages/rooms/RoomDetailPage.tsx` - Room detail display
- `backend/migrations/038_create_room_assignment_junction_tables.sql` - Junction table creation
- `backend/migrations/057_add_property_level_payment_rules.sql` - Property-level rules support

## Date Completed

2026-01-11
