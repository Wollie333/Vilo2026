# Checkout Modal Formatting Check

## Current Setup

The checkout page uses the **PolicyModal** component which already has comprehensive styling:

### Styling Applied:
- ✅ Professional typography (line-height 1.8)
- ✅ Proper heading sizes and colors (green theme)
- ✅ Paragraph spacing
- ✅ List formatting
- ✅ Bold and emphasis styling
- ✅ Links, blockquotes, tables
- ✅ Dark mode support

### Where Modals Are Used:

**GuestDetailsStep (Step 3 of checkout):**
1. **Privacy Policy** modal (line 506-515)
2. **Refund Policy** modal (line 517-526)
3. **Terms & Conditions** modal (line 528-537)

All three use the same `PolicyModal` component with the same styling.

---

## Potential Issue

If the content appears as **plain text without formatting**, the problem might be:

### 1. **Content stored as plain text (no HTML tags)**
If the content in the database is just:
```
This is the privacy policy.
You must agree to these terms.
```

Instead of:
```html
<h1>Privacy Policy</h1>
<p>This is the privacy policy.</p>
<p>You must agree to these terms.</p>
```

**Solution**: Content needs to be saved with HTML tags using the ReactQuill editor.

### 2. **Content has HTML but not displaying**
The PolicyModal uses `dangerouslySetInnerHTML` which should render HTML properly.

---

## To Diagnose:

Please share a screenshot of:
1. What the modal currently looks like when you click "Privacy Policy" or "Terms & Conditions" during checkout
2. What you want it to look like

This will help me identify if the issue is:
- CSS not applying
- Content missing HTML tags
- Different modal being used
- Something else

---

## Expected Appearance:

When properly formatted, the modal should show:
- **Large green heading** at the top (H1)
- **Section headings** in green (H2, H3)
- **Proper paragraph spacing** (1.25rem between paragraphs)
- **Bold text** in darker green
- **Bulleted lists** with proper indentation
- **Smooth, readable line spacing** (1.8 line-height)
- **Professional font** (system-ui, sans-serif)

---

## Quick Fix (If Content is Plain Text):

If the content is stored as plain text, we can auto-convert it to formatted HTML by:
1. Wrapping paragraphs in `<p>` tags
2. Detecting headings and wrapping in `<h2>` tags
3. Converting line breaks to proper spacing

But first, let me see the screenshot to confirm the issue!
