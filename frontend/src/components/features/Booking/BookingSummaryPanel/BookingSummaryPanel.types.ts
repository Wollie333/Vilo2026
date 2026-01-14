/**
 * BookingSummaryPanel Types
 */

import type { BookingWithDetails } from '@/types/booking.types';

export interface BookingSummaryPanelProps {
  booking: BookingWithDetails;
  onRecordPayment?: () => void;
}
