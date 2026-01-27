# Pricing Page Fix - Display Correct Subscription Prices

## Issue
The `/pricing` page was showing all subscription plans as "Free" instead of displaying the actual prices configured in the SaaS admin billing settings.

## Root Cause
The `PricingCard` component was using the **legacy** data structure (`plan.pricing.monthly`, `plan.pricing.annual`) but the API returns subscription plans using the **new** enhanced structure (`plan.pricing_tiers.monthly.price_cents`, `plan.pricing_tiers.annual.price_cents`).

### Old Code (Broken):
```typescript
const pricing = plan.pricing || { monthly: 0, annual: 0 };
const displayPrice = billingInterval === 'monthly' ? pricing.monthly : pricing.annual;
```

This was accessing `plan.pricing` which doesn't exist in the current data structure, so it defaulted to `{ monthly: 0, annual: 0 }`, making everything appear free.

## Fix Applied

### 1. Updated Price Access
**File**: `frontend/src/pages/pricing/PricingPage.tsx` (lines 61-65)

```typescript
// Use pricing_tiers (new structure) with fallback to pricing (legacy)
const monthlyPrice = plan.pricing_tiers?.monthly?.price_cents ?? plan.pricing?.monthly ?? 0;
const annualPrice = plan.pricing_tiers?.annual?.price_cents ?? plan.pricing?.annual ?? 0;
const displayPrice = billingInterval === 'monthly' ? monthlyPrice : annualPrice;
const isFree = displayPrice === 0 && monthlyPrice === 0 && annualPrice === 0;
```

### 2. Updated Trial Period Display
**File**: `frontend/src/pages/pricing/PricingPage.tsx` (lines 133-143)

```typescript
{(() => {
  const trialDays = billingInterval === 'monthly'
    ? plan.pricing_tiers?.monthly?.trial_period_days ?? plan.trial_period_days
    : plan.pricing_tiers?.annual?.trial_period_days ?? plan.trial_period_days;

  return trialDays && trialDays > 0 && (
    <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 font-medium">
      {trialDays}-day free trial
    </p>
  );
})()}
```

## Result

✅ **Pricing page now correctly displays:**
- Monthly prices from `pricing_tiers.monthly.price_cents`
- Annual prices from `pricing_tiers.annual.price_cents`
- Correct trial periods per billing interval
- Proper savings calculations for annual billing
- Accurate "Free" vs "Paid" plan identification

## Data Structure Reference

### Subscription Type Schema:
```typescript
interface SubscriptionType {
  // Legacy (deprecated but kept for backward compatibility)
  pricing: PricingTiers; // { monthly: number, annual: number }
  trial_period_days: number | null;

  // NEW (current)
  pricing_tiers: PricingTiersEnhanced; // {
  //   monthly?: { price_cents: number, trial_period_days?: number }
  //   annual?: { price_cents: number, trial_period_days?: number }
  // }
}
```

## Testing

1. **View pricing page**: Navigate to `/pricing`
2. **Check prices**: Verify prices match what's set in `/admin/billing#plans`
3. **Toggle billing**: Switch between Monthly/Annual - prices should update
4. **Check trial periods**: Verify trial badges show if configured
5. **Check free plans**: Plans with $0 monthly + $0 annual should show "Free"

## Files Modified

- `frontend/src/pages/pricing/PricingPage.tsx` - Fixed price and trial period access

## Related

- **Admin Billing**: `/admin/billing#plans` - Where prices are configured
- **Type Definition**: `frontend/src/types/billing.types.ts` - SubscriptionType interface
- **Billing Service**: `frontend/src/services/billing.service.ts` - API client
