import type { Booking } from '@/types/booking.types';
import type { CreateRefundRequestDTO } from '@/types/refund.types';

export interface RefundRequestFormProps {
  booking: Booking;
  onSubmit: (data: CreateRefundRequestDTO) => Promise<void>;
  onCancel: () => void;
}
