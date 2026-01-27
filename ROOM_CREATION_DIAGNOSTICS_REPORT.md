# Room Creation Diagnostics Report

## Issue Summary
User reported: "I am unable to add new rooms"

## Investigation Completed

### 1. Code Analysis

#### Backend Room Creation Flow
**File**: `backend/src/services/room.service.ts` (lines 286-437)

The `createRoom` function performs the following checks **before** creating a room:

1. **Field Validation**:
   - Room name required
   - Base price per night >= 0
   - Max guests >= 1

2. **Room Limit Check** (line 306-316):
   ```typescript
   const [limitInfo, property] = await Promise.all([
     getRoomLimitInfo(userId),
     getProperty(input.property_id),
   ]);

   if (!limitInfo.can_create) {
     throw new AppError(
       'FORBIDDEN',
       `You have reached your room limit (${limitInfo.max_allowed}). Please upgrade your subscription to create more rooms.`
     );
   }
   ```

3. **Property Ownership Check** (line 318-320):
   - Verifies the user owns the property

#### Room Limit Logic
**File**: `backend/src/services/room.service.ts` (lines 1390-1439)

The `getRoomLimitInfo` function determines if a user can create rooms:

**Logic**:
- Queries user's active subscription
- Counts existing rooms across all user's properties
- If no subscription: allows 5 rooms (free tier)
- Otherwise: uses subscription's `limits.max_rooms` value
- Returns `can_create: false` if limit reached

**Default Limits**:
- No subscription: 5 rooms
- Subscription with no limit specified: 5 rooms
- Unlimited: `max_rooms = -1`

### 2. Potential Root Causes

Based on the code analysis, room creation can fail for these reasons:

#### A. **Room Limit Reached** (Most Likely)
- User has reached their subscription's max_rooms limit
- Error message: "You have reached your room limit (X). Please upgrade your subscription to create more rooms."

#### B. **Property Ownership Issue**
- User trying to add room to a property they don't own
- Error message: "You do not own this property"

#### C. **Validation Errors**
- Missing required fields (room name, base price, max guests)
- Invalid values (negative price, zero guests)

#### D. **Frontend Validation**
- Form validation preventing submission
- TypeScript errors in RoomWizard component

### 3. Diagnostic Steps

#### Step 1: Check User's Subscription and Room Count

Run the diagnostic SQL query I created:
**File**: `DIAGNOSE_ROOM_CREATION_ISSUE.sql`

This will show:
- Current subscription status
- Max rooms allowed
- Current room count
- Remaining slots

#### Step 2: Check Browser Console
Open browser console (F12) when attempting to create a room and look for:
- JavaScript errors
- Failed API requests (red in Network tab)
- Validation error messages

#### Step 3: Check Backend Logs
Look for these error patterns in backend logs:
- "You have reached your room limit"
- "You do not own this property"
- "Room name is required"
- "Failed to create room"

### 4. Solutions

#### Solution A: Increase Room Limit (If limit reached)

**Option 1 - Upgrade Subscription Plan**:
- User upgrades to a plan with higher room limit
- System automatically updates limits

**Option 2 - Manually Adjust Limit** (Admin only):
```sql
-- Increase room limit to 10
UPDATE subscriptions
SET limits = jsonb_set(limits, '{max_rooms}', '10')
WHERE user_id = 'USER_ID' AND status = 'active';

-- Give unlimited rooms
UPDATE subscriptions
SET limits = jsonb_set(limits, '{max_rooms}', '-1')
WHERE user_id = 'USER_ID' AND status = 'active';
```

#### Solution B: Fix Property Ownership (If ownership issue)

Check if properties have NULL owner_id (from onboarding issue):
```sql
SELECT id, name, owner_id, company_id
FROM properties
WHERE owner_id IS NULL;
```

If found, fix with:
```sql
UPDATE properties
SET owner_id = (SELECT user_id FROM companies WHERE id = properties.company_id)
WHERE owner_id IS NULL;
```

#### Solution C: Frontend Validation Issue

If frontend is blocking submission:
1. Check CreateRoomPage.tsx (lines 132-146) for room limit check
2. Verify RoomWizard form validation
3. Check for TypeScript errors: `npm run build`

### 5. Quick Verification Commands

**Check user's current situation**:
```sql
-- Replace 'user@example.com' with actual user email
SELECT
  u.email,
  u.user_type,
  s.status as subscription_status,
  COALESCE(s.limits->>'max_rooms', '5') as max_rooms,
  COUNT(r.id) as current_rooms
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN properties p ON p.owner_id = u.id
LEFT JOIN rooms r ON r.property_id = p.id
WHERE u.email = 'user@example.com'
GROUP BY u.email, u.user_type, s.status, s.limits;
```

**Check for properties with NULL owner_id**:
```sql
SELECT COUNT(*) as properties_without_owner
FROM properties
WHERE owner_id IS NULL;
```

### 6. Testing Checklist

To fully diagnose the issue, test:

- [ ] Run diagnostic SQL query to check limits
- [ ] Check browser console for errors
- [ ] Check backend logs for error messages
- [ ] Verify user has active subscription
- [ ] Verify property ownership (owner_id not NULL)
- [ ] Try creating room with minimal data
- [ ] Check TypeScript diagnostics: No errors found in IDE

### 7. API Endpoint Details

**Create Room Endpoint**:
- Method: POST
- URL: `/api/rooms`
- Auth: Required (Bearer token)
- Validation: `createRoomSchema` (Zod)

**Required Fields**:
- property_id (UUID)
- name (string, min 1 char)
- base_price_per_night (number, >= 0)
- max_guests (number, >= 1)

**Optional Fields**:
- description, room_size_sqm, pricing_mode, currency
- capacity, bed configuration, amenities
- seasonal rates, promotions

### 8. Next Steps

1. **Run the diagnostic SQL** to identify the exact issue
2. **Check browser console** when attempting to create a room
3. **Provide the results** so we can determine the specific solution needed

---

## Files Modified/Created

- `DIAGNOSE_ROOM_CREATION_ISSUE.sql` - Diagnostic SQL queries
- `ROOM_CREATION_DIAGNOSTICS_REPORT.md` - This report

## References

- Room Service: `backend/src/services/room.service.ts`
- Room Controller: `backend/src/controllers/room.controller.ts`
- Room Validators: `backend/src/validators/room.validators.ts`
- Room Routes: `backend/src/routes/room.routes.ts`
- Create Room Page: `frontend/src/pages/rooms/CreateRoomPage.tsx`
- Room Wizard: `frontend/src/components/features/Room/RoomWizard/RoomWizard.tsx`
