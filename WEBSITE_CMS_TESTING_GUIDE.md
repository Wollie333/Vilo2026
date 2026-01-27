# Website CMS Feature - Testing Guide

## Overview
This guide provides comprehensive testing steps for the Property Website CMS feature. Complete all sections to ensure the feature works end-to-end.

---

## Pre-Testing Setup

### 1. Database Migration
```bash
# Ensure migration 100 has been run
# Check that these tables exist:
- property_websites
- website_pages
- blog_categories
- blog_posts
```

### 2. Build and Start
```bash
# From project root
npm run dev

# OR start backend and frontend separately
cd backend && npm run dev
cd frontend && npm run dev
```

---

## Phase 1: Dashboard - Website Activation

### Test: Activate Website

**Steps:**
1. Log in as property owner
2. Navigate to Manage > Properties
3. Click on a property
4. Click the "Website" tab (between "Listing Details" and "Legal")
5. You should see the Overview section

**Activation Flow:**
1. Click "Activate Website" button
2. Subdomain should auto-populate based on property name
3. Click "Activate"

**Expected Results:**
- ✅ Website is activated
- ✅ Subdomain is generated (e.g., `property-name`)
- ✅ 5 default pages are created (Home, About, Contact, Accommodation, Blog)
- ✅ Overview shows website status as "Active"
- ✅ Website URL is displayed (e.g., `property-name.vilo.com`)

**Potential Issues:**
- Subdomain already taken → Should append `-1`, `-2`, etc.
- Invalid property name characters → Should be sanitized

---

## Phase 2: Dashboard - Page Management

### Test: Edit Home Page

**Steps:**
1. In Website tab, left sidebar, click "Pages > Home"
2. Update the following:
   - **Title:** "Welcome to [Property Name]"
   - **Content:** Add some HTML content
   - **Visibility:** Toggle on/off
   - **SEO Meta Title:** "[Property Name] - Luxury Accommodation"
   - **SEO Meta Description:** "Book your perfect getaway at [Property Name]"
   - **SEO Keywords:** "accommodation, vacation rental, booking"
3. Click "Save Changes"

**Expected Results:**
- ✅ Changes save successfully
- ✅ Success message appears
- ✅ Page remains on Home page editor
- ✅ Visibility toggle works

**Repeat for:**
- About page
- Contact page
- Accommodation page
- Blog page

---

## Phase 3: Dashboard - Blog Management

### Test: Create Category

**Steps:**
1. In Website tab, left sidebar, click "Blog > Categories"
2. Click "Create Category"
3. Enter:
   - **Name:** "Travel Tips"
   - **Slug:** Auto-generated (travel-tips)
   - **Description:** "Helpful travel tips and guides"
4. Click "Create"

**Expected Results:**
- ✅ Category is created
- ✅ Appears in category list
- ✅ Slug is auto-generated correctly

**Test: Create Blog Post**

**Steps:**
1. In Website tab, left sidebar, click "Blog > Posts"
2. Click "Create Post"
3. Enter:
   - **Title:** "10 Things to Do in [City]"
   - **Slug:** Auto-generated
   - **Excerpt:** "Discover the best activities..."
   - **Content:** Add blog content (HTML supported)
   - **Featured Image URL:** Paste image URL
   - **Category:** Select "Travel Tips"
   - **Status:** Published
   - **SEO Meta Title:** Custom title
   - **SEO Meta Description:** Custom description
4. Click "Save Changes"

**Expected Results:**
- ✅ Post is created
- ✅ Appears in post list
- ✅ Status shows "Published"
- ✅ Published date is set automatically

**Test: Draft Post**

**Steps:**
1. Create another post
2. Set **Status:** Draft
3. Save

**Expected Results:**
- ✅ Post is saved as draft
- ✅ Published date is NOT set
- ✅ Post shows in list with "Draft" badge

---

## Phase 4: Dashboard - Settings & Branding

### Test: Customize Theme

