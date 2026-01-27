# Promo Code Debug Instructions

## IMMEDIATE TESTING STEPS

I've added debug logging to trace the exact issue. Here's what you need to do:

### Step 1: Restart Backend Server

```bash
cd backend

# Stop the current server (Ctrl+C)

# Start in development mode (this uses ts-node-dev which ignores TypeScript errors)
npm run dev
```

**Watch for this in the console:**
```
🔧 [PROMOTIONS ROUTES] Router initialized
```

If you see this, the routes are being loaded.

### Step 2: Test the Promo Code

1. Go to the booking wizard
2. Fill in dates and select a room
3. Enter a promo code
4. Click "Apply"

### Step 3: Check Backend Console

When you click "Apply", you should see ONE of these:

**OPTION A: Route is working correctly**
```
🎯 [PROMOTIONS ROUTES] /promotions/validate route HIT
🎯 [PROMOTIONS ROUTES] Headers: { ... }
🎯 [PROMOTIONS ROUTES] Body: { code: '...', property_id: '...' }
[PromotionController] validatePromoCode called
```

**OPTION B: Route not being hit (routing problem)**
```
(no output at all - means route isn't matching)
```

**OPTION C: Auth middleware running first (middleware order problem)**
```
(some error about authentication before the "route HIT" message)
```

### Step 4: Test the Test Route

Open a new terminal and run:

```bash
curl -X POST http://localhost:3001/api/promotions/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Expected response:**
```json
{"success": true, "message": "Test route works - routing is OK!"}
```

**If you get 401 on this test route, the entire promotions router has auth applied incorrectly.**

### Step 5: Report Back

Tell me which option you saw (A, B, or C) and I'll fix it accordingly.

---

## What I Changed

I added debug logging to `backend/src/routes/promotions.routes.ts`:

1. **Line 14:** Logs when the router is initialized
2. **Line 21-24:** Test route that should work without auth
3. **Line 28-33:** Debug middleware that logs when the validate route is hit

This will tell us EXACTLY where the request is failing.

---

## Quick Check Commands

### Check if server is running
```bash
curl http://localhost:3001/
```
Expected: `{"success":true,"data":{"name":"Vilo API",...}}`

### Check if test route works
```bash
curl -X POST http://localhost:3001/api/promotions/test \
  -H "Content-Type: application/json" \
  -d '{}'
```
Expected: `{"success":true,"message":"Test route works - routing is OK!"}`

### Check validate route (will fail validation but should reach the route)
```bash
curl -X POST http://localhost:3001/api/promotions/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST","property_id":"123","room_ids":[]}'
```
Expected: Should NOT be 401. Should be either validation error OR invalid promo code message.

---

## Common Issues

### Issue 1: Port already in use
If you see `EADDRINUSE` error, kill the process:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### Issue 2: TypeScript compilation errors
Use dev mode instead of build:
```bash
npm run dev  # This uses ts-node-dev which ignores type errors
```

### Issue 3: Module not found errors
```bash
npm install
```

---

## Next Steps Based on Results

### If Option A (route is hit):
- The routing is working
- The controller is the issue
- I'll fix the controller logic

### If Option B (route not hit):
- Express isn't matching the route
- The router mounting is wrong
- I'll fix the route registration

### If Option C (auth middleware first):
- Middleware order is wrong
- The authenticate middleware is being applied globally
- I'll fix the middleware chain

---

**Just restart the dev server and test - I need to see the console output to fix this!**
