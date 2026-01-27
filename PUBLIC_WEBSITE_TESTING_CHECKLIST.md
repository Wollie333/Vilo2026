# Public Website Template - Testing Checklist

## Overview
This checklist ensures all features of the refined public website template work correctly across all pages and devices.

**Last Updated**: 2026-01-18
**Testing Scope**: Contact, Blog Archive, Room Detail, Booking Checkout, and all supporting pages

---

## Pre-Testing Setup

- [ ] Create a test property with website template enabled
- [ ] Add at least 3 rooms with different configurations
- [ ] Add featured images to property and rooms
- [ ] Create 5-10 blog posts (some published, some draft)
- [ ] Create at least 2 blog categories
- [ ] Configure property contact info (phone, email, address)
- [ ] Set custom primary color in theme settings
- [ ] Upload property logo

---

## Phase 1: Icon System

### Visual Consistency
- [ ] All icons use Lucide Icons library
- [ ] Icon sizes are consistent within each context
- [ ] Icons match the professional/luxury aesthetic
- [ ] No emoji or mismatched icon styles remain
- [ ] Icon colors adapt to theme (primary color)

### Pages to Check
- [ ] Contact page (Phone, Mail, MapPin, Send icons)
- [ ] Blog archive (Calendar, Clock, User, Tag, ArrowRight icons)
- [ ] Blog post detail page
- [ ] Room detail page (Users, Maximize2, Bed icons)
- [ ] Room amenities (20+ category-specific icons)
- [ ] Room gallery lightbox (X, ChevronLeft, ChevronRight, ZoomIn)

---

## Phase 2: Contact Page

### Layout & Design
- [ ] Full-width hero section displays correctly
- [ ] Background image loads (or fallback gradient shows)
- [ ] Dark overlay is visible and text remains readable
- [ ] Form overlay has glassmorphism effect (backdrop blur)
- [ ] Two-column layout on desktop (contact info + form)
- [ ] Single column on mobile with proper stacking

### Contact Information Cards
- [ ] Phone card displays and is clickable (tel: link)
- [ ] Email card displays and is clickable (mailto: link)
- [ ] Address card displays full address
- [ ] Icon backgrounds use theme primary color
- [ ] Cards are readable with backdrop blur

### Contact Form
- [ ] All fields render correctly (Name, Email, Phone, Message)
- [ ] Validation works (required fields show errors)
- [ ] Email validation checks format
- [ ] Message minimum length validation (10 chars)
- [ ] Success message displays after submission
- [ ] Error message displays on failure
- [ ] Form clears after successful submission
- [ ] Loading state shows during submission
- [ ] Submit button disabled while submitting

### Responsive Design
- [ ] Mobile (320px, 375px, 414px) - form overlay works
- [ ] Tablet (768px, 1024px) - layout transitions properly
- [ ] Desktop (1280px+) - full two-column layout
- [ ] Background image scales correctly on all sizes
- [ ] Touch targets are at least 44x44px

### Dark Mode
- [ ] Form background adapts (dark:bg-gray-900/95)
- [ ] Input fields readable in dark mode
- [ ] Labels and text have proper contrast
- [ ] Success/error messages readable

---

## Phase 3: Blog Archive Page

### Layout & Design
- [ ] Page header displays "Blog" title
- [ ] Category filter pills appear if categories exist
- [ ] Featured post section shows (large card, first post only)
- [ ] Regular posts display in 3-column grid
- [ ] Empty state shows if no posts exist

### Featured Post (Main Blog Page Only)
- [ ] Featured post is first post in database
- [ ] Large two-column layout (image + content)
- [ ] "Featured" badge displays with theme color
- [ ] Category name displays
- [ ] Author name displays
- [ ] Published date formatted correctly
- [ ] Read time calculated and displayed
- [ ] Image hover zoom effect works
- [ ] "Read Full Article" link with arrow animates
- [ ] Click navigates to post detail

### Regular Post Cards
- [ ] 3-column grid on desktop, 2-column on tablet, 1-column on mobile
- [ ] Featured image displays with proper aspect ratio (16:10)
- [ ] Category badge on image (top-left)
- [ ] Published date and read time in metadata
- [ ] Title displays (max 2-3 lines before truncating)
- [ ] Excerpt shows with line-clamp-3
- [ ] "Read More" link with animated arrow
- [ ] Card hover effects work (lift, image zoom)
- [ ] Click navigates to post detail

### Category Filtering
- [ ] "All Posts" pill displays
- [ ] Category pills display for each category
- [ ] Category pills use theme primary color background
- [ ] Active category highlighted
- [ ] Clicking category filters posts
- [ ] URL updates with category slug
- [ ] Back to "All Posts" works

### Read Time Calculation
- [ ] Read time displays (e.g., "5 min read")
- [ ] Calculation is accurate (200 words per minute)
- [ ] Shows minimum 1 minute for short posts

