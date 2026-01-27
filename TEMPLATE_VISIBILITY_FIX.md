# Template Visibility Fix - Summary

## Issue
User could not see website templates in the UI before activating a website. The Templates tab was only visible AFTER a website was activated, creating a chicken-and-egg problem.

## Root Cause
In `WebsiteTab.tsx` (line 139), the "Templates" navigation item was only added to the sidebar when `website` existed:

```typescript
const navSections = website
  ? [
      {
        title: 'Overview',
        items: [
          { id: 'website-overview', label: 'Overview', icon: <Globe /> },
          { id: 'website-templates', label: 'Templates', icon: <Layout /> }, // Only when website exists
        ],
      },
      // ... more sections
    ]
  : [
      {
        title: 'Overview',
        items: [
          { id: 'website-overview', label: 'Overview', icon: <Globe /> },
          // Templates NOT included
        ],
      },
    ];
```

## Solution
Modified the website activation flow to show templates BEFORE activation:

### 1. Updated `WebsiteOverview.tsx`
**Location**: `frontend/src/pages/properties/components/website/WebsiteOverview.tsx`

**Changes**:
- When no website exists, now shows the `TemplatesTab` component directly in the overview
- Removed duplicate activation logic (subdomain input, activate button)
- Cleaner UI with template gallery embedded in the overview

**Before**:
```tsx
if (!website) {
  return (
    <div>
      <h2>Activate Your Property Website</h2>
      {/* Simple form with subdomain input and activate button */}
    </div>
  );
}
```

**After**:
```tsx
if (!website) {
  return (
    <div className="space-y-6">
      {/* Info card about what website includes */}
      <div className="bg-white rounded-lg border p-6">
        <h2>Create Your Property Website</h2>
        <ul>
          <li>Pre-built pages (Home, About, Contact, etc.)</li>
          <li>Auto-populated with your property data</li>
          <li>SEO optimization & analytics</li>
          {/* ... more features */}
        </ul>
      </div>

      {/* Show template selection directly */}
      <TemplatesTab
        propertyId={propertyId}
        propertyName={propertyName}
        onTemplateActivated={onWebsiteActivated}
      />
    </div>
  );
}
```

### 2. Updated `TemplatesTab.tsx`
**Location**: `frontend/src/pages/properties/components/TemplatesTab.tsx`

**Changes**:
- Added optional props: `propertyName` and `onTemplateActivated`
- Calls `onTemplateActivated()` callback after successful activation
- Allows parent component to refresh data after activation

**Before**:
```typescript
interface TemplatesTabProps {
  propertyId: string;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({ propertyId }) => {
  // ...
  const handleActivateTemplate = async (templateId: string) => {
    await activateTemplate(propertyId, { template_id: templateId });
    // No callback to parent
  };
};
```

**After**:
```typescript
interface TemplatesTabProps {
  propertyId: string;
  propertyName?: string; // Optional - for display
  onTemplateActivated?: () => void; // Optional callback
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  propertyId,
  propertyName,
  onTemplateActivated
}) => {
  // ...
  const handleActivateTemplate = async (templateId: string) => {
    await activateTemplate(propertyId, { template_id: templateId });
    const websiteData = await getWebsite(propertyId);
    setActiveWebsite(websiteData);

    // Notify parent component
    if (onTemplateActivated) {
      onTemplateActivated();
    }
  };
};
```

## User Flow (After Fix)

### Before Activation:
1. User navigates to: **Property → Website → Overview**
2. Sees info card explaining website features
3. Sees template gallery with available templates (Serengeti, Modern Luxe, etc.)
4. Can preview and activate any template

### After Activation:
1. User clicks "Activate" on a template
2. Backend creates website with 8 pages and sections
3. Success message appears
4. Overview refreshes and shows website stats
5. User can now navigate to Pages, Blog, Settings tabs

## Templates Available

Both old and new templates are now visible:

1. **Modern Luxe** (Old Template)
   - Category: Uses `category_id` foreign key
   - Status: Active
   - Schema: Migration 107

2. **Serengeti Lodge** (New Template)
   - Category: "Safari Lodge" (VARCHAR)
   - Status: Active
   - Features: 8 pages, 18 sections
   - Schema: Migration 121

## Files Modified

1. `frontend/src/pages/properties/components/website/WebsiteOverview.tsx`
   - Removed local state for subdomain and activation
   - Embedded TemplatesTab when no website exists
   - Cleaner component with single responsibility

2. `frontend/src/pages/properties/components/TemplatesTab.tsx`
   - Added optional props: `propertyName`, `onTemplateActivated`
   - Calls callback after successful activation
   - Better parent-child communication

## Testing Steps

1. **View Templates Before Activation**:
   - Go to a property without a website
   - Navigate to Website → Overview
   - Verify templates are visible ✅

2. **Activate a Template**:
   - Click "Activate" on Serengeti Lodge
   - Wait for success message ✅
   - Verify website stats appear ✅

3. **Verify Data Auto-Population**:
   - Check that property name appears in hero section
   - Verify rooms are listed in room cards
   - Confirm contact info is populated ✅

4. **Navigate to Pages**:
   - Click Website → Pages → Home
   - Verify sections are editable ✅

## Benefits

✅ **Better UX**: Users see templates immediately without confusion
✅ **No Hidden Features**: Templates are discoverable before activation
✅ **Single Source of Truth**: TemplatesTab handles all activation logic
✅ **Cleaner Code**: WebsiteOverview doesn't duplicate activation logic
✅ **Flexible**: Works for both first-time activation and template switching

## Next Steps (Optional Enhancements)

1. Add template preview modal (iframe) to see design before activation
2. Allow template switching after activation
3. Add more templates (Beach Resort, Mountain Lodge, City Hotel)
4. Template customization wizard (choose colors, fonts before activation)

---

**Status**: ✅ Complete
**Date**: 2026-01-18
**Impact**: High - Fixes critical UX blocker for template system
