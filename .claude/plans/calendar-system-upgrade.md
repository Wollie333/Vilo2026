# Calendar System Production Upgrade - Comprehensive Plan

## Status: IN_PROGRESS
## Started: 2026-01-14
## Last Updated: 2026-01-14 (Session Start)
## Current Step: 1 of 64

---

## 🎯 Goal

Upgrade the booking calendar system to be fully integrated with the new booking management system features, including:
- New payment statuses (EFT verification, abandoned carts, partial refunds)
- Booking modification tracking (`pending_modification` status)
- Availability blocks and maintenance periods display
- EFT payment proof verification status indicators
- Refund information display
- Advanced filtering options (show/hide cancelled, blocks, maintenance)
- Enhanced quick view modal with all new metadata
- Performance optimizations for large properties

Make the calendar **production-ready** with world-class UX and visual polish.

---

## 📊 Context

### Current State
- **Location:** `frontend/src/pages/bookings/CalendarPage.tsx` (711 lines)
- **Backend API:** `backend/src/services/booking.service.ts::getCalendarEntries()` (lines 2204-2299)
- **Components:**
  - `BookingCalendar` - Main controller (376 lines)
  - `CalendarTimeline` - Gantt view (434 lines)
  - `CalendarMonth` - Month grid view (308 lines)
  - `BookingQuickViewModal` - Quick preview (359 lines)
  - `Calendar.types.ts` - Type definitions (189 lines)

### What Works Today
✅ Dual view system (Timeline + Month)
✅ Quick view modal with keyboard navigation
✅ Property filtering
✅ Block creation functionality
✅ Dark mode support
✅ Real-time data loading
✅ Today highlighting
✅ Responsive design

### Gaps Identified
❌ Missing `pending_modification` status support
❌ Missing new payment statuses: `verification_pending`, `failed_checkout`, `partially_refunded`
❌ No availability blocks display (only bookings shown)
❌ No EFT payment proof status indicators
❌ No refund information display
❌ No cancelled booking display option
❌ Limited filtering options
❌ Quick view modal doesn't show payment proof metadata

---

## 📋 Implementation Plan - 64 Steps Across 12 Phases

### Phase 1: Type System & Data Models (Foundation)

**Goal:** Update TypeScript interfaces to support all new features

#### Step 1: Update Calendar.types.ts with new booking/payment statuses ⏳
**File:** `frontend/src/components/features/Calendar/Calendar.types.ts`
**Changes:**
- Add `pending_modification` to BookingStatus color mappings
- Add `verification_pending`, `failed_checkout`, `partially_refunded` to payment status colors
- Document new status meanings in comments

#### Step 2: Add payment proof fields to CalendarEntry interface
**File:** `frontend/src/components/features/Calendar/Calendar.types.ts`
**Changes:**
```typescript
export interface CalendarEntry {
  // ... existing fields ...

  // Payment proof metadata (EFT verification)
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  payment_verified_at?: string | null;
  payment_verified_by?: string | null;
  payment_rejection_reason?: string | null;

  // Refund information
  refund_status?: 'none' | 'partial' | 'full';
  total_refunded?: number;

  // Modification tracking
  has_pending_modification?: boolean;
}
```

#### Step 3: Add color mappings for new statuses
**File:** `frontend/src/components/features/Calendar/Calendar.types.ts`
**Changes:**
```typescript
export const BOOKING_STATUS_CALENDAR_COLORS: Record<BookingStatus, string> = {
  // ... existing ...
  pending_modification: 'bg-purple-500', // New status
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  verification_pending: 'bg-orange-500',
  failed_checkout: 'bg-gray-400',
  partially_refunded: 'bg-purple-400',
  // ... existing ...
};
```

#### Step 4: Update BookingCalendarEntry type in backend
**File:** `backend/src/types/booking.types.ts`
**Changes:**
```typescript
export interface BookingCalendarEntry {
  // ... existing fields ...
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  payment_verified_at?: string | null;
  refund_status?: 'none' | 'partial' | 'full';
  total_refunded?: number;
  has_pending_modification?: boolean;
}
```

