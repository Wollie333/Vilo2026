/**
 * Payment Schedule Service (Frontend)
 *
 * API client for payment schedule management.
 */

import { api } from './api.service';

/**
 * Payment schedule milestone
 */
export interface PaymentScheduleMilestone {
  id: string;
  booking_id: string;
  milestone_sequence: number;
  milestone_name: string;
  amount_due: number;
  currency: string;
  due_date: string; // ISO date string
  due_type: string;
  status: 'pending' | 'overdue' | 'paid' | 'partial' | 'cancelled';
  amount_paid: number;
  paid_at: string | null;
  created_from_rule_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get payment schedule for a booking
 */
export const getBookingPaymentSchedule = async (
  bookingId: string
): Promise<PaymentScheduleMilestone[]> => {
  const response = await api.get(`/bookings/${bookingId}/payment-schedule`);
  return response.data.data;
};

// Export as named export to match other services
export const paymentScheduleService = {
  getBookingPaymentSchedule,
};