**Steps:**
1. In Website tab, left sidebar, click "Settings > Branding"
2. Update:
   - **Primary Color:** #047857 (or any color)
   - **Secondary Color:** #000000 (or any color)
   - **Logo URL:** Paste image URL
   - **Favicon URL:** Paste favicon URL
3. Click "Save Changes"

**Expected Results:**
- ✅ Colors update in preview
- ✅ Logo/favicon URLs save
- ✅ Success message appears

**Test: Toggle Website Active**

**Steps:**
1. Toggle "Website Active" switch
2. Save changes

**Expected Results:**
- ✅ Website can be deactivated/reactivated
- ✅ When inactive, public website should not be accessible

---

## Phase 5: Public Website - Subdomain Routing

### Test: Access Public Website

**Important:** For local development, subdomain routing won't work on `localhost`. You have two options:

**Option 1: Use hosts file (Recommended for testing)**
1. Edit your hosts file:
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - Mac/Linux: `/etc/hosts`
2. Add this line:
   ```
   127.0.0.1   property-name.localhost
   ```
3. Access: `http://property-name.localhost:5173`

**Option 2: Deploy to staging with real subdomain**

**Steps:**
1. Access public website URL
2. Should see home page with property name and hero image

**Expected Results:**
- ✅ Home page loads
- ✅ Property name appears in header
- ✅ Navigation shows all visible pages
- ✅ Theme colors are applied
- ✅ Logo appears (if set)

---

## Phase 6: Public Website - Navigation

### Test: Page Navigation

**Steps:**
1. On public website, click "About" in navigation
2. Click "Contact"
3. Click "Accommodation"
4. Click "Blog"

**Expected Results:**
- ✅ All pages load correctly
- ✅ Page content displays
- ✅ URLs are clean (e.g., `/about`, `/contact`)
- ✅ Back button works

---

## Phase 7: Public Website - Blog

### Test: Blog List Page

**Steps:**
1. Navigate to `/blog`

**Expected Results:**
- ✅ All published posts appear
- ✅ Posts show featured image, title, excerpt, date, category
- ✅ "Read more" links work
- ✅ Draft posts do NOT appear

**Test: Blog Post Single View**

**Steps:**
1. Click on a blog post

**Expected Results:**
- ✅ Post loads at `/blog/post-slug`
- ✅ Featured image displays
- ✅ Title, date, author, category show
- ✅ Full content renders (HTML formatting preserved)
- ✅ "Back to Blog" link works

**Test: Category Filter**

**Steps:**
1. On blog list, click on a category link

**Expected Results:**
- ✅ URL changes to `/blog/category/category-slug`
- ✅ Only posts from that category show
- ✅ Category name appears at top

---

## Phase 8: Public Website - Reservation Widget

### Test: Search for Rooms

**Steps:**
1. Navigate to "Accommodation" page on public website
2. Reservation widget should be visible
3. Enter:
   - **Check-in:** Tomorrow's date
   - **Check-out:** 3 days later
   - **Guests:** 2
4. Click "Search Availability"

**Expected Results:**
- ✅ Widget loads
- ✅ Search executes
- ✅ Available rooms display with:
   - Room image
   - Room name
   - Max occupancy
   - Price per night
   - "Book Now" button

**Test: Book Now Redirect**

**Steps:**
1. After search, click "Book Now" on a room

**Expected Results:**
- ✅ Redirects to booking wizard
- ✅ URL includes query params: `?checkIn=...&checkOut=...&guests=...&roomId=...`
- ✅ Booking wizard pre-fills dates and room

---

## Phase 9: Public Website - Contact Form

### Test: Submit Contact Form

**Steps:**
1. Navigate to "Contact" page on public website
2. Fill out form:
   - **Name:** John Doe
   - **Email:** john@example.com
   - **Phone:** (555) 123-4567
   - **Message:** "I'd like to inquire about..."
3. Click "Send Message"

**Expected Results:**
- ✅ Form submits successfully
- ✅ Success message appears: "Thank you for your message!"
- ✅ Form fields clear after submission
- ✅ Chat conversation is created for property owner
- ✅ Property owner receives the inquiry in their chat