#### Step 5: Create CalendarFilter interface for show/hide options
**File:** `frontend/src/components/features/Calendar/Calendar.types.ts`
**Changes:**
```typescript
export interface CalendarFilterOptions {
  showCancelled: boolean;
  showBlocks: boolean;
  showMaintenance: boolean;
  highlightPaymentIssues: boolean;
  paymentStatusFilter: 'all' | 'verified' | 'pending' | 'failed';
}
```

---

### Phase 2: Backend API Enhancement (Data Layer)

**Goal:** Extend backend to return blocks, payment proof, and refund metadata

#### Step 6: Extend getCalendarEntries to query room_availability_blocks table
**File:** `backend/src/services/booking.service.ts`
**Location:** Line 2204 (getCalendarEntries function)
**Changes:**
- After fetching bookings, query `room_availability_blocks` table
- Filter blocks by date range and property
- Convert blocks to CalendarEntry format with `type: 'block'`

#### Step 7: Include payment proof metadata in bookings query
**File:** `backend/src/services/booking.service.ts`
**Changes:**
- Add payment proof fields to SELECT clause:
  ```sql
  payment_proof_url,
  payment_proof_uploaded_at,
  payment_verified_at,
  payment_verified_by,
  payment_rejection_reason
  ```

#### Step 8: Add query parameter to optionally include cancelled bookings
**File:** `backend/src/services/booking.service.ts` + `backend/src/controllers/booking.controller.ts`
**Changes:**
- Add `include_cancelled` query parameter (default: false)
- Conditionally apply `.neq('booking_status', 'cancelled')` filter

#### Step 9: Add maintenance period support (if maintenance_periods table exists)
**File:** `backend/src/services/booking.service.ts`
**Changes:**
- Check if `maintenance_periods` table exists in schema
- If yes, query and include as `type: 'maintenance'` entries
- If no, skip (future feature)

#### Step 10: Optimize query performance with proper joins
**File:** `backend/src/services/booking.service.ts`
**Changes:**
- Use single query with joins instead of separate queries
- Add indexes on date range columns (check if missing)
- Measure query performance with EXPLAIN

#### Step 11: Update backend controller route handler
**File:** `backend/src/controllers/booking.controller.ts`
**Changes:**
- Parse `include_cancelled` query param
- Pass to service function
- Add error handling for invalid params

#### Step 12: Add TypeScript types for enhanced response
**File:** `backend/src/types/booking.types.ts`
**Changes:**
- Ensure BookingCalendarEntry includes all new fields
- Export block-specific type if needed
- Update JSDoc comments

---

### Phase 3: Frontend Data Layer (Service Integration)

**Goal:** Update frontend service to handle new backend data

#### Step 13: Update booking.service.ts::getCalendarEntries
**File:** `frontend/src/services/booking.service.ts`
**Location:** Line 438 (getCalendarEntries function)
**Changes:**
- Add optional `includeCancelled` parameter
- Add to query string if true
- Update return type to include new fields

#### Step 14: Map blocks to CalendarEntry format (type: 'block')
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Location:** Data mapping section (lines 212-234)
**Changes:**
- Handle entries with `type: 'block'` from backend
- Set appropriate color and styling
- Include block_reason in entry

#### Step 15: Handle payment proof status in entry mapping
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Changes:**
- Map payment proof fields from API response
- Calculate verification status (pending/verified/rejected)
- Store in CalendarEntry

#### Step 16: Add filter parameters to API call
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Changes:**
- Add state for filter options
- Pass to API call when fetching entries
- Reload data when filters change

---

### Phase 4: Visual Enhancements - Color System

**Goal:** Update visual treatment for all statuses

#### Step 17: Update BOOKING_STATUS_CALENDAR_COLORS with pending_modification
**File:** `frontend/src/components/features/Calendar/Calendar.types.ts`
**Already covered in Step 3**

#### Step 18: Add payment status color overrides
**File:** `frontend/src/components/features/Calendar/Calendar.types.ts`
**Already covered in Step 3**

