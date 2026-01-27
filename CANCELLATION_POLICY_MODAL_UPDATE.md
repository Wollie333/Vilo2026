# Cancellation Policy Modal - Complete Implementation

## Summary

Updated the booking wizard to display the property's **active cancellation policy** with full details (name, description, and refund schedule tiers) in a clickable modal popup.

---

## Changes Made

### Backend Changes

#### 1. **Discovery Service** (`backend/src/services/discovery.service.ts`)

**Line 574** - Added `tiers` field to cancellation policy query:
```typescript
return supabase
  .from('cancellation_policies')
  .select('id, name, description, tiers')  // Added 'tiers'
  .eq('id', propertyData.cancellation_policy)
  .single();
```

**Lines 764-769** - Added full cancellation policy object to response:
```typescript
cancellation_policy_detail: policyData ? {
  id: policyData.id,
  name: policyData.name,
  description: policyData.description,
  tiers: policyData.tiers || [],
} : null,
```

**What this does:**
- Fetches the full cancellation policy object from the database
- Includes the refund schedule tiers (days before check-in + refund percentage)
- Returns it as a separate field alongside the text-only `cancellation_policy` field

---

### Frontend Changes

#### 2. **Discovery Types** (`frontend/src/types/discovery.types.ts`)

**Lines 98-103** - Added cancellation policy detail type:
```typescript
export interface PublicPropertyDetail extends PublicPropertySummary {
  // ... existing fields
  cancellation_policy: string | null;
  cancellation_policy_detail: {
    id: string;
    name: string;
    description: string | null;
    tiers: Array<{ days: number; refund: number }>;
  } | null;
  terms_and_conditions: string | null;
  // ... rest
}
```

---

#### 3. **Booking Wizard Types** (`frontend/src/types/booking-wizard.types.ts`)

**Lines 37-38** - Updated GuestDetails interface:
```typescript
export interface GuestDetails {
  // ... existing fields
  termsAccepted: boolean; // Property terms & cancellation policy
  platformTermsAccepted: boolean; // Platform (Vilo SaaS) terms & privacy policy
  // Removed: marketingConsent: boolean;
}
```

---

#### 4. **Guest Payment Step** (`frontend/src/pages/booking-wizard/steps/GuestPaymentStep.tsx`)

**Already Updated** (from previous changes):
- Props updated to accept `propertyCancellationPolicy` object
- Modal implemented with refund schedule display
- Color-coded tiers (green = 100%, yellow = 50%, red = 0%)
- Clickable link to open modal

---

#### 5. **Booking Wizard Page** (`frontend/src/pages/booking-wizard/BookingWizardPage.tsx`)

**Line 59** - Updated initial state:
```typescript
const [guestDetails, setGuestDetails] = useState<GuestDetails>({
  // ... existing fields
  termsAccepted: false,
  platformTermsAccepted: false, // NEW
  // marketingConsent: false, // REMOVED
});
```

**Line 663** - Passed cancellation policy to component:
```typescript
<GuestPaymentStep
  // ... other props
  propertyTerms={property?.terms_and_conditions}
  propertyCancellationPolicy={property?.cancellation_policy_detail} // NEW
  propertyName={property?.listing_title || property?.name}
  propertyId={property?.id}
  availablePaymentMethods={availablePaymentMethods}
/>
```

**Lines 299-304** - Added validation:
```typescript
if (!guestDetails.termsAccepted) {
  newErrors.termsAccepted = 'You must accept the property terms and cancellation policy';
}
if (!guestDetails.platformTermsAccepted) {
  newErrors.platformTermsAccepted = 'You must accept the Vilo Terms of Service and Privacy Policy';
}
```

**Line 713** - Added to continue button disabled condition:
```typescript
continueDisabled={
  currentStep === 3
    ? !guestDetails.firstName ||
      !guestDetails.lastName ||
      !guestDetails.email ||
      !guestDetails.phone ||
      !guestDetails.password ||
      !guestDetails.termsAccepted ||
      !guestDetails.platformTermsAccepted || // NEW
      !paymentMethod
    : false
}
```

---

## How It Works

### 1. Data Flow

```
Database (cancellation_policies table)
  ↓ (fetched with property)
Backend Discovery Service
  ↓ (returns cancellation_policy_detail object)
Frontend (property.cancellation_policy_detail)
  ↓ (passed as prop)
GuestPaymentStep Component
  ↓ (rendered as clickable link)
User clicks "Cancellation Policy"
  ↓ (opens modal)
Modal displays policy details with refund schedule
```

### 2. User Experience

**Step-by-Step:**
1. Guest goes to booking wizard (Step 3 - Payment)
2. Sees two checkbox agreements:
   - **Property Terms** (blue box)
   - **Platform Terms** (green box)
