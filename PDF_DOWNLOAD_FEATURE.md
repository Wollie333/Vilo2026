# PDF Download Feature - Implementation Summary

## Summary

Added PDF download functionality to both **Terms & Conditions** and **Cancellation Policies** pages, allowing property owners and guests to download legal documents as professionally formatted PDFs.

---

## Features Added

### 1. Terms & Conditions PDF Download

**Location:** Property Legal Tab → Terms & Conditions

**Features:**
- Professional PDF layout with property branding
- Styled HTML content from WYSIWYG editor
- Download button at bottom of the page
- Filename: `Terms-{property-slug}.pdf`

**User Experience:**
- Click "Download PDF" button
- Browser downloads formatted PDF with:
  - Property name as header
  - Full terms content with HTML formatting preserved
  - Generated date in footer
  - Professional styling (colors, fonts, spacing)

### 2. Cancellation Policy PDF Download

**Location:** Property Legal Tab → Cancellation Policies → Each policy card

**Features:**
- Visual refund schedule table
- Color-coded refund percentages (green = 100%, yellow = 50%, red = 0%)
- Policy description and tiers
- Important information box
- Download button on each policy card
- Filename: `{Policy-Name}_Policy.pdf`

**User Experience:**
- Each policy card has a "Download PDF" button at the bottom
- Click to download professionally formatted PDF with:
  - Policy name and description
  - Refund schedule table
  - Color-coded refund amounts
  - Property name (if applicable)
  - Important information about how the policy works

---

## Technical Implementation

### Backend Changes

#### 1. PDF Service (`backend/src/services/pdf.service.ts`)

**New Function:** `generateCancellationPolicyPDF`

```typescript
export async function generateCancellationPolicyPDF(
  policy: {
    name: string;
    description: string | null;
    tiers: Array<{ days: number; refund: number }>;
  },
  propertyName?: string
): Promise<Buffer>
```

