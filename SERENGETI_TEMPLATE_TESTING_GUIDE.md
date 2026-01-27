# Serengeti Template - Testing & Deployment Guide

## Overview
The Serengeti Lodge template is a professional, modern website template that can be activated with one click. This guide covers testing and deployment procedures.

---

## ✅ Pre-Testing Checklist

### 1. Database Verification
Run these SQL queries to verify template data exists:

```sql
-- Check if Serengeti template exists
SELECT id, name, category, is_active
FROM website_templates
WHERE name = 'Serengeti Lodge';
-- Expected: 1 row with id = 9fdaee7d-ef10-41a5-bf97-97eb9beb6f09

-- Check template pages
SELECT COUNT(*) as page_count
FROM website_template_pages
WHERE template_id = '9fdaee7d-ef10-41a5-bf97-97eb9beb6f09';
-- Expected: 8

-- Check template sections
SELECT wtp.page_type, COUNT(wtps.id) as section_count
FROM website_template_pages wtp
LEFT JOIN website_template_page_sections wtps ON wtps.template_page_id = wtp.id
WHERE wtp.template_id = '9fdaee7d-ef10-41a5-bf97-97eb9beb6f09'
GROUP BY wtp.page_type
ORDER BY wtp.page_type;
-- Expected: 8 rows showing sections per page

-- View all sections details
SELECT
  wtp.page_type,
  wtps.section_type,
  wtps.section_name,
  wtps.sort_order
FROM website_template_page_sections wtps
JOIN website_template_pages wtp ON wtp.id = wtps.template_page_id
WHERE wtp.template_id = '9fdaee7d-ef10-41a5-bf97-97eb9beb6f09'
ORDER BY wtp.page_type, wtps.sort_order;
-- Expected: 18 rows
```

### 2. Test Property Setup
Create or use an existing property with:
- Property name set
- Featured image uploaded
- Contact information (email, phone, address)
- At least 2-3 active rooms with:
  - Room name
  - Room description
  - Featured image
  - Base price set
  - Amenities defined

---

## 🧪 Testing Procedures

### Test 1: Template Listing
**Objective**: Verify template appears in the templates tab

**Steps**:
1. Log in as property owner/admin
2. Navigate to any property
3. Click "Website" tab
4. Click "Templates" sub-tab
5. Verify Serengeti Lodge template card appears
6. Check template details:
   - Name: "Serengeti Lodge"
   - Category badge: "Safari Lodge"
   - Description is visible
   - Preview image shows (if uploaded)

**Expected Result**: ✅ Template card displays correctly

---

### Test 2: Template Activation
**Objective**: Activate Serengeti template and verify website creation

**Steps**:
1. On Templates tab, click "Activate" on Serengeti template
2. Wait for success message
3. Note the subdomain shown in success message
4. Verify success alert shows: "Template activated successfully..."

**Backend Verification**:
```sql
-- Check website was created
SELECT id, subdomain, template_id, is_active
FROM property_websites
WHERE property_id = '{YOUR_PROPERTY_ID}';
-- Expected: 1 row with template_id = 9fdaee7d-ef10-41a5-bf97-97eb9beb6f09

-- Check pages were created
SELECT page_type, title, slug, is_visible
FROM website_pages
WHERE property_website_id = '{WEBSITE_ID}'
ORDER BY sort_order;
-- Expected: 8 rows

-- Check sections were created
SELECT
  wp.page_type,
  tps.section_type,
  tps.section_name,
  tps.is_visible
FROM template_page_sections tps
JOIN website_pages wp ON wp.page_type = tps.page_type
WHERE tps.property_website_id = '{WEBSITE_ID}'
ORDER BY tps.page_type, tps.sort_order;
-- Expected: 18 rows
```

**Expected Result**: ✅ Website created with 8 pages and 18 sections

---

### Test 3: Auto-Population Verification
**Objective**: Verify property data was auto-populated in sections

**Steps**:
1. In database, check a hero section:
```sql
SELECT content
FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}'
  AND section_type = 'serengeti-hero-fullscreen'
LIMIT 1;
```

2. Verify the `content` JSONB contains:
   - Property name (not `{property.name}` placeholder)
   - Hero image URL (not `{property.hero_image}` placeholder)
   - Actual data from your property

