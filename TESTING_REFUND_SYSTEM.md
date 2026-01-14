# Refund Management System - Testing Guide

This guide explains how to test the enhanced refund management system implemented in Phases 1-12.

## Overview

The refund management system includes:
- **Two-way comment system** (guests and admins can communicate)
- **Activity timeline** (unified view of comments + status changes)
- **Refund action modal** (approve/reject/process with separate internal/customer notes)
- **Database triggers** (validation, auto-logging, deduplication)
- **Character limits** (2000 chars enforced at 3 layers)

## Testing Phases

### Phase 13: Database Tests ✅

Tests database triggers, constraints, and views.

**File**: `backend/migrations/test_refund_system.sql`

**What it tests**:
1. Tables exist with correct schema
2. Indexes created for performance
3. CHECK constraint enforces 1-2000 character limit
4. Status transition validation trigger blocks invalid transitions
5. Status history auto-logging trigger works
6. Comment count auto-update trigger works
7. Activity feed view returns unified timeline
8. Deduplication prevents duplicate history entries
9. Internal vs public comment flags work
10. All trigger functions exist

**How to run**:

```bash
# Option 1: Using psql (direct SQL execution)
psql -U postgres -d vilo_db -f backend/migrations/test_refund_system.sql

# Option 2: Using Supabase CLI (if you have it)
supabase db execute --file backend/migrations/test_refund_system.sql

# Option 3: Copy-paste into Supabase Dashboard SQL Editor
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Open backend/migrations/test_refund_system.sql
# 3. Copy all content
# 4. Paste into SQL Editor and click "Run"
```

**Expected output**:
```
TEST 1: Verify Tables
✓ refund_comments table with all columns
✓ refund_status_history table with all columns

TEST 2: Verify Indexes
✓ idx_refund_comments_refund
✓ idx_refund_comments_user
✓ idx_refund_comments_created
...

TEST PASSED: Empty comment correctly blocked by CHECK constraint
TEST PASSED: 2001 char comment correctly blocked by CHECK constraint
TEST PASSED: Valid comment (50 chars) successfully inserted
TEST PASSED: requested -> under_review (valid transition)
...

===============================================
DATABASE TESTS COMPLETED
===============================================
All 10 test categories passed
```

---

### Phase 14: Backend API Tests

Tests all comment-related API endpoints.

**File**: `test-refund-api.js`

**What it tests**:
1. POST /api/refunds/:id/comments (valid comment)
2. POST /api/refunds/:id/comments (empty text - should fail)
3. POST /api/refunds/:id/comments (2001 chars - should fail)
4. POST /api/refunds/:id/comments (guest cannot create internal)
5. POST /api/refunds/:id/comments (admin creates internal)
6. GET /api/refunds/:id/comments (guest sees no internal)
7. GET /api/refunds/:id/comments (admin sees all)
8. GET /api/refunds/:id/activity (unified timeline)
9. GET /api/refunds/:id/history (status history)
10. Character limit validation (exactly 2000 chars - should pass)
11. Unauthorized access (no token - should fail)
12. Comment user population check

**Prerequisites**:

1. **Backend server running**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Get authentication tokens** (JWT tokens from your database):
   - Admin token: Login as admin, copy JWT from browser DevTools > Application > Local Storage
   - Guest token: Login as guest, copy JWT

3. **Get test refund ID**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT id FROM refund_requests LIMIT 1;
   ```

**How to run**:

```bash
# Set environment variables with your tokens and refund ID
ADMIN_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
GUEST_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
TEST_REFUND_ID=123e4567-e89b-12d3-a456-426614174000 \
node test-refund-api.js
```

**Expected output**:
```
========================================
REFUND API TESTS - Starting...
========================================

✅ TEST 1: POST /api/refunds/:id/comments (Valid comment)
   Comment created with ID: abc123...

✅ TEST 2: POST /api/refunds/:id/comments (Empty text - should fail)
   Correctly rejected empty comment

✅ TEST 3: POST /api/refunds/:id/comments (2001 chars - should fail)
   Correctly rejected 2001 char comment
...

