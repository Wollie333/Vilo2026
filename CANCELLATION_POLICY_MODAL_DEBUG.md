# Cancellation Policy Modal Not Opening - Debug & Fix Guide

## Issue
The "Cancellation Policy" link in the booking wizard (Step 3 - Guest Payment) for **Pandokkie House** is not opening in a modal popup.

The text shows: "I agree to Pandokkie House's Terms & Conditions and Cancellation Policy."

But clicking "Cancellation Policy" does nothing.

---

## Root Cause Analysis

The modal doesn't open because the property **does not have a valid cancellation policy assigned** in the database.

### How it Works:
1. Backend fetches property data including `cancellation_policy` field
2. If `cancellation_policy` is a valid UUID, backend queries `cancellation_policies` table
3. Backend returns `cancellation_policy_detail` object with full policy data
4. Frontend receives this data and passes to `GuestPaymentStep` component
5. Component renders clickable link ONLY if `propertyCancellationPolicy` prop exists
6. If prop is null/undefined, link is grayed out (not clickable)

### Why It's Not Working:
- Property "Pandokkie House" likely has:
  - **No cancellation policy assigned** (`cancellation_policy` field is NULL)
  - OR **Old text-based policy** (not a UUID)
  - OR **Invalid UUID** (policy doesn't exist in cancellation_policies table)

---

## Diagnosis Steps

### Step 1: Check Backend Logs

I've added comprehensive logging to the backend. When you load the booking wizard for Pandokkie House, check your **backend server console** for these logs:

```
🔍 [DISCOVERY] Checking cancellation policy for property: {
  property_id: "...",
  property_name: "Pandokkie House",
  cancellation_policy_value: null,  // <-- This will tell us the issue
  has_policy: false
}
```

**What to look for:**
- If `cancellation_policy_value` is **null** → Property has no policy assigned
- If `has_policy` is **false** → Same issue
- If value is a long text string → Old schema (not UUID-based)
- If value is a UUID → Continue to next log

**Next log:**
```
🔍 [DISCOVERY] Cancellation policy type: {
  isUUID: true/false,
  value: "..."
}
```

**If `isUUID: false`:**
- Property is using old text-based cancellation policy
- Backend will not fetch policy details
- Modal won't work

**If `isUUID: true`, look for:**
```
✅ [DISCOVERY] Cancellation policy query result: {
  found: false,  // <-- Policy not found in database
  policy_name: null,
  tiers_count: 0,
  error: {...}
}
```

**Finally:**
```
📦 [DISCOVERY] Returning property detail with cancellation_policy_detail: {
  property_id: "...",
  property_name: "Pandokkie House",
  has_cancellation_policy_detail: false,  // <-- This is the problem
  policy_detail: null
}
```

**If `has_cancellation_policy_detail: false`**, the modal won't work.

---

### Step 2: Check Frontend Logs

In the **browser console** when you reach Step 3 (Guest Payment):

```
🔍 [BookingWizard] Cancellation policy data: {
  cancellation_policy: "...",
  cancellation_policy_detail: null  // <-- Problem!
}

🔍 [GuestPaymentStep] Component mounted with props: {
  propertyName: "Pandokkie House",
  propertyId: "...",
  hasPropertyTerms: true,
  hasCancellationPolicy: false,  // <-- Problem!
  cancellationPolicyDetail: null
}
```

**If `hasCancellationPolicy: false`:**
- The link will be rendered as a grayed-out span (not clickable)
- No modal will open

---

## Fix Instructions

### Option 1: Check and Assign Policy via SQL (Recommended)

I've created a comprehensive SQL script: `CHECK_AND_FIX_CANCELLATION_POLICY.sql`

**Run these queries in order:**

#### 1. Check if property has a policy:
```sql
SELECT
  id,
  name,
  slug,
  cancellation_policy,
  CASE
    WHEN cancellation_policy IS NULL THEN 'NO POLICY ASSIGNED'
    WHEN cancellation_policy ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID (Good)'
    ELSE 'TEXT (Old Schema)'
  END as policy_type
FROM properties
WHERE name ILIKE '%Pandokkie%';
```

**Expected Result:**
- If `policy_type` = **'NO POLICY ASSIGNED'** → Go to Step 2
- If `policy_type` = **'TEXT (Old Schema)'** → Go to Step 3
- If `policy_type` = **'UUID (Good)'** → Policy is assigned but might not exist, go to Step 4

#### 2. Check available policies:
```sql
SELECT
  id,
  name,
  description,
  tiers,
  is_system_default
FROM cancellation_policies
ORDER BY created_at DESC;
```

**If no policies exist:**
- You need to create one first (see Step 5 in SQL script)

#### 3. Assign a policy to the property:
```sql
UPDATE properties
SET cancellation_policy = (
  SELECT id FROM cancellation_policies WHERE name = 'Flexible' LIMIT 1
)
WHERE name ILIKE '%Pandokkie%';
```

**Replace 'Flexible' with any policy name from Step 2.**

#### 4. Verify the assignment:
```sql
SELECT
  p.name as property_name,
  cp.name as policy_name,
  cp.description,
  jsonb_array_length(cp.tiers) as tier_count,
  cp.tiers
FROM properties p
LEFT JOIN cancellation_policies cp ON p.cancellation_policy = cp.id::text
WHERE p.name ILIKE '%Pandokkie%';
```

**Expected Result:**
- `policy_name` should not be NULL
- `tier_count` should be > 0 (e.g., 3)
- `tiers` should show an array like: `[{"days": 7, "refund": 100}, ...]`

---

### Option 2: Quick One-Liner Fix

Run this in your database:

```sql
DO $$
DECLARE
  v_policy_id UUID;
  v_property_id UUID;
BEGIN
  -- Get first available cancellation policy
  SELECT id INTO v_policy_id
  FROM cancellation_policies
  ORDER BY created_at ASC
  LIMIT 1;

  -- Get Pandokkie House property ID
  SELECT id INTO v_property_id
  FROM properties
  WHERE name ILIKE '%Pandokkie%'
  LIMIT 1;

  -- Assign the policy
  IF v_policy_id IS NOT NULL AND v_property_id IS NOT NULL THEN
    UPDATE properties
    SET cancellation_policy = v_policy_id::text
    WHERE id = v_property_id;

    RAISE NOTICE 'Successfully assigned cancellation policy to Pandokkie House';
  ELSE
    RAISE NOTICE 'Error: Policy or property not found!';
  END IF;
END $$;
```

---

### Option 3: Fix via UI (If Property Management Page Exists)

1. Go to **Properties → Edit Pandokkie House**
2. Look for **"Cancellation Policy"** dropdown
3. Select a policy (e.g., "Flexible", "Moderate", or "Strict")
4. **Save** the property

---

## After Fixing

### Step 1: Restart Backend Server
```bash
cd backend
npm run dev
```

### Step 2: Test the Booking Wizard

1. Navigate to: `/book/pandokkie-house` (or the correct slug)
2. Select dates and rooms
3. Go to **Step 3 (Guest Payment)**
4. Check **backend console** for the logs I added
5. Check **browser console** for frontend logs
6. **Click "Cancellation Policy" link**
7. Modal should open showing:
   - Policy name
   - Policy description
   - Refund schedule with color-coded tiers

### Step 3: Verify Logs Show Success

**Backend console should show:**
```
🔍 [DISCOVERY] Checking cancellation policy for property: {
  ...
  has_policy: true  ✅
}

✅ [DISCOVERY] Cancellation policy query result: {
  found: true,  ✅
  policy_name: "Flexible",
  tiers_count: 3,
  error: null
}

📦 [DISCOVERY] Returning property detail with cancellation_policy_detail: {
  ...
  has_cancellation_policy_detail: true,  ✅
  policy_detail: { name: "Flexible", tiers: [...] }
}
```

**Browser console should show:**
```
🔍 [GuestPaymentStep] Component mounted with props: {
  ...
  hasCancellationPolicy: true,  ✅
  cancellationPolicyDetail: { name: "Flexible", ... }
}

🔘 [GuestPaymentStep] Cancellation policy button clicked  ✅
🔍 [GuestPaymentStep] Policy data: { name: "Flexible", tiers: [...] }
```

---

## If Still Not Working After Assigning Policy

### Check 1: Policy UUID vs String
```sql
-- Check data type of cancellation_policy column
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name = 'cancellation_policy';
```

**Expected:** `data_type` should be "character varying" or "text" (stores UUID as string)

### Check 2: Policy Actually Exists
```sql
SELECT * FROM cancellation_policies
WHERE id = 'paste-the-uuid-from-property-here';
```

**If no results:** The UUID in the property doesn't match any existing policy.

### Check 3: Clear Browser Cache
- Hard refresh: **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
- Or clear browser cache completely

---

## Creating a New Cancellation Policy (If None Exist)

```sql
INSERT INTO cancellation_policies (id, name, description, tiers, is_system_default)
VALUES (
  gen_random_uuid(),
  'Flexible',
  'Cancel up to 7 days before check-in for a full refund. Moderate fees apply for later cancellations.',
  '[
    {"days": 7, "refund": 100},
    {"days": 3, "refund": 50},
    {"days": 0, "refund": 0}
  ]'::jsonb,
  true
)
RETURNING id, name, tiers;
```

**Copy the returned `id` and assign it to the property:**
```sql
UPDATE properties
SET cancellation_policy = 'paste-id-here'
WHERE name ILIKE '%Pandokkie%';
```

---

## Summary

**The issue is:** Property has no valid cancellation policy assigned.

**The fix is:**
1. Run the SQL queries to check the current state
2. Assign a cancellation policy to the property
3. Restart backend server
4. Test the booking wizard
5. Modal should now open

**Files with debug logging:**
- `backend/src/services/discovery.service.ts` (lines 567-606, 818-823)
- `frontend/src/pages/booking-wizard/BookingWizardPage.tsx` (lines 138-141)
- `frontend/src/pages/booking-wizard/steps/GuestPaymentStep.tsx` (lines 66-72, 222-224)

**SQL script:** `CHECK_AND_FIX_CANCELLATION_POLICY.sql`

Let me know what the backend and frontend logs show! 🔍
