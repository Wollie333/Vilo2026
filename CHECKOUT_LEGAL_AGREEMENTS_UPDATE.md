# Checkout Legal Agreements - Separated Property & Platform Terms

## Summary

Updated the guest checkout flow to **separate property-level and platform-level legal agreements** into two distinct checkboxes. Removed the marketing email opt-in checkbox.

---

## Changes Made

### 1. Removed Marketing Email Checkbox
- **Removed:** "I'd like to receive updates, offers, and travel inspiration via email"
- This checkbox has been completely removed from the checkout flow

### 2. Separated Legal Agreements into Two Checkboxes

#### **Checkbox 1: Property Terms (Blue Box)**
Guests must agree to the **property-specific** legal documents:
- ✅ Property Terms & Conditions
- ✅ Property Cancellation Policy

**Text:**
> "I agree to [Property Name]'s Terms & Conditions and Cancellation Policy."

#### **Checkbox 2: Platform Terms (Green Box)**
Guests must agree to **Vilo's platform-level** legal documents:
- ✅ Vilo Terms of Service
- ✅ Vilo Privacy Policy
- ℹ️ Includes account creation notice

**Text:**
> "I agree to Vilo's Terms of Service and Privacy Policy, and understand that an account will be created for me to access my booking portal."

---

## Visual Changes

### Before:
```
[✓] I agree to the Privacy Policy, Refund Policy, Terms & Conditions
    and understand that an account will be created...

[  ] I'd like to receive updates, offers, and travel inspiration via email
```

### After:
```
[✓] I agree to [Property Name]'s Terms & Conditions and Cancellation Policy. *

[✓] I agree to Vilo's Terms of Service and Privacy Policy, and understand
    that an account will be created for me to access my booking portal. *
```

---

## Modal Popups

All legal documents are clickable and open in modal popups:

### Property-Level Modals:
1. **Property Terms & Conditions**
   - Shows property's custom terms
   - Includes download PDF button
   - Displays property name in header

2. **Cancellation Policy**
   - Shows refund schedule with color-coded tiers:
     - 🟢 Green = 100% refund
     - 🟡 Yellow = 50% refund
     - 🔴 Red = 0% refund
   - Policy name and description
   - Clear close button

### Platform-Level Modals:
3. **Vilo Terms of Service**
   - Active platform terms loaded from database
   - Full HTML content with formatting
   - Scrollable content area

4. **Vilo Privacy Policy**
   - Active platform privacy policy
   - Full HTML content with formatting
   - Scrollable content area

---

## Technical Implementation

### Files Modified:

#### 1. **`frontend/src/pages/booking-wizard/steps/GuestPaymentStep.tsx`**
**Changes:**
- Added `useEffect` to load active platform legal documents on mount
- Replaced single terms checkbox with two separate checkboxes
- Removed marketing consent checkbox completely
- Added state for 4 modal popups
- Updated props to accept `propertyCancellationPolicy` instead of privacy/refund policies
- Integrated with platform legal documents API

**New Props:**
```typescript
propertyCancellationPolicy?: {
  name: string;
  description: string;
  tiers: Array<{ days: number; refund: number }>;
} | null;
```

**Removed Props:**
```typescript
propertyPrivacyPolicy?: string | null;
propertyRefundPolicy?: string | null;
```

#### 2. **`frontend/src/types/booking-wizard.types.ts`**
**Changes:**
```typescript
export interface GuestDetails {
  // ... other fields
  termsAccepted: boolean; // Property terms & cancellation policy
  platformTermsAccepted: boolean; // NEW - Platform terms & privacy
  // marketingConsent: boolean; // REMOVED
}
```

---

## Validation Requirements

Both checkboxes are **required** (marked with red asterisk `*`):

### Validation Errors:
- `errors.termsAccepted` - Property terms not accepted
- `errors.platformTermsAccepted` - Platform terms not accepted (NEW)

**Parent component must validate both fields before allowing checkout.**

---

## API Integration

### Platform Legal Documents:
The component automatically fetches the active platform legal documents:

**Endpoint:** `GET /api/platform-legal/active/:type`
- `terms_of_service` - Vilo's Terms of Service
- `privacy_policy` - Vilo's Privacy Policy

**Response:**
```typescript
{
  id: string;
  document_type: 'terms_of_service' | 'privacy_policy';
  title: string;
  content: string; // HTML content
  version: string;
  is_active: boolean;
  effective_date: string;
}
```

---

## Parent Component Updates Needed

### **IMPORTANT:** Update the parent component that uses `GuestPaymentStep`:

**File:** `frontend/src/pages/booking-wizard/BookingWizardPage.tsx` (or similar)

#### 1. Initialize `platformTermsAccepted` in state:
```typescript
const [guestDetails, setGuestDetails] = useState<GuestDetails>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  specialRequests: '',
  termsAccepted: false,
  platformTermsAccepted: false, // NEW - Add this
  // marketingConsent: false, // REMOVE this
});
```

#### 2. Add validation for platform terms:
```typescript
const validateGuestDetails = (): boolean => {
  const newErrors: Record<string, string> = {};

  // ... existing validations

  if (!guestDetails.termsAccepted) {
    newErrors.termsAccepted = 'You must accept the property terms and cancellation policy';
  }

  if (!guestDetails.platformTermsAccepted) {
    newErrors.platformTermsAccepted = 'You must accept the Vilo Terms of Service and Privacy Policy';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

#### 3. Pass cancellation policy data:
```typescript
<GuestPaymentStep
  // ... other props
  propertyTerms={propertyTerms}
  propertyCancellationPolicy={cancellationPolicy} // NEW - Pass this
  propertyName={property.name}
  propertyId={property.id}
  // propertyPrivacyPolicy={...} // REMOVE
  // propertyRefundPolicy={...}   // REMOVE
