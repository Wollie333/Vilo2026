# Quick Testing Checklist - All Fixes Ready

## 🚀 Start Servers

### Backend
```bash
cd backend
npm run dev
```

**✅ Expected Output:**
```
Server started on port 3001
✓ All routes loaded
✓ No errors
```

**❌ If you see errors:** Check the console output and report back

---

### Frontend
```bash
cd frontend
npm run dev
```

**✅ Expected Output:**
```
VITE vX.X.X  ready in XXXms

➜  Local:   http://localhost:5173/
✓ No import errors
✓ No build errors
```

**❌ If you see errors:** Check the console output and report back

---

## 🧪 Test 1: Promo Code Validation (CRITICAL)

### Steps:
1. Open browser: `http://localhost:5173`
2. Navigate to any property booking page
3. Select dates and room(s)
4. Scroll to payment section
5. Enter a promo code in the "Promo Code" field
6. Click **"Apply"**

### ✅ Expected Backend Console Output:
```
🎯 [INDEX.TS] Direct /promotions/validate route HIT - NO AUTH REQUIRED
🎯 [INDEX.TS] Method: POST
🎯 [INDEX.TS] Path: /promotions/validate
🎯 [INDEX.TS] Body: { code: 'YOURCODE', property_id: '...', ... }
[PromotionController] validatePromoCode called
[PromotionController] Code: YOURCODE
[PromotionController] Property ID: ...
```

### ✅ Expected Frontend Behavior:

**If valid promo code:**
- Shows success message: `✓ 10% discount applied` (or similar)
- Discount appears in pricing breakdown
- NO 401 error in browser console

**If invalid/expired promo code:**
- Shows error message: `Invalid or expired promo code`
- NO 401 error in browser console

### ❌ FAILURE Signs:
- Browser console shows: `POST /api/promotions/validate 401 (Unauthorized)`
- Error message: "Authentication required" or "Invalid token"
- Backend console shows NO output (route not being hit)

---

## 🧪 Test 2: PDF Downloads

### Test Terms & Conditions PDF:
1. Go to: **Properties → [Select Property] → Legal Tab → Terms & Conditions**
2. Click **"Download PDF"** button (bottom left)
3. **✅ Expected:** PDF downloads with property name and terms content
4. **❌ Failure:** Error in console or no download

### Test Cancellation Policy PDF:
1. Go to: **Properties → [Select Property] → Legal Tab → Cancellation Policies**
2. Find any policy card
3. Click **"Download PDF"** button at bottom of card
4. **✅ Expected:** PDF downloads with policy details and refund schedule
5. **❌ Failure:** Error in console or no download

---

## 🧪 Test 3: Platform Legal Documents (Admin Only)

### Access:
1. Login as Super Admin or SaaS Team Member
2. Go to: **Admin → Billing → Legal Settings tab**

### ✅ Expected:
- Tab loads without errors
- Shows document type buttons (Terms of Service, Privacy Policy, etc.)
- Can switch between document types
- No console errors

### ❌ Failure:
- Tab doesn't load
- Import errors in console
- Toast notifications don't work

---

## 📊 Quick Status Check

After starting both servers, fill this out:

### Backend Status:
- [ ] Server started on port 3001
- [ ] No route registration errors
- [ ] No TypeScript compilation errors

### Frontend Status:
- [ ] Dev server started on port 5173
- [ ] No import/module errors
- [ ] Application loads in browser

### Promo Code Test:
- [ ] Backend shows `[INDEX.TS] Direct /promotions/validate route HIT`
- [ ] Frontend shows success OR "Invalid promo code" message (NOT 401 error)
- [ ] Browser Network tab shows `200 OK` response (NOT 401)

### PDF Downloads:
- [ ] Terms & Conditions PDF downloads
- [ ] Cancellation Policy PDF downloads

### Legal Settings:
- [ ] Legal Settings tab loads (admin only)
- [ ] No import errors
- [ ] Toast notifications work

---

## 🐛 If Something Fails

### Backend won't start:
1. Check for TypeScript errors in console
2. Try: `npm install` (in case dependencies are missing)
3. Check if port 3001 is already in use: `netstat -ano | findstr :3001`

### Frontend won't start:
1. Check for import errors in console
2. Try: `npm install` (in case dependencies are missing)
3. Clear browser cache or use Incognito mode

### Promo code still returns 401:
1. **First:** Verify backend console shows the `[INDEX.TS]` log
2. **If no log:** Route isn't being hit - check if server restarted
3. **If log appears but still 401:** There's a deeper issue - report the full console output

### PDF download fails:
1. Check browser console for errors
2. Check backend console for errors
3. Verify Puppeteer is installed: `cd backend && npm list puppeteer`

---

## 📝 Report Back

When you've tested, report:

### ✅ If Everything Works:
Just say: **"All tests passed ✅"**

### ❌ If Something Fails:
Report which test failed and:
1. **Backend console output** (copy/paste)
2. **Browser console errors** (copy/paste)
3. **What you were doing** when it failed

---

## 🎯 Priority Test: PROMO CODE

**The most critical test is the promo code validation.**

This has been a persistent issue, so please test this FIRST and report:
- ✅ "Promo code works - no 401 error"
- ❌ "Still getting 401 error" (with console output)

Everything else is secondary to confirming this fix works!

---

**Ready to test!** 🚀
