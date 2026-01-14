/**
 * Booking Wizard Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware';
import { bookingWizardController } from '../controllers/booking-wizard.controller';

const router = Router();

/**
 * POST /api/booking-wizard/calculate-pricing
 * Calculate pricing breakdown for booking
 */
router.post(
  '/calculate-pricing',
  asyncHandler(bookingWizardController.calculatePricing.bind(bookingWizardController))
);

/**
 * POST /api/booking-wizard/initiate
 * Create pending booking (before payment)
 */
router.post(
  '/initiate',
  asyncHandler(bookingWizardController.initiateBooking.bind(bookingWizardController))
);

/**
 * POST /api/booking-wizard/confirm
 * Confirm booking after payment success
 */
router.post(
  '/confirm',
  asyncHandler(bookingWizardController.confirmBooking.bind(bookingWizardController))
);

/**
 * POST /api/booking-wizard/check-email
 * Check if email already exists
 */
router.post(
  '/check-email',
  asyncHandler(bookingWizardController.checkEmail.bind(bookingWizardController))
);

export default router;
