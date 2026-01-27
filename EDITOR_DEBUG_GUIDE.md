# Legal Editor Debug Guide

## What I Just Added

I've added **visual debugging indicators** directly on the page so we can see what's happening without needing to open developer tools.

---

## Where to Look

Go to: **Admin → Billing Settings → Legal Settings tab**

---

## What You'll See Now

### 1. Yellow Debug Panel (Top of Page)
A yellow box that shows current state values:
```
DEBUG INFO:
isEditing: false or true
activeDocument: EXISTS or NULL
activeDocument?.title: (document name)
hasUnsavedChanges: false or true
editedTitle: (value)
editedContent length: (number)
```

### 2. Green Editor Indicator (When Editor Shows)
If the editor is rendering, you'll see a green box that says:
```
✅ EDITOR IS RENDERING! You should see the form below:
```

---

## Testing Steps

### Test 1: Check Initial State
1. Go to Legal Settings tab
2. Select any document type (Terms of Service, Privacy Policy, etc.)
3. **Look at the yellow debug panel**
4. Write down what you see:
   - isEditing: ______
   - activeDocument: ______
   - activeDocument?.title: ______

### Test 2: Click "Edit Document" Button
1. Click the "Edit Document" button
2. **Watch the yellow debug panel**
3. Does `isEditing` change from `false` to `true`? ______
4. Do you see the green "EDITOR IS RENDERING" box? ______
5. Do you see the form fields below it? ______

### Test 3: Click "Create First Version" Button
(Only if no document exists)
1. Click "Create First Version" button
2. **Watch the yellow debug panel**
3. Does `isEditing` change to `true`? ______
4. Do you see the green "EDITOR IS RENDERING" box? ______
5. Do you see the form fields below it? ______

---

## What We're Diagnosing

**Scenario A: isEditing stays FALSE**
- Problem: State not updating when button clicked
- Likely cause: Button click not calling handleStartEdit properly

**Scenario B: isEditing changes to TRUE, but no green box**
- Problem: Render condition not working
- Likely cause: React rendering issue or conditional logic problem

**Scenario C: Green box appears, but no form fields**
- Problem: Form components not rendering
- Likely cause: ReactQuill or Suspense issue

**Scenario D: Everything shows, but editor area is blank**
- Problem: ReactQuill not loading or CSS hiding it
- Likely cause: Import issue or styling conflict

---

## Next Steps

**Please test and tell me:**
1. What does the yellow debug panel show when you first load the page?
2. When you click "Edit Document", does isEditing change to true?
3. Do you see the green "EDITOR IS RENDERING" box?
4. What happens after that?

With this information, I can pinpoint exactly where the problem is!

---

## How to Remove Debug Panels Later

Once we fix the issue, I'll remove:
1. The yellow debug panel (lines 305-316 in LegalSettingsTab.tsx)
2. The green editor indicator (lines 363-368 in LegalSettingsTab.tsx)

These are temporary diagnostic tools.