#### Step 19: Create payment proof status badge component
**File:** `frontend/src/components/ui/PaymentProofBadge/PaymentProofBadge.tsx` (NEW)
**Changes:**
```tsx
interface PaymentProofBadgeProps {
  status: 'pending' | 'verified' | 'rejected' | 'none';
  compact?: boolean;
}

export const PaymentProofBadge: React.FC<PaymentProofBadgeProps> = ({ status, compact }) => {
  // Badge with icon and label
  // Green checkmark for verified
  // Orange clock for pending
  // Red X for rejected
  // Gray for none
};
```

#### Step 20: Add cancelled booking visual treatment
**File:** `frontend/src/components/features/Calendar/CalendarTimeline.tsx` + `CalendarMonth.tsx`
**Changes:**
- Add opacity-50 class for cancelled bookings
- Add strikethrough for guest name
- Optional: different border style (dashed)

---

### Phase 5: Calendar Timeline View Upgrades

**Goal:** Enhance timeline (Gantt) view with new indicators

#### Step 21: Add payment verification indicator badge overlay
**File:** `frontend/src/components/features/Calendar/CalendarTimeline.tsx`
**Location:** Entry bar rendering (approx line 200-250)
**Changes:**
- Add small badge overlay in top-right corner of bar
- Show orange clock icon if `verification_pending`
- Show green check if verified and `payment_proof_url` exists

#### Step 22: Add pending modification icon indicator
**File:** `frontend/src/components/features/Calendar/CalendarTimeline.tsx`
**Changes:**
- Add purple wrench/edit icon if `has_pending_modification === true`
- Position in top-left corner of bar
- Tooltip: "Modification pending guest approval"

#### Step 23: Update tooltip to show payment proof status
**File:** `frontend/src/components/features/Calendar/CalendarTimeline.tsx`
**Location:** Tooltip rendering (approx line 180-200)
**Changes:**
- Add payment proof section if uploaded
- Show: "Payment Proof: Uploaded {timestamp} - Status: {status}"
- Show rejection reason if rejected

#### Step 24: Add block entries display with distinct styling
**File:** `frontend/src/components/features/Calendar/CalendarTimeline.tsx`
**Changes:**
- Render entries with `type: 'block'` as gray bars
- Diagonal stripe pattern (CSS background-image)
- Tooltip shows: "Blocked: {reason}"
- No guest name shown

#### Step 25: Implement cancelled booking display (semi-transparent)
**File:** `frontend/src/components/features/Calendar/CalendarTimeline.tsx`
**Changes:**
- If entry.booking_status === 'cancelled', apply:
  - `opacity-50`
  - `line-through` on text
  - Tooltip prefix: "CANCELLED - "

---

### Phase 6: Calendar Month View Upgrades

**Goal:** Enhance month grid view with new indicators

#### Step 26: Add payment status indicator dots on month view entries
**File:** `frontend/src/components/features/Calendar/CalendarMonth.tsx`
**Location:** Entry badge rendering (approx line 150-200)
**Changes:**
- Add small colored dot before entry text
- Orange dot if `verification_pending`
- Red dot if `failed` or `failed_checkout`
- Green dot if `paid` and verified

#### Step 27: Update entry badge colors based on payment verification status
**File:** `frontend/src/components/features/Calendar/CalendarMonth.tsx`
**Changes:**
- Override badge background color for payment issues
- Orange badge for verification_pending
- Gray badge for failed_checkout

#### Step 28: Add block badges to month view
**File:** `frontend/src/components/features/Calendar/CalendarMonth.tsx`
**Changes:**
- Render block entries as gray badges
- Icon: 🚫 or block icon
- Label: "Blocked" or reason (truncated)

#### Step 29: Show cancelled bookings with distinct style
**File:** `frontend/src/components/features/Calendar/CalendarMonth.tsx`
**Changes:**
- Faded badge (opacity-50)
- Strikethrough text
- Optional: dashed border

---

### Phase 7: Quick View Modal Enhancement

**Goal:** Display all new metadata in booking preview

#### Step 30: Add payment proof status section to modal
**File:** `frontend/src/components/features/Calendar/BookingQuickViewModal.tsx`
**Location:** After payment status badge (approx line 200)
**Changes:**
```tsx
{entry.payment_proof_url && (
  <div className="payment-proof-section">
    <PaymentProofBadge status={getProofStatus(entry)} />
    <span>Uploaded {formatDate(entry.payment_proof_uploaded_at)}</span>
    {entry.payment_verified_at && (
      <span>Verified {formatDate(entry.payment_verified_at)}</span>
    )}
  </div>
)}
```

