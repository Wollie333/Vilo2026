# Debugging Instructions - Subscription Plan Updates

## Comprehensive Logging Added

I've added detailed logging throughout the entire save flow to help identify where the issue is occurring.

## Where Logging Was Added:

### Frontend:

1. **SubscriptionPlansTab.tsx** (Form component)
   - Logs: `🔍 UPDATE PAYLOAD` and `🔍 Form Data CMS Fields`
   - Shows what data is being prepared for the API call

2. **billing.service.ts** (API service)
   - Logs: `📤 API CALL`, `📤 Request Data`, `📥 API Response`, `📥 Updated Subscription`
   - Shows what's being sent to the API and what's returned

### Backend:

3. **billing.controller.ts** (HTTP endpoint handler)
   - Logs: `🎯 [CONTROLLER]` messages
   - Shows what the backend receives from the frontend

4. **billing.service.ts** (Business logic & database)
   - Logs: `🔧 [BACKEND]` messages
   - Shows what's being sent to Supabase and what's returned

## How to Debug:

### Step 1: Open Browser DevTools

1. Open your browser
2. Press **F12** (or right-click → Inspect)
3. Go to the **Console** tab
4. Clear the console (click the 🚫 icon)

### Step 2: Open Backend Terminal

Make sure your backend server is running and you can see the terminal output.

### Step 3: Edit a Subscription Plan

1. Go to `/admin/billing#subscription-plans`
2. Click **Edit** on "Vilo Plus" (or any plan)
3. Go to **Plan Details** tab
4. Make changes:
   - Change **URL Slug** to: "vilo-plus-updated"
   - Change **Custom Headline** to: "Test Headline"
   - Change **Badge** to: "Popular"
5. Click **Save Changes**

### Step 4: Review Console Logs

#### In Browser Console, look for:

```
🔍 UPDATE PAYLOAD: { ... }
🔍 Form Data CMS Fields: { slug: "vilo-plus-updated", ... }
📤 API CALL: PATCH /billing/subscription-types/...
📤 Request Data: { ... }
📥 API Response: { success: true/false, ... }
📥 Updated Subscription: { slug: "...", ... }
```

#### In Backend Terminal, look for:

```
🎯 [CONTROLLER] PATCH /api/billing/subscription-types/:id
🎯 [CONTROLLER] CMS fields received: { slug: "...", ... }
🔧 [BACKEND] updateSubscriptionType called
🔧 [BACKEND] Input data: { ... }
🔧 [BACKEND] CMS Fields in updateData: { ... }
✅ [BACKEND] Subscription updated successfully
✅ [BACKEND] Updated CMS fields: { ... }
```

## What to Look For:

### ✅ SUCCESS CASE:
All logs appear, and you see:
- `📥 API Response: { success: true }`
- `✅ [BACKEND] Subscription updated successfully`
- The returned data includes your changes

### ❌ FAILURE CASES:

**Case 1: Frontend doesn't send data**
- `🔍 Form Data CMS Fields` shows empty/wrong values
- → Problem: Form state not updating correctly

**Case 2: API request fails**
- `📤 API CALL` shows, but `📥 API Response` shows error
- → Problem: Network error or API endpoint issue

**Case 3: Backend doesn't receive data**
- `🎯 [CONTROLLER] CMS fields received` shows null/undefined
- → Problem: Data lost in transit or middleware stripping it

**Case 4: Database update fails**
- `🔧 [BACKEND]` shows data, but `❌ [BACKEND] Supabase update error`
- → Problem: Database constraint, permission, or SQL error

**Case 5: Response doesn't include updated data**
- Everything succeeds, but `📥 Updated Subscription` doesn't show changes
- → Problem: Supabase query not selecting updated values

## Send Me the Logs

After you test, please send me:

1. **Browser Console Output** (screenshot or copy all `🔍 📤 📥` logs)
2. **Backend Terminal Output** (screenshot or copy all `🎯 🔧 ✅ ❌` logs)

This will help me pinpoint exactly where the issue is!

## Common Issues & Solutions:

### Issue: "slug field has a constraint violation"
**Solution:** The slug might not be unique or doesn't match the format `[a-z0-9-]+`

### Issue: "Backend shows null for CMS fields"
**Solution:** The TypeScript interface might not match what's being sent

### Issue: "Changes disappear after refresh"
**Solution:** Database update succeeds but UI cache not refreshing

### Issue: "Network error or 401/403"
**Solution:** Authentication or permission issue

---

## Quick Test Query

After you click Save, immediately run this in Supabase SQL Editor:

```sql
SELECT
  display_name,
  slug,
  custom_headline,
  checkout_badge,
  checkout_accent_color,
  updated_at
FROM subscription_types
WHERE name = 'vilo_plus_plan'
ORDER BY updated_at DESC
LIMIT 1;
```

This will show if the data was actually saved to the database, regardless of what the UI shows.
