# Frontend UI Verification Checklist - Migrations 066-071

## Pages to Test

### 1. User Types Tab (Member Types)
**Location:** `/admin/settings/billing` → "User Types" tab

#### Visual Verification
- [ ] Category badges appear on each user type card
  - SaaS types show blue "SaaS" badge
  - Customer types show green "Customer" badge
- [ ] Info alert at top explains category differences
- [ ] Create modal has category selector (radio buttons)
- [ ] Category radio buttons have descriptions

#### Functionality Tests
- [ ] Click "Create User Type" button
- [ ] Select "Customer" category
  - Description should mention "subscription plan"
- [ ] Select "SaaS Team" category
  - Description should mention "direct permission assignment"
- [ ] Create a test user type (use category: customer)
- [ ] Verify category badge appears on new card

#### Permission Management
- [ ] Select a SaaS user type (super_admin or admin)
  - Permission section should be visible
  - Should show permission toggles
- [ ] Select a Customer user type (free or paid)
  - Permission section should be HIDDEN
  - Info alert should say "permissions come from subscription plan"
  - Alert should direct to Subscription Plans tab

### 2. Subscription Plans Tab
**Location:** `/admin/settings/billing` → "Subscription Plans" tab

#### Visual Verification
- [ ] Free Tier plan card exists
- [ ] Shows "R0.00" or "FREE" pricing
- [ ] Displays limit information correctly
- [ ] "Permissions" tab exists in plan editor

#### Functionality Tests
- [ ] Click on Free Tier plan to edit
- [ ] Navigate to "Permissions" tab
- [ ] Permission toggles should be visible
- [ ] Toggle some permissions on/off
- [ ] Click "Save" button
- [ ] Verify success message appears
- [ ] Reload page and edit plan again
  - Previously selected permissions should still be selected

#### Permission Count Display
- [ ] Plan cards should show permission count (e.g., "18 permissions")
- [ ] Count should match actual assigned permissions

### 3. Company Detail Page - Team Members Tab
**Location:** `/companies/:id` → "Team Members" tab

#### Visual Verification
- [ ] "Team Members" nav item appears in left sidebar under "LINKED" section
- [ ] Has users icon (👥)
- [ ] Tab is clickable

#### When Tab is Empty
- [ ] Shows empty state with icon
- [ ] Shows "No team members yet" message
- [ ] Shows "Add First Team Member" button
- [ ] Button should open add modal

#### Add Team Member Modal
- [ ] Click "Add Team Member" button
- [ ] Modal opens with form
- [ ] Form fields present:
  - User Email input
  - Role dropdown (Manager, Receptionist, Maintenance, Housekeeping, Custom)
  - Custom Role Name input (only shows when "Custom" selected)
- [ ] Role descriptions appear below dropdown
- [ ] Cancel and Add buttons present

#### Functionality Tests
- [ ] Enter a valid user email
- [ ] Select "Manager" role
  - Should show role description
- [ ] Select "Custom" role
  - Custom Role Name input should appear
  - Enter custom role name
- [ ] Click "Add Team Member"
  - Should show success message
  - Modal should close
  - New team member should appear in list

#### Team Member List
- [ ] Each member shows:
  - Avatar (initial letter)
  - Full name or email
  - Email address
  - Role badge with color
  - Remove button
- [ ] Click "Remove" button
  - Confirmation modal appears
  - Confirm removal
  - Team member disappears from list

### 4. Company Detail Page - Navigation
**Location:** `/companies/:id`

#### Visual Check
- [ ] Left sidebar shows all navigation items:
  - COMPANY section: Overview, Info, Address, Legal, Social
  - LINKED section: Properties, **Team Members** (NEW)
  - SETTINGS section: Document Settings
- [ ] Team Members item has correct icon
- [ ] Clicking Team Members navigates to `#team-members`
- [ ] URL updates to `/companies/:id#team-members`
- [ ] Team Members section renders

---

## Code Verification (Already Completed)

### Type Exports ✅
- [x] `UserTypeCategory` exported from billing.types.ts
- [x] `SubscriptionTypePermission` interfaces added
- [x] `CompanyTeamMember` types exported from company-team.types.ts
- [x] All types exported from index.ts

