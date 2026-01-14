export * from './auth.types';
export * from './api.types';
export * from './company.types';
export * from './location.types';
// Exclude Permission from billing.types as it conflicts with auth.types
export {
  type UserType,
  type UserTypeCategory, // NEW
  type CreateUserTypeData,
  type UpdateUserTypeData,
  type SubscriptionStatus,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  type BillingInterval,
  type PricingTiers,
  type LimitKey,
  type SubscriptionType,
  type CreateSubscriptionTypeData,
  type UpdateSubscriptionTypeData,
  type UserSubscription,
  type UserSubscriptionWithDetails,
  type CreateUserSubscriptionData,
  type UpdateUserSubscriptionData,
  type LimitCheckResult,
  type UserBillingInfo,
  type BillingOverview,
  type SubscriptionTypeListParams,
  type UserSubscriptionListParams,
  type UserSubscriptionListResponse,
  LIMIT_KEY_LABELS,
  DEFAULT_LIMITS,
  type UserTypePermission,
  type UserTypeWithPermissions,
  type SubscriptionTypePermission, // NEW
  type SubscriptionTypePermissionWithDetails, // NEW
  type SubscriptionTypeWithPermissions, // NEW
  type PermissionTemplate,
  type PermissionTemplateWithPermissions,
  type CreatePermissionTemplateData,
  type UpdatePermissionTemplateData,
  type BillingStatusColor,
  type BillingStatus,
  type SubscriptionLimit,
  type SubscriptionTypeWithLimits,
} from './billing.types';
export * from './company-team.types'; // NEW
export * from './checkout.types';
export * from './onboarding.types';
export * from './subscription-access.types';
export * from './invoice.types';
export * from './credit-note.types';
export * from './legal.types';
export * from './room.types';
export * from './property.types';
// addon.types is not re-exported as it duplicates room.types exports
// Use room.types for AddOn, AddonPricingType, ADDON_PRICING_TYPE_LABELS

// booking.types exports RefundRequest which conflicts with refund.types
// Exclude RefundRequest from booking.types and use the complete version from refund.types
export type {
  BookingStatus,
  BookingSource,
  RefundStatus,
  PaymentStatus,
  BookingRoom,
  Booking,
  BookingWithDetails,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingListParams,
  BookingListResponse,
  BookingStatistics,
  CreateRefundRequestRequest,
  ReviewRefundRequest,
  ProcessRefundRequest,
  CheckoutData,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  BOOKING_SOURCE_LABELS,
  BOOKING_SOURCE_COLORS,
  REFUND_STATUS_LABELS,
} from './booking.types';

export * from './refund.types';
export * from './credit-memo.types';
export * from './review.types';
export * from './discovery.types';
export * from './booking-wizard.types';
