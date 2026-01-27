/**
 * Booking Wizard Controller
 *
 * Handles guest booking flow API endpoints
 */

import { Request, Response } from 'express';
import { bookingWizardService } from '../services/booking-wizard.service';
import * as authService from '../services/auth.service';
import { AppError } from '../utils/errors';

export class BookingWizardController {
  /**
   * Calculate pricing breakdown
   * POST /api/booking-wizard/calculate-pricing
   */
  async calculatePricing(req: Request, res: Response) {
    try {
      const pricingData = req.body;

      const pricing = await bookingWizardService.calculatePricing(pricingData);

      res.json({
        success: true,
        data: pricing,
      });
    } catch (error) {
      console.error('Calculate pricing error:', error);
      throw new AppError('INTERNAL_ERROR', 'Failed to calculate pricing');
    }
  }

  /**
   * Initiate booking (create pending booking)
   * POST /api/booking-wizard/initiate
   */
  async initiateBooking(req: Request, res: Response) {
    try {
      console.log('=== [BOOKING_WIZARD_CONTROLLER] initiateBooking called ===');
      const bookingData = req.body;
      console.log('[BOOKING_WIZARD_CONTROLLER] Payment method:', bookingData.payment_method);

      // Validate required fields
      if (!bookingData.property_id) {
        throw new AppError('BAD_REQUEST', 'Property ID is required');
      }
      if (!bookingData.check_in_date || !bookingData.check_out_date) {
        throw new AppError('BAD_REQUEST', 'Check-in and check-out dates are required');
      }
      if (!bookingData.rooms || bookingData.rooms.length === 0) {
        throw new AppError('BAD_REQUEST', 'At least one room is required');
      }

      // Check if booking via chat
      if (bookingData.payment_method === 'book_via_chat') {
        console.log('[BOOKING_WIZARD_CONTROLLER] Using book via chat flow');
        const result = await bookingWizardService.createBookingViaChat(bookingData);
        console.log('[BOOKING_WIZARD_CONTROLLER] Book via chat success:', result.booking_reference);

        res.json({
          success: true,
          data: result,
        });
      } else {
        console.log('[BOOKING_WIZARD_CONTROLLER] Using standard booking flow');
        const result = await bookingWizardService.initiateBooking(bookingData);

        res.json({
          success: true,
          data: result,
        });
      }
    } catch (error) {
      console.error('[BOOKING_WIZARD_CONTROLLER] Initiate booking error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('INTERNAL_ERROR', 'Failed to initiate booking');
    }
  }

  /**
   * Confirm booking after payment
   * POST /api/booking-wizard/confirm
   */
  async confirmBooking(req: Request, res: Response) {
    try {
      const { booking_id, user_id, payment_reference } = req.body;

      // Validate required fields
      if (!booking_id || !user_id || !payment_reference) {
        throw new AppError('BAD_REQUEST', 'Booking ID, user ID, and payment reference are required');
      }

      const result = await bookingWizardService.confirmBooking({
        booking_id,
        user_id,
        payment_reference,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Confirm booking error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('INTERNAL_ERROR', 'Failed to confirm booking');
    }
  }

  /**
   * Check if email exists
   * POST /api/booking-wizard/check-email
   */
  async checkEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('BAD_REQUEST', 'Email is required');
      }

      const exists = await authService.checkEmailExists(email);

      res.json({
        success: true,
        data: {
          exists,
        },
      });
    } catch (error) {
      console.error('Check email error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('INTERNAL_ERROR', 'Failed to check email');
    }
  }

  /**
   * Initialize payment with Paystack
   * POST /api/booking-wizard/initialize-payment
   */
  async initializePayment(req: Request, res: Response) {
    try {
      const { booking_id, property_id, guest_email, amount, currency } = req.body;

      // Validate required fields
      if (!booking_id || !property_id || !guest_email || !amount || !currency) {
        throw new AppError('BAD_REQUEST', 'Missing required payment information');
      }

      const result = await bookingWizardService.initializePayment({
        booking_id,
        property_id,
        guest_email,
        amount,
        currency,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Initialize payment error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('INTERNAL_ERROR', 'Failed to initialize payment');
    }
  }

  /**
   * Get available payment methods for a property
   * GET /api/booking-wizard/:propertyId/payment-methods
   */
  async getPaymentMethods(req: Request, res: Response) {
    try {
      console.log('=== [BOOKING_WIZARD_CONTROLLER] getPaymentMethods called ===');
      const { propertyId } = req.params;
      console.log('[BOOKING_WIZARD_CONTROLLER] Property ID:', propertyId);

      if (!propertyId) {
        throw new AppError('BAD_REQUEST', 'Property ID is required');
      }

      const methods = await bookingWizardService.getAvailablePaymentMethods(propertyId);
      console.log('[BOOKING_WIZARD_CONTROLLER] Payment methods:', methods);

      res.json({
        success: true,
        data: {
          payment_methods: methods,
        },
      });
    } catch (error) {
      console.error('[BOOKING_WIZARD_CONTROLLER] Get payment methods error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('INTERNAL_ERROR', 'Failed to get payment methods');
    }
  }

  /**
   * Verify payment with Paystack
   * POST /api/booking-wizard/verify-payment
   */
  async verifyPayment(req: Request, res: Response) {
    try {
      const { reference, booking_id, property_id } = req.body;

      // Validate required fields
      if (!reference || !booking_id || !property_id) {
        throw new AppError('BAD_REQUEST', 'Missing required verification information');
      }

      const result = await bookingWizardService.verifyPayment({
        reference,
        booking_id,
        property_id,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Verify payment error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('INTERNAL_ERROR', 'Failed to verify payment');
    }
  }
}

export const bookingWizardController = new BookingWizardController();