### Service Methods ✅
- [x] `billingService.getSubscriptionTypePermissions()`
- [x] `billingService.updateSubscriptionTypePermissions()`
- [x] `companyTeamService.listTeamMembers()`
- [x] `companyTeamService.addTeamMember()`
- [x] `companyTeamService.removeTeamMember()`

### Component Integration ✅
- [x] UserTypesTab updated with category support
- [x] SubscriptionPlansTab connected to permissions API
- [x] CompanyTeamMembersTab created and exported
- [x] CompanyDetailPage integrated team members tab

---

## Browser Testing Steps

### Step 1: Test User Types
1. **Start frontend:** `cd frontend && npm run dev`
2. **Navigate to:** http://localhost:5173/admin/settings/billing
3. **Click:** "User Types" tab
4. **Verify:** Category badges visible on all user types
5. **Click:** "Create User Type" button
6. **Verify:** Category selector with radio buttons appears
7. **Select:** Different categories and verify descriptions
8. **Click:** Existing user type to edit
9. **Verify:** Permission section visibility based on category

### Step 2: Test Subscription Plans
1. **Navigate to:** http://localhost:5173/admin/settings/billing
2. **Click:** "Subscription Plans" tab
3. **Find:** Free Tier plan card
4. **Verify:** Shows R0.00 pricing
5. **Click:** Free Tier plan to edit
6. **Click:** "Permissions" tab
7. **Toggle:** Some permissions on/off
8. **Click:** "Save" button
9. **Verify:** Success message appears
10. **Refresh page** and re-open plan
11. **Verify:** Permissions persisted correctly

### Step 3: Test Team Members
1. **Navigate to:** http://localhost:5173/companies
2. **Click:** Any company to view details
3. **Verify:** "Team Members" appears in left sidebar
4. **Click:** "Team Members" tab
5. **Verify:** Empty state or existing members display
6. **Click:** "Add Team Member" button
7. **Fill form:**
   - Email: (existing user email)
   - Role: Manager
8. **Click:** "Add Team Member"
9. **Verify:** Success message and member appears
10. **Click:** "Remove" button on member
11. **Confirm:** Removal in modal
12. **Verify:** Member removed from list

---

## Expected UI Behavior

### User Types Tab
✅ **Category Badge Colors:**
- SaaS: Blue (primary variant)
- Customer: Green (success variant)

✅ **Permission Section Display:**
- SaaS types: Shows permission toggles
- Customer types: Shows info alert directing to Subscription Plans

### Subscription Plans Tab
✅ **Free Tier Plan:**
- Displays R0.00 or FREE
- Shows basic limits (1 property, 3 rooms, etc.)
- Has 18 permissions assigned by default
- Permissions can be edited

### Team Members Tab
✅ **Empty State:**
- Friendly message with icon
- Clear call-to-action button

✅ **Team Member Cards:**
- Clean layout with avatar
- Role badge with appropriate color
- Email visible
- Easy-to-use remove button

✅ **Add Modal:**
- Clear form labels
- Role descriptions help users
- Custom role option available
- Validation on submit

---

## Potential Issues to Watch For

### Type Errors
❌ **If you see TypeScript errors:**
- Check that all types are properly exported
- Verify imports in components match exports

### API Errors
❌ **If API calls fail:**
- Check backend is running (`cd backend && npm run dev`)
- Verify authentication token is valid
- Check browser console for error messages

### UI Not Updating
❌ **If changes don't appear:**
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check if data is being fetched (Network tab)
- Verify state updates in React DevTools

### Permission Not Saving
❌ **If permissions don't persist:**
- Check backend logs for errors
- Verify PUT endpoint is being called
- Check database has subscription_type_permissions table

---

## Success Criteria

✅ **All UI components render without errors**
✅ **Category badges display correctly**
✅ **Permission management works for both categories**
✅ **Subscription plan permissions can be edited**
✅ **Team members can be added and removed**
✅ **All navigation works correctly**
✅ **Forms validate properly**
✅ **Success/error messages appear**

---

## Next Steps After UI Verification

Once all UI checks pass:
1. ✅ Test complete user workflows (see USER_SCENARIOS.md)
2. ✅ Verify permission resolution in different scenarios
3. ✅ Test subscription limits enforcement
4. ✅ Verify auto-assignment on new user signup
