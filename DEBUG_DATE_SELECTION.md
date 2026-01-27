# Debug Guide: Date Selection Not Working on Booking Wizard

## Issue
User reports they cannot select the date range on the checkout/booking wizard.

## Debug Logging Added

I've added comprehensive logging to trace the date selection flow. Here's what to check:

### Step 1: Check if date picker button opens modal

**Action:** Navigate to the booking wizard and click the date selector button.

**Expected Logs:**
```
📅 [DatesRoomsStep] Opening date picker modal
📅 [DatePickerModal] Rendering: {
  isOpen: true,
  mode: "range",
  checkIn: "...",
  checkOut: "..."
}
```

**If modal doesn't open:**
- Check browser console for JavaScript errors
- Check if button click is registered in logs
- Modal might be blocked by CSS (z-index issue)
- Check browser DevTools Elements tab to see if modal exists in DOM

### Step 2: Check if dates can be clicked

**Action:** Try clicking on a date in the calendar.

**Expected Logs:**
```
📅 [DatePickerModal] Date clicked: "1/23/2026"
📅 [DatePickerModal] Range mode - starting new selection
```

**For second date click:**
```
📅 [DatePickerModal] Date clicked: "1/28/2026"
📅 [DatePickerModal] Range mode - completing range
✅ [DatePickerModal] Range selected: {
  checkIn: "1/23/2026",
  checkOut: "1/28/2026"
}
```

**If dates don't click:**
- Check if log shows "Date is null or disabled"
- Dates in the past are disabled (grayed out)
- Check if calendar grid is rendering correctly
- Possible z-index conflict preventing clicks

### Step 3: Check if confirm button works

**Action:** After selecting dates, click "Confirm Dates" button.

**Expected Logs:**
```
✅ [DatePickerModal] Confirm clicked: {
  checkIn: "1/23/2026",
  checkOut: "1/28/2026"
}
📅 [DatePickerModal] Calling onDateSelect
📅 [DatesRoomsStep] Received date selection: {
  checkIn: "1/23/2026",
  checkOut: "1/28/2026"
}
```

**If confirm doesn't work:**
- Button might be disabled (needs both check-in and check-out selected)
- Check if error appears in console
- Modal might not be closing after confirmation

## Common Issues and Fixes

### Issue 1: Modal doesn't appear
**Symptoms:** Button click works but modal is invisible

**Possible Causes:**
1. Z-index conflict with other elements
2. Modal component not imported correctly
3. CSS styles not loading

**Debug Steps:**
- Check browser DevTools → Elements tab
- Search for elements with `DatePickerModal` or `modal` in className
- Check if modal div exists but is hidden (opacity, display, etc.)
- Look for z-index values on modal (should be high, like z-50 or z-9999)

**Fix:**
Check the Modal component z-index in `frontend/src/components/ui/Modal/Modal.tsx`

### Issue 2: Dates are all grayed out/disabled
**Symptoms:** Calendar appears but all dates are unclickable

**Possible Causes:**
1. `minDate` is set incorrectly
2. All dates are in the past
3. Date validation logic is too restrictive

**Debug Steps:**
- Check console for "Date is null or disabled" logs
- Verify today's date is correct
- Check `DatesRoomsStep.tsx` line 165: `minDate={new Date()}`

**Fix:**
```typescript
// In DatePickerModal.tsx, check isDateDisabled function
const isDateDisabled = (date: Date | null): boolean => {
  if (!date) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date < minDate) return true; // This might be the issue
  // ...
}
```

### Issue 3: First date selects but second date doesn't
**Symptoms:** Can click one date but not complete the range

**Possible Causes:**
1. State management issue (checkIn/checkOut state)
2. Date comparison logic error
3. Click handler not firing for second click

**Debug Steps:**
- Look for first date selection log
- Try clicking second date and check for log
- Verify range mode is active

**Fix:**
Check DatePickerModal.tsx lines 114-133 (handleDateClick function)

### Issue 4: Dates select but don't show after confirming
**Symptoms:** Modal confirms but dates don't appear in booking wizard

**Possible Causes:**
1. `onDateSelect` callback not working
2. Parent component state not updating
3. Date format mismatch

**Debug Steps:**
- Check for "Received date selection" log in DatesRoomsStep
- Verify dates are shown in the date selector button
- Check BookingWizardPage state management

**Fix:**
Check BookingWizardPage.tsx date state management (checkIn/checkOut useState)

## Quick Test Checklist

1. [ ] Open browser console (F12)
2. [ ] Navigate to `/book/[property-slug]`
3. [ ] Click on the date selector button
4. [ ] See modal open (📅 logs appear)
5. [ ] Click a future date (check-in)
6. [ ] Click another future date (check-out)
7. [ ] See range selected in modal
8. [ ] Click "Confirm Dates" button
9. [ ] See dates appear in the booking wizard
10. [ ] Report console output if any step fails

## Files Modified for Debugging

1. `frontend/src/pages/booking-wizard/steps/DatesRoomsStep.tsx`:
   - Line 128-130: Button click logging
   - Lines 49-59: Date selection callback logging

2. `frontend/src/components/ui/DatePickerModal/DatePickerModal.tsx`:
   - Lines 184-189: Modal render logging
   - Lines 100-134: Date click logging
   - Lines 158-171: Confirm button logging

## Browser DevTools Inspection

If modal is not visible, check:

1. **Elements Tab:**
   ```
   Look for: <div class="...modal..." style="...">
   Check: display, opacity, z-index, position
   ```

2. **Console Tab:**
   ```
   Look for: Any JavaScript errors or warnings
   ```

3. **Network Tab:**
   ```
   Check: If all CSS files loaded successfully
   ```

## Next Steps

Run through the test checklist and share:
1. All console logs that appear
2. What step fails
3. Any error messages in console
4. Screenshot of the issue if possible

This will help identify the exact problem! 🔍