#### Step 31: Display upload timestamp and verification status
**File:** `frontend/src/components/features/Calendar/BookingQuickViewModal.tsx`
**Already covered in Step 30**

#### Step 32: Show modification pending indicator with details
**File:** `frontend/src/components/features/Calendar/BookingQuickViewModal.tsx`
**Changes:**
- Add banner at top if `has_pending_modification === true`
- Purple background
- Icon: ⚠️ or edit icon
- Text: "This booking has changes pending guest approval"

#### Step 33: Add refund information display
**File:** `frontend/src/components/features/Calendar/BookingQuickViewModal.tsx`
**Changes:**
```tsx
{entry.refund_status !== 'none' && (
  <div className="refund-section">
    <Badge variant={entry.refund_status === 'full' ? 'purple' : 'orange'}>
      {entry.refund_status === 'full' ? 'Fully Refunded' : 'Partially Refunded'}
    </Badge>
    <span className="text-sm">
      {formatCurrency(entry.total_refunded)} refunded
    </span>
  </div>
)}
```

#### Step 34: Add "View Payment Proof" link (if uploaded)
**File:** `frontend/src/components/features/Calendar/BookingQuickViewModal.tsx`
**Changes:**
- Add link/button if `payment_proof_url` exists
- Opens proof in new tab or lightbox
- Label: "View Payment Proof →"

#### Step 35: Add "Verify Payment" button for hosts (if verification_pending)
**File:** `frontend/src/components/features/Calendar/BookingQuickViewModal.tsx`
**Changes:**
- Show button if `payment_status === 'verification_pending'`
- On click: navigate to booking detail page's verification section
- Label: "Verify Payment →"
- Primary button style

---

### Phase 8: Filtering & Options (User Controls)

**Goal:** Give users control over what's displayed

#### Step 36: Add filter state management to CalendarPage
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Changes:**
```typescript
const [filterOptions, setFilterOptions] = useState<CalendarFilterOptions>({
  showCancelled: false,
  showBlocks: true,
  showMaintenance: true,
  highlightPaymentIssues: true,
  paymentStatusFilter: 'all',
});
```

#### Step 37: Create filter UI component
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Location:** Inside filters card (after property selector)
**Changes:**
```tsx
<div className="filter-options">
  <Checkbox
    label="Show Cancelled"
    checked={filterOptions.showCancelled}
    onChange={(e) => setFilterOptions({ ...filterOptions, showCancelled: e.target.checked })}
  />
  <Checkbox label="Show Blocks" ... />
  <Checkbox label="Show Maintenance" ... />
  <Checkbox label="Highlight Payment Issues" ... />
  <Select
    label="Payment Status"
    value={filterOptions.paymentStatusFilter}
    options={['all', 'verified', 'pending', 'failed']}
    onChange={...}
  />
</div>
```

#### Step 38: Implement client-side filtering logic
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Changes:**
```typescript
const filteredEntries = useMemo(() => {
  return entries.filter(entry => {
    if (!filterOptions.showCancelled && entry.booking_status === 'cancelled') return false;
    if (!filterOptions.showBlocks && entry.type === 'block') return false;
    if (!filterOptions.showMaintenance && entry.type === 'maintenance') return false;

    if (filterOptions.paymentStatusFilter !== 'all') {
      // Apply payment status filter
    }

    return true;
  });
}, [entries, filterOptions]);
```

#### Step 39: Add payment status filtering
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Already covered in Step 38**

#### Step 40: Update legend to include new statuses
**File:** `frontend/src/components/features/Calendar/BookingCalendar.tsx`
**Location:** Legend section (approx line 200-250)
**Changes:**
- Add `pending_modification` to legend
- Add `verification_pending` payment status
- Add block/maintenance indicators
- Color-coded dots matching calendar

