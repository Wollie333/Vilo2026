/**
 * Main JavaScript Entry Point
 * Initializes all modules and components
 */

import { initNavigation } from './modules/navigation.js';
import { initSearchWidget } from './modules/search-widget.js';
import { initAnimations } from './modules/animations.js';
import { initGallery, initLightbox } from './modules/gallery.js';
import { initFormHandler } from './modules/form-handler.js';
import { initAccommodation } from './modules/accommodation.js';
import { initBookingGuestSelector } from './modules/booking-guest-selector.js';
import { initCheckout } from './modules/checkout.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation (header, mobile menu)
  initNavigation();

  // Initialize search widget (has internal guard check)
  initSearchWidget();

  // Initialize scroll animations
  initAnimations();

  // Initialize image gallery/carousel (has internal guard check)
  initGallery();

  // Initialize image lightbox (has internal guard check)
  initLightbox();

  // Initialize booking guest selector (has internal guard check)
  initBookingGuestSelector();

  // Initialize checkout flow (has internal guard check)
  initCheckout();

  // Initialize accommodation page filters and view toggle (has internal guard check)
  initAccommodation();

  // Initialize form handlers
  if (document.querySelector('form')) {
    initFormHandler();
  }

  console.log('✅ Serengeti Lodge - All modules initialized');
});
