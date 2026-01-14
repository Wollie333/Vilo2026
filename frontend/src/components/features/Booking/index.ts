export {
  BookingCard,
  BookingStatusBadge,
  PaymentStatusBadge,
  BookingSourceBadge,
  GuestInfoDisplay,
  StayInfoDisplay,
  BookingPricingDisplay,
  BookingTimeline,
  BookingActions,
} from './BookingCard';

export type {
  BookingCardProps,
  BookingStatusBadgeProps,
  PaymentStatusBadgeProps,
  BookingSourceBadgeProps,
  GuestInfoDisplayProps,
  StayInfoDisplayProps,
  BookingPricingDisplayProps,
  BookingTimelineProps,
  BookingActionsProps,
} from './BookingCard.types';

export { PaymentScheduleDisplay } from './PaymentScheduleDisplay';
export { PaymentHistoryTable } from './PaymentHistoryTable';

// Comprehensive timeline for booking history
export { BookingTimeline as BookingHistoryTimeline } from './BookingTimeline';
export type { BookingTimelineProps as BookingHistoryTimelineProps } from './BookingTimeline';

export { BookingLockBanner } from './BookingLockBanner';
export type { BookingLockBannerProps } from './BookingLockBanner';

export { PaymentProofViewer } from './PaymentProofViewer';
export type { PaymentProofViewerProps } from './PaymentProofViewer.types';

export { PaymentProofActions } from './PaymentProofActions';
export type { PaymentProofActionsProps } from './PaymentProofActions.types';

export { PaymentStatusBanner } from './PaymentStatusBanner';
export type { PaymentStatusBannerProps } from './PaymentStatusBanner.types';

// New modern redesign components
export { BookingDetailSidebar } from './BookingDetailSidebar';
export type { BookingDetailSidebarProps } from './BookingDetailSidebar';

export { BookingJourneyProgress } from './BookingJourneyProgress';
export type { BookingJourneyProgressProps } from './BookingJourneyProgress';

export { BookingSummaryPanel } from './BookingSummaryPanel';
export type { BookingSummaryPanelProps } from './BookingSummaryPanel';

export { EnhancedRoomCard } from './EnhancedRoomCard';
export type { EnhancedRoomCardProps, RoomDetails } from './EnhancedRoomCard';

export { EnhancedAddonCard } from './EnhancedAddonCard';
export type { EnhancedAddonCardProps, AddonDetails } from './EnhancedAddonCard';
