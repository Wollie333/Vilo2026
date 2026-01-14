# Manual API Testing Guide - Migrations 066-071

## Backend API Endpoints to Test

All tests require authentication. Use your admin credentials to log in first.

### 1. Subscription Type Permissions

#### GET Subscription Permissions
```bash
GET /api/billing/subscription-types/:id/permissions
Authorization: Bearer {your_token}

Expected: 200 OK with array of permissions
```

**Test in browser console:**
```javascript
// After logging in as admin
const response = await fetch('/api/billing/subscription-types/{subscription_id}/permissions', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
});
const data = await response.json();
console.log('Permissions:', data);
```

#### PUT Update Subscription Permissions
```bash
PUT /api/billing/subscription-types/:id/permissions
Authorization: Bearer {your_token}
Content-Type: application/json

Body:
{
  "permission_ids": ["uuid1", "uuid2", "uuid3"]
}

Expected: 200 OK with updated permissions
```

### 2. Company Team Members

#### GET Team Members
```bash
GET /api/companies/:companyId/team-members
Authorization: Bearer {your_token}

Expected: 200 OK with array of team members
```

#### POST Add Team Member
```bash
POST /api/companies/:companyId/team-members
Authorization: Bearer {your_token}
Content-Type: application/json

Body:
{
  "user_id": "user_email@example.com",
  "role": "manager",
  "permissions": ["properties:read", "bookings:read"]
}

Expected: 201 Created with team member details
```

#### DELETE Remove Team Member
```bash
DELETE /api/companies/:companyId/team-members/:memberId
Authorization: Bearer {your_token}

Expected: 200 OK with success message
```

---

## Testing Checklist

### Backend API Tests
- [ ] GET subscription permissions returns array
- [ ] PUT subscription permissions updates successfully
- [ ] GET team members returns array (empty or populated)
- [ ] POST add team member creates successfully
- [ ] DELETE remove team member works

### Permission Resolution Tests
- [ ] SaaS user (admin) has permissions from user_type_permissions
- [ ] Customer user has permissions from subscription plan
- [ ] Customer without subscription has no base permissions
- [ ] Direct permission overrides work (grant/deny)

### Auto-Assignment Tests
- [ ] New signup gets free user type automatically
- [ ] New signup gets free tier subscription automatically
- [ ] Free tier subscription is active immediately

---

## Quick Browser Console Tests

### Test 1: Check Current User Permissions
```javascript
const me = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json());

console.log('User category:', me.data.user.user_type.category);
console.log('Permissions:', me.data.user.effective_permissions);
```

### Test 2: Test Subscription Permissions
```javascript
// Get free tier plan
const plans = await fetch('/api/billing/subscription-types').then(r => r.json());
const freeTier = plans.data.subscription_types.find(p => p.name === 'free_tier');

// Get its permissions
const permissions = await fetch(`/api/billing/subscription-types/${freeTier.id}/permissions`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json());

console.log('Free tier permissions:', permissions.data.permissions.length);
```

### Test 3: Test Team Member Management
```javascript
// Assuming you have a company
const companyId = 'your-company-id';

// List team members
const members = await fetch(`/api/companies/${companyId}/team-members`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}).then(r => r.json());

console.log('Team members:', members.data.team_members);
```

---

## Expected Results

✅ **SaaS Admin User:**
- Category: "saas"
- Permissions from: user_type_permissions table
- Should have many permissions (50+)

✅ **Customer User (Free Tier):**
- Category: "customer"
- Permissions from: subscription plan (free_tier)
- Should have ~18 basic permissions

✅ **Customer User (Paid Plan):**
- Category: "customer"
- Permissions from: subscription plan (their active plan)
- Should have more permissions than free tier

✅ **Team Member:**
- Appears in company_team_members table
- Has property-specific permissions
- Can be added/removed by company owner
