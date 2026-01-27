# Subscription Plan Slug & Customizations - Fixed

## Issue

When editing subscription plans via the **Billing Settings Page** (`/admin/billing#subscription-plans`), changes to CMS fields were not being saved:
- URL Slug
- Custom Headline
- Custom Description
- Custom Features
- CTA Button Text
- Badge Text
- Accent Color

## Root Cause

In `frontend/src/pages/admin/billing/components/SubscriptionPlansTab.tsx`, the **update** function was missing the CMS fields when sending data to the API.

**The bug:**
- ✅ CREATE mode: CMS fields were included → worked fine
- ❌ EDIT mode: CMS fields were missing → changes weren't saved

## Fix Applied

Updated the `updateSubscriptionType` call in `SubscriptionPlansTab.tsx` (line 390-416) to include all CMS fields:

```typescript
// BEFORE (missing CMS fields)
await billingService.updateSubscriptionType(selectedId, {
  display_name: formData.display_name,
  description: formData.description || undefined,
  price_cents: priceCents,
  // ... other fields
  // ❌ CMS fields missing!
});

// AFTER (includes CMS fields)
await billingService.updateSubscriptionType(selectedId, {
  display_name: formData.display_name,
  description: formData.description || undefined,
  price_cents: priceCents,
  // ... other fields
  // ✅ CMS fields added!
  slug: formData.slug,
  custom_headline: formData.custom_headline || undefined,
  custom_description: formData.custom_description || undefined,
  custom_features: formData.custom_features.length > 0 ? formData.custom_features : undefined,
  custom_cta_text: formData.custom_cta_text || undefined,
  checkout_badge: formData.checkout_badge || undefined,
  checkout_accent_color: formData.checkout_accent_color || undefined,
});
```

## Files Modified

- `frontend/src/pages/admin/billing/components/SubscriptionPlansTab.tsx` (lines 407-414)

## Important Note

There are **TWO** ways to edit subscription plans:

1. **Via Billing Settings Page** (`/admin/billing#subscription-plans`)
   - Click a plan card → inline editor opens
   - ❌ Was broken (now ✅ FIXED)

2. **Via Dedicated Edit Page** (`/admin/billing/plans/:id/edit`)
   - Navigate directly to edit URL
   - ✅ Was always working (uses `EditPlanPage.tsx`)

Both paths now work correctly!

## Testing

1. **Go to:** `/admin/billing#subscription-plans`
2. **Click Edit** on any subscription plan
3. **Change the slug** (e.g., from "starter" to "starter-plan")
4. **Change other customizations:**
   - Custom headline
   - Badge text
   - Accent color
5. **Click "Save Changes"**
6. **Reload the page**
7. **Verify:** All changes are persisted ✅

## What Now Works

- ✅ Slug changes save correctly
- ✅ Custom headlines save correctly
- ✅ Custom descriptions save correctly
- ✅ Custom features list saves correctly
- ✅ CTA button text saves correctly
- ✅ Badge text saves correctly
- ✅ Accent color saves correctly

All customizations for the `/plans/:slug` checkout pages now save properly!
