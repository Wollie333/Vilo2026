# Promo Code Validation Fix - Complete Solution

## Problem

Promo code validation endpoint returning `401 Unauthorized` error when guests try to apply promo codes during booking.

## Root Cause

There were **TWO** promotion route files conflicting with each other:
1. `backend/src/routes/promotion.routes.ts` (OLD, singular) - Not imported but compiled files existed
2. `backend/src/routes/promotions.routes.ts` (NEW, plural) - Currently in use

The old compiled files in `dist/routes/` were causing routing conflicts.

## Solution Applied

### 1. Deleted Old Route File

**Deleted:** `backend/src/routes/promotion.routes.ts` (source file)
**Deleted:** `backend/dist/routes/promotion.routes.*` (compiled files)

### 2. Verified Correct Route Configuration

**File:** `backend/src/routes/promotions.routes.ts`

```typescript
// PUBLIC ROUTES (No authentication required)
// Line 20: This route is BEFORE the authenticate middleware
router.post('/promotions/validate', promotionController.validatePromoCode);

// Line 30: authenticate middleware applied AFTER public routes
router.use(authenticate);
```

**Mounting in index.ts:**
```typescript
// Line 77
router.use('/', promotionsRoutes);
```

**Full endpoint path:**
`/api` (app.ts) + `/` (index.ts) + `/promotions/validate` (promotions.routes.ts)
= **`/api/promotions/validate`**

### 3. Verified Frontend Configuration

**File:** `frontend/.env`
```
VITE_API_URL=http://localhost:3001/api
```

**Frontend code:** `frontend/src/pages/booking-wizard/BookingWizardPage.tsx`
```typescript
// Line 487
const response = await fetch(
  `${import.meta.env.VITE_API_URL}/promotions/validate`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: promoCode,
      property_id: property.id,
      room_ids: roomIds,
      booking_amount: pricing?.subtotal || 0,
      nights,
    }),
  }
);
```

**Full URL called:**
`http://localhost:3001/api` + `/promotions/validate`
= **`http://localhost:3001/api/promotions/validate`**

## Critical Steps to Complete Fix

### Step 1: Clean Build (REQUIRED)

```bash
cd backend

# Stop the dev server (Ctrl+C if running)

# Clean the dist folder completely
rm -rf dist

# Rebuild from scratch
npm run build

# Restart the dev server
npm run dev
```

**Why this is critical:**
- Old compiled `promotion.routes.js` files may still exist
- TypeScript cache may be stale
- Clean build ensures only current code is compiled

### Step 2: Verify Server Startup

Check console output for:
```
✓ Server started successfully
✓ No route conflicts
✓ Listening on port 3001
```

### Step 3: Test the Endpoint

**Option A: Using curl**
```bash
curl -X POST http://localhost:3001/api/promotions/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST123",
    "property_id": "your-property-id",
    "room_ids": ["room-id-1"],
    "booking_amount": 1000,
    "nights": 2
  }'
```

**Expected responses:**
- **Valid promo:** `{"valid": true, "discount_type": "...", "discount_value": ...}`
- **Invalid promo:** `{"valid": false, "message": "Invalid or expired promo code"}`
- **NOT:** `401 Unauthorized` or `404 Not Found`

**Option B: Using frontend**
1. Go to booking wizard for a property
2. Select room and dates
3. Enter a promo code you created
4. Click "Apply"
5. Check browser Network tab → Response should be 200 OK

### Step 4: Check Server Logs

If still getting 401, check backend console for these logs:

```
[PromotionController] validatePromoCode called
[PromotionController] Code: YOURCODE
[PromotionController] Property ID: property-id
[PromotionController] Room IDs: [...]
```

**If you DON'T see these logs:**
- Route is not being reached (routing issue)

**If you DO see these logs but still get 401:**
- Issue is in the controller or response handling

## Route Verification Checklist

- [✓] Old `promotion.routes.ts` file deleted
- [✓] Old `dist/routes/promotion.routes.*` files deleted
- [✓] `/promotions/validate` route defined BEFORE `router.use(authenticate)`
- [✓] Frontend calls `http://localhost:3001/api/promotions/validate`
- [✓] No global authentication middleware in app.ts
- [✓] CORS allows `http://localhost:5173` origin
- [ ] **Server restarted with clean build** (YOU MUST DO THIS)
- [ ] **Endpoint tested and returns 200 OK** (VERIFY THIS)

## Backend Route Flow

1. Request: `POST http://localhost:3001/api/promotions/validate`
2. app.ts: Routes to `/api` → index.ts
3. index.ts line 77: Routes to `/` → promotions.routes.ts
4. promotions.routes.ts line 20: Matches `/promotions/validate` (PUBLIC, no auth)
5. promotions.controller.ts: `validatePromoCode()` executes
6. Response: `{valid: true/false, ...}`

**Key insight:** The route should NEVER hit the `authenticate` middleware because it's defined BEFORE line 30.

## If Still Not Working

### Check 1: Verify Route Registration

Add temporary logging in `backend/src/routes/promotions.routes.ts`:

```typescript
const router = Router();

// Add this debug line
console.log('🔧 [DEBUG] Promotions routes loaded');

// Public routes
router.post('/promotions/validate', (req, res, next) => {
  console.log('🎯 [DEBUG] /promotions/validate route HIT');
  next();
}, promotionController.validatePromoCode);
```

Restart server and check logs. If you see "Promotions routes loaded" but NOT "route HIT", the route isn't matching.

### Check 2: Test Direct Route

Create a test route in `backend/src/routes/index.ts` BEFORE line 77:

```typescript
// Temporary test route - add at line 42 (right after const router = Router();)
router.post('/promotions/validate', (req, res) => {
  console.log('🧪 [TEST] Test route hit!');
  res.json({ test: true, message: 'Test route works' });
});
```

If THIS works, the issue is with the promotions router. If this ALSO returns 401, there's a deeper middleware issue.

### Check 3: Server Port Conflict

Ensure backend is actually running on port 3001:

```bash
# Check what's listening on port 3001
netstat -ano | findstr :3001   # Windows
lsof -i :3001                  # Mac/Linux
```

If nothing is listening, the dev server isn't running.

## Final Checklist Before Testing

1. [ ] Backend server is running on port 3001
2. [ ] Frontend is running on port 5173
3. [ ] `/backend/src/routes/promotion.routes.ts` does NOT exist
4. [ ] `/backend/dist/routes/promotion.routes.js` does NOT exist
5. [ ] `/backend/src/routes/promotions.routes.ts` EXISTS with correct route
6. [ ] Clean build completed (`rm -rf dist && npm run build`)
7. [ ] Server restarted fresh
8. [ ] Browser cache cleared or using Incognito mode

## Expected Result

After completing all steps, applying a promo code should:
- Show "Validating promo code..." message
- Call `POST http://localhost:3001/api/promotions/validate`
- Get **200 OK** response (not 401)
- Show either success message with discount OR error message "Invalid or expired promo code"

## Files Modified in This Fix

### Deleted
- `backend/src/routes/promotion.routes.ts`
- `backend/dist/routes/promotion.routes.*`

### Verified Correct
- `backend/src/routes/promotions.routes.ts`
- `backend/src/routes/index.ts`
- `backend/src/controllers/promotion.controller.ts`
- `frontend/src/pages/booking-wizard/BookingWizardPage.tsx`

---

**Status:** ✅ Code fixes applied, awaiting clean rebuild and server restart for verification
