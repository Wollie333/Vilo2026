## Template Switch Bug - Analysis & Fix

# Template Switch Bug - Analysis & Fix

## Problem Summary

When activating the Serengeti template on a property that already had a website (with the old Modern Luxe template), the system:

1. ✅ Updated `template_id` in the database to point to Serengeti
2. ❌ **DID NOT delete old sections** from the previous template
3. ❌ **DID NOT create new Serengeti sections**
4. ❌ Result: Database says "Serengeti" but website renders old template

## Root Cause

In `backend/src/services/property-website.service.ts`, the `activateTemplate` function had this logic:

```typescript
// When website already exists
if (existing) {
  // Update template_id to new template
  await updateWebsite({ template_id: newTemplateId });

  // Check if sections exist
  const sectionsExist = await checkSections(website.id);

  if (sectionsExist) {
    // ❌ BUG: Skip creating new sections!
    console.log('Sections already exist, skipping template copy');
  } else {
    // Only copy if NO sections exist
    await copyTemplateSections(templateId, websiteId);
  }
}
```

**The Problem:** When switching templates, old sections exist, so new sections are NEVER created!

## The Fix

### Backend Code Change

**File**: `backend/src/services/property-website.service.ts`
**Lines**: 541-635

**New Logic**:
```typescript
if (existing) {
  // Check if template is actually changing
  const currentTemplateId = await getCurrentTemplateId(existing.id);
  const isTemplateSwitching = currentTemplateId !== newTemplateId;

  if (isTemplateSwitching) {
    console.log('🎨 Switching templates - deleting old content');

    // DELETE old sections first
    await deleteAllSections(existing.id);

    // DELETE old pages
    await deleteAllPages(existing.id);
  }

  // Update template_id
  await updateWebsite({ template_id: newTemplateId });

  // Now copy new template (sections are gone, so this will run)
  await copyTemplateSections(newTemplateId, websiteId, propertyData, rooms);
}
```

**What Changed**:
- ✅ Detects when template is switching (different `template_id`)
- ✅ Deletes old sections and pages BEFORE copying new ones
- ✅ Always copies new template content when switching
- ✅ Preserves old behavior when activating first time (no deletion needed)

## How to Fix Your Current Broken Website

### Option 1: Re-activate Serengeti (Recommended)

1. **Run the SQL cleanup** (use `FIX_TEMPLATE_SWITCH_ISSUE.sql`):
   ```sql
   -- Find your website_id
   SELECT id FROM property_websites WHERE property_id = 'YOUR_PROPERTY_ID';

   -- Delete old sections
   DELETE FROM template_page_sections WHERE property_website_id = 'YOUR_WEBSITE_ID';

   -- Delete old pages
   DELETE FROM website_pages WHERE property_website_id = 'YOUR_WEBSITE_ID';
   ```

2. **Restart backend** (pick up new code):
   ```bash
   # Backend should restart automatically if using npm run dev
   # Or manually restart if needed
   ```

3. **Re-activate Serengeti from UI**:
   - Go to: Property → Website → Overview
   - Click "Activate" on Serengeti Lodge template
   - Backend will now detect template switch and create fresh Serengeti sections
   - Website will now show Serengeti design

### Option 2: Switch Back to Modern Luxe

If you want the old template back:

1. **Get Modern Luxe template ID**:
   ```sql
   SELECT id FROM website_templates WHERE name = 'Modern Luxe';
   ```

2. **Update website to use Modern Luxe**:
   ```sql
   UPDATE property_websites
   SET template_id = 'MODERN_LUXE_TEMPLATE_ID'
   WHERE id = 'YOUR_WEBSITE_ID';
   ```

3. **Clean up sections** (same as Option 1 step 1)

4. **Re-activate Modern Luxe from UI**

## Verification Steps

After re-activation, verify the fix:

### 1. Check Template ID
```sql
SELECT
  pw.subdomain,
  wt.name as template_name,
  pw.template_id
FROM property_websites pw
JOIN website_templates wt ON wt.id = pw.template_id
WHERE pw.id = 'YOUR_WEBSITE_ID';
```
Should show: `Serengeti Lodge`

### 2. Check Sections
```sql
SELECT
  section_type,
  section_name,
  page_type
FROM template_page_sections
WHERE property_website_id = 'YOUR_WEBSITE_ID'
ORDER BY page_type, sort_order
LIMIT 10;
```
Should show: `serengeti-hero-fullscreen`, `serengeti-room-cards`, etc.

### 3. Visit Website
```
http://{subdomain}.localhost:5173
```
Should now show: **Serengeti design** with hero image, room cards, etc.

## Why Only One Template Shows in UI

You mentioned seeing only "Serengeti" in the template list. This might be:

### Possible Causes:

1. **Modern Luxe is inactive** - Check:
   ```sql
   SELECT name, is_active FROM website_templates;
   ```
   Both should have `is_active = true`

2. **Frontend filtering** - The `listTemplates` API filters by `is_active = true`

3. **Template already activated** - If a template is already active on your website, the UI might hide it or mark it differently

### To Fix:

1. **Ensure both templates are active**:
   ```sql
   UPDATE website_templates SET is_active = true WHERE name IN ('Modern Luxe', 'Serengeti Lodge');
   ```

2. **Check template list API**:
   - Open DevTools → Network tab
   - Navigate to: Property → Website → Overview
   - Check the response from `/api/website-templates` or similar
   - Should return 2 templates

## Testing Checklist

After applying the fix:

- [ ] Backend code updated with new `activateTemplate` logic
- [ ] Old sections/pages deleted from database
- [ ] Serengeti template re-activated from UI
- [ ] Website shows Serengeti design (not old template)
- [ ] Both templates appear in UI template list
- [ ] Can switch between templates successfully
- [ ] Template switching deletes old content and creates new

## Future Improvements

1. **Add confirmation dialog** when switching templates:
   > "Switching templates will replace all current pages and sections. This cannot be undone. Continue?"

2. **Create backup** before switching:
   - Save old sections to `template_page_sections_backup` table
   - Allow rollback if user doesn't like new template

3. **Template preview** before activation:
   - Show iframe preview of template
   - Let users see design before committing

4. **Preserve custom content** when switching:
   - Detect which sections were customized
   - Attempt to migrate custom text/images to new template
   - Only works if section types match

---

**Status**: ✅ Backend Fix Applied
**Date**: 2026-01-18
**Impact**: High - Fixes critical bug preventing template switching
**Action Required**: User must clean up database and re-activate template
