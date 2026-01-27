/**
 * Booking Guest Selector Module
 * Handles the guest selector dropdown for room booking
 */

export function initBookingGuestSelector() {
  // Get elements
  const trigger = document.getElementById('guest-selector-trigger');
  const dropdown = document.getElementById('guest-selector-dropdown');
  const display = document.getElementById('guest-selector-display');
  const arrow = document.getElementById('guest-selector-arrow');

  // Only initialize if elements exist
  if (!trigger || !dropdown) return;

  // Counter elements
  const adultsCount = document.getElementById('adults-count');
  const adultsMinusBtn = document.getElementById('adults-minus');
  const adultsPlusBtn = document.getElementById('adults-plus');

  const childrenCount = document.getElementById('children-count');
  const childrenMinusBtn = document.getElementById('children-minus');
  const childrenPlusBtn = document.getElementById('children-plus');

  // State
  let adults = 2;
  let children = 0;
  let isOpen = false;

  // Update display text
  function updateDisplay() {
    const totalGuests = adults + children;
    let text = '';

    if (totalGuests === 1) {
      text = '1 Guest';
    } else {
      text = `${totalGuests} Guests`;
    }

    // Add breakdown if there are children
    if (children > 0) {
      text += ` (${adults} ${adults === 1 ? 'Adult' : 'Adults'}, ${children} ${children === 1 ? 'Child' : 'Children'})`;
    }

    display.textContent = text;
  }

  // Update counter displays
  function updateCounters() {
    adultsCount.textContent = adults;
    childrenCount.textContent = children;

    // Disable minus buttons at minimum
    adultsMinusBtn.disabled = adults <= 1;
    childrenMinusBtn.disabled = children <= 0;

    // Update button styles
    if (adults <= 1) {
      adultsMinusBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      adultsMinusBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    if (children <= 0) {
      childrenMinusBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      childrenMinusBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // Toggle dropdown
  function toggleDropdown() {
    isOpen = !isOpen;

    if (isOpen) {
      dropdown.classList.remove('hidden');
      arrow.style.transform = 'rotate(180deg)';
      trigger.classList.add('ring-2', 'ring-primary-500');
    } else {
      dropdown.classList.add('hidden');
      arrow.style.transform = 'rotate(0deg)';
      trigger.classList.remove('ring-2', 'ring-primary-500');
    }
  }

  // Close dropdown
  function closeDropdown() {
    if (isOpen) {
      isOpen = false;
      dropdown.classList.add('hidden');
      arrow.style.transform = 'rotate(0deg)';
      trigger.classList.remove('ring-2', 'ring-primary-500');
    }
  }

  // Event listeners
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Adults increment/decrement
  adultsPlusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (adults < 10) {
      adults++;
      updateCounters();
      updateDisplay();
    }
  });

  adultsMinusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (adults > 1) {
      adults--;
      updateCounters();
      updateDisplay();
    }
  });

  // Children increment/decrement
  childrenPlusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (children < 10) {
      children++;
      updateCounters();
      updateDisplay();
    }
  });

  childrenMinusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (children > 0) {
      children--;
      updateCounters();
      updateDisplay();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
      closeDropdown();
    }
  });

  // Prevent dropdown from closing when clicking inside it
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Initialize
  updateCounters();
  updateDisplay();

  console.log('✅ Booking guest selector initialized');
}