========================================
TEST SUMMARY
========================================
Total Tests: 12
✅ Passed: 12
❌ Failed: 0
Success Rate: 100.0%
========================================
```

---

### Phase 15: Frontend UI Tests (Manual)

Test the UI components in the browser.

#### Test 1: Guest - Comment Thread (MyRefundsPage)

**Steps**:
1. Login as a guest user
2. Navigate to "My Refunds" page
3. Find a refund and click to expand details
4. Scroll to "Comments & Updates" section

**Verify**:
- [ ] Comment thread is visible
- [ ] Existing comments display correctly (newest at bottom)
- [ ] Own comments appear on the right with blue background
- [ ] Other users' comments appear on the left with gray background
- [ ] Textarea has placeholder "Add a comment..."
- [ ] Character counter shows "0/2000"
- [ ] "Post Comment" button is disabled when textarea is empty
- [ ] Admin comments show "Admin" badge
- [ ] Internal comments are NOT visible to guest

**Test Comment Submission**:
1. Type a message in the textarea
2. Watch character counter update (e.g., "50/2000")
3. Click "Post Comment"
4. Verify comment appears immediately at the bottom
5. Verify comment has your name and timestamp

**Test Character Limit**:
1. Paste 2001 characters into textarea
2. Verify character counter turns red: "-1/2000"
3. Verify "Post Comment" button is disabled
4. Delete one character
5. Verify counter turns normal: "2000/2000"
6. Verify "Post Comment" button is enabled

---

#### Test 2: Guest - Activity Timeline (MyRefundsPage)

**Steps**:
1. Expand a refund with both comments and status changes
2. Scroll to "Activity Timeline" section

**Verify**:
- [ ] Timeline shows both comments AND status changes
- [ ] Status changes appear in blue boxes with "→" arrow
- [ ] Comments appear in gray boxes
- [ ] Each activity shows:
  - [ ] Actor name (user who did the action)
  - [ ] Actor role (Admin, Guest, etc.)
  - [ ] Relative timestamp ("2 hours ago")
  - [ ] Activity description
- [ ] Activities are in chronological order (newest first)
- [ ] Internal comments/activities are NOT visible to guest

---

#### Test 3: Admin - Refund Action Modal (RefundDetailPage)

**Steps**:
1. Login as admin
2. Navigate to "Admin" > "Refunds"
3. Click on a refund with status "requested" or "under_review"

**Verify Approve Modal**:
1. Click "Approve Refund" button
2. Modal opens with title "Approve Refund Request"
3. Refund summary shows booking ID, requested amount, reason
4. **Approved Amount** field is pre-filled with requested amount
5. **Reason dropdown** has options:
   - Valid claim - policy compliant
   - Exceptional circumstances
   - Partial approval warranted
   - Goodwill gesture
6. **Notes to Customer** textarea with "(Optional)" label
7. **Internal Notes (Admin Only)** textarea with "(Optional)" label
8. Both textareas have character counters showing "0/2000"
9. Click "Cancel" - modal closes, no changes
10. Fill in all fields:
    - Approved amount: 50.00
    - Reason: "Valid claim - policy compliant"
    - Customer notes: "Your refund has been approved as per our cancellation policy."
    - Internal notes: "Customer provided valid proof of emergency."
11. Click "Approve Refund"
12. Modal closes, success message appears
13. Refund status changes to "approved"
14. Activity timeline shows new status change
15. Comments section shows TWO new comments:
    - Public comment with customer notes
    - Internal comment (yellow background) with admin notes

**Verify Reject Modal**:
1. Find a refund with status "requested"
2. Click "Reject Request" button
3. Modal opens with red "Reject Request" button
4. Try clicking "Reject Request" without filling customer notes
5. Button should be **disabled**
6. Fill in customer notes: "Unfortunately, we cannot process refunds outside the 48-hour cancellation window."
7. (Optional) Add internal notes
8. Click "Reject Request"
9. Modal closes, refund status changes to "rejected"
10. Customer receives public comment explaining rejection

**Verify Process Modal**:
1. Find a refund with status "approved"
2. Click "Process Refund" button
3. Modal shows **Refund Method** dropdown:
   - Manual Processing
   - EFT (Electronic Funds Transfer)
   - Credit Memo
4. Select a method
5. Click "Process Refund"
6. Status changes to "processing"

---

#### Test 4: Admin - Comment Thread (RefundDetailPage)

**Steps**:
1. On a refund detail page, scroll to "Comments & Updates"

**Verify Internal Comment Creation**:
1. Type a message: "Investigating this refund request with finance team"
2. Check the **"Internal note (admin only)"** checkbox
3. Click "Post Comment"
4. Comment appears with:
   - Yellow background
   - "Internal" badge
5. Open the same refund as a guest user
6. Verify the internal comment is NOT visible

**Verify Public Comment Creation**:
1. Uncheck "Internal note" checkbox
2. Type: "We've received your refund request and are reviewing it."
3. Click "Post Comment"
4. Comment appears with gray background (no "Internal" badge)
5. Switch to guest view - comment IS visible

---

#### Test 5: Admin - Activity Timeline (RefundDetailPage)

**Steps**:
1. On a refund detail page, scroll to "Activity Timeline"

**Verify**:
- [ ] Shows all activities (status changes + all comments, including internal)
- [ ] Internal activities have "Internal" badge
- [ ] Status changes clearly show "Status changed: requested → approved"
- [ ] If change_reason was provided, it displays under status change
- [ ] Timeline is sorted newest first
- [ ] Each entry shows correct user name and role
- [ ] Timestamps are human-readable ("5 minutes ago", "2 days ago")

---

#### Test 6: Character Limit Edge Cases

**Test exactly 2000 characters**:
1. Paste a string with exactly 2000 characters
2. Counter shows "2000/2000" (green or normal color)
3. "Post Comment" button is **enabled**
4. Submit successfully

**Test 2001 characters**:
1. Paste a string with 2001 characters
2. Counter shows "-1/2000" (red color)
3. "Post Comment" button is **disabled**
4. Cannot submit

**Test empty string**:
1. Leave textarea empty
2. Counter shows "0/2000"
3. "Post Comment" button is **disabled**

---

#### Test 7: Permissions & Authorization

**Guest User**:
- [ ] Cannot see internal comments
- [ ] Cannot see internal activities in timeline
- [ ] Cannot create internal comments (checkbox not available)
- [ ] Can only comment on own refund requests
- [ ] Cannot access admin refund detail page

**Admin User**:
- [ ] Can see all comments (internal and public)
- [ ] Can see all activities in timeline
- [ ] Can create internal comments via checkbox
- [ ] Can approve/reject/process any refund
- [ ] Has access to action modals

---

## Common Issues & Troubleshooting

### Database Tests

**Issue**: "relation refund_comments does not exist"
- **Fix**: Run migration 045 first: `psql -U postgres -d vilo_db -f backend/migrations/045_add_refund_comments_and_history.sql`

**Issue**: "function track_refund_status_change does not exist"
- **Fix**: Triggers were not created. Re-run migration 045.

**Issue**: Tests fail with "no user found"
- **Fix**: Ensure you have at least one admin user in the `users` table.

### API Tests

**Issue**: "Connection refused" or "ECONNREFUSED"
- **Fix**: Start backend server first: `cd backend && npm run dev`

**Issue**: "401 Unauthorized" on all tests
- **Fix**: Your JWT tokens are invalid or expired. Get new tokens by logging in.

**Issue**: "404 Not Found" on comment endpoints
- **Fix**: Routes not registered. Check `backend/src/routes/refund.routes.ts` includes comment routes.

### Frontend Tests

**Issue**: Comment thread not visible
- **Fix**: Check browser console for errors. Verify API endpoints are returning data.

**Issue**: "Post Comment" button always disabled
- **Fix**: Character count calculation may be incorrect. Check `RefundCommentThread.tsx` logic.

**Issue**: Internal comments visible to guests
- **Fix**: Backend filtering issue. Check `getRefundComments()` service method filters `is_internal: false` for non-admins.

**Issue**: Modal doesn't open
- **Fix**: Check `RefundActionModal` import in `RefundDetailPage.tsx`. Verify state management (`showActionModal`, `currentAction`).

---

## Success Criteria

✅ All database tests pass
✅ All API tests pass (100% success rate)
✅ Guests can comment on their refunds
✅ Admins can create internal and public comments
✅ 2000 character limit enforced (cannot submit more)
✅ Activity timeline shows unified view
✅ Status changes automatically logged
✅ Approve/reject modals work correctly
✅ Internal comments hidden from guests
✅ Comment count updates automatically

---

## Next Steps After Testing

If all tests pass:

1. **Deploy to staging environment**
2. **User acceptance testing (UAT)** with real users
3. **Monitor error logs** for edge cases
4. **Performance testing** (timeline with 100+ activities)
5. **Mobile responsive testing** (comment thread on small screens)

If tests fail:

1. **Review error messages** carefully
2. **Check migration 045** was applied correctly
3. **Verify all files** from Phases 1-12 were updated
4. **Check browser console** for frontend errors
5. **Review API responses** in Network tab

---

## Test Automation (Future Enhancement)

For continuous integration, consider:

- **Jest/Mocha** for backend unit tests
- **Cypress/Playwright** for frontend E2E tests
- **Supertest** for API endpoint testing
- **GitHub Actions** for CI/CD pipeline

---

## Contact

If you encounter issues not covered in this guide, check:

1. Implementation plan: `.claude/plans/floofy-weaving-fern.md`
2. Migration file: `backend/migrations/045_add_refund_comments_and_history.sql`
3. Service layer: `backend/src/services/refund.service.ts` (lines 986-1165)
4. Component code: `frontend/src/components/features/Refund/`

---

**Last Updated**: January 10, 2026
**Implemented Phases**: 1-12 ✅
**Testing Phases**: 13-15 (in progress)