3. Check contact section:
```sql
SELECT content
FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}'
  AND section_type = 'serengeti-contact-info'
LIMIT 1;
```

**Expected Result**: ✅ All placeholders replaced with actual property data

---

### Test 4: Public Website Rendering
**Objective**: Verify public website displays correctly

**Development Setup**:
```
http://{subdomain}.localhost:5173
```

**Production Setup**:
```
https://{subdomain}.yourdomain.com
```

**Steps**:
1. Get subdomain from property_websites table
2. Open URL in browser
3. Verify homepage loads
4. Check sections render in order:
   - Hero section with property name
   - Features section
   - Room cards (showing property's rooms)

5. Navigate through all pages:
   - Homepage (/)
   - About (/about)
   - Accommodation (/accommodation)
   - Room Single (/rooms/{slug})
   - Contact (/contact)
   - Blog (/blog)
   - Blog Post (/blog/{slug})
   - Checkout (/checkout)

**Expected Result**: ✅ All pages render without errors, showing Serengeti design

---

### Test 5: Room Cards Auto-Population
**Objective**: Verify rooms from property appear in room cards section

**Steps**:
1. Navigate to homepage or accommodation page
2. Scroll to "Our Accommodations" section
3. Verify:
   - Room cards display
   - Each card shows:
     - Room name
     - Room code
     - Room image (featured_image or first gallery image)
     - Base price per night (if showPricing is true)
     - Room description
     - Amenities
     - "Book Now" button

4. Count visible rooms matches property's active rooms

**Expected Result**: ✅ All active rooms display correctly with data

---

### Test 6: Mobile Responsiveness
**Objective**: Verify template works on mobile devices

**Steps**:
1. Open public website
2. Use browser dev tools to test:
   - Mobile (375px width)
   - Tablet (768px width)
   - Desktop (1920px width)

3. Check:
   - Layout adjusts correctly
   - Images scale properly
   - Navigation is usable
   - Text is readable
   - Buttons are clickable

**Expected Result**: ✅ Site is fully responsive on all screen sizes

---

### Test 7: Section Customization
**Objective**: Verify users can edit sections via CMS

**Steps**:
1. Log in as property owner
2. Navigate to Website → Pages → Homepage
3. Click on any section to edit
4. Modify content (e.g., change heading text)
5. Click "Save"
6. Visit public website
7. Verify changes appear

**Expected Result**: ✅ Section edits save and display on public site

---

### Test 8: Multiple Activations
**Objective**: Verify re-activation behavior

**Steps**:
1. Activate Serengeti on a property (already done)
2. Try activating again
3. Verify behavior:
   - Should skip creating duplicate pages/sections
   - Or handle gracefully with appropriate message

**Expected Result**: ✅ No duplicate data created, appropriate handling

---

### Test 9: Different Properties
**Objective**: Verify template works across different properties

**Steps**:
1. Create/use 3 different properties with:
   - Different names
   - Different room counts
   - Different contact info

2. Activate Serengeti on each
3. Visit each website
4. Verify each shows correct property-specific data

**Expected Result**: ✅ Each website is unique with correct data

---

### Test 10: SEO & Performance
**Objective**: Verify SEO and performance metrics

**Steps**:
1. Open public website
2. View page source
3. Check for:
   - `<title>` tag present
   - `<meta name="description">` present
   - Schema.org structured data (JSON-LD)
   - Proper heading hierarchy (h1, h2, h3)

4. Run Lighthouse audit:
   - Performance > 80
   - Accessibility > 90
   - Best Practices > 90
   - SEO > 90

**Expected Result**: ✅ Good SEO and performance scores

---

## 🐛 Common Issues & Solutions

### Issue 1: Template doesn't appear in list
**Symptom**: Templates tab is empty or Serengeti doesn't show

**Solution**:
```sql
-- Check if template is marked as active
UPDATE website_templates
SET is_active = true
WHERE name = 'Serengeti Lodge';
```

### Issue 2: Pages created but sections missing
**Symptom**: Pages exist but have no content

**Check**:
```sql
-- Verify template sections exist
SELECT COUNT(*) FROM website_template_page_sections;
-- Should be > 0
```

**Solution**: Re-run migration `121_seed_serengeti_correct.sql`

### Issue 3: Auto-population not working
**Symptom**: Sections show placeholders like `{property.name}`

**Solution**: Check `autoPopulateContent` function in backend service is being called

### Issue 4: Public website shows "Section not implemented"
**Symptom**: Gray box with "Section type ... not yet implemented"

**Solution**:
- Verify section type matches enum value exactly
- Check `SectionRenderer.tsx` has case for that section type
- Ensure Serengeti component is imported

### Issue 5: Images not loading
**Symptom**: Broken image icons

**Solution**:
- Verify property has `featured_image` set
- Check room `gallery_images` array exists
- Ensure storage bucket policies allow public access

---

## 📊 Performance Benchmarks

**Target Metrics**:
- Homepage load time: < 2 seconds
- Time to Interactive: < 3 seconds
- Total page size: < 2MB
- Number of HTTP requests: < 50

**Database Query Performance**:
```sql
-- Should complete in < 100ms
EXPLAIN ANALYZE
SELECT
  tps.*,
  wp.page_type
FROM template_page_sections tps
JOIN website_pages wp ON wp.page_type = tps.page_type
WHERE tps.property_website_id = '{WEBSITE_ID}'
  AND wp.property_website_id = '{WEBSITE_ID}'
  AND wp.page_type = 'home'
  AND tps.is_visible = true
ORDER BY tps.sort_order;
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Database migrations applied
- [ ] Template data seeded
- [ ] Environment variables set

### Deployment Steps
1. Run backend build: `cd backend && npm run build`
2. Run frontend build: `cd frontend && npm run build`
3. Deploy backend to production server
4. Deploy frontend to CDN/static host
5. Run migrations on production database
6. Seed Serengeti template data
7. Verify template appears in production

### Post-Deployment
- [ ] Smoke test activation on production
- [ ] Verify public website accessible
- [ ] Check error logs for issues
- [ ] Monitor performance metrics

---

## 📝 Documentation for Users

### Quick Start Guide (For Property Owners)

**Step 1: Activate Template**
1. Go to your property dashboard
2. Click "Website" tab
3. Click "Templates" sub-tab
4. Click "Activate" on Serengeti Lodge template
5. Wait for success message

**Step 2: View Your Website**
1. Note your subdomain from the success message
2. Visit: `https://{your-subdomain}.vilo.com`
3. Your website is now live!

**Step 3: Customize Content**
1. Go to Website → Pages
2. Select a page (e.g., Homepage)
3. Click on any section to edit
4. Modify text, images, or settings
5. Click "Save"

**What's Included**:
- 8 professionally designed pages
- Mobile-responsive design
- Auto-populated with your property data
- Customizable via easy-to-use editor
- SEO-optimized
- Fast loading times

---

## 🔧 Advanced Configuration

### Custom Theme Colors
Modify template colors via theme_config:
```sql
UPDATE property_websites
SET theme_config = theme_config || '{"primaryColor": "#YOUR_COLOR"}'::jsonb
WHERE id = '{WEBSITE_ID}';
```

### Disable Specific Sections
Hide sections without deleting:
```sql
UPDATE template_page_sections
SET is_visible = false
WHERE id = '{SECTION_ID}';
```

### Reorder Sections
Change display order:
```sql
UPDATE template_page_sections
SET sort_order = {NEW_ORDER}
WHERE id = '{SECTION_ID}';
```

---

## 📞 Support & Troubleshooting

**If you encounter issues**:
1. Check browser console for errors
2. Check backend logs
3. Verify database has correct data
4. Review this testing guide
5. Contact development team with:
   - Property ID
   - Website ID
   - Steps to reproduce
   - Screenshots of issue

---

## ✅ Success Criteria

Template implementation is successful when:
- ✅ Template appears in templates list
- ✅ Activation creates website in < 5 seconds
- ✅ All 8 pages created
- ✅ All 18 sections created
- ✅ Property data auto-populated correctly
- ✅ Public website renders without errors
- ✅ Mobile responsive
- ✅ SEO optimized
- ✅ User can customize via CMS
- ✅ Performance metrics met

---

**Version**: 1.0
**Last Updated**: 2026-01-18
**Author**: Claude AI Assistant
