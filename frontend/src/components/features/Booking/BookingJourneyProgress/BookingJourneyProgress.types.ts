/**
 * BookingJourneyProgress Types
 */

import type { BookingStatus } from '@/types/booking.types';

export interface BookingJourneyProgressProps {
  status: BookingStatus;
  createdAt: string;
  confirmedAt?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  completedAt?: string | null;
}
