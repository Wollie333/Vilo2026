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
      const bookingData = req.body;

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

      const result = await bookingWizardService.initiateBooking(bookingData);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Initiate booking error:', error);
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
}

export const bookingWizardController = new BookingWizardController();
