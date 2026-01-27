# All Editable Legal Documents - Complete Guide

## ✅ All Documents Now Editable with Rich Text & Word Paste Support

---

## 📋 Property-Level Documents

### 1. Terms & Conditions (Property-specific)
**Location:** Property Detail → Legal Tab → Terms & Conditions

**What it is:** Property-specific terms that apply to bookings at that property

**Editor Features:**
- ✅ Full rich text editor (React Quill)
- ✅ Word paste support (preserves all formatting)
- ✅ Line spacing preservation
- ✅ Bold, italic, underline, headings
- ✅ Lists, links, images
- ✅ Colors and highlights
- ✅ PDF download
- ✅ Auto-save on click "Save Changes"

**How to Edit:**
1. Go to Properties → Select Property
2. Click "Legal" tab
3. Click "Terms & Conditions" in left sidebar
4. Edit content in rich text editor
5. Click "Save Changes"

**Where Guests See It:**
- Booking checkout (checkbox link)
- Property listing page
- Can download as PDF

---

### 2. Cancellation Policies (Property-specific)
**Location:** Property Detail → Legal Tab → Cancellation Policies

**What it is:** Structured refund policy with tiers (e.g., 7 days = 100% refund, 0 days = 0% refund)

**Editor Features:**
- ✅ Policy Name field
- ✅ **Rich text description editor** (NEW - with Word paste support)
- ✅ Refund tier builder (days + percentage)
- ✅ Visual timeline preview
- ✅ Color-coded tiers (green/yellow/red)

**How to Edit:**
1. Go to Properties → Select Property
2. Click "Legal" tab
3. Click "Cancellation Policies" in left sidebar
4. Click "Edit" on existing policy OR "Create New Policy"
5. **Policy Details:**
   - Enter Policy Name
   - Use rich text editor for description (can paste from Word!)
6. **Refund Tiers:**
   - Set days before check-in
   - Set refund percentage
   - Add/remove tiers as needed
7. Click "Save Changes"

**Where Guests See It:**
- Booking checkout (checkbox link opens modal)
- Property listing overview tab
- Modal shows policy name, description, and refund tiers with color coding

---

## 🏢 Platform-Level Documents (SaaS-wide)

### 3. Terms of Service (Platform-wide)
**Location:** Admin → Billing Settings → Legal Settings Tab

**What it is:** Platform-wide terms that apply to all users of the Vilo SaaS platform

**Editor Features:**
- ✅ Full rich text editor
- ✅ Word paste support (all formatting preserved)
- ✅ Version management
- ✅ Title and version fields
- ✅ Active/inactive status

**How to Edit:**
1. Go to Admin → Billing Settings
2. Click "Legal Settings" tab
3. Select "Terms of Service" card
4. Click "Edit Document"
5. Update Title, Version, and Content (paste from Word if needed)
6. Click "Save Changes"

**Where Users See It:**
- User signup
- Guest checkout (checkbox link)
- Footer links

---

### 4. Privacy Policy (Platform-wide)
**Location:** Admin → Billing Settings → Legal Settings Tab

**What it is:** Platform-wide privacy policy explaining data handling

**Editor Features:**
- ✅ Full rich text editor
- ✅ Word paste support
- ✅ Version management

**How to Edit:**
1. Go to Admin → Billing Settings
2. Click "Legal Settings" tab
3. Select "Privacy Policy" card
4. Click "Edit Document"
5. Update content (paste from Word if needed)
6. Click "Save Changes"

**Where Users See It:**
- Guest checkout (checkbox link)
- Footer links
- Signup flow

---

### 5. Cookie Policy (Platform-wide)
**Location:** Admin → Billing Settings → Legal Settings Tab

**What it is:** Platform-wide cookie usage and tracking information

**Editor Features:**
- ✅ Full rich text editor
- ✅ Word paste support
- ✅ Version management

**How to Edit:**
1. Go to Admin → Billing Settings
2. Click "Legal Settings" tab
3. Select "Cookie Policy" card
4. Click "Edit Document"
5. Update content
6. Click "Save Changes"

**Where Users See It:**
- Cookie banner links
- Footer links

---

### 6. Acceptable Use Policy (Platform-wide)
**Location:** Admin → Billing Settings → Legal Settings Tab

**What it is:** Rules for using the Vilo platform

**Editor Features:**
- ✅ Full rich text editor
- ✅ Word paste support
- ✅ Version management

**How to Edit:**
1. Go to Admin → Billing Settings
2. Click "Legal Settings" tab
3. Select "Acceptable Use Policy" card
4. Click "Edit Document"
5. Update content
6. Click "Save Changes"

