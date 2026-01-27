# Legal Settings UI - Manual Test Checklist

**URL**: `http://localhost:5173/admin/billing#legal-settings`

---

## Pre-Test Setup

- [ ] Backend server is running (`cd backend && npm run dev`)
- [ ] Frontend server is running (`cd frontend && npm run dev`)
- [ ] Logged in as `super_admin` or `saas_team_member`
- [ ] Migration 137 has been applied (templates updated)

---

## Visual Tests

### 1. Tab Navigation
- [ ] "Legal Settings" tab appears in the billing page tabs
- [ ] Clicking the tab loads the Legal Settings view
- [ ] No console errors when tab loads

### 2. Document Type Selector (Top Card)
- [ ] Four document type buttons visible:
  - [ ] **Terms of Service** (FileText icon)
  - [ ] **Privacy Policy** (Shield icon)
  - [ ] **Cookie Policy** (Cookie icon)
  - [ ] **Acceptable Use Policy** (AlertCircle icon)
- [ ] Buttons have proper styling (icon + label + description)
- [ ] Selected button has primary color highlight
- [ ] Clicking each button switches the document

### 3. Terms of Service Content
Click "Terms of Service" button and verify:
- [ ] Title shows: "Vilo Platform Terms of Service"
- [ ] Version shows: "1.0"
- [ ] Last updated date is recent (today or when migration ran)
- [ ] Content displays rich HTML with proper formatting
- [ ] Content includes these sections:
  - [ ] "Acceptance of Terms"
  - [ ] "Definitions"
  - [ ] "User Accounts"
  - [ ] "Subscriptions & Billing"
  - [ ] "Property Owner Terms"
  - [ ] "Guest Terms"
  - [ ] "Intellectual Property Rights"
  - [ ] "Disclaimer of Warranties"
  - [ ] "Limitation of Liability"
  - [ ] "Dispute Resolution & Arbitration"
  - [ ] Contact information at bottom

**Content Check**: Scroll through and verify content is NOT placeholder text like:
- ❌ "Content to be customized by SaaS admin..."
- ✅ Should have full paragraphs with legal language

### 4. Privacy Policy Content
Click "Privacy Policy" button and verify:
- [ ] Title shows: "Vilo Privacy Policy"
- [ ] Version shows: "1.0"
- [ ] Content includes these sections:
  - [ ] "Introduction"
  - [ ] "Information We Collect"
  - [ ] "How We Use Your Information"
  - [ ] "Information Sharing & Disclosure"
  - [ ] "Your Rights" (GDPR rights)
  - [ ] "California Privacy Rights" (CCPA section)
  - [ ] "European Privacy Rights"
  - [ ] Contact information

**Content Check**: Look for compliance language:
- [ ] GDPR mentioned
- [ ] CCPA mentioned
- [ ] User rights (access, deletion, portability) listed
- [ ] Data retention policies described

### 5. Cookie Policy Content
Click "Cookie Policy" button and verify:
- [ ] Title shows: "Cookie Policy"
- [ ] Version shows: "1.0"
- [ ] Content includes these sections:
  - [ ] "What Are Cookies"
  - [ ] "Strictly Necessary Cookies"
  - [ ] "Functional Cookies"
  - [ ] "Analytics & Performance Cookies"
  - [ ] "Marketing & Advertising Cookies"
  - [ ] "Managing Cookies"
  - [ ] Browser-specific instructions (Chrome, Firefox, Safari, Edge)
  - [ ] Mobile device instructions (iOS, Android)

**Content Check**: Look for specific details:
- [ ] Cookie types categorized
- [ ] Third-party cookies mentioned (Google Analytics, etc.)
- [ ] Clear management instructions provided

### 6. Acceptable Use Policy Content
Click "Acceptable Use Policy" button and verify:
- [ ] Title shows: "Acceptable Use Policy"
- [ ] Version shows: "1.0"
- [ ] Content includes these sections:
  - [ ] "Purpose & Scope"
  - [ ] "Prohibited Activities" (with specific list)
  - [ ] "Property Owner Responsibilities"
  - [ ] "Guest Responsibilities"
  - [ ] "Reporting Violations"
  - [ ] "Investigation & Enforcement"
  - [ ] "Appeals Process"

**Content Check**: Look for enforcement details:
- [ ] 16+ prohibited activities listed
- [ ] Warning/suspension/termination procedures described
- [ ] Appeals process explained

### 7. Version History Card (Bottom Card)
For each document type:
- [ ] Version history section displays
- [ ] Current version (1.0) listed
- [ ] "Active" badge shows in green
- [ ] Created date displays
- [ ] "Create New Version" button shows (may show "coming soon" toast if clicked)

### 8. Responsive Design
Test on different screen sizes:
- [ ] **Desktop**: Cards display full width
- [ ] **Tablet**: Document type buttons stack appropriately
- [ ] **Mobile**: Layout remains readable and functional

### 9. Dark Mode (if applicable)
Toggle dark mode and verify:
- [ ] Cards have proper dark theme colors
- [ ] Text is readable (white text on dark background)
- [ ] Buttons have proper contrast
- [ ] Active/inactive states visible

