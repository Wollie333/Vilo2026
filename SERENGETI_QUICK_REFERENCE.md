# Serengeti Template - Quick Reference Guide

## 🚀 Quick Start (30 seconds)

### Testing in Development
```bash
# 1. Ensure migrations are applied
# Check Supabase Dashboard → SQL Editor → Run:
SELECT COUNT(*) FROM website_templates WHERE name = 'Serengeti Lodge';
# Should return 1

# 2. Start dev servers (if not running)
npm run dev

# 3. Test activation
# - Login as property owner
# - Go to Property → Website → Templates
# - Click "Activate" on Serengeti Lodge
# - Wait for success message
# - Visit: http://{subdomain}.localhost:5173
```

---

## 📁 Key Files Reference

### Database
```
backend/migrations/115_create_website_templates_schema.sql  ← Creates tables
backend/migrations/121_seed_serengeti_correct.sql          ← Seeds template
```

### Backend
```
backend/src/types/property-website.types.ts                 ← Section types
backend/src/services/property-website.service.ts            ← Activation logic
  ├─ autoPopulateContent()                                  ← Placeholder replacement
  ├─ copyTemplatePagesToWebsite()                           ← Template copying
  └─ activateTemplate()                                     ← Main activation
```

### Frontend Components
```
frontend/src/components/features/SerengetiSections/
  ├─ SerengetiHeroFullscreen.tsx                            ← Full-screen hero
  ├─ SerengetiHeroLeft.tsx                                  ← Left hero
  ├─ SerengetiFeatures3Col.tsx                              ← Features grid
  ├─ SerengetiRoomCards.tsx                                 ← Room cards ⭐
  ├─ SerengetiTestimonials.tsx                              ← Testimonials
  ├─ SerengetiCtaBanner.tsx                                 ← CTA banner
  ├─ SerengetiAboutIntro.tsx                                ← Intro text
  ├─ SerengetiStoryLeft.tsx                                 ← Story section
  ├─ SerengetiValuesGrid.tsx                                ← Values grid
  ├─ SerengetiContactInfo.tsx                               ← Contact info
  ├─ SerengetiContactForm.tsx                               ← Contact form
  └─ SerengetiBlogCards.tsx                                 ← Blog cards

frontend/src/components/features/SectionRenderer/
  └─ SectionRenderer.tsx                                    ← Dynamic loader
```

### Frontend Pages
```
frontend/src/pages/properties/components/
  └─ TemplatesTab.tsx                                       ← Template selector UI

frontend/src/pages/public-website/
  └─ PublicWebsiteHome.tsx                                  ← Public rendering
```

### Types
```
frontend/src/types/property-website.types.ts
  ├─ SectionType enum (15 Serengeti types)
  └─ 12 Serengeti content interfaces
```

---

## 🗄️ Database Quick Reference

### Template ID
```
9fdaee7d-ef10-41a5-bf97-97eb9beb6f09
```

### Useful Queries

**Check template exists:**
```sql
SELECT id, name, category, is_active
FROM website_templates
WHERE name = 'Serengeti Lodge';
```

**Count pages and sections:**
```sql
SELECT
  (SELECT COUNT(*) FROM website_template_pages WHERE template_id = '9fdaee7d-ef10-41a5-bf97-97eb9beb6f09') as pages,
  (SELECT COUNT(*) FROM website_template_page_sections wtps
   JOIN website_template_pages wtp ON wtp.id = wtps.template_page_id
   WHERE wtp.template_id = '9fdaee7d-ef10-41a5-bf97-97eb9beb6f09') as sections;
-- Expected: pages=8, sections=18
```

**View all sections:**
```sql
SELECT
  wtp.page_type,
  wtps.section_type,
  wtps.section_name,
  wtps.sort_order
FROM website_template_page_sections wtps
JOIN website_template_pages wtp ON wtp.id = wtps.template_page_id
WHERE wtp.template_id = '9fdaee7d-ef10-41a5-bf97-97eb9beb6f09'
ORDER BY wtp.sort_order, wtps.sort_order;
```