**Where Users See It:**
- Footer links
- Admin dashboard

---

## 📄 Document Hierarchy

```
Platform Level (applies to all):
├── Terms of Service (platform-wide)
├── Privacy Policy (platform-wide)
├── Cookie Policy (platform-wide)
└── Acceptable Use Policy (platform-wide)

Property Level (specific to each property):
├── Terms & Conditions (property-specific)
└── Cancellation Policy (property-specific, structured data)
```

---

## ✨ Rich Text Editor Features (All Documents)

### Word Paste Support:
- ✅ **Line spacing** preserved (1.0, 1.5, Double, etc.)
- ✅ **Paragraph spacing** preserved (Space Before/After)
- ✅ **Headings** (H1-H6) with proper sizing
- ✅ **Bold, Italic, Underline, Strikethrough**
- ✅ **Text colors** and **highlights**
- ✅ **Lists** (bullet and numbered)
- ✅ **Alignment** (left, center, right, justify)
- ✅ **Indentation** (up to 8 levels)
- ✅ **Links** and **images**
- ✅ **Blockquotes** and **code blocks**

### How to Use:
1. Create your document in Microsoft Word
2. Format it exactly how you want (bold, headings, spacing, colors, etc.)
3. Copy all content (Ctrl+A, Ctrl+C)
4. Paste into Vilo editor (Ctrl+V)
5. Formatting is preserved automatically!
6. Click "Save Changes"

---

## 🔍 Where to Find Each Document Type

### For Property Owners:
1. **Terms & Conditions** → Properties → [Property Name] → Legal tab → Terms & Conditions
2. **Cancellation Policies** → Properties → [Property Name] → Legal tab → Cancellation Policies

### For Super Admins:
3. **Platform Legal Docs** → Admin → Billing Settings → Legal Settings tab

---

## 🆘 Troubleshooting

### "I can't find the document editor"
**Property documents:**
- Make sure you've selected a property first
- Click the "Legal" tab in property detail page

**Platform documents:**
- Go to Admin menu → Billing Settings
- Click "Legal Settings" tab
- You must be a super admin to access this

### "The editor won't load"
- Check your internet connection (React Quill loads dynamically)
- Wait a moment for the editor to initialize
- Refresh the page if needed

### "My formatting disappeared"
- Make sure you're using the rich text editor (not plain textarea)
- Paste using Ctrl+V (not right-click paste)
- Check that the content saved (look for success message)

### "Cancellation policy description is too small"
- The description field now has a rich text editor
- You can expand the window if needed
- Use headings and formatting to make content clearer

---

## 📊 Document Status Checklist

Use this to verify all your documents are ready:

### Property-Level:
- [ ] Property Terms & Conditions written and saved
- [ ] At least one Cancellation Policy created
- [ ] Cancellation Policy assigned to property
- [ ] Cancellation Policy description filled out (optional but recommended)

### Platform-Level:
- [ ] Terms of Service content created
- [ ] Privacy Policy content created
- [ ] Cookie Policy content created (if you use cookies)
- [ ] Acceptable Use Policy content created

---

## 💡 Best Practices

### For All Documents:
1. **Use clear headings** (H1, H2, H3) to organize content
2. **Bold important points** to draw attention
3. **Use lists** for terms, conditions, or steps
4. **Add proper spacing** between sections
5. **Include last updated date** at the top
6. **Keep language simple** and easy to understand
7. **Review legal compliance** with a lawyer if possible

### For Cancellation Policies:
1. **Name clearly** (e.g., "Flexible", "Moderate", "Strict")
2. **Write detailed description** explaining the policy
3. **Order tiers** from most lenient to strictest
4. **Use common timeframes** (7 days, 14 days, 30 days)
5. **Consider guest expectations** for your market

---

## 🎯 Summary

**Total Editable Document Types:** 6

**Property-Level:** 2
- Terms & Conditions ✅ Rich text with Word paste
- Cancellation Policy ✅ Rich text description + structured tiers

**Platform-Level:** 4
- Terms of Service ✅ Rich text with Word paste
- Privacy Policy ✅ Rich text with Word paste
- Cookie Policy ✅ Rich text with Word paste
- Acceptable Use Policy ✅ Rich text with Word paste

**All documents support:**
- ✅ Word paste with formatting preservation
- ✅ Line spacing and paragraph spacing
- ✅ Professional typography
- ✅ Dark mode
- ✅ Mobile responsive

**You can now create all legal documents in Word and paste them into Vilo with perfect formatting!** 🎉