**Check in Dashboard:**
1. Log in as property owner
2. Navigate to Manage > Chat
3. Should see new conversation with inquiry

---

## Phase 10: SEO Verification

### Test: Meta Tags

**Steps:**
1. View page source (right-click > View Source) on:
   - Home page
   - About page
   - Blog list
   - Single blog post

**Expected Results:**
- ✅ `<title>` tag is set correctly
- ✅ `<meta name="description">` exists
- ✅ Open Graph tags exist (`og:title`, `og:description`, `og:image`, `og:url`)
- ✅ Twitter Card tags exist
- ✅ Schema.org JSON-LD script exists

**Test: Schema.org Validation**

**Steps:**
1. Go to https://validator.schema.org/
2. Paste URL of:
   - Home page (should validate as LodgingBusiness)
   - Blog post page (should validate as Article)
3. Click "Run Test"

**Expected Results:**
- ✅ No errors
- ✅ LodgingBusiness schema detected on home
- ✅ Article schema detected on blog posts

---

## Phase 11: Mobile Responsiveness

### Test: Mobile View

**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)

**Pages to Test:**
- Home page
- Blog list
- Blog post
- Contact form
- Reservation widget

**Expected Results:**
- ✅ All content is readable
- ✅ No horizontal scroll
- ✅ Navigation collapses appropriately
- ✅ Forms are usable
- ✅ Buttons are tappable
- ✅ Images scale properly

---

## Phase 12: Error Handling

### Test: Invalid Subdomain

**Steps:**
1. Access public website with invalid subdomain: `http://nonexistent.vilo.com`

**Expected Results:**
- ✅ "Website Not Found" error displays

### Test: Invalid Blog Post Slug

**Steps:**
1. Access: `/blog/nonexistent-post`

**Expected Results:**
- ✅ "Post Not Found" error displays
- ✅ "Back to Blog" link works

### Test: No Available Rooms

**Steps:**
1. On accommodation page, search for dates with no availability

**Expected Results:**
- ✅ Message: "No rooms available for the selected dates. Please try different dates."

---

## Phase 13: Performance & Polish

### Test: Page Load Speed

**Steps:**
1. Open DevTools > Network tab
2. Reload public website pages
3. Check load times

**Expected Results:**
- ✅ Pages load in < 2 seconds
- ✅ Images are optimized
- ✅ No 404 errors in console

### Test: Console Errors

**Steps:**
1. Open DevTools > Console
2. Navigate through all pages

**Expected Results:**
- ✅ No JavaScript errors
- ✅ No React warnings
- ✅ No network errors

---

## Known Limitations

1. **Subdomain Routing in Development:**
   - Requires hosts file modification OR deployment to staging
   - Cannot test on `localhost` without configuration

2. **Rich Text Editor:**
   - Currently using textarea for content (HTML input)
   - Consider adding WYSIWYG editor (React Quill) in future

3. **Image Uploads:**
   - Currently using URL inputs
   - Could add drag-and-drop image upload

4. **Page Templates:**
   - Single default template only
   - No custom layouts per page

5. **Blog Pagination:**
   - API supports pagination but UI doesn't have pagination controls yet

---

## Bug Reporting

If you encounter issues, note:
1. **What you were doing** (steps to reproduce)
2. **What you expected** (expected behavior)
3. **What happened** (actual behavior)
4. **Browser/Device** (Chrome, Safari, mobile, etc.)
5. **Console errors** (screenshot of DevTools console)

---

## Success Criteria

Feature is complete when:
- ✅ All 12 phases test successfully
- ✅ No critical bugs
- ✅ SEO validates correctly
- ✅ Mobile responsive
- ✅ No console errors
- ✅ End-to-end flow works (activate → customize → publish → view)

---

## Next Steps (Future Enhancements)

1. Add WYSIWYG editor for page/blog content
2. Add image upload functionality
3. Add pagination controls for blog list
4. Add search functionality for blog
5. Add analytics integration
6. Add social sharing buttons on blog posts
7. Add comments system for blog posts
8. Add newsletter signup form
9. Add multiple template options
10. Add custom CSS editor for advanced users