#### Step 41: Persist filter preferences to localStorage
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Changes:**
```typescript
useEffect(() => {
  localStorage.setItem('calendar-filter-options', JSON.stringify(filterOptions));
}, [filterOptions]);

// On mount:
const savedFilters = localStorage.getItem('calendar-filter-options');
if (savedFilters) {
  setFilterOptions(JSON.parse(savedFilters));
}
```

---

### Phase 9: Calendar Settings (Preferences)

**Goal:** User customization options

#### Step 42: Add calendar display settings dropdown
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Location:** Header actions area (near Settings button)
**Changes:**
- Expand existing settings dropdown
- Add new options section

#### Step 43: Option: "Show cancelled bookings" toggle
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Already covered in Step 37 (filters)**

#### Step 44: Option: "Show availability blocks" toggle
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Already covered in Step 37 (filters)**

#### Step 45: Option: "Highlight payment issues" toggle
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Changes:**
- When enabled, add pulsing border to entries with:
  - `verification_pending`
  - `failed_checkout`
  - Payment overdue

#### Step 46: Save preferences to localStorage
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Already covered in Step 41**

---

### Phase 10: Performance Optimization

**Goal:** Ensure calendar scales to large properties

#### Step 47: Add debouncing to date range changes
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Changes:**
```typescript
import { debounce } from 'lodash';

const debouncedFetchEntries = useMemo(
  () => debounce((propertyId, startDate, endDate) => {
    // Fetch calendar entries
  }, 300),
  []
);
```

#### Step 48: Implement virtual scrolling for timeline (if needed)
**File:** `frontend/src/components/features/Calendar/CalendarTimeline.tsx`
**Changes:**
- Only if property has 50+ rooms
- Use `react-window` or similar
- Render only visible room rows
- Measure performance improvement

#### Step 49: Add loading skeletons for calendar cells
**File:** `frontend/src/components/features/Calendar/CalendarTimeline.tsx` + `CalendarMonth.tsx`
**Changes:**
- Create skeleton loader component
- Show while `isLoading === true`
- Animated pulse effect
- Match calendar structure

#### Step 50: Optimize re-renders with React.memo
**File:** Multiple calendar components
**Changes:**
- Wrap `CalendarTimeline`, `CalendarMonth` with `React.memo`
- Memoize expensive calculations with `useMemo`
- Memoize callbacks with `useCallback`
- Profile with React DevTools

---

### Phase 11: Testing & Validation (Quality Assurance)

**Goal:** Ensure production-ready quality

#### Step 51: Test with bookings in all new statuses
**Test Cases:**
- Create test booking with `pending_modification` status
- Create test booking with `verification_pending` payment status
- Create test booking with `failed_checkout` status
- Create test booking with `partially_refunded` status
- Verify calendar displays each correctly

#### Step 52: Test with EFT payment proof uploads
**Test Cases:**
- Upload payment proof for booking
- Verify orange indicator appears in timeline
- Verify "Payment Proof: Pending" shows in quick view
- Approve payment proof
- Verify indicator changes to green

#### Step 53: Test with pending modifications
**Test Cases:**
- Modify booking dates (triggers pending_modification)
- Verify purple wrench icon appears
- Verify banner shows in quick view modal
- Guest approves modification
- Verify indicator disappears

#### Step 54: Test block creation and display
**Test Cases:**
- Create availability block via calendar click
- Verify gray bar appears in timeline
- Verify gray badge appears in month view
- Verify block reason shows in tooltip
- Delete block and verify removal

#### Step 55: Test filter combinations
**Test Cases:**
- Toggle "Show Cancelled" on/off - verify bookings appear/disappear
- Toggle "Show Blocks" on/off
- Change payment status filter to "pending" - verify only pending shown
- Combine multiple filters
- Verify localStorage persistence

#### Step 56: Test quick view modal with all new fields
**Test Cases:**
- Open quick view for booking with payment proof
- Verify payment proof section displays
- Open quick view for booking with refund
- Verify refund section displays
- Test "View Payment Proof" link
- Test "Verify Payment" button

#### Step 57: Test dark mode appearance
**Test Cases:**
- Switch to dark mode
- Verify all colors are visible and readable
- Check badge contrast
- Check tooltip readability
- Check modal appearance