### Responsive Design
- [ ] Featured post stacks on mobile
- [ ] Grid adapts (3 → 2 → 1 columns)
- [ ] Cards remain readable at all sizes
- [ ] Touch targets adequate on mobile

### Dark Mode
- [ ] All text readable
- [ ] Card backgrounds adapt
- [ ] Hover states work in dark mode
- [ ] Category badges maintain contrast

---

## Phase 4: Room Detail Page

### Breadcrumbs
- [ ] Breadcrumb navigation displays
- [ ] Links work (Home → Accommodation → Room Name)
- [ ] Current page shows as bold
- [ ] Uses design system styling

### Room Gallery
- [ ] Featured image + gallery images display
- [ ] Thumbnail navigation shows below main image
- [ ] Click thumbnail changes main image
- [ ] Lightbox opens on image click
- [ ] Lightbox navigation works (prev/next arrows)
- [ ] Lightbox close button works (X icon)
- [ ] Keyboard navigation in lightbox (arrow keys, escape)
- [ ] Swipe gestures work on mobile
- [ ] Zoom indicator visible

### Room Header
- [ ] Room name displays as h1
- [ ] Max occupancy shows with icon
- [ ] Room size displays (if provided)
- [ ] Icons use consistent size

### Room Description
- [ ] "About This Room" section displays
- [ ] Description text preserves line breaks (whitespace-pre-line)
- [ ] Typography follows design system

### Bed Configuration
- [ ] Section displays if beds exist
- [ ] Each bed type listed with quantity
- [ ] Bed icons display with theme-colored background
- [ ] Grid layout (2 columns)
- [ ] Cards styled consistently

### Room Amenities (Grouped by Category)
- [ ] Amenities display in categorized groups
- [ ] 9 categories shown (Bedroom, Bathroom, Kitchen, etc.)
- [ ] Each amenity has appropriate icon
- [ ] Icons match amenity type
- [ ] Grid layout responsive
- [ ] Empty categories hidden

### Optional Add-ons
- [ ] Section displays if add-ons exist
- [ ] Add-on name and price shown
- [ ] Cards styled consistently
- [ ] Prices formatted correctly ($X.XX)

### Advanced Booking Widget (Right Column, Sticky)
- [ ] Widget displays in right column
- [ ] Widget becomes sticky on scroll
- [ ] Base price displays prominently
- [ ] Check-in date picker works
- [ ] Check-out date picker works
- [ ] Date validation (check-out > check-in)
- [ ] Minimum nights validation displays
- [ ] Adult count selector works (1 to max_occupancy)
- [ ] Children count selector works (0 to max_children)
- [ ] Guest count validation enforced
- [ ] Total price calculated correctly
- [ ] Tax calculation shown in breakdown
- [ ] "Reserve Now" button enabled when valid
- [ ] Button disabled when dates incomplete
- [ ] Theme primary color applied to button

### Related Rooms CTA
- [ ] "Explore More Rooms" section at bottom
- [ ] "View All Rooms" button styled with theme color
- [ ] Button links to /accommodation
- [ ] Section uses design system spacing

### Responsive Design
- [ ] Two-column layout on desktop (2/3 + 1/3)
- [ ] Single column on mobile (content → widget)
- [ ] Gallery images scale properly
- [ ] Amenity grid adapts to screen size
- [ ] Booking widget readable on mobile
- [ ] Touch targets adequate (44x44px minimum)

### Dark Mode
- [ ] All sections readable
- [ ] Cards have proper backgrounds
- [ ] Amenity icons visible
- [ ] Booking widget adapts
- [ ] Contrast maintained

---

## Phase 5: Template-Branded Booking Checkout

### Checkout Page Access
- [ ] Clicking "Reserve Now" navigates to /reserve
- [ ] URL contains correct parameters (room, checkIn, checkOut, adults, children)
- [ ] Checkout page loads with template branding

### Checkout Header
- [ ] Minimal branded header displays
- [ ] Property logo shows (or property name)
- [ ] Phone contact displays
- [ ] Close button works (returns to room page)
- [ ] Header uses theme primary color

### Progress Indicator
- [ ] Progress bar shows at top
- [ ] Current step highlighted
- [ ] Progress percentage updates
- [ ] Step numbers/labels display

### Pre-filled Data
- [ ] Room pre-selected from URL param
- [ ] Check-in date pre-filled
- [ ] Check-out date pre-filled
- [ ] Adult count pre-filled
- [ ] Children count pre-filled

### Checkout Steps
**Step 1: Date/Room Selection**
- [ ] Room displays with details
- [ ] Dates can be modified
- [ ] Room can be changed (if needed)
- [ ] "Continue" button advances

