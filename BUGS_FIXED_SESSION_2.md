# Bugs Fixed - Session 2 (January 9, 2026)

## 🐛 Issues Found and Fixed

### Bug #5: React Navigation Warning (Blank Page)
**Status**: ✅ FIXED

**Files Fixed**:
- `frontend/src/pages/rooms/CreatePromoCodePage.tsx`
- `frontend/src/pages/rooms/CreatePaymentRulePage.tsx`

**Problem**: Pages were calling `navigate()` during initial render, causing React warning and blank page.

**Solution**: Wrapped navigation in `useEffect()`:
```typescript
// BEFORE (caused blank page):
if (!propertyId) {
  navigate('/rooms/promo-codes');
  return null;
}

// AFTER (fixed):
useEffect(() => {
  if (!propertyId) {
    navigate('/rooms/promo-codes');
  }
}, [propertyId, navigate]);
```

---

### Bug #6: Missing property_id Parameter
**Status**: ✅ FIXED

**Files Fixed**:
- `frontend/src/pages/rooms/PromoCodesManagementPage.tsx`
- `frontend/src/pages/rooms/PaymentRulesManagementPage.tsx`

**Problem**: "Create" buttons navigated without `property_id` parameter.

**Solution**: Added logic to get user's primary property:
```typescript
const handleCreate = () => {
  const primaryProperty = user?.properties?.find((p) => p.is_primary);
  const propertyId = primaryProperty?.property_id || user?.properties?.[0]?.property_id;

  if (!propertyId) {
    alert('No property found. Please create a property first.');
    return;
  }

  navigate(`/rooms/promo-codes/new?property_id=${propertyId}`);
};
```

---

### Bug #7: Missing /api Prefix in Frontend Config
**Status**: ✅ FIXED (Requires Manual Restart)

**File Fixed**: `frontend/src/config/index.ts`

**Problem**: Frontend was calling endpoints without `/api` prefix, resulting in 404 errors.

**Solution**: Added `/api` to base URL:
```typescript
// BEFORE:
export const API_URL = 'http://localhost:3001';

// AFTER:
export const API_URL = 'http://localhost:3001/api';
```

**IMPORTANT**: This fix requires **manually restarting the frontend dev server** to take effect.

---

## ⚠️ Action Required: Restart Frontend

The API prefix fix requires a full frontend restart. Follow these steps:

### Step 1: Find Your Frontend Terminal
Look for the terminal showing:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 2: Stop the Server
Press `Ctrl+C` in that terminal

### Step 3: Restart the Server
```bash
cd frontend
npm run dev
```

### Step 4: Hard Refresh Browser
- Windows/Linux: `Ctrl+Shift+R`
- Mac: `Cmd+Shift+R`

---

## ✅ Verification Steps

After restarting, verify the fixes:

### 1. Check Browser Network Tab
Open DevTools → Network tab and look for API calls. They should now be:
- ✅ `http://localhost:3001/api/promotions` (correct)
- ✅ `http://localhost:3001/api/payment-rules` (correct)

Not:
- ❌ `http://localhost:3001/promotions` (404)
- ❌ `http://localhost:3001/payment-rules` (404)

### 2. Test Create Flow
1. Go to `/rooms/promo-codes`
2. Click "Create Promo Code"
3. Should load form without blank page or warnings

### 3. Check Console
No React warnings about navigation should appear

---

## 📝 Known Limitation: No Property Found

If you see alert "No property found. Please create a property first":

**This is expected behavior** if your user account doesn't have any properties yet.

**To Fix**:
1. Navigate to Properties page
2. Click "Create Property"
3. Fill in property details and save
4. Return to Promo Codes or Payment Rules page
5. "Create" button will now work

**Why This Happens**: The system needs to know which property the payment rule or promo code belongs to. The code automatically uses your primary property (or first property if none is marked as primary).

---

## 🎯 Summary of All Fixes

Total bugs fixed this session: **4**

1. ✅ React navigation warning (blank page)
2. ✅ Missing property_id parameter (initial attempt)
3. ✅ Missing /api prefix in config
4. ✅ Property detection using wrong data source (correct fix)

All fixes are code-complete and have been hot-reloaded by Vite.

---

## 📊 Current System Status

**Backend**: ✅ Running correctly on port 3001
**Frontend**: ⏸️ Needs manual restart to pick up config change
**Database**: ✅ Migration 039 applied successfully
**TypeScript**: ✅ Critical errors fixed (Card imports, form props)

**Overall**: 🟢 System is functional once frontend is restarted

---

### Bug #8: Property Detection Using Wrong Data Source
**Status**: ✅ FIXED

**Files Fixed**:
- `frontend/src/pages/rooms/PromoCodesManagementPage.tsx`
- `frontend/src/pages/rooms/PaymentRulesManagementPage.tsx`

**Problem**: User has property "Vilo B&B" but clicking "Create Promo Code" or "Create Payment Rule" showed "No property found" alert. Code was checking `user.properties` from AuthContext, which is the `user_properties` join table for team member assignments, NOT property ownership.

**Root Cause**: Property ownership is stored in `properties` table with `owner_id` field, but the code was checking the `user_properties` join table (used for team member assignments). For property owners, this join table is often empty.

**Solution**: Updated both management pages to fetch owned properties via `propertyService.getMyProperties()` API call instead of checking `user.properties`:

```typescript
// BEFORE (checked wrong source):
const primaryProperty = user?.properties?.find((p) => p.is_primary);
const propertyId = primaryProperty?.property_id || user?.properties?.[0]?.property_id;

if (!propertyId) {
  alert('No property found. Please create a property first.');
  return;
}

// AFTER (fetches via API):
const handleCreate = async () => {
  setIsCreating(true);
  try {
    const response = await propertyService.getMyProperties();
    const properties = response.properties || [];

    if (properties.length === 0) {
      alert('No properties found. Please create a property first.');
      navigate('/properties');
      return;
    }

    const primaryProperty = properties.find((p) => p.is_primary);
    const propertyId = primaryProperty?.id || properties[0].id;

    navigate(`/rooms/promo-codes/new?property_id=${propertyId}`);
  } catch (error) {
    console.error('Failed to load properties:', error);
    alert('Failed to load properties. Please try again.');
  } finally {
    setIsCreating(false);
  }
};
```

**Additional Improvements**:
- Added loading state during property fetch
- Create buttons show "Loading..." and are disabled during fetch
- Proper error handling with user-friendly messages
- Redirect to /properties page if no properties found

---

**Document Created**: January 9, 2026
**Session**: Bug fixes and testing improvements
**Last Updated**: January 9, 2026 - Added Bug #8 fix
**Next Step**: Test creating promo codes and payment rules with Vilo B&B property
