/**
 * BookingDetailSidebar Types
 */

import type { BookingWithDetails } from '@/types/booking.types';

export interface BookingDetailSidebarProps {
  booking: BookingWithDetails;
  onRecordPayment?: () => void;
  onSendConfirmation?: () => void;
  onNavigateBack?: () => void;
}
