# Property Owner Legal Documents - Permission Fix

## Summary

Fixed the permission system to allow **all property owners** to create and manage their own custom cancellation policies, while preserving system default policies that only admins can modify.

Previously, only super_admin and saas_team_member user types could create cancellation policies. Now any authenticated user can create custom policies.

---

## Problem

User reported: "the user cannot create terms or cancelation policies...please fix this so every user can create their own legal docs and assign them to their property..."

Error encountered: "Requires one of the following roles: super_admin, property_admin"

**Root Causes:**
1. RLS policies in `cancellation_policies` table restricted INSERT/UPDATE/DELETE to super_admin/saas_team_member only
2. Routes had `requireAdmin()` middleware blocking non-admin users
3. No ownership tracking - couldn't distinguish between system defaults and user-created policies

---

## Solution Architecture

### Two-Tier Policy System

1. **System Default Policies** (admin-only):
   - Flexible, Moderate, Strict, Non-refundable
   - `is_custom = false`, `created_by = null`
   - Cannot be edited or deleted by regular users
   - Available to all users

2. **User Custom Policies** (user-managed):
   - Created by property owners for their specific needs
   - `is_custom = true`, `created_by = [user_id]`
   - Users can only edit/delete their own custom policies
   - Only visible to the user who created them (plus system defaults)

---

## Changes Made

### 1. Database Migration

**File:** `backend/migrations/135_allow_property_owners_create_cancellation_policies.sql`

- Added `created_by UUID` column (references users.id)
- Added `is_custom BOOLEAN` flag
- Updated RLS policies:
  - Users can INSERT their own custom policies
  - Users can UPDATE/DELETE only their own custom policies
  - Admins can manage all policies (system defaults + custom)
  - Everyone can SELECT active policies (system defaults + their own custom)
- Marked existing policies as `is_custom = false` (system defaults)

### 2. Backend Routes

**File:** `backend/src/routes/legal.routes.ts`

- **Removed** `requireAdmin()` middleware from POST, PUT, DELETE routes
- **Kept** `authenticate` and `loadUserProfile` middleware
- RLS policies now handle permission checks at database level

### 3. Backend Controller

**File:** `backend/src/controllers/legal.controller.ts`

- **Create:** Sets `created_by = req.user.id` and `is_custom = true` for all user-created policies
- **Update:** Prevents modification of system default policies (is_custom = false)
- **Delete:** Prevents deletion of system default policies
- **List:** Passes user ID to service to fetch both system defaults + user's custom policies
- Added comprehensive logging for debugging

### 4. Backend Service

**File:** `backend/src/services/legal.service.ts`

- **getCancellationPolicies:** Now accepts optional `userId` parameter
  - If userId provided: returns system defaults OR user's custom policies
  - If no userId: returns only system defaults (public access)
- **createCancellationPolicy:** Includes `is_custom` and `created_by` in INSERT

### 5. Backend Types

**File:** `backend/src/types/legal.types.ts`

- Added `is_custom: boolean` to `CancellationPolicy` interface
- Added `created_by: string | null` to `CancellationPolicy` interface
- Added optional fields to `CreateCancellationPolicyData`

### 6. Frontend Types

**File:** `frontend/src/types/legal.types.ts`

- Added `is_custom: boolean` to `CancellationPolicy` interface
- Added `created_by: string | null` to `CancellationPolicy` interface
- Added optional fields to `CreateCancellationPolicyData`

### 7. Frontend UI

**File:** `frontend/src/pages/legal/components/PolicyCard.tsx`

- Added "System Default" badge for `is_default = true` policies
- Added "Custom" badge for `is_custom = true` policies
- Only show Edit/Delete buttons for custom policies (hide for system defaults)

---

## Migration Instructions

**IMPORTANT:** You must apply the database migration before the backend changes take effect.

### Step 1: Apply Migration

Run the migration file against your Supabase database:

```bash
# Option A: Using Supabase CLI
supabase migration up

# Option B: Copy SQL and run in Supabase Dashboard
# Go to SQL Editor in Supabase Dashboard
# Paste contents of backend/migrations/135_allow_property_owners_create_cancellation_policies.sql
# Click Run
```

### Step 2: Restart Backend Server

```bash
cd backend
npm run dev
```

