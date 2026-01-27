/**
 * Checkout Module
 * Handles 4-step booking wizard flow matching Vilo's booking process
 */

export function initCheckout() {
  // Check if on checkout page
  if (!document.getElementById('step-1')) return;

  // State
  const bookingData = {
    // Step 1
    checkin: null,
    checkout: null,
    nights: 0,
    room: null,
    roomPrice: 0,
    roomName: '',
    adults: 2,
    children: 0,
    childrenAges: [],

    // Step 2
    addons: [],

    // Step 3
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    specialRequests: '',
    promoCode: null,
    discount: 0,
    paymentMethod: 'card',
    termsAccepted: false,
    marketingConsent: false,

    // Pricing
    roomTotal: 0,
    addonsTotal: 0,
    subtotal: 0,
    tax: 0,
    total: 0
  };

  let currentStep = 1;

  // Mock promo codes
  const promoCodes = {
    'SAFARI10': { type: 'percentage', value: 10 },
    'WELCOME20': { type: 'percentage', value: 20 },
    'SUMMER50': { type: 'fixed_amount', value: 50 }
  };

  // Initialize
  initStep1();
  initStep2();
  initStep3();
  updateStep();

  // Navigation buttons
  document.getElementById('next-btn').addEventListener('click', nextStep);
  document.getElementById('prev-btn').addEventListener('click', prevStep);

  // ==================== STEP 1: DATES & ROOMS ====================

  function initStep1() {
    const checkinInput = document.getElementById('checkin-date');
    const checkoutInput = document.getElementById('checkout-date');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    checkinInput.min = today;
    checkoutInput.min = today;

    // Date change handlers
    checkinInput.addEventListener('change', () => {
      bookingData.checkin = checkinInput.value;

      // Set checkout min to day after checkin
      if (bookingData.checkin) {
        const checkinDate = new Date(bookingData.checkin);
        checkinDate.setDate(checkinDate.getDate() + 1);
        checkoutInput.min = checkinDate.toISOString().split('T')[0];
      }

      calculateNights();
      updatePricing();
    });

    checkoutInput.addEventListener('change', () => {
      bookingData.checkout = checkoutInput.value;
      calculateNights();
      updatePricing();
    });

    // Room selection
    const roomRadios = document.querySelectorAll('.room-radio');
    roomRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          bookingData.room = e.target.value;
          bookingData.roomPrice = parseFloat(e.target.dataset.price);
          bookingData.roomName = e.target.dataset.name;

          // Update all room cards to inactive state
          document.querySelectorAll('.room-option').forEach(option => {
            option.classList.remove('border-primary-500', 'bg-primary-50');
            option.classList.add('border-gray-200');

            // Reset all radio button visual states
            const radioLabel = option.querySelector('label[for^="room-"]');
            const radioCheckmark = option.querySelector('.radio-checkmark');
            if (radioLabel && radioCheckmark) {
              radioLabel.classList.remove('bg-primary-500', 'border-primary-500');
              radioLabel.classList.add('border-gray-300');
              radioCheckmark.classList.add('hidden');
            }
          });

          // Add active state to selected room card
          const selectedCard = e.target.closest('.room-option');
          selectedCard.classList.remove('border-gray-200');
          selectedCard.classList.add('border-primary-500', 'bg-primary-50');

          // Update selected radio button visual state
          const radioLabel = e.target.nextElementSibling;
          const radioCheckmark = radioLabel.querySelector('.radio-checkmark');
          radioLabel.classList.remove('border-gray-300');
          radioLabel.classList.add('bg-primary-500', 'border-primary-500');
          radioCheckmark.classList.remove('hidden');

          // Show guest section
          document.getElementById('guest-section').classList.remove('hidden');

          calculateRoomTotal();
          updatePricing();
          updateSummary();
        }
      });
    });

    // Make entire room card clickable
    document.querySelectorAll('.room-option').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on a label (which already triggers the radio)
        if (e.target.tagName !== 'LABEL') {
          const radio = card.querySelector('.room-radio');
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
        }
      });
    });

    // Adults/Children count
    document.getElementById('adults-count').addEventListener('change', (e) => {
      bookingData.adults = parseInt(e.target.value);
      updateSummary();
      updatePricing(); // Affects per_guest addons
    });

    document.getElementById('children-count').addEventListener('change', (e) => {
      bookingData.children = parseInt(e.target.value);
      updateChildrenAges();
      updateSummary();
      updatePricing(); // Affects per_guest addons
    });
  }

  function calculateNights() {
    if (bookingData.checkin && bookingData.checkout) {
      const checkin = new Date(bookingData.checkin);
      const checkout = new Date(bookingData.checkout);
      const diffTime = checkout - checkin;
      bookingData.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (bookingData.nights > 0) {
        document.getElementById('nights-display').textContent = `${bookingData.nights} night${bookingData.nights > 1 ? 's' : ''} selected`;
      } else {
        document.getElementById('nights-display').textContent = 'Check-out must be after check-in';
      }

      calculateRoomTotal();
    }
  }

  function calculateRoomTotal() {
    if (bookingData.roomPrice && bookingData.nights > 0) {
      bookingData.roomTotal = bookingData.roomPrice * bookingData.nights;
    } else {
      bookingData.roomTotal = 0;
    }
  }

  function updateChildrenAges() {
    const agesSection = document.getElementById('children-ages');
    const agesInputs = document.getElementById('children-ages-inputs');

    if (bookingData.children > 0) {
      agesSection.classList.remove('hidden');
      agesInputs.innerHTML = '';
      bookingData.childrenAges = [];

      for (let i = 0; i < bookingData.children; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.max = 17;
        input.placeholder = `Child ${i + 1} age`;
        input.required = true;
        input.classList.add('w-full', 'px-4', 'py-3', 'border', 'border-gray-300', 'rounded-lg', 'focus:outline-none', 'focus:ring-2', 'focus:ring-primary-500');
        input.addEventListener('input', (e) => {
          bookingData.childrenAges[i] = parseInt(e.target.value);
        });
        agesInputs.appendChild(input);
      }
    } else {
      agesSection.classList.add('hidden');
      bookingData.childrenAges = [];
    }
  }

  function validateStep1() {
    let valid = true;

    // Clear errors
    document.getElementById('checkin-error').classList.add('hidden');
    document.getElementById('checkout-error').classList.add('hidden');
    document.getElementById('room-error').classList.add('hidden');
    document.getElementById('ages-error').classList.add('hidden');

    // Check-in
    if (!bookingData.checkin) {
      document.getElementById('checkin-error').textContent = 'Check-in date is required';
      document.getElementById('checkin-error').classList.remove('hidden');
      valid = false;
    }

    // Check-out
    if (!bookingData.checkout) {
      document.getElementById('checkout-error').textContent = 'Check-out date is required';
      document.getElementById('checkout-error').classList.remove('hidden');
      valid = false;
    } else if (bookingData.nights <= 0) {
      document.getElementById('checkout-error').textContent = 'Check-out must be after check-in';
      document.getElementById('checkout-error').classList.remove('hidden');
      valid = false;
    }

    // Room
    if (!bookingData.room) {
      document.getElementById('room-error').classList.remove('hidden');
      valid = false;
    }

    // Children ages
    if (bookingData.children > 0) {
      const allAgesEntered = bookingData.childrenAges.length === bookingData.children &&
                              bookingData.childrenAges.every(age => age >= 0 && age <= 17);
      if (!allAgesEntered) {
        document.getElementById('ages-error').classList.remove('hidden');
        valid = false;
      }
    }

    return valid;
  }

  // ==================== STEP 2: ADD-ONS ====================

  function initStep2() {
    // Addon checkboxes
    const addonCheckboxes = document.querySelectorAll('.addon-checkbox');

    addonCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const item = e.target.closest('.addon-item');
        const qtySection = item.querySelector('.addon-quantity');
        const checkboxLabel = e.target.nextElementSibling;
        const checkmarkIcon = checkboxLabel.querySelector('.checkmark-icon');

        if (e.target.checked) {
          qtySection.classList.remove('hidden');

          // Add active state to selected addon card
          item.classList.remove('border-gray-200');
          item.classList.add('border-primary-500', 'bg-primary-50');

          // Update checkbox visual state
          checkboxLabel.classList.remove('border-gray-300');
          checkboxLabel.classList.add('bg-primary-500', 'border-primary-500');
          checkmarkIcon.classList.remove('hidden');

          // Add to bookingData
          const addon = {
            id: e.target.value,
            name: e.target.dataset.name,
            price: parseFloat(e.target.dataset.price),
            type: e.target.dataset.type,
            quantity: 1
          };
          bookingData.addons.push(addon);
        } else {
          qtySection.classList.add('hidden');

          // Remove active state from deselected addon card
          item.classList.remove('border-primary-500', 'bg-primary-50');
          item.classList.add('border-gray-200');

          // Update checkbox visual state
          checkboxLabel.classList.remove('bg-primary-500', 'border-primary-500');
          checkboxLabel.classList.add('border-gray-300');
          checkmarkIcon.classList.add('hidden');

          // Remove from bookingData
          bookingData.addons = bookingData.addons.filter(a => a.id !== e.target.value);
        }

        updatePricing();
        updateSummary();
      });

      // Quantity controls
      const item = checkbox.closest('.addon-item');
      const minusBtn = item.querySelector('.qty-minus');
      const plusBtn = item.querySelector('.qty-plus');
      const qtyInput = item.querySelector('.qty-input');

      minusBtn.addEventListener('click', () => {
        let currentQty = parseInt(qtyInput.value);
        if (currentQty > 1) {
          qtyInput.value = currentQty - 1;
          updateAddonQuantity(checkbox.value, currentQty - 1);
        }
      });

      plusBtn.addEventListener('click', () => {
        let currentQty = parseInt(qtyInput.value);
        if (currentQty < 10) {
          qtyInput.value = currentQty + 1;
          updateAddonQuantity(checkbox.value, currentQty + 1);
        }
      });
    });
  }

  function updateAddonQuantity(addonId, quantity) {
    const addon = bookingData.addons.find(a => a.id === addonId);
    if (addon) {
      addon.quantity = quantity;
      updatePricing();
      updateSummary();
    }
  }

  function calculateAddonPrice(addon) {
    const basePrice = addon.price * addon.quantity;
    const totalGuests = bookingData.adults + bookingData.children;

    switch (addon.type) {
      case 'per_booking':
        return basePrice;
      case 'per_night':
        return basePrice * bookingData.nights;
      case 'per_guest':
        return basePrice * totalGuests;
      case 'per_room':
        return basePrice; // Single room
      default:
        return basePrice;
    }
  }

  // ==================== STEP 3: GUEST DETAILS & PAYMENT ====================

  function initStep3() {
    // Guest info inputs
    document.getElementById('first-name').addEventListener('input', (e) => {
      bookingData.firstName = e.target.value;
    });

    document.getElementById('last-name').addEventListener('input', (e) => {
      bookingData.lastName = e.target.value;
    });

    document.getElementById('email').addEventListener('input', (e) => {
      bookingData.email = e.target.value;
    });

    document.getElementById('phone').addEventListener('input', (e) => {
      bookingData.phone = e.target.value;
    });

    document.getElementById('password').addEventListener('input', (e) => {
      bookingData.password = e.target.value;
    });

    document.getElementById('special-requests').addEventListener('input', (e) => {
      bookingData.specialRequests = e.target.value;
    });

    // Promo code
    document.getElementById('apply-promo').addEventListener('click', applyPromoCode);

    // Payment method
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    paymentRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        bookingData.paymentMethod = e.target.value;
      });
    });

    // Terms checkbox
    document.getElementById('terms-checkbox').addEventListener('change', (e) => {
      bookingData.termsAccepted = e.target.checked;
    });

    // Marketing checkbox
    document.getElementById('marketing-checkbox').addEventListener('change', (e) => {
      bookingData.marketingConsent = e.target.checked;
    });
  }

  function applyPromoCode() {
    const promoInput = document.getElementById('promo-code');
    const code = promoInput.value.toUpperCase().trim();
    const successMsg = document.getElementById('promo-success');
    const errorMsg = document.getElementById('promo-error');

    // Clear messages
    successMsg.classList.add('hidden');
    errorMsg.classList.add('hidden');

    if (!code) {
      errorMsg.textContent = 'Please enter a promo code';
      errorMsg.classList.remove('hidden');
      return;
    }

    const promo = promoCodes[code];

    if (!promo) {
      errorMsg.textContent = 'Invalid promo code';
      errorMsg.classList.remove('hidden');
      bookingData.promoCode = null;
      bookingData.discount = 0;
      updatePricing();
      return;
    }

    // Calculate discount
    bookingData.promoCode = code;
    const subtotal = bookingData.roomTotal + bookingData.addonsTotal;

    if (promo.type === 'percentage') {
      bookingData.discount = (subtotal * promo.value) / 100;
      successMsg.textContent = `Promo code applied! ${promo.value}% discount`;
    } else if (promo.type === 'fixed_amount') {
      bookingData.discount = Math.min(promo.value, subtotal);
      successMsg.textContent = `Promo code applied! $${promo.value} discount`;
    }

    successMsg.classList.remove('hidden');
    updatePricing();
  }

  function validateStep3() {
    let valid = true;

    // Clear errors
    document.getElementById('firstname-error').classList.add('hidden');
    document.getElementById('lastname-error').classList.add('hidden');
    document.getElementById('email-error').classList.add('hidden');
    document.getElementById('phone-error').classList.add('hidden');
    document.getElementById('password-error').classList.add('hidden');
    document.getElementById('terms-error').classList.add('hidden');

    // First name
    if (bookingData.firstName.length < 2) {
      document.getElementById('firstname-error').classList.remove('hidden');
      valid = false;
    }

    // Last name
    if (bookingData.lastName.length < 2) {
      document.getElementById('lastname-error').classList.remove('hidden');
      valid = false;
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.email)) {
      document.getElementById('email-error').classList.remove('hidden');
      valid = false;
    }

    // Phone (min 7 digits)
    const phoneDigits = bookingData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      document.getElementById('phone-error').classList.remove('hidden');
      valid = false;
    }

    // Password (min 8 chars, uppercase, lowercase, number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(bookingData.password)) {
      document.getElementById('password-error').classList.remove('hidden');
      valid = false;
    }

    // Terms
    if (!bookingData.termsAccepted) {
      document.getElementById('terms-error').classList.remove('hidden');
      valid = false;
    }

    return valid;
  }

  // ==================== PRICING & SUMMARY ====================

  function updatePricing() {
    // Calculate addon total
    bookingData.addonsTotal = bookingData.addons.reduce((sum, addon) => {
      return sum + calculateAddonPrice(addon);
    }, 0);

    // Subtotal
    bookingData.subtotal = bookingData.roomTotal + bookingData.addonsTotal;

    // Tax (15%)
    const afterDiscount = Math.max(0, bookingData.subtotal - bookingData.discount);
    bookingData.tax = afterDiscount * 0.15;

    // Total
    bookingData.total = afterDiscount + bookingData.tax;

    // Update UI
    document.getElementById('pricing-room').textContent = bookingData.roomTotal.toFixed(2);
    document.getElementById('pricing-subtotal').textContent = bookingData.subtotal.toFixed(2);
    document.getElementById('pricing-tax').textContent = bookingData.tax.toFixed(2);
    document.getElementById('pricing-total').textContent = bookingData.total.toFixed(2);

    // Addons row
    if (bookingData.addonsTotal > 0) {
      document.getElementById('pricing-addons').textContent = bookingData.addonsTotal.toFixed(2);
      document.getElementById('pricing-addons-row').classList.remove('hidden');
    } else {
      document.getElementById('pricing-addons-row').classList.add('hidden');
    }

    // Discount row
    if (bookingData.discount > 0) {
      document.getElementById('pricing-discount').textContent = bookingData.discount.toFixed(2);
      document.getElementById('discount-code').textContent = bookingData.promoCode;
      document.getElementById('pricing-discount-row').classList.remove('hidden');
    } else {
      document.getElementById('pricing-discount-row').classList.add('hidden');
    }
  }

  function updateSummary() {
    // Room info
    if (bookingData.room) {
      document.getElementById('summary-room').classList.remove('hidden');
      document.getElementById('summary-room-name').textContent = bookingData.roomName;
      document.getElementById('summary-nights').textContent = bookingData.nights;
      document.getElementById('summary-room-price').textContent = bookingData.roomPrice;
      document.getElementById('summary-room-total').textContent = bookingData.roomTotal.toFixed(0);
    }

    // Guests
    const totalGuests = bookingData.adults + bookingData.children;
    if (totalGuests > 0) {
      document.getElementById('summary-guests-section').classList.remove('hidden');
      let guestText = `${bookingData.adults} Adult${bookingData.adults > 1 ? 's' : ''}`;
      if (bookingData.children > 0) {
        guestText += `, ${bookingData.children} Child${bookingData.children > 1 ? 'ren' : ''}`;
      }
      document.getElementById('summary-guests').textContent = guestText;
    }

    // Addons
    const addonsSummary = document.getElementById('summary-addons');
    if (bookingData.addons.length > 0) {
      addonsSummary.classList.remove('hidden');
      addonsSummary.innerHTML = bookingData.addons.map(addon => {
        const price = calculateAddonPrice(addon);
        return `
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">${addon.name} (×${addon.quantity})</span>
            <span class="font-medium">$${price.toFixed(2)}</span>
          </div>
        `;
      }).join('');
    } else {
      addonsSummary.classList.add('hidden');
    }
  }

  // ==================== STEP 4: CONFIRMATION ====================

  function showConfirmation() {
    // Generate booking reference
    const reference = `SL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    document.getElementById('booking-reference').textContent = reference;

    // Booking details
    const checkinDate = new Date(bookingData.checkin).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const checkoutDate = new Date(bookingData.checkout).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    document.getElementById('confirm-checkin').textContent = checkinDate;
    document.getElementById('confirm-checkout').textContent = checkoutDate;
    document.getElementById('confirm-room').textContent = bookingData.roomName;

    let guestText = `${bookingData.adults} Adult${bookingData.adults > 1 ? 's' : ''}`;
    if (bookingData.children > 0) {
      guestText += `, ${bookingData.children} Child${bookingData.children > 1 ? 'ren' : ''}`;
    }
    document.getElementById('confirm-guests').textContent = guestText;

    // Guest info
    document.getElementById('confirm-name').textContent = `${bookingData.firstName} ${bookingData.lastName}`;
    document.getElementById('confirm-email').textContent = bookingData.email;
    document.getElementById('confirm-email-copy').textContent = bookingData.email;

    // Payment
    document.getElementById('confirm-total').textContent = `$${bookingData.total.toFixed(2)}`;

    const paymentMethods = {
      'card': 'Credit/Debit Card',
      'paypal': 'PayPal',
      'bank': 'Bank Transfer'
    };
    document.getElementById('confirm-payment').textContent = paymentMethods[bookingData.paymentMethod];
  }

  // ==================== NAVIGATION ====================

  function nextStep() {
    // Validate current step
    if (currentStep === 1 && !validateStep1()) {
      return;
    }

    if (currentStep === 3 && !validateStep3()) {
      return;
    }

    // Move to next step
    if (currentStep < 4) {
      currentStep++;

      // Show confirmation when reaching step 4
      if (currentStep === 4) {
        showConfirmation();
      }

      updateStep();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      updateStep();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function updateStep() {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
      step.classList.add('hidden');
    });

    // Show current step
    document.getElementById(`step-${currentStep}`).classList.remove('hidden');

    // Update progress indicators
    for (let i = 1; i <= 4; i++) {
      const circle = document.getElementById(`step-${i}-circle`);
      const label = document.getElementById(`step-${i}-label`);

      if (i < currentStep) {
        // Completed - show checkmark
        circle.className = 'w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold mb-2 text-sm';
        circle.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
        `;
        label.className = 'text-xs font-medium text-green-600 text-center';
      } else if (i === currentStep) {
        // Current - show step number
        circle.className = 'w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold mb-2 text-sm';
        circle.textContent = i;
        label.className = 'text-xs font-medium text-primary-600 text-center';
      } else {
        // Future - show step number
        circle.className = 'w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold mb-2 text-sm';
        circle.textContent = i;
        label.className = 'text-xs font-medium text-gray-500 text-center';
      }
    }

    // Update progress lines
    for (let i = 1; i < 4; i++) {
      const line = document.getElementById(`progress-${i}`);
      if (i < currentStep) {
        line.style.width = '100%';
      } else {
        line.style.width = '0%';
      }
    }

    // Update buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (currentStep === 1) {
      prevBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
    }

    if (currentStep === 4) {
      nextBtn.classList.add('hidden');
    } else {
      nextBtn.classList.remove('hidden');
    }
  }

  console.log('✅ Checkout module initialized');
}