**Check activated websites:**
```sql
SELECT
  pw.id,
  pw.subdomain,
  p.name as property_name,
  pw.created_at
FROM property_websites pw
JOIN properties p ON p.id = pw.property_id
WHERE pw.template_id = '9fdaee7d-ef10-41a5-bf97-97eb9beb6f09'
ORDER BY pw.created_at DESC;
```

**Verify auto-population:**
```sql
SELECT
  tps.section_type,
  tps.content->>'heading' as heading,
  tps.content->>'sectionTitle' as section_title
FROM template_page_sections tps
WHERE tps.property_website_id = '{WEBSITE_ID}'
  AND tps.section_type LIKE 'serengeti%'
LIMIT 5;
-- Should show actual property data, not placeholders
```

---

## 🎨 Section Types Reference

| Section Type | Purpose | Auto-Populates |
|--------------|---------|----------------|
| `serengeti-hero-fullscreen` | Full-screen hero with search | Property name, hero image |
| `serengeti-hero-left` | Left-aligned hero | Property name, background image |
| `serengeti-features-3col` | 3-column features | Static content |
| `serengeti-room-cards` | Room cards grid | **Rooms data** ⭐ |
| `serengeti-testimonials` | Testimonials carousel | Static content |
| `serengeti-cta-banner` | Call-to-action banner | Static content |
| `serengeti-about-intro` | Simple intro text | Static content |
| `serengeti-story-left` | Image + text layout | Static content |
| `serengeti-values-grid` | Values with icons | Static content |
| `serengeti-contact-info` | Contact info cards | **Phone, email, address** ⭐ |
| `serengeti-contact-form` | Contact form | Static content |
| `serengeti-blog-cards` | Blog post cards | **Blog posts** ⭐ |

⭐ = Dynamic data from database

---

## 🔧 Common Tasks

### Add a New Serengeti Section Type

**1. Backend Types:**
```typescript
// backend/src/types/property-website.types.ts
export enum SectionType {
  // ... existing
  SERENGETI_NEW_SECTION = 'serengeti-new-section',
}

export interface SerengetiNewSectionContent {
  title: string;
  description: string;
  // ... fields
}
```

**2. Frontend Types:**
```typescript
// frontend/src/types/property-website.types.ts
export enum SectionType {
  // ... existing
  SERENGETI_NEW_SECTION = 'serengeti-new-section',
}

export interface SerengetiNewSectionContent {
  title: string;
  description: string;
  // ... fields
}
```

**3. React Component:**
```tsx
// frontend/src/components/features/SerengetiSections/SerengetiNewSection.tsx
import React from 'react';
import { SerengetiNewSectionContent } from '@/types/property-website.types';

interface SerengetiNewSectionProps {
  content: SerengetiNewSectionContent;
}

export const SerengetiNewSection: React.FC<SerengetiNewSectionProps> = ({ content }) => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2>{content.title}</h2>
        <p>{content.description}</p>
      </div>
    </section>
  );
};
```

**4. Export:**
```typescript
// frontend/src/components/features/SerengetiSections/index.ts
export { SerengetiNewSection } from './SerengetiNewSection';
```

**5. Add to SectionRenderer:**
```typescript
// frontend/src/components/features/SectionRenderer/SectionRenderer.tsx
import { SerengetiNewSection } from '../SerengetiSections';

// In switch statement:
case SectionType.SERENGETI_NEW_SECTION:
  return <SerengetiNewSection content={content} />;
```

**6. Seed in Database:**
```sql
INSERT INTO website_template_page_sections (
  template_page_id,
  section_type,
  section_name,
  sort_order,
  content
) VALUES (
  '{PAGE_ID}',
  'serengeti-new-section',
  'New Section',
  10,
  '{"title": "Title", "description": "Description"}'::jsonb
);
```

---