#### Step 58: Test mobile responsiveness
**Test Cases:**
- Test on iPhone SE (375px width)
- Test on iPad (768px width)
- Verify timeline horizontal scroll works
- Verify month view grid doesn't break
- Verify quick view modal is readable

#### Step 59: Test performance with 100+ bookings
**Test Cases:**
- Load property with 100+ bookings in date range
- Measure initial render time (should be < 2 seconds)
- Measure filter change response (should be < 300ms)
- Check for memory leaks with React DevTools Profiler
- Verify smooth scrolling in timeline

---

### Phase 12: Documentation & Polish (Final Touches)

**Goal:** Professional finish and maintainability

#### Step 60: Update calendar component documentation
**File:** `frontend/src/components/features/Calendar/README.md` (NEW)
**Changes:**
```markdown
# Calendar Component Documentation

## Overview
The booking calendar provides timeline and month views...

## Components
- BookingCalendar - Main controller
- CalendarTimeline - Gantt-style view
- CalendarMonth - Month grid view
- BookingQuickViewModal - Quick preview

## New Features (2026-01-14)
- EFT payment verification indicators
- Pending modification tracking
- Availability blocks display
- Advanced filtering options
- Refund information display

## Usage
...
```

#### Step 61: Add JSDoc comments to new functions
**Files:** All modified files
**Changes:**
- Add JSDoc to all new functions
- Document parameters and return types
- Add examples where helpful
- Document complex logic

#### Step 62: Create visual legend guide in calendar
**File:** `frontend/src/components/features/Calendar/BookingCalendar.tsx`
**Changes:**
- Expand legend section
- Add icon examples for each indicator
- Add descriptive text
- Make collapsible (expandable help section)

#### Step 63: Add error handling for failed API calls
**Files:** `frontend/src/pages/bookings/CalendarPage.tsx`, `frontend/src/services/booking.service.ts`
**Changes:**
- Try-catch blocks around API calls
- Display user-friendly error messages
- Add retry mechanism for failed loads
- Log errors to console for debugging

#### Step 64: Add empty state messages
**File:** `frontend/src/pages/bookings/CalendarPage.tsx`
**Changes:**
```tsx
{filteredEntries.length === 0 && !isLoading && (
  <Card>
    <Card.Body className="py-12 text-center">
      <CalendarIcon className="mx-auto text-gray-400" />
      <p className="mt-2 text-gray-500">
        No bookings found for this period.
      </p>
      <Button variant="primary" onClick={() => navigate('/bookings/new')}>
        Create New Booking
      </Button>
    </Card.Body>
  </Card>
)}
```

---

## 📊 Progress Tracking

### Phase Status
- ✅ Phase 1: 0/5 steps complete (0%)
- ⏳ Phase 2: 0/7 steps complete (0%)
- ⏳ Phase 3: 0/4 steps complete (0%)
- ⏳ Phase 4: 0/4 steps complete (0%)
- ⏳ Phase 5: 0/5 steps complete (0%)
- ⏳ Phase 6: 0/4 steps complete (0%)
- ⏳ Phase 7: 0/6 steps complete (0%)
- ⏳ Phase 8: 0/6 steps complete (0%)
- ⏳ Phase 9: 0/5 steps complete (0%)
- ⏳ Phase 10: 0/4 steps complete (0%)
- ⏳ Phase 11: 0/9 steps complete (0%)
- ⏳ Phase 12: 0/5 steps complete (0%)

**Overall Progress: 0/64 steps (0%)**

---

## 📝 Progress Log

### 2026-01-14 - Session Start
- ✅ Created comprehensive 64-step plan across 12 phases
- ✅ Analyzed current calendar implementation (2,404 lines of code)
- ✅ Identified gaps with new booking management features
- ✅ Designed upgrade architecture (types → backend → frontend → visuals → features → testing)
- 🎯 **Next:** Begin Phase 1, Step 1 - Update Calendar.types.ts

---

## 🗂️ Files to Create

### Backend
None (all backend files already exist, will modify)

### Frontend - New Components
1. `frontend/src/components/ui/PaymentProofBadge/PaymentProofBadge.tsx`
2. `frontend/src/components/ui/PaymentProofBadge/PaymentProofBadge.types.ts`
3. `frontend/src/components/ui/PaymentProofBadge/index.ts`