**Features:**
- Uses Puppeteer to generate PDF from HTML
- Sorts tiers by days (descending)
- Color-codes refund percentages in table
- Includes property name if provided
- Professional styling with brand colors (#047857)
- Responsive A4 layout with margins

**Existing Function:** `generateTermsPDF` (already existed)

#### 2. Legal Controller (`backend/src/controllers/legal.controller.ts`)

**New Method:** `downloadCancellationPolicyPDF`

- Route: `GET /api/legal/cancellation-policies/:id/pdf`
- Query params: `?propertyId={id}` (optional)
- Fetches policy from database
- Optionally fetches property name
- Generates PDF using pdf.service
- Returns PDF with proper headers (Content-Type, Content-Disposition)

**Imports Added:**
```typescript
import { propertyService } from '../services/property.service';
import { generateCancellationPolicyPDF } from '../services/pdf.service';
```

#### 3. Legal Routes (`backend/src/routes/legal.routes.ts`)

**New Route:**
```typescript
// PDF download route (public - no auth required for guests to download)
router.get(
  '/cancellation-policies/:id/pdf',
  legalController.downloadCancellationPolicyPDF
);
```

**Note:** No authentication required - guests can download policies

**Existing Route:** `GET /api/properties/:id/terms/pdf` (already existed)

### Frontend Changes

#### 1. Terms Tab (`frontend/src/pages/legal/components/TermsTab.tsx`)

**New Function:** `handleDownloadPDF`

- Fetches PDF from `/api/properties/${propertyId}/terms/pdf`
- Creates blob and triggers browser download
- Handles errors gracefully

**UI Changes:**
- Added "Download PDF" button at bottom
- Button positioned on left side of action bar
- Save/Cancel buttons moved to right side
- Download icon added (document with arrow)

```tsx
<Button
  variant="outline"
  onClick={handleDownloadPDF}
  leftIcon={<DownloadIcon />}
>
  Download PDF
</Button>
```

#### 2. Policy Card (`frontend/src/pages/legal/components/PolicyCard.tsx`)

**New Prop:** `propertyId?: string`

**New Function:** `handleDownloadPDF`

- Fetches PDF from `/api/legal/cancellation-policies/{id}/pdf`
- Includes `propertyId` query param if provided
- Creates blob and triggers browser download
- Handles errors gracefully

**UI Changes:**
- Added "Download PDF" button at bottom of each policy card
- Full-width button with download icon
- Styled to match card design

```tsx
<button
  onClick={handleDownloadPDF}
  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-border rounded-md transition-colors"
>
  <DownloadIcon />
  <span>Download PDF</span>
</button>
```

#### 3. Cancellation Policies Tab (`frontend/src/pages/legal/components/CancellationPoliciesTab.tsx`)

**Update:** Pass `propertyId` prop to PolicyCard

```tsx
<PolicyCard
  key={policy.id}
  policy={policy}
  propertyId={propertyId}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

## PDF Styling

Both PDFs use consistent professional styling:

### Color Scheme
- Primary: `#047857` (Brand Green)
- Headings: Brand Green
- Body Text: `#333`
- Muted Text: `#6b7280`

### Typography
- Font: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- Body: 11pt
- H1: 24pt
- H2: 18pt
- Line height: 1.6

### Layout
- Format: A4
- Margins: 20mm top/bottom, 15mm left/right
- Max width: 800px centered
- Professional spacing and padding

### Cancellation Policy Specific
- **Refund Table:**
  - Header: Brand green background, white text
  - Color-coded refund amounts:
    - 100% = Green (`#10b981`)
    - 50% = Yellow (`#f59e0b`)
    - 0% = Red (`#ef4444`)

- **Info Box:**
  - Light blue background (`#eff6ff`)
  - Blue border (`#3b82f6`)
  - Contains how-it-works explanation

---

## Files Modified

### Backend
1. `backend/src/services/pdf.service.ts` - Added `generateCancellationPolicyPDF` function
2. `backend/src/controllers/legal.controller.ts` - Added PDF download controller method
3. `backend/src/routes/legal.routes.ts` - Added PDF download route

### Frontend
1. `frontend/src/pages/legal/components/TermsTab.tsx` - Added download button and handler
2. `frontend/src/pages/legal/components/PolicyCard.tsx` - Added download button and handler
3. `frontend/src/pages/legal/components/CancellationPoliciesTab.tsx` - Pass propertyId to cards

---

## Testing Steps

### Test Terms & Conditions PDF

1. Navigate to: **Properties → [Select a property] → Legal tab → Terms & Conditions**
2. Edit/save some terms content
3. Click **"Download PDF"** button (bottom left)
4. Verify:
   - ✅ PDF downloads automatically
   - ✅ Filename is `Terms-{property-slug}.pdf`
   - ✅ PDF contains property name in header
   - ✅ All HTML formatting preserved (headings, lists, bold, italic)
   - ✅ Professional styling applied
   - ✅ Generated date in footer

### Test Cancellation Policy PDF

1. Navigate to: **Properties → [Select a property] → Legal tab → Cancellation Policies**
2. Find any policy card (system default or custom)
3. Click **"Download PDF"** button at bottom of card
4. Verify:
   - ✅ PDF downloads automatically
   - ✅ Filename is `{Policy-Name}_Policy.pdf` (e.g., `Flexible_Policy.pdf`)
   - ✅ PDF contains policy name and description
   - ✅ Refund schedule table shows all tiers
   - ✅ Refund percentages are color-coded (100%=green, 50%=yellow, 0%=red)
   - ✅ Property name appears if in property context
   - ✅ "Important Information" box included
   - ✅ Generated date in footer

---

## User Guide

### How Guests See Terms & Conditions:

1. **During booking:** Checkbox with "Terms & Conditions" link that opens a popup
2. **On property listing:** Link below cancellation policy in the Overview tab
3. **PDF download:** Can download terms as a PDF document from the property page

### How Guests See Cancellation Policies:

1. **During booking:** Policy details displayed in booking flow
2. **On property listing:** Policy shown on property overview
3. **PDF download:** Can download policy as a PDF document from each policy card

---

## Dependencies

**Required:** Puppeteer (already installed)

The PDF generation uses Puppeteer to render HTML to PDF. This package should already be installed in the backend:

```json
{
  "dependencies": {
    "puppeteer": "^21.x"
  }
}
```

---

## API Endpoints

### Terms & Conditions PDF

```
GET /api/properties/:id/terms/pdf
```

**Authentication:** Required (Bearer token)

**Parameters:**
- `id` - Property ID (path param)

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="Terms-{slug}.pdf"`

### Cancellation Policy PDF

```
GET /api/legal/cancellation-policies/:id/pdf?propertyId={propertyId}
```

**Authentication:** None required (public endpoint)

**Parameters:**
- `id` - Policy ID (path param)
- `propertyId` - Property ID (optional query param) - includes property name in PDF

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="{PolicyName}_Policy.pdf"`

---

## Future Enhancements (Optional)

1. **Preview Before Download:**
   - Add "Preview PDF" button that opens in new tab instead of downloading
   - Use `window.open()` with blob URL

2. **Email PDF:**
   - Add "Email PDF" button to send via email
   - Integration with notification service

3. **Bulk Download:**
   - Download all policies as ZIP
   - Combined PDF with all policies

4. **Customization:**
   - Let users customize PDF header/footer
   - Add property logo to PDF
   - Custom color schemes per property

5. **Privacy Policy & Refund Policy PDFs:**
   - Similar implementation for other legal documents
   - Combined "Legal Pack" PDF download

---

## Status

✅ **COMPLETE** - PDF download feature fully implemented for both Terms & Conditions and Cancellation Policies

**Next:** Restart backend server to test the functionality