### Debug Activation Issues

**1. Check logs:**
```bash
# Backend console logs show:
🎨 [ACTIVATE TEMPLATE] Property: {name}, Rooms: {count}
🎨 [COPY TEMPLATE] Found {n} template pages to copy
🎨 [COPY TEMPLATE] Created page: {title} ({type})
🎨 [COPY TEMPLATE] Summary: {pages} pages, {sections} sections created
```

**2. Verify database:**
```sql
-- Check website created
SELECT * FROM property_websites WHERE property_id = '{PROPERTY_ID}';

-- Check pages created
SELECT COUNT(*) FROM website_pages WHERE property_website_id = '{WEBSITE_ID}';

-- Check sections created
SELECT COUNT(*) FROM template_page_sections WHERE property_website_id = '{WEBSITE_ID}';
```

**3. Check auto-population:**
```sql
-- View section content
SELECT section_type, content
FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}'
  AND section_type = 'serengeti-hero-fullscreen';

-- Content should show actual property name, not "{property.name}"
```

---

### Fix Common Errors

**Error: Template not found**
```sql
-- Re-seed template
\i backend/migrations/121_seed_serengeti_correct.sql
```

**Error: Section type not implemented**
- Check section_type in database matches SectionType enum exactly
- Verify case statement in SectionRenderer.tsx includes that type
- Ensure component is imported

**Error: Auto-population not working**
- Check property has required fields (name, featured_image_url, etc.)
- Verify `autoPopulateContent` is being called in backend
- Check placeholder syntax: `{property.field}` not `${property.field}`

**Error: Images not loading**
```sql
-- Check property has images
SELECT featured_image_url FROM properties WHERE id = '{PROPERTY_ID}';

-- Check rooms have images
SELECT name, featured_image, gallery_images
FROM rooms
WHERE property_id = '{PROPERTY_ID}';
```

---

## 🧪 Testing Checklist

Quick test before deploying:

- [ ] Template appears in templates list
- [ ] Activation completes in < 5 seconds
- [ ] 8 pages created in database
- [ ] 18 sections created in database
- [ ] Property name shows in hero (not placeholder)
- [ ] Rooms show in room cards section
- [ ] Public website loads without errors
- [ ] Mobile view works (test on 375px width)
- [ ] Images load correctly
- [ ] Console has no errors
- [ ] Can customize section via CMS

---

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Template not found" | Run seed migration 121 |
| Blank sections | Check section_type case-sensitivity |
| Placeholders showing | Verify property has data, check autoPopulateContent |
| Images broken | Check storage bucket, verify image URLs |
| "Not implemented" message | Add section type to SectionRenderer |
| Slow activation | Check database indexes, optimize queries |
| TypeScript errors | Run `npm run build` and fix type mismatches |

---

## 🎯 Production Deployment

```bash
# 1. Backend
cd backend
npm install
npm run build
# Deploy dist/ folder

# 2. Frontend
cd frontend
npm install
npm run build
# Deploy dist/ folder to static hosting

# 3. Database
# Apply migrations via Supabase Dashboard:
# - 115_create_website_templates_schema.sql
# - 121_seed_serengeti_correct.sql

# 4. Verify
# - Check template in production database
# - Test activation on production
# - Verify public website renders
```

---

## 📊 Performance Targets

- Template activation: < 5 seconds
- Homepage load: < 2 seconds
- Section render: < 100ms
- Database queries: < 50ms

---

## 🔗 Related Documentation

- `SERENGETI_TEMPLATE_TESTING_GUIDE.md` - Full testing procedures
- `SERENGETI_IMPLEMENTATION_SUMMARY.md` - Technical details
- `CLAUDE.md` - Project conventions
- Backend API docs (if available)
- Frontend component library (if available)

---

**Version**: 1.0
**Last Updated**: 2026-01-18
**Quick Help**: Check SERENGETI_TEMPLATE_TESTING_GUIDE.md for detailed steps