3. First checkbox text includes **clickable "Cancellation Policy" link**
4. User clicks the link
5. **Modal opens** showing:
   - Policy name (e.g., "Flexible", "Moderate", "Strict")
   - Policy description (if any)
   - **Refund Schedule** with color-coded tiers:
     - 🟢 Green: 100% refund
     - 🟡 Yellow: 50% refund
     - 🔴 Red: 0% refund (No refund)
   - Days before check-in for each tier
6. User reviews the policy
7. User closes modal
8. User checks the checkbox to agree
9. Cannot proceed without checking both checkboxes

---

## Cancellation Policy Modal Content

### Example Display:

```
┌──────────────────────────────────────────────────┐
│  Flexible Cancellation Policy                    │
├──────────────────────────────────────────────────┤
│                                                   │
│  Cancel up to 7 days before check-in for a      │
│  full refund. Moderate fees apply for later     │
│  cancellations.                                  │
│                                                   │
│  ┌────────────────────────────────────────────┐ │
│  │ Refund Schedule                           │ │
│  ├────────────────────────────────────────────┤ │
│  │ 7+ days before      │ 100% refund 🟢      │ │
│  │ 3+ days before      │  50% refund 🟡      │ │
│  │ Same day            │   0% refund 🔴      │ │
│  └────────────────────────────────────────────┘ │
│                                                   │
│  [ Close ]                                        │
└──────────────────────────────────────────────────┘
```

---

## Properties Without Cancellation Policy

If a property doesn't have a cancellation policy assigned:
- `cancellation_policy_detail` will be `null`
- Link will show as grayed out (not clickable)
- Text will say "Cancellation Policy" without underline
- User can still check the box (accepting whatever terms exist)

**Recommendation:** All properties should have a cancellation policy assigned for best guest experience.

---

## Testing

### Test Steps:

1. **Assign Cancellation Policy to Property** (if not already)
   - Go to: Properties → Edit Property → Cancellation Policy
   - Select a policy (or create one)
   - Save

2. **Test Booking Wizard**
   - Navigate to property booking page
   - Select dates and rooms
   - Go to Step 3 (Payment)

3. **Verify Property Terms Checkbox (Blue Box)**
   - Should show: "I agree to [Property Name]'s Terms & Conditions and Cancellation Policy"
   - **Click "Cancellation Policy" link**
   - Modal should open
   - Should show policy name, description, and refund schedule
   - Tiers should be color-coded
   - Close button should work

4. **Verify Platform Terms Checkbox (Green Box)**
   - Should show: "I agree to Vilo's Terms of Service and Privacy Policy..."
   - Both links should be clickable
   - Modals should open with platform documents

5. **Test Validation**
   - Try to continue without checking boxes
   - Should see error messages
   - Continue button should be disabled

6. **Complete Booking**
   - Check both boxes
   - Select payment method
   - Continue button should be enabled
   - Should proceed to payment

---

## Files Modified

### Backend
1. `backend/src/services/discovery.service.ts`
   - Line 574: Added `tiers` to cancellation policy query
   - Lines 764-769: Added `cancellation_policy_detail` to response

### Frontend
1. `frontend/src/types/discovery.types.ts`
   - Lines 98-103: Added `cancellation_policy_detail` field

2. `frontend/src/types/booking-wizard.types.ts`
   - Lines 37-38: Updated GuestDetails interface

3. `frontend/src/pages/booking-wizard/steps/GuestPaymentStep.tsx`
   - Already updated in previous task (modals implemented)

4. `frontend/src/pages/booking-wizard/BookingWizardPage.tsx`
   - Line 59: Updated initial state
   - Line 663: Pass cancellation policy detail
   - Lines 299-304: Added validation
   - Line 713: Added to continue disabled condition

---

## Database Schema

The `cancellation_policies` table should have:
```sql
CREATE TABLE cancellation_policies (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tiers JSONB NOT NULL, -- Array of {days: number, refund: number}
  is_system_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tiers Format:**
```json
[
  { "days": 7, "refund": 100 },
  { "days": 3, "refund": 50 },
  { "days": 0, "refund": 0 }
]
```

---

## Summary

✅ **Backend:** Fetches full cancellation policy with tiers
✅ **Frontend Types:** Updated to include cancellation_policy_detail
✅ **Booking Wizard:** Passes policy data to payment step
✅ **Guest Payment Step:** Already has modal implementation
✅ **Validation:** Both checkboxes required
✅ **User Experience:** Clear, clickable links with informative modals

**Status:** ✅ COMPLETE - Cancellation policy is now fully integrated with clickable modal
