# Payment Rules - Multiple Selection Implementation

## Summary

Fixed the payment rule system to allow manual selection of **multiple** payment rules per room, replacing the previous auto-assignment behavior.

## Changes Made

### 1. Removed Auto-Assignment Logic

**Backend - Payment Rules Service** (`backend/src/services/payment-rules.service.ts`)
- Removed auto-assignment from `createPaymentRuleGlobal()` function
- Property-level payment rules no longer auto-assign to all rooms
- Users must manually select which rules apply to each room

**Backend - Room Service** (`backend/src/services/room.service.ts`)
- Removed auto-assignment from `createRoom()` function
- New rooms no longer auto-inherit property-level payment rules
- Users must explicitly assign payment rules via Room Wizard

### 2. Updated Room Wizard - Payment Rules Step

**Frontend Component** (`frontend/src/components/features/Room/RoomWizard/PaymentRulesStep.tsx`)

Changed from single-selection (radio buttons) to **multi-selection (checkboxes)**:

**Before:**
- Radio button UI
- Only ONE payment rule allowed per room
- "Flexible Payment Terms" default option always shown
- Selected rule replaced any previous selection

**After:**
- Checkbox UI
- **MULTIPLE payment rules** allowed per room
- No default "Flexible Payment Terms" option
- Rules can be selected/deselected independently
- Status shows: "X payment rules selected"

### 3. Data Structure

Payment rules are stored as an array in room form data:
```typescript
// Room form data
interface RoomFormData {
  // ... other fields
  payment_rules: PaymentRuleFormData[]; // Array - can hold multiple rules
}
```

### 4. Cleared Unwanted Assignments

- Removed 3 unwanted payment rule assignments from King room
- Kept only "Standard" (Flexible) rule as requested
- Can now manually select which rules apply to each room

## How It Works Now

### Creating/Editing a Room

1. Navigate to Room Wizard → Payment Rules step
2. See all available payment rules for the property
3. Click to select/deselect multiple rules (checkboxes)
4. Selected rules will be assigned to the room on save

### Managing Payment Rules

- Create payment rules at property level (centralized)
- Manually assign rules to specific rooms via Room Wizard
- Each room can have 0, 1, or multiple payment rules
- Rules can be selectively applied based on room type, season, etc.

## UI Changes

### Payment Rules Step Interface

**Selection Counter:**
- "No payment rules selected" (when none selected)
- "1 payment rule selected" (when one selected)
- "X payment rules selected" (when multiple selected)

**Checkbox Appearance:**
- ☐ Empty checkbox = Not selected
- ☑ Checked box with green background = Selected
- Hover effect on all cards
- Selected cards have green border and light green background

**Create New Rule:**
- "Create New Payment Rule" button
- Newly created rules auto-selected and added to existing selections
- Rules are created at property level and can be reused across rooms

## Database Structure

```sql
-- Junction table for many-to-many relationships
room_payment_rule_assignments (
  id UUID,
  room_id UUID, -- Links to rooms table
  payment_rule_id UUID, -- Links to room_payment_rules table
  assigned_by UUID, -- User who assigned
  assigned_at TIMESTAMPTZ,
  UNIQUE(room_id, payment_rule_id) -- Prevents duplicates
)
```

## Benefits

1. **Full Control**: Users manually select which rules apply to each room
2. **Flexibility**: Different rooms can have different payment terms
3. **Multiple Rules**: Rooms can have multiple payment rules for different scenarios
4. **No Auto-Assignment**: No unwanted rules automatically applied
5. **Reusable Rules**: Create rules once, apply to multiple rooms selectively

## Example Use Cases

### Scenario 1: Seasonal Payment Rules
- Create "Summer Deposit" rule (50% deposit)
- Create "Winter Full Payment" rule (100% upfront)
- Assign both to premium rooms
- Economy rooms might only use "Winter Full Payment"

### Scenario 2: Room Type Variations
- Create "Standard Payment" rule for regular rooms
- Create "VIP Payment Schedule" for luxury suites
- Each room type gets the appropriate rule(s)

### Scenario 3: Multi-Rule Strategy
- Assign "Early Bird Discount" rule
- Assign "Last Minute" rule
- Assign "Standard Deposit" rule
- System can choose appropriate rule based on booking date

## Testing

To test the multiple selection:

1. **Edit a room** (e.g., King room)
2. Navigate to "Payment Rules" step
3. You'll see all available payment rules with checkboxes
4. Click multiple rules to select them
5. Selected rules show with green checkmark and border
6. Save the room
7. View room detail page → Payment Rules tab
8. All selected rules should appear

## Files Modified

- `backend/src/services/payment-rules.service.ts` - Removed auto-assignment
- `backend/src/services/room.service.ts` - Removed auto-assignment
- `frontend/src/components/features/Room/RoomWizard/PaymentRulesStep.tsx` - Multi-select UI

## Previous Documentation

The auto-assignment implementation was documented in `AUTO_ASSIGNMENT_IMPLEMENTED.md` but has been reverted in favor of manual selection based on user feedback.

---

**Date Implemented**: 2026-01-11