### Documentation
1. `frontend/src/components/features/Calendar/README.md`

**Total New Files: 4**

---

## 📄 Files to Modify

### Backend (7 files)
1. `backend/src/services/booking.service.ts` - Extend getCalendarEntries
2. `backend/src/controllers/booking.controller.ts` - Add query param handling
3. `backend/src/types/booking.types.ts` - Update BookingCalendarEntry interface
4. `backend/src/routes/booking.routes.ts` - Update route documentation

### Frontend - Types (2 files)
5. `frontend/src/components/features/Calendar/Calendar.types.ts` - Add new fields and colors
6. `frontend/src/types/booking.types.ts` - Sync with backend types

### Frontend - Services (1 file)
7. `frontend/src/services/booking.service.ts` - Add filter parameters

### Frontend - Components (5 files)
8. `frontend/src/pages/bookings/CalendarPage.tsx` - Add filters, settings, enhanced data mapping
9. `frontend/src/components/features/Calendar/BookingCalendar.tsx` - Update legend
10. `frontend/src/components/features/Calendar/CalendarTimeline.tsx` - Add indicators, blocks
11. `frontend/src/components/features/Calendar/CalendarMonth.tsx` - Add indicators, blocks
12. `frontend/src/components/features/Calendar/BookingQuickViewModal.tsx` - Add payment proof, refund sections

**Total Modified Files: 12**

---

## 🎯 Success Criteria

### Functional Requirements
✅ All new booking/payment statuses display correctly
✅ Availability blocks appear on calendar
✅ EFT payment proof status visible at a glance
✅ Pending modifications clearly indicated
✅ Refund information accessible from calendar
✅ Filters work and persist preferences
✅ Quick view modal shows all relevant metadata

### Performance Requirements
✅ Calendar loads in < 2 seconds (100 bookings)
✅ Filter changes apply in < 300ms
✅ No memory leaks (tested with DevTools)
✅ Smooth scrolling in timeline view
✅ Responsive on all device sizes

### UX Requirements
✅ Visual indicators are intuitive (icons + colors)
✅ Tooltips provide context
✅ Dark mode looks polished
✅ Error messages are user-friendly
✅ Empty states guide users to actions
✅ Legend explains all indicators

### Code Quality Requirements
✅ TypeScript strict mode passes
✅ All functions have JSDoc comments
✅ Components use React.memo where appropriate
✅ No prop drilling (use context if needed)
✅ Follows CLAUDE.md conventions

---

## 🚀 Implementation Strategy

### Day 1: Foundation (Phases 1-2)
- Complete type system updates
- Enhance backend API
- Test backend with Postman/REST client

### Day 2: Data & Visuals (Phases 3-4)
- Update frontend data layer
- Implement color system
- Create PaymentProofBadge component

### Day 3: Timeline & Month Views (Phases 5-6)
- Add indicators to timeline
- Add indicators to month view
- Test visual appearance

### Day 4: Modal & Filters (Phases 7-8)
- Enhance quick view modal
- Implement filtering system
- Test user interactions

### Day 5: Settings & Performance (Phases 9-10)
- Add calendar settings
- Optimize performance
- Profile with DevTools

### Day 6: Testing & Polish (Phases 11-12)
- Execute all test cases
- Fix bugs found
- Add documentation
- Final polish

**Estimated Total Time: 6 days**

---

## 📋 Notes for Resume

If session disconnects, resume from:
- **Current Phase:** Phase 1 (Type System & Data Models)
- **Current Step:** Step 1 (Update Calendar.types.ts)
- **Next Action:** Add new booking status colors to Calendar.types.ts

All steps are documented with file locations and specific code changes. The plan is self-contained and can be resumed at any point.

---

## 🎉 End Goal

A production-ready calendar that:
- Displays ALL booking information (including new statuses)
- Provides visual indicators for payment issues
- Shows availability blocks and maintenance periods
- Offers powerful filtering options
- Delivers world-class UX
- Performs smoothly with large datasets
- Is fully documented and maintainable

**Let's build this! 🚀**
