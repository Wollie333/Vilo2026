# Payment Rules & Promo Codes Save/Load Fix - COMPLETE ✅

## Issue Summary

User reported: "BOTH PROMO CODES DO NOT SAVE AND SHOW UP WHEN i EDIT AND PAYMENT RULES DO NOT SHOW UP IN TAB ON DETAILS PAGE"

## Root Cause

After migrations 038 and 057:
- Payment rules and promotions transitioned to use **junction table pattern**
- Rules/promotions are property-level (property_id set, room_id = null)
- Rooms are linked via junction tables: `room_payment_rule_assignments` and `room_promotion_assignments`
- **BUT**: The code was still using the OLD direct foreign key pattern

### The Mismatch

**Creating Data:**
- Payment rules: Created property-level ✅ BUT assigned via old room_id FK ❌
- Promotions: Created with room_id directly ❌ (not property-level)

**Reading Data:**
- Backend queried: `.eq('room_id', id)` ❌ (only gets direct FK, misses junction table assignments)

**Result:** Data created in one pattern, queried in another = **nothing found**

---

## Fixes Applied

### 1. Backend Room Service - Query via Junction Tables ✅

**File:** `backend/src/services/room.service.ts` (lines 193-242)

**Before:**
```typescript
// Only queried direct foreign keys
supabase.from('room_payment_rules').select('*').eq('room_id', id)
supabase.from('room_promotions').select('*').eq('room_id', id)
```

**After:**
```typescript
// Query via junction tables (gets assigned rules/promotions)
supabase
  .from('room_payment_rule_assignments')
  .select(`payment_rule_id, room_payment_rules (*)`)
  .eq('room_id', id)

supabase
  .from('room_promotion_assignments')
  .select(`promotion_id, room_promotions (*)`)
  .eq('room_id', id)

// Extract from nested results
const paymentRules = (paymentRulesResult.data || [])
  .map((assignment: any) => assignment.room_payment_rules)
  .filter(Boolean);

const promotions = (promotionsResult.data || [])
  .map((assignment: any) => assignment.room_promotions)
  .filter(Boolean);
```

---

### 2. Frontend Payment Rules Hook - Use Assignment Pattern ✅

**File:** `frontend/src/hooks/usePaymentRulesManagement.ts`

**Before:**
- Tried to create/update/delete payment rules directly
- Called `paymentRulesService.createPaymentRule(roomId, ...)` (creates room-level rules)
- Called `paymentRulesService.updatePaymentRule(roomId, ruleId, ...)` (updates rules)
- Called `paymentRulesService.deletePaymentRule(roomId, ruleId)` (deletes rules)

**After:**
- Only manages assignments (junction table records)
- Calls `paymentRulesService.assignPaymentRuleToRooms(ruleId, [roomId])` for new selections
- Calls `paymentRulesService.unassignPaymentRuleFromRoom(ruleId, roomId)` for removals
- **Does NOT create/update/delete rules** (rules are managed on Payment Rules page)

**Key Logic:**
```typescript
// Find rules to assign (in current but not in original)
const rulesToAssign = Array.from(currentRuleIds).filter(
  (ruleId) => !originalRuleIds.has(ruleId)
);

// Find rules to unassign (in original but not in current)
const rulesToUnassign = Array.from(originalRuleIds).filter(
  (ruleId) => !currentRuleIds.has(ruleId)
);

// Execute assignments and unassignments in parallel
await Promise.all([
  ...rulesToAssign.map((ruleId) =>
    paymentRulesService.assignPaymentRuleToRooms(ruleId, [roomId])
  ),
  ...rulesToUnassign.map((ruleId) =>
    paymentRulesService.unassignPaymentRuleFromRoom(ruleId, roomId)
  ),
]);
```

---

### 3. Backend Promotion Creation - Use Property-Level + Junction Table ✅

**File:** `backend/src/services/room.service.ts` (lines 847-903)

**Before:**
```typescript
// Created promotion with room_id directly
await supabase.from('room_promotions').insert({
  room_id: roomId,      // ❌ Direct FK
  property_id: room.property_id,
  // ... other fields
});
```

**After:**
```typescript
// Step 1: Create property-level promotion
const { data, error } = await supabase.from('room_promotions').insert({
  room_id: null,        // ✅ Property-level
  property_id: room.property_id,
  // ... other fields
});

// Step 2: Assign to room via junction table
await supabase.from('room_promotion_assignments').insert({
  room_id: roomId,
  promotion_id: data.id,
  assigned_by: userId,
});
```

**Rollback on Error:**
- If assignment fails, deletes the promotion to maintain data consistency

---

### 4. Backend Promotion Deletion - Delete Assignment ✅

**File:** `backend/src/services/room.service.ts` (lines 956-976)