### 10. Loading States
Refresh the page and observe:
- [ ] Loading spinner or "Loading..." text appears briefly
- [ ] No flash of incorrect content
- [ ] Smooth transition to loaded state

---

## Error Tests

### Test 1: Network Error Simulation
1. Stop backend server
2. Refresh Legal Settings tab
3. **Expected**: Error message or toast notification
4. **Verify**: User-friendly error message (not raw error dump)
5. Restart backend server

### Test 2: Wrong User Role
1. Log in as `property_owner` or `free` user
2. Try to navigate to `/admin/billing#legal-settings`
3. **Expected**: Access denied or redirect
4. **Verify**: Cannot access the tab

---

## Browser Console Checks

Open DevTools (F12) → Console tab:

### Success Logs (should see):
- [ ] `[PLATFORM_LEGAL_SERVICE] Fetching active document for type: terms_of_service`
- [ ] `[PLATFORM_LEGAL_SERVICE] Active document fetched successfully`
- [ ] `[PLATFORM_LEGAL_SERVICE] Fetching versions for type: terms_of_service`
- [ ] `[PLATFORM_LEGAL_SERVICE] Fetched X versions`
- [ ] `[LegalSettingsTab] Active document: 1.0`
- [ ] `[LegalSettingsTab] Total versions: 1`

### No Errors (should NOT see):
- [ ] No red error messages
- [ ] No "Request timed out" errors
- [ ] No 401/403 authorization errors
- [ ] No TypeScript errors

---

## Network Tab Checks

Open DevTools (F12) → Network tab:

### Successful Requests (Status 200):
- [ ] `GET /api/admin/platform-legal/documents/type/terms_of_service` → 200
- [ ] `GET /api/admin/platform-legal/documents/type/terms_of_service/versions` → 200
- [ ] Response time < 1 second

### Response Body Check:
Click on a network request → Preview/Response tab:
- [ ] Response has `success: true`
- [ ] Response has `data` object with document
- [ ] Document has `content` field with substantial length (10000+ characters)

---

## Content Quality Verification

### Quick Scan Test
For EACH document type, verify the content:

**Terms of Service**:
- [ ] Content mentions "Vilo" platform
- [ ] Contains legal disclaimers ("AS IS", "NO WARRANTY")
- [ ] Has arbitration clause
- [ ] Lists subscription/billing terms
- [ ] Includes contact information

**Privacy Policy**:
- [ ] Explains what data is collected
- [ ] Describes how data is used
- [ ] Lists user rights (GDPR)
- [ ] Mentions cookies (links to Cookie Policy)
- [ ] Has CCPA section for California users

**Cookie Policy**:
- [ ] Defines what cookies are
- [ ] Categorizes cookie types
- [ ] Provides opt-out instructions
- [ ] Lists third-party cookies

**Acceptable Use**:
- [ ] Lists prohibited activities (fraud, harassment, etc.)
- [ ] Defines consequences (suspension, termination)
- [ ] Explains appeals process

---

## ✅ Test Complete Criteria

All tests pass when:

1. ✅ All 4 document types load without errors
2. ✅ Each document shows comprehensive content (NOT placeholder text)
3. ✅ Content length for each document > 1000 characters
4. ✅ Version history displays correctly
5. ✅ No console errors
6. ✅ Network requests return 200 status
7. ✅ Responsive design works on all screen sizes
8. ✅ Dark mode (if enabled) displays correctly

---

## 🐛 If Tests Fail

### Documents Show Placeholder Text
**Problem**: Content shows "Content to be customized by SaaS admin..."

**Solution**: Migration 137 hasn't been applied yet
```sql
-- Run this in Supabase SQL Editor
-- Copy contents of backend/migrations/137_update_platform_legal_templates.sql
```

### Timeout Errors
**Problem**: Requests timeout after 30 seconds

**Solution**: Backend not running
```bash
cd backend && npm run dev
```

### 401 Unauthorized
**Problem**: API returns 401 error

**Solution**: Not logged in as correct role
- Log out and log back in as `super_admin` or `saas_team_member`
- Check user role in database:
  ```sql
  SELECT u.email, ut.name
  FROM users u
  JOIN user_types ut ON u.user_type_id = ut.id
  WHERE u.email = 'your-email@example.com';
  ```

### Documents Not Loading
**Problem**: Shows "Loading..." forever

**Solution**: Check backend logs for errors
```bash
# In backend terminal, look for error messages
# Check if migration 136 ran successfully
```

---

## 📝 Test Results

**Date Tested**: _______________

**Tester**: _______________

**Results**:
- [ ] All tests passed
- [ ] Some tests failed (see notes below)

**Notes**:
_____________________________________
_____________________________________
_____________________________________

---

**Next Steps After Testing**:
- If all tests pass → Feature is ready for production!
- If tests fail → Review error logs and follow troubleshooting steps
- Customize templates → Edit content to match your company's specific legal requirements
