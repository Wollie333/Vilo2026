/**
 * Search Widget Module
 * Handles booking search functionality
 */

export function initSearchWidget() {
  console.log('Search widget module loaded');

  // Get elements
  const guestsMinusBtn = document.getElementById('guests-minus');
  const guestsPlusBtn = document.getElementById('guests-plus');
  const guestsInput = document.getElementById('guests-count');
  const checkinInput = document.getElementById('checkin-date');
  const checkoutInput = document.getElementById('checkout-date');

  // Only initialize if elements exist on the page
  if (!guestsInput) return;

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  if (checkinInput) checkinInput.setAttribute('min', today);
  if (checkoutInput) checkoutInput.setAttribute('min', today);

  // Guest counter functionality
  if (guestsMinusBtn) {
    guestsMinusBtn.addEventListener('click', () => {
      const currentValue = parseInt(guestsInput.value);
      const minValue = parseInt(guestsInput.getAttribute('min')) || 1;

      if (currentValue > minValue) {
        guestsInput.value = currentValue - 1;
      }
    });
  }

  if (guestsPlusBtn) {
    guestsPlusBtn.addEventListener('click', () => {
      const currentValue = parseInt(guestsInput.value);
      const maxValue = parseInt(guestsInput.getAttribute('max')) || 10;

      if (currentValue < maxValue) {
        guestsInput.value = currentValue + 1;
      }
    });
  }

  // Update checkout min date when checkin changes
  if (checkinInput && checkoutInput) {
    checkinInput.addEventListener('change', () => {
      const checkinDate = new Date(checkinInput.value);
      checkinDate.setDate(checkinDate.getDate() + 1); // Next day
      checkoutInput.setAttribute('min', checkinDate.toISOString().split('T')[0]);

      // Clear checkout if it's before new min date
      if (checkoutInput.value && new Date(checkoutInput.value) < checkinDate) {
        checkoutInput.value = '';
      }
    });
  }

  console.log('Search widget initialized');
}
