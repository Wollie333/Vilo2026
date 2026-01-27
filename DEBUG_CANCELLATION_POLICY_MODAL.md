# Debug Guide: Cancellation Policy Modal Not Opening

## Issue
The "Cancellation Policy" link in the booking wizard (Step 3 - Guest Payment) is not opening the modal.

## Debug Logging Added

I've added comprehensive logging to trace the data flow. Here's what to check:

### Step 1: Check if property data includes cancellation policy

**Open browser console** and navigate to the booking wizard for a property.

Look for this log:
```
🔍 [BookingWizard] Cancellation policy data: {
  cancellation_policy: "...",
  cancellation_policy_detail: { ... }
}
```

**Expected:**
- `cancellation_policy_detail` should be an object with `id`, `name`, `description`, and `tiers` array

**If null or missing:**
- The property doesn't have a cancellation policy assigned
- OR the backend isn't returning the data
- Solution: Check backend discovery service or assign a policy to the property

### Step 2: Check if GuestPaymentStep receives the data

Look for this log when you reach Step 3:
```
🔍 [GuestPaymentStep] Component mounted with props: {
  propertyName: "Property Name",
  propertyId: "uuid",
  hasPropertyTerms: true/false,
  hasCancellationPolicy: true/false,
  cancellationPolicyDetail: { ... }
}
```

**Expected:**
- `hasCancellationPolicy` should be `true`
- `cancellationPolicyDetail` should show the policy object

**If false:**
- The prop isn't being passed from BookingWizardPage
- Check line 666 in BookingWizardPage.tsx

### Step 3: Check if button click is registered

**Click the "Cancellation Policy" link** and look for:
```
🔘 [GuestPaymentStep] Cancellation policy button clicked
🔍 [GuestPaymentStep] Policy data: { name: "...", tiers: [...] }
```

**Expected:**
- Both logs should appear
- Policy data should be complete

**If not appearing:**
- The button isn't clickable (might be rendering as gray span instead)
- Means `propertyCancellationPolicy` prop is falsy

### Step 4: Check modal rendering

Look for this log (appears continuously while on Step 3):
```
🔍 [GuestPaymentStep] Rendering cancellation policy modal: {
  isOpen: true/false,
  policyName: "Policy Name",
  tiersCount: 3
}
```

**Expected:**
- When you click the link, `isOpen` should change from `false` to `true`
- `tiersCount` should be > 0

**If modal doesn't appear:**
- Check if `isOpen` actually toggles to `true`
- Check browser DevTools for any CSS issues (z-index conflicts, etc.)

## Common Fixes

### Fix 1: Property has no cancellation policy
```sql
-- Check if property has policy assigned
SELECT id, name, cancellation_policy
FROM properties
WHERE slug = 'your-property-slug';

-- If cancellation_policy is NULL, assign one:
UPDATE properties
SET cancellation_policy = (SELECT id FROM cancellation_policies LIMIT 1)
WHERE slug = 'your-property-slug';
```

### Fix 2: Backend not returning tiers
Check `backend/src/services/discovery.service.ts` line 574:
```typescript
// Should include 'tiers' in select
.select('id, name, description, tiers')
```

And line 764-769:
```typescript
cancellation_policy_detail: policyData ? {
  id: policyData.id,
  name: policyData.name,
  description: policyData.description,
  tiers: policyData.tiers || [],
} : null,
```

### Fix 3: Frontend not passing prop correctly
Check `frontend/src/pages/booking-wizard/BookingWizardPage.tsx` line 666:
```typescript
<GuestPaymentStep
  // ... other props
  propertyCancellationPolicy={property?.cancellation_policy_detail}
/>
```

## Quick Test

1. Open browser console (F12)
2. Navigate to: `/book/[property-slug]`
3. Fill in dates and select rooms
4. Go to Step 3 (Guest Payment)
5. Look for all the debug logs above
6. Click "Cancellation Policy" link
7. Report back with the console output

## Files Modified for Debugging

1. `frontend/src/pages/booking-wizard/BookingWizardPage.tsx` - Lines 138-141
2. `frontend/src/pages/booking-wizard/steps/GuestPaymentStep.tsx` - Lines 66-72, 222-224, 387-392
