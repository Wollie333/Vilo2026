import type {
  BookingWithDetails,
  BookingStatus,
  PaymentStatus,
  BookingSource,
} from '@/types/booking.types';

export interface BookingCardProps {
  /** The booking data to display */
  booking: BookingWithDetails;
  /** Whether the card is interactive (clickable) */
  interactive?: boolean;
  /** Whether the card is currently selected */
  selected?: boolean;
  /** Callback when the card is clicked */
  onClick?: () => void;
  /** Callback for view action */
  onView?: () => void;
  /** Callback for edit action */
  onEdit?: () => void;
  /** Callback for cancel action */
  onCancel?: () => void;
  /** Callback for check-in action */
  onCheckIn?: () => void;
  /** Callback for check-out action */
  onCheckOut?: () => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Show compact version of the card */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

export interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export interface BookingSourceBadgeProps {
  source: BookingSource;
  size?: 'sm' | 'md';
}

export interface GuestInfoDisplayProps {
  name: string;
  email: string;
  phone?: string | null;
  adults: number;
  children: number;
  infants: number;
  compact?: boolean;
}

export interface StayInfoDisplayProps {
  checkIn: string;
  checkOut: string;
  nights: number;
  propertyName?: string;
  rooms?: Array<{
    room_name: string;
    room_code?: string | null;
    adults: number;
    children: number;
  }>;
  compact?: boolean;
}

export interface BookingPricingDisplayProps {
  roomTotal: number;
  addonsTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  currency: string;
  compact?: boolean;
}

export interface BookingTimelineProps {
  statusHistory: BookingWithDetails['status_history'];
  createdAt: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  cancelledAt?: string | null;
  payments?: BookingWithDetails['payments'];
  invoiceGeneratedAt?: string | null;
  updatedAt?: string;
}

export interface BookingActionsProps {
  booking: BookingWithDetails;
  onView?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onSendConfirmation?: () => void;
  onGenerateInvoice?: () => void;
  compact?: boolean;
}