**Before:**
```typescript
// Tried to delete promotion directly
await supabase
  .from('room_promotions')
  .delete()
  .eq('id', promotionId)
  .eq('room_id', roomId);  // ❌ Won't work (room_id is null)
```

**After:**
```typescript
// Delete assignment (unassign promotion from room)
await supabase
  .from('room_promotion_assignments')
  .delete()
  .eq('room_id', roomId)
  .eq('promotion_id', promotionId);
```

**Note:** Promotion itself remains (can be deleted from promotions management page if needed)

---

## Architecture Pattern (Final)

### Payment Rules
1. **Create:** User selects existing property-level rule in Room Wizard
2. **Assign:** `room_payment_rule_assignments` record created (roomId ↔ ruleId)
3. **Fetch:** Query junction table, join with `room_payment_rules`
4. **Unassign:** Delete junction table record

### Promotions
1. **Create:** User creates new promotion inline in Room Wizard
2. **Insert:** Property-level promotion created (property_id set, room_id = null)
3. **Assign:** `room_promotion_assignments` record created (roomId ↔ promotionId)
4. **Fetch:** Query junction table, join with `room_promotions`
5. **Unassign:** Delete junction table record

---

## Files Modified

### Backend
1. `backend/src/services/room.service.ts`
   - Lines 193-242: Updated `getRoomById()` to query via junction tables
   - Lines 847-903: Updated `addRoomPromotion()` to use property-level + assignment pattern
   - Lines 956-976: Updated `deleteRoomPromotion()` to delete assignment instead of promotion

### Frontend
1. `frontend/src/hooks/usePaymentRulesManagement.ts`
   - Complete rewrite: Changed from rule CRUD to assignment management
   - Uses `assignPaymentRuleToRooms()` and `unassignPaymentRuleFromRoom()` APIs

---

## How to Test

### Test 1: Create Room with Payment Rule
1. Navigate to Room Wizard (create new room)
2. Go to Payment Rules step
3. Click "Create New Payment Rule"
4. Fill in rule details (e.g., "30% Deposit")
5. Click Save
6. **Expected:** Rule appears in list and is selected (radio button checked)
7. Click Continue → Save and Activate Room
8. **Expected:** Room created successfully

### Test 2: Edit Room - Payment Rule Loads
1. Edit the room you just created
2. Navigate to Payment Rules step
3. **Expected:** The payment rule you selected is shown and selected (radio button checked)
4. Select a different rule or deselect
5. Click Continue
6. **Expected:** Changes saved, notification appears

### Test 3: Create Room with Promo Code
1. Navigate to Room Wizard (create new room)
2. Go to Promo Codes step
3. Click "Add Promotion"
4. Fill in promo code details (code: "SUMMER10", 10% discount)
5. Click Save
6. Click "Save and Activate Room"
7. **Expected:** Room created with promo code

### Test 4: Edit Room - Promo Code Loads
1. Edit the room you just created
2. Navigate to Promo Codes step
3. **Expected:** The promo code you created is shown in the list
4. Edit the promo code (change discount to 15%)
5. Click Continue
6. **Expected:** Changes saved, notification appears

### Test 5: Verify in Database
Run in Supabase SQL Editor:
```sql
-- Check payment rule assignments
SELECT
  r.name as room_name,
  pr.rule_name,
  rpa.assigned_at
FROM room_payment_rule_assignments rpa
JOIN rooms r ON rpa.room_id = r.id
JOIN room_payment_rules pr ON rpa.payment_rule_id = pr.id
ORDER BY rpa.assigned_at DESC
LIMIT 10;

-- Check promotion assignments
SELECT
  r.name as room_name,
  p.code,
  p.name as promo_name,
  pa.assigned_at
FROM room_promotion_assignments pa
JOIN rooms r ON pa.room_id = r.id
JOIN room_promotions p ON pa.promotion_id = p.id
ORDER BY pa.assigned_at DESC
LIMIT 10;
```

---

## Backend Server Restart Required ⚠️

**IMPORTANT:** You must restart the backend server for these changes to take effect:

```bash
# Kill the current server (Ctrl+C in terminal)
# Then restart:
cd backend
npm run dev
```

**DO NOT use taskkill or kill commands** - just stop the terminal process manually.

---

## Success Criteria

✅ Payment rules load when editing a room
✅ Payment rules save when selecting/deselecting in Room Wizard
✅ Promo codes load when editing a room
✅ Promo codes save when creating/editing in Room Wizard
✅ Data visible in database junction tables

---

## Next Steps

After backend restart, test all four scenarios above and verify:
1. Payment rules appear in wizard when editing
2. Payment rule changes persist
3. Promo codes appear in wizard when editing
4. Promo code changes persist

If any issues remain, check:
- Backend server restarted successfully
- No console errors in browser
- Database junction tables have records

Let me know how the testing goes! 🚀
