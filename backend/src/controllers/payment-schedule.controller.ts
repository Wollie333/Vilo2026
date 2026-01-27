/**
 * Payment Schedule Controller
 *
 * Handles HTTP requests for payment schedule management.
 */

import { Request, Response } from 'express';
import { getBookingPaymentSchedule } from '../services/payment-schedule.service';
import { AppError } from '../utils/errors';

/**
 * Get payment schedule for a booking
 * GET /api/bookings/:id/payment-schedule
 */
export const getBookingSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('BAD_REQUEST', 'Booking ID is required');
    }

    const schedule = await getBookingPaymentSchedule(id);

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment schedule',
    });
  }
};