**Step 2: Add-ons (if available)**
- [ ] Property add-ons display
- [ ] Add-on selection updates total
- [ ] Quantities can be adjusted
- [ ] Skip button available

**Step 3: Guest Details + Payment**
- [ ] Guest info form displays
- [ ] Payment method selector shows
- [ ] Validation works
- [ ] Terms checkbox required

**Step 4: Confirmation**
- [ ] Booking reference displays
- [ ] Booking details summary shown
- [ ] Confirmation message clear
- [ ] Return to website button works

### Template Branding Applied
- [ ] Primary color used throughout
- [ ] Theme fonts applied (heading + body)
- [ ] Logo displays in header
- [ ] Buttons match template style
- [ ] Pricing summary uses theme colors

### Responsive Design
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1280px+)
- [ ] Form fields readable
- [ ] Touch targets adequate

### Dark Mode
- [ ] Checkout respects dark mode
- [ ] All steps readable
- [ ] Form fields visible
- [ ] Contrast maintained

---

## Phase 6: Consistency & Polish

### Typography Consistency
- [ ] All h1 tags use `ds.typography.pageTitle`
- [ ] All h2 tags use `ds.typography.sectionTitle`
- [ ] All h3 tags use `ds.typography.cardTitle`
- [ ] Body text uses `ds.colors.body`
- [ ] Headings use `ds.colors.heading`
- [ ] Muted text uses `ds.colors.muted`

### Spacing Consistency
- [ ] All sections use `ds.spacing.sectionY` (vertical)
- [ ] All sections use `ds.spacing.sectionX` (horizontal)
- [ ] All pages use `ds.spacing.containerMax`
- [ ] Card padding consistent
- [ ] Element gaps consistent

### Border Radius Consistency
- [ ] Cards use `ds.radius.card`
- [ ] Buttons use `ds.radius.button`
- [ ] Inputs use `ds.radius.input`
- [ ] Badges use `ds.radius.badge`
- [ ] Images use `ds.radius.image`

### Shadow Consistency
- [ ] Cards use `ds.shadows.card`
- [ ] Hover effects use `ds.shadows.cardHover`
- [ ] Buttons use `ds.shadows.button`

### Transition Consistency
- [ ] All hover effects use `ds.transitions.default`
- [ ] Animations smooth and professional
- [ ] No jarring or slow transitions

### Responsive Design (All Pages)
**Mobile (320px)**
- [ ] Contact page
- [ ] Blog archive
- [ ] Blog post
- [ ] Room detail
- [ ] Booking checkout
- [ ] About page
- [ ] Accommodation page
- [ ] Home page

**Mobile (375px - iPhone)**
- [ ] Contact page
- [ ] Blog archive
- [ ] Blog post
- [ ] Room detail
- [ ] Booking checkout

**Mobile (414px - Large Phone)**
- [ ] Contact page
- [ ] Blog archive
- [ ] Blog post
- [ ] Room detail
- [ ] Booking checkout

**Tablet (768px - iPad)**
- [ ] Contact page
- [ ] Blog archive (2-column grid)
- [ ] Blog post
- [ ] Room detail (still stacked)
- [ ] Booking checkout

**Tablet (1024px - iPad Pro)**
- [ ] Contact page (2-column)
- [ ] Blog archive (3-column grid)
- [ ] Blog post
- [ ] Room detail (2-column layout)
- [ ] Booking checkout

**Desktop (1280px+)**
- [ ] Contact page
- [ ] Blog archive
- [ ] Blog post
- [ ] Room detail
- [ ] Booking checkout

---

## Accessibility (WCAG AA Compliance)

### Heading Hierarchy
- [ ] Each page has exactly one h1
- [ ] Heading levels don't skip (h1 → h2 → h3, not h1 → h3)
- [ ] Headings are semantic and descriptive

### Keyboard Navigation
- [ ] All interactive elements focusable with Tab
- [ ] Focus order is logical
- [ ] Focus indicators visible (focus ring)
- [ ] Escape key works in lightbox/modals
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in gallery/carousel

### Focus States
- [ ] All buttons have visible focus state
- [ ] All links have visible focus state
- [ ] All form inputs have visible focus state
- [ ] Focus ring uses theme primary color
- [ ] Focus ring has 2px width minimum

### Touch Targets (Mobile)
- [ ] All buttons at least 44x44px
- [ ] All links at least 44x44px
- [ ] Form inputs tall enough (min 44px)
- [ ] Icon buttons meet minimum size

### Color Contrast (WCAG AA)
- [ ] Body text on white: minimum 4.5:1 ratio
- [ ] Headings on white: minimum 4.5:1 ratio
- [ ] Links on white: minimum 4.5:1 ratio
- [ ] Button text on primary: minimum 4.5:1 ratio
- [ ] Muted text: minimum 4.5:1 ratio
- [ ] Dark mode: all ratios maintained

