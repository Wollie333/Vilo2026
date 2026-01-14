# End-to-End User Scenario Testing - Migrations 066-071

## Test Scenarios

### Scenario 1: New User Signup (Auto Free Tier Assignment)

**Goal:** Verify new users automatically get free tier subscription

#### Steps:
1. **Open signup page** (not logged in)
2. **Click** "Sign Up" or "Create Account"
3. **Fill form:**
   - Email: `testuser+${Date.now()}@example.com`
   - Password: Strong password
   - Full Name: Test User
   - Phone: (optional)
4. **Submit** signup form
5. **Verify** redirected to dashboard or onboarding

#### Verification:
```javascript
// In browser console after signup
const me = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json());

console.log('User type:', me.data.user.user_type.name); // Should be "free"
console.log('Category:', me.data.user.user_type.category); // Should be "customer"
console.log('Has subscription:', me.data.user.subscriptions?.length > 0); // Should be true
console.log('Plan:', me.data.user.subscriptions[0].subscription_type.name); // Should be "free_tier"
console.log('Permission count:', me.data.user.effective_permissions.length); // Should be ~18
```

✅ **Expected:**
- User type: "free" (customer category)
- Active subscription: "free_tier"
- Price: R0.00
- Permissions: ~18 basic permissions
- Can create 1 property
- Can create 3 rooms
- Can create 10 bookings/month

❌ **If Fails:**
- Check backend/src/services/auth.service.ts lines 76-120
- Verify free tier plan exists in database
- Check console logs for auto-assignment errors

---

### Scenario 2: SaaS Admin Managing Permissions

**Goal:** Verify SaaS admin has direct permissions, not from subscription

#### Steps:
1. **Log in** as super_admin or admin user
2. **Navigate to** `/admin/settings/billing`
3. **Click** "User Types" tab
4. **Click** on "Super Admin" or "Admin" user type
5. **Verify** category badge shows "SaaS"
6. **Verify** Permission section is VISIBLE
7. **Toggle** some permissions on/off
8. **Click** "Save" button

#### Verification:
```javascript
const me = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json());

console.log('Category:', me.data.user.user_type.category); // Should be "saas"
console.log('Permission count:', me.data.user.effective_permissions.length); // Should be 50+
console.log('Has subscription:', me.data.user.subscriptions?.length > 0); // May be false or true (doesn't matter for SaaS)
```

✅ **Expected:**
- Category: "saas"
- Permissions: 50+ (from user_type_permissions, not subscription)
- Permission management UI visible in User Types tab
- Changes persist after save

❌ **If Fails:**
- Check category field on user_types table
- Verify permission resolution in backend/src/middleware/auth.middleware.ts
- Check user_type_permissions table has entries

---

### Scenario 3: Customer with Paid Subscription

**Goal:** Verify customer permissions come from subscription plan

#### Steps:
1. **Create or use** a customer user
2. **Upgrade** to paid subscription plan
3. **Navigate to** dashboard
4. **Try to access** features (properties, rooms, bookings)

#### Verification:
```javascript
const me = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json());

console.log('Category:', me.data.user.user_type.category); // Should be "customer"
console.log('Plan:', me.data.user.subscriptions[0]?.subscription_type.name); // Should be paid plan name
console.log('Permission count:', me.data.user.effective_permissions.length); // Should be more than free tier
```

✅ **Expected:**
- Category: "customer"
- Active subscription: Paid plan (not free_tier)
- Permissions: More than 18 (from subscription plan)
- Can exceed free tier limits

❌ **If Fails:**
- Check subscription_type_permissions table
- Verify permission resolution uses subscription
- Check subscription is active and not expired

---

### Scenario 4: Managing User Type Categories

**Goal:** Verify admin can create user types with categories

#### Steps:
1. **Log in** as super_admin
2. **Navigate to** `/admin/settings/billing`
3. **Click** "User Types" tab
4. **Click** "Create User Type" button
5. **Fill form:**
   - Name: test_customer_type
   - Display Name: Test Customer Type
   - Description: Test customer member type
   - **Category: Customer** (select radio button)
6. **Submit** form
7. **Verify** new type appears with green "Customer" badge

#### Verification:
- New user type card shows "Customer" badge in green
- When editing, permission section is hidden
- Info alert directs to Subscription Plans tab

✅ **Expected:**
- Can create both SaaS and Customer types
- Category badges display correctly
- Permission UI adapts based on category

---

### Scenario 5: Managing Subscription Plan Permissions

**Goal:** Verify admin can assign permissions to subscription plans

#### Steps:
1. **Log in** as super_admin
2. **Navigate to** `/admin/settings/billing`
3. **Click** "Subscription Plans" tab
4. **Click** on "Free Tier" plan
5. **Navigate to** "Permissions" tab
6. **Current permissions** should show ~18 selected
7. **Toggle** some permissions on:
   - rooms:delete
   - properties:manage
   - analytics:read
8. **Click** "Save" button
9. **Verify** success message
10. **Reload page** and re-open plan
11. **Verify** newly added permissions still selected

#### Verification:
```sql
-- In database
SELECT COUNT(*) FROM subscription_type_permissions
WHERE subscription_type_id = (SELECT id FROM subscription_types WHERE name = 'free_tier');
-- Count should match selected permissions
```