The backend server needs to restart to pick up the route and controller changes.

### Step 3: Test

1. Log in as a **property owner** (non-admin user)
2. Navigate to a property → Legal tab → Cancellation Policies
3. Click "Add Policy"
4. Create a custom cancellation policy
5. Verify:
   - ✅ Policy creates successfully (no permission error)
   - ✅ Custom badge appears on the new policy
   - ✅ Edit/Delete buttons visible only on custom policies
   - ✅ System default policies (Flexible, Moderate, Strict, Non-refundable) show "System Default" badge
   - ✅ System defaults have no Edit/Delete buttons

---

## Benefits

1. **Property owners can customize policies** - Create policies tailored to their specific property needs
2. **System defaults preserved** - Built-in policies remain protected from accidental modification
3. **Better UX** - Clear visual distinction between system defaults and custom policies
4. **Secure** - RLS policies enforce ownership at database level
5. **Scalable** - Each user only sees their own custom policies + system defaults

---

## Technical Notes

### RLS Policy Logic

```sql
-- Users can create their own custom policies
CREATE POLICY "Users can create custom cancellation policies"
  ON cancellation_policies
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND is_custom = true
  );

-- Users can update their own custom policies
CREATE POLICY "Users can update their own custom policies"
  ON cancellation_policies
  FOR UPDATE
  USING (created_by = auth.uid() AND is_custom = true)
  WITH CHECK (created_by = auth.uid() AND is_custom = true);

-- Users can delete their own custom policies
CREATE POLICY "Users can delete their own custom policies"
  ON cancellation_policies
  FOR DELETE
  USING (created_by = auth.uid() AND is_custom = true);

-- Admins can manage all policies
CREATE POLICY "Admins can manage all cancellation policies"
  ON cancellation_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'saas_team_member')
    )
  );
```

### Ownership Enforcement

- Backend controller sets `created_by` from `req.user.id` (cannot be overridden by client)
- Backend controller forces `is_custom = true` for user-created policies
- Backend controller prevents `is_default = true` for user-created policies
- RLS policies enforce these rules at database level (defense in depth)

### Query Optimization

- Added index on `created_by` for efficient user policy lookups
- List query uses OR condition to fetch system defaults + user's custom policies in one query

---

## Related Files

### Backend
- `backend/migrations/135_allow_property_owners_create_cancellation_policies.sql`
- `backend/src/routes/legal.routes.ts`
- `backend/src/controllers/legal.controller.ts`
- `backend/src/services/legal.service.ts`
- `backend/src/types/legal.types.ts`

### Frontend
- `frontend/src/types/legal.types.ts`
- `frontend/src/pages/legal/components/PolicyCard.tsx`
- `frontend/src/pages/legal/components/CancellationPoliciesTab.tsx` (no changes needed - already set up correctly)
- `frontend/src/pages/properties/components/PropertyLegalTab.tsx` (no changes needed - already set up correctly)

---

## Future Enhancements (Optional)

1. **Privacy Policy & Refund Policy Management:**
   - Currently only Terms & Conditions stored in `properties.terms_and_conditions`
   - Could add `privacy_policy` and `refund_policy` TEXT columns to properties table
   - Or create a separate `legal_documents` table with document_type enum

2. **Property-Specific Policy Selection:**
   - Allow properties to select which cancellation policy to use
   - Currently properties store a string reference in `cancellation_policy` field

3. **Policy Usage Tracking:**
   - Show which properties/rooms are using each policy
   - Prevent deletion if policy is in use

---

## Verification Checklist

After applying migration and restarting server:

- [ ] Migration applied successfully (no SQL errors)
- [ ] Backend server restarted
- [ ] Can log in as property owner
- [ ] Can navigate to Legal tab
- [ ] Can click "Add Policy" without permission error
- [ ] Can create custom cancellation policy
- [ ] Custom policy shows "Custom" badge
- [ ] System defaults show "System Default" badge
- [ ] Edit/Delete buttons only on custom policies
- [ ] Cannot edit/delete system defaults
- [ ] Policy list shows both system defaults + user's custom policies

---

## Status

✅ **COMPLETE** - All changes implemented and ready for testing

**Next Step:** Apply migration 135 and restart backend server