### ARIA Labels
- [ ] Image alt text descriptive
- [ ] Icon buttons have aria-label
- [ ] Form inputs have labels (or aria-label)
- [ ] Navigation landmarks present
- [ ] Skip to content link available (if applicable)

### Screen Reader Testing
- [ ] Page title announced correctly
- [ ] Headings navigable
- [ ] Links descriptive (not "click here")
- [ ] Form errors announced
- [ ] Loading states announced
- [ ] Success messages announced

---

## Dark Mode Consistency

### All Pages in Dark Mode
- [ ] Contact page
- [ ] Blog archive
- [ ] Blog post
- [ ] Room detail
- [ ] Booking checkout
- [ ] About page
- [ ] Accommodation page
- [ ] Home page
- [ ] Generic custom pages

### Dark Mode Elements
- [ ] Backgrounds use `dark:bg-dark-bg`
- [ ] Alternate backgrounds use `dark:bg-dark-bg-secondary`
- [ ] Text uses `dark:text-dark-text`
- [ ] Secondary text uses `dark:text-dark-text-secondary`
- [ ] Borders use `dark:border-dark-border`
- [ ] Cards have dark backgrounds
- [ ] Form inputs readable
- [ ] Prose content uses `dark:prose-invert`

### Dark Mode Contrast
- [ ] All text readable
- [ ] Icons visible
- [ ] Buttons have proper contrast
- [ ] Focus states visible
- [ ] Hover states work

---

## Performance

### Image Optimization
- [ ] Featured images load without layout shift
- [ ] Gallery images lazy loaded
- [ ] Responsive images used (if available)
- [ ] Images have proper width/height attributes

### Loading States
- [ ] Loading spinner shows while fetching data
- [ ] Skeleton screens used (if applicable)
- [ ] No flash of unstyled content (FOUC)

### Page Load Speed
- [ ] Contact page loads in < 2s
- [ ] Blog archive loads in < 2s
- [ ] Room detail loads in < 2s
- [ ] Checkout loads in < 2s

---

## Cross-Browser Testing

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] Styles render correctly
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Styles render correctly
- [ ] No console errors

### Safari (macOS/iOS)
- [ ] All features work
- [ ] Backdrop blur works (glassmorphism)
- [ ] Styles render correctly
- [ ] No console errors

---

## Integration Testing

### End-to-End User Flows

**Flow 1: Guest Discovers Room and Books**
1. [ ] Land on home page
2. [ ] Click "Accommodation" or "View Rooms"
3. [ ] Browse room list
4. [ ] Click specific room card
5. [ ] View room details and gallery
6. [ ] Select dates in booking widget
7. [ ] Enter guest count
8. [ ] Click "Reserve Now"
9. [ ] Complete checkout flow
10. [ ] Receive confirmation

**Flow 2: Guest Contacts Property**
1. [ ] Navigate to Contact page
2. [ ] Fill out contact form
3. [ ] Submit form
4. [ ] See success message
5. [ ] Click phone or email link

**Flow 3: Guest Reads Blog**
1. [ ] Navigate to Blog page
2. [ ] See featured post and grid
3. [ ] Click category filter
4. [ ] See filtered posts
5. [ ] Click post to read
6. [ ] Navigate back to blog
7. [ ] Click "All Posts" to clear filter

**Flow 4: Mobile Guest Books Room**
1. [ ] Land on home page (mobile)
2. [ ] Navigate to accommodation
3. [ ] Tap room card
4. [ ] Scroll through gallery (swipe)
5. [ ] Scroll to booking widget
6. [ ] Select dates (mobile date picker)
7. [ ] Adjust guest count
8. [ ] Tap "Reserve Now"
9. [ ] Complete mobile checkout
10. [ ] Receive confirmation

---

## Bug Tracking

### Known Issues
List any issues discovered during testing:

1. **Issue**: [Description]
   - **Page**: [Page name]
   - **Severity**: High / Medium / Low
   - **Steps to Reproduce**:
   - **Expected**:
   - **Actual**:
   - **Status**: Open / In Progress / Fixed

---

## Sign-Off

### Testing Completed By
- **Name**: ___________________
- **Date**: ___________________
- **Pass/Fail**: ___________________

### Notes
[Any additional observations or recommendations]

---

## Quick Test Summary

**Total Checks**: ~280 items
**Estimated Time**: 3-4 hours for complete testing

**Priority Testing Order**:
1. Phase 4: Room Detail + Booking Widget (most complex)
2. Phase 5: Booking Checkout (revenue-critical)
3. Phase 2: Contact Page (customer support)
4. Phase 3: Blog Archive (content marketing)
5. Phase 6: Consistency & Accessibility (quality assurance)

**Must-Test Devices**:
- iPhone (Safari)
- Android Phone (Chrome)
- iPad (Safari)
- Desktop (Chrome + Firefox)