✅ **Expected:**
- Permissions persist after save
- All customer users with free tier immediately get new permissions
- Permission count updates on plan card

---

### Scenario 6: Company Team Member Management

**Goal:** Verify property owners can add staff to manage their properties

#### Steps:
1. **Log in** as property owner (customer user)
2. **Navigate to** `/companies` page
3. **Click** on your company
4. **Click** "Team Members" tab in left sidebar
5. **Click** "Add Team Member" button
6. **Fill form:**
   - User Email: (email of another user)
   - Role: Manager
7. **Submit** form
8. **Verify** success message
9. **Verify** team member appears in list with:
   - Avatar
   - Name/Email
   - "Manager" role badge
   - Remove button

#### Remove Team Member:
10. **Click** "Remove" button
11. **Confirm** in modal
12. **Verify** team member removed from list

#### Verification:
```javascript
// Check team membership via API
const companyId = 'your-company-id';
const members = await fetch(`/api/companies/${companyId}/team-members`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json());

console.log('Team members:', members.data.team_members);
```

✅ **Expected:**
- Can add existing users by email
- Role badges show correct colors
- Remove confirmation prevents accidents
- Team member has access to company properties

---

### Scenario 7: Permission Override Testing

**Goal:** Verify direct permission grants/denies work for all user types

#### Steps:
1. **Log in** as super_admin
2. **Navigate to** `/admin/users`
3. **Select** a customer user
4. **Go to** "Permissions" tab
5. **Add direct GRANT** for permission not in their subscription
   - Example: "properties:delete"
6. **Save** changes
7. **Log in** as that customer user
8. **Verify** they now have the granted permission

#### Verification:
```javascript
const me = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json());

// Check if override permission exists
const hasOverride = me.data.user.effective_permissions.includes('properties:delete');
console.log('Has override permission:', hasOverride); // Should be true
```

✅ **Expected:**
- Direct GRANT adds permission to effective_permissions
- Direct DENY removes permission from effective_permissions
- Overrides work for both SaaS and Customer users
- Expired overrides are ignored

---

### Scenario 8: Subscription Limit Enforcement

**Goal:** Verify free tier limits are enforced

#### Steps:
1. **Log in** as free tier customer
2. **Try to create** 2nd property
   - Should be blocked (limit: 1 property)
3. **Try to create** 4th room
   - Should be blocked (limit: 3 rooms)
4. **Try to add** team member
   - Should be blocked (limit: 0 team members)

#### Verification:
- Error messages clearly state subscription limit
- Upgrade prompts appear
- Actions are prevented before API call

✅ **Expected:**
- Limits enforced on frontend and backend
- Clear error messages with limits shown
- Upgrade options presented

---

## Testing Matrix

| User Type | Category | Permissions From | Can Manage Team | Limit Source |
|-----------|----------|------------------|-----------------|--------------|
| Super Admin | saas | user_type_permissions | N/A | None |
| Admin | saas | user_type_permissions | N/A | None |
| Free Customer | customer | subscription (free_tier) | No (limit: 0) | Subscription |
| Paid Customer | customer | subscription (paid plan) | Yes (plan limit) | Subscription |
| Team Member | N/A | company_team_members.permissions | No | N/A |

---

## Success Criteria Summary

✅ **All scenarios complete without errors**
✅ **New users get free tier automatically**
✅ **SaaS users have full permissions**
✅ **Customer permissions come from subscription**
✅ **Subscription permissions can be managed**
✅ **Team members can be added/removed**
✅ **Permission overrides work correctly**
✅ **Subscription limits are enforced**

---

## Rollback Plan

If critical issues are found:

1. **Database Rollback:**
   ```sql
   -- Remove tables
   DROP TABLE IF EXISTS public.subscription_type_permissions CASCADE;
   DROP TABLE IF EXISTS public.company_team_members CASCADE;

   -- Remove category column
   ALTER TABLE public.user_types DROP COLUMN IF EXISTS category;
   ```

2. **Code Rollback:**
   ```bash
   git revert HEAD~9  # Revert last 9 commits (Save Points 1-9)
   ```

3. **Frontend Cleanup:**
   - Remove category UI from UserTypesTab
   - Remove permissions tab from SubscriptionPlansTab
   - Remove team members tab from CompanyDetailPage

---

## Performance Monitoring

Monitor these metrics after deployment:

- **Permission Resolution Time:** Should be < 100ms
- **Subscription Assignment:** Should happen within signup request
- **Team Member Queries:** Should be cached appropriately
- **API Response Times:** All endpoints < 500ms

---

## Support Documentation

Create user-facing documentation:
- [ ] How to invite team members
- [ ] Understanding subscription plans and permissions
- [ ] How to upgrade from free tier
- [ ] Managing user types (admin guide)
- [ ] Permission system overview

---

## Final Validation

Before marking complete:
- [ ] All 7 database checks pass
- [ ] Backend APIs respond correctly
- [ ] Frontend UI renders without errors
- [ ] All 8 user scenarios work end-to-end
- [ ] No console errors in browser
- [ ] No backend errors in logs
- [ ] Performance is acceptable
- [ ] Documentation is updated