/>
```

#### 4. Update backend payload (if needed):
When creating the booking, ensure you're sending both acceptance fields:
```typescript
const bookingData = {
  // ... other fields
  terms_accepted: guestDetails.termsAccepted,
  platform_terms_accepted: guestDetails.platformTermsAccepted, // NEW
  // marketing_consent: guestDetails.marketingConsent, // REMOVE
};
```

---

## Testing Checklist

### Frontend Testing:

- [ ] **Checkbox 1 (Property Terms)** - Blue box visible
  - [ ] Shows property name correctly
  - [ ] "Terms & Conditions" link is clickable
  - [ ] "Cancellation Policy" link is clickable
  - [ ] Both links open modals
  - [ ] Modals display correct content
  - [ ] Modals can be closed

- [ ] **Checkbox 2 (Platform Terms)** - Green box visible
  - [ ] Shows "Vilo's Terms of Service and Privacy Policy"
  - [ ] Both links are clickable
  - [ ] Both modals open with platform content
  - [ ] Modals display HTML content correctly
  - [ ] Account creation notice is visible

- [ ] **Marketing Checkbox** - Completely removed
  - [ ] No email opt-in checkbox visible
  - [ ] No marketing consent in form

- [ ] **Validation**
  - [ ] Cannot submit without checking property terms
  - [ ] Cannot submit without checking platform terms
  - [ ] Error messages appear for both if unchecked

- [ ] **Modals**
  - [ ] All 4 modals open correctly
  - [ ] Clicking backdrop closes modal
  - [ ] Close button works
  - [ ] Content is scrollable
  - [ ] Styled correctly in light/dark mode

### Backend Testing:

- [ ] Platform legal documents API returns active documents
- [ ] Booking creation accepts both terms flags
- [ ] Database stores both acceptance flags
- [ ] No errors in console when loading documents

---

## User Flow

### Step-by-Step:
1. User fills in guest details (name, email, phone, password)
2. User sees **two separate agreement boxes**
3. User clicks "Terms & Conditions" link → Modal opens with property terms
4. User clicks "Cancellation Policy" link → Modal opens with refund schedule
5. User checks **first checkbox** (property terms)
6. User clicks "Terms of Service" link → Modal opens with platform terms
7. User clicks "Privacy Policy" link → Modal opens with privacy policy
8. User checks **second checkbox** (platform terms)
9. User selects payment method
10. User clicks "Continue to Payment" → Both checkboxes validated

**Both checkboxes MUST be checked before proceeding.**

---

## Design Notes

### Color Coding:
- **Blue box** = Property-specific legal agreements
- **Green box** = Platform-wide legal agreements

This visual distinction helps users understand:
- What they're agreeing to with the **property** (cancellation, refunds, property rules)
- What they're agreeing to with **Vilo** (platform usage, data privacy, account terms)

### Account Creation Notice:
The platform terms checkbox includes the note about account creation to inform users that:
- An account will be created automatically
- They'll receive booking portal access
- They need to agree to Vilo's terms for account usage

---

## Platform Legal Documents Setup

### Required Steps:

#### 1. Create Platform Legal Documents (Admin)
Navigate to: **Admin → Billing → Legal Settings**

**Required Documents:**
- ✅ Terms of Service
- ✅ Privacy Policy

**For each document:**
1. Select document type
2. Write content (HTML editor)
3. Set version (e.g., "1.0")
4. Activate the document

#### 2. Verify Documents Are Active
The checkout will automatically load the **active** versions of:
- `terms_of_service`
- `privacy_policy`

**If no active document exists:**
- Links will show as grayed out (not clickable)
- Modals won't open
- Admin must create and activate documents

---

## Troubleshooting

### Issue: Platform terms links are grayed out
**Cause:** No active platform legal documents in database
**Fix:** Admin must create and activate Terms of Service and Privacy Policy

### Issue: Cancellation policy not showing
**Cause:** Property doesn't have cancellation policy assigned
**Fix:** Property owner must assign a cancellation policy to the property

### Issue: Marketing checkbox still visible
**Cause:** Using old version of component
**Fix:** Refresh browser, clear cache, restart frontend server

### Issue: platformTermsAccepted validation error
**Cause:** Parent component not updated with new field
**Fix:** Update parent component state to include `platformTermsAccepted: false`

---

## Migration Notes

### Existing Bookings:
Existing bookings in the database may only have `termsAccepted` field. The new `platformTermsAccepted` field should:
- Default to `false` for old bookings (optional)
- OR apply retroactively (all users who accepted terms before now implicitly accepted platform terms)
- **Decision:** Up to legal/business requirements

### Database Update (if needed):
If storing acceptance flags in database:
```sql
-- Add new column for platform terms acceptance
ALTER TABLE bookings
ADD COLUMN platform_terms_accepted BOOLEAN DEFAULT false;

-- Optional: Retroactively mark as accepted for old bookings
UPDATE bookings
SET platform_terms_accepted = true
WHERE terms_accepted = true AND created_at < '2026-01-22';
```

---

## Summary

✅ **Removed:** Marketing email opt-in checkbox
✅ **Added:** Separate property and platform legal agreement checkboxes
✅ **Added:** 4 modal popups for viewing all legal documents
✅ **Added:** Integration with platform legal documents API
✅ **Updated:** GuestDetails type definition
✅ **Updated:** Visual distinction (blue vs green boxes)

**Status:** ✅ Implementation complete - requires parent component updates and testing
