import React from 'react';
import { Card } from '@/components/ui';
import { HiOutlineCube } from 'react-icons/hi';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  BOOKING_SOURCE_LABELS,
  BOOKING_SOURCE_COLORS,
  formatBookingReference,
  formatCurrency,
  formatDateRange,
  getGuestCount,
  canCheckIn,
  canCheckOut,
  isBookingCancellable,
} from '@/types/booking.types';
import type {
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

// ============================================================================
// BOOKING STATUS BADGE
// ============================================================================

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const colors = BOOKING_STATUS_COLORS[status];
  const label = BOOKING_STATUS_LABELS[status];

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      )}
      {label}
    </span>
  );
};

// ============================================================================
// PAYMENT STATUS BADGE
// ============================================================================

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const colors = PAYMENT_STATUS_COLORS[status];
  const label = PAYMENT_STATUS_LABELS[status];

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      )}
      {label}
    </span>
  );
};

// ============================================================================
// BOOKING SOURCE BADGE
// ============================================================================

export const BookingSourceBadge: React.FC<BookingSourceBadgeProps> = ({
  source,
  size = 'md',
}) => {
  const label = BOOKING_SOURCE_LABELS[source];
  const colorClass = BOOKING_SOURCE_COLORS[source];

  const sizeClasses = size === 'sm'
    ? 'text-xs'
    : 'text-sm';

  // Source icons
  const getSourceIcon = () => {
    switch (source) {
      case 'airbnb':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.1c-.3.6-.8 1.1-1.4 1.4-.2.1-.5.1-.7.1-.5 0-1-.2-1.5-.5-1-.6-1.8-1.5-2.5-2.4-.5-.7-1-1.4-1.4-2.2-.4.8-.9 1.5-1.4 2.2-.7.9-1.5 1.8-2.5 2.4-.5.3-1 .5-1.5.5-.2 0-.5 0-.7-.1-.6-.3-1.1-.8-1.4-1.4-.3-.6-.4-1.3-.2-2 .3-1.2 1.2-2.3 2.2-3.3.8-.8 1.7-1.5 2.7-2.1-.2-.6-.4-1.2-.5-1.8-.2-1-.2-2 .1-2.9.2-.6.6-1.1 1.1-1.4.4-.3.9-.4 1.4-.4s1 .1 1.4.4c.5.3.9.8 1.1 1.4.3.9.3 1.9.1 2.9-.1.6-.3 1.2-.5 1.8 1 .6 1.9 1.3 2.7 2.1 1 1 1.9 2.1 2.2 3.3.2.7.1 1.4-.2 2z"/>
          </svg>
        );
      case 'booking_com':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h4v4H7V7zm6 0h4v2h-4V7zm0 4h4v2h-4v-2zm-6 4h10v2H7v-2z"/>
          </svg>
        );
      case 'vilo':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${colorClass} ${sizeClasses}`}>
      {getSourceIcon()}
      {label}
    </span>
  );
};

// ============================================================================
// GUEST INFO DISPLAY
// ============================================================================

export const GuestInfoDisplay: React.FC<GuestInfoDisplayProps> = ({
  name,
  email,
  phone,
  adults,
  children,
  infants,
  compact = false,
}) => {
  const guestCount = getGuestCount(adults, children, infants);

  if (compact) {
    return (
      <div className="space-y-0.5">
        <p className="font-medium text-gray-900 dark:text-white truncate">{name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{guestCount}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="truncate">{email}</span>
      </div>
      {phone && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{phone}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>{guestCount}</span>
      </div>
    </div>
  );
};

// ============================================================================
// STAY INFO DISPLAY
// ============================================================================

export const StayInfoDisplay: React.FC<StayInfoDisplayProps> = ({
  checkIn,
  checkOut,
  nights,
  propertyName,
  rooms,
  compact = false,
}) => {
  const dateRange = formatDateRange(checkIn, checkOut);

  if (compact) {
    return (
      <div className="space-y-0.5">
        <p className="font-medium text-gray-900 dark:text-white">{dateRange}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {nights} night{nights !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-medium">{dateRange}</span>
        <span className="text-gray-500 dark:text-gray-400">
          ({nights} night{nights !== 1 ? 's' : ''})
        </span>
      </div>
      {propertyName && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>{propertyName}</span>
        </div>
      )}
      {rooms && rooms.length > 0 && (
        <div className="space-y-1">
          {rooms.map((room, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>
                {room.room_name}
                {room.room_code && ` (${room.room_code})`}
                <span className="ml-1 text-xs">
                  - {room.adults} adult{room.adults !== 1 ? 's' : ''}
                  {room.children > 0 && `, ${room.children} child${room.children !== 1 ? 'ren' : ''}`}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BOOKING PRICING DISPLAY
// ============================================================================

export const BookingPricingDisplay: React.FC<BookingPricingDisplayProps> = ({
  roomTotal,
  addonsTotal,
  discountAmount,
  taxAmount,
  totalAmount,
  amountPaid,
  currency,
  compact = false,
}) => {
  const balance = totalAmount - amountPaid;

  if (compact) {
    return (
      <div className="text-right">
        <p className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(totalAmount, currency)}
        </p>
        {balance > 0 && (
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Due: {formatCurrency(balance, currency)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-400">Rooms</span>
        <span className="text-gray-900 dark:text-white">{formatCurrency(roomTotal, currency)}</span>
      </div>
      {addonsTotal > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Add-ons</span>
          <span className="text-gray-900 dark:text-white">{formatCurrency(addonsTotal, currency)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
          <span>Discount</span>
          <span>-{formatCurrency(discountAmount, currency)}</span>
        </div>
      )}
      {taxAmount > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Tax</span>
          <span className="text-gray-900 dark:text-white">{formatCurrency(taxAmount, currency)}</span>
        </div>
      )}
      <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-dark-border font-semibold">
        <span className="text-gray-900 dark:text-white">Total</span>
        <span className="text-gray-900 dark:text-white">{formatCurrency(totalAmount, currency)}</span>
      </div>
      {amountPaid > 0 && (
        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
          <span>Paid</span>
          <span>{formatCurrency(amountPaid, currency)}</span>
        </div>
      )}
      {balance > 0 && (
        <div className="flex justify-between text-orange-600 dark:text-orange-400 font-medium">
          <span>Balance Due</span>
          <span>{formatCurrency(balance, currency)}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BOOKING TIMELINE
// ============================================================================

export const BookingTimeline: React.FC<BookingTimelineProps> = ({
  statusHistory,
  createdAt,
  checkedInAt,
  checkedOutAt,
  cancelledAt,
  payments = [],
  invoiceGeneratedAt,
  updatedAt,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const events = [
    { label: 'Booking Created', date: createdAt, type: 'created' },
    ...statusHistory.map(h => ({
      label: `Status: ${BOOKING_STATUS_LABELS[h.new_status]}`,
      date: h.created_at,
      reason: h.change_reason,
      type: 'status',
    })),
    ...payments.map(p => ({
      label: `Payment Recorded: ${formatCurrency(p.amount, p.currency)}`,
      date: p.created_at,
      reason: p.notes || `Payment via ${PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}`,
      type: 'payment',
    })),
    ...(invoiceGeneratedAt ? [{ label: 'Invoice Generated', date: invoiceGeneratedAt, type: 'invoice' }] : []),
    ...(checkedInAt ? [{ label: 'Checked In', date: checkedInAt, type: 'checkin' }] : []),
    ...(checkedOutAt ? [{ label: 'Checked Out', date: checkedOutAt, type: 'checkout' }] : []),
    ...(cancelledAt ? [{ label: 'Cancelled', date: cancelledAt, type: 'cancelled' }] : []),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-blue-500';
      case 'payment':
        return 'bg-green-500';
      case 'invoice':
        return 'bg-purple-500';
      case 'status':
        return 'bg-yellow-500';
      case 'checkin':
        return 'bg-emerald-500';
      case 'checkout':
        return 'bg-indigo-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-0 left-2 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-4">
        {events.map((event, idx) => (
          <div key={idx} className="relative flex items-start gap-3 pl-6">
            <div className={`absolute left-0 top-1 w-4 h-4 rounded-full ${getEventColor(event.type)} border-2 border-white dark:border-dark-card`} />
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{event.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(event.date)}</p>
              {'reason' in event && event.reason && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">
                  {event.reason}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// BOOKING ACTIONS
// ============================================================================

export const BookingActions: React.FC<BookingActionsProps> = ({
  booking,
  onView,
  onEdit,
  onCancel,
  onCheckIn,
  onCheckOut,
  onSendConfirmation,
  onGenerateInvoice,
  compact = false,
}) => {
  const status = booking.booking_status;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {onView && (
          <button
            onClick={onView}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="View"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}
        {canCheckIn(status) && onCheckIn && (
          <button
            onClick={onCheckIn}
            className="p-1.5 text-blue-500 hover:text-blue-700"
            title="Check In"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
        {canCheckOut(status) && onCheckOut && (
          <button
            onClick={onCheckOut}
            className="p-1.5 text-purple-500 hover:text-purple-700"
            title="Check Out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {onView && (
        <button
          onClick={onView}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
        >
          View Details
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
        >
          Edit
        </button>
      )}
      {canCheckIn(status) && onCheckIn && (
        <button
          onClick={onCheckIn}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Check In
        </button>
      )}
      {canCheckOut(status) && onCheckOut && (
        <button
          onClick={onCheckOut}
          className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
        >
          Check Out
        </button>
      )}
      {onSendConfirmation && status === 'confirmed' && (
        <button
          onClick={onSendConfirmation}
          className="px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          Send Confirmation
        </button>
      )}
      {onGenerateInvoice && ['checked_out', 'completed'].includes(status) && (
        <button
          onClick={onGenerateInvoice}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
        >
          Generate Invoice
        </button>
      )}
      {isBookingCancellable(status) && onCancel && (
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

// ============================================================================
// BOOKING CARD
// ============================================================================

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  interactive = false,
  selected = false,
  onClick,
  onView,
  onEdit,
  onCancel,
  onCheckIn,
  onCheckOut,
  showActions = true,
  compact = false,
  className = '',
}) => {
  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  // Compact card (for list view)
  if (compact) {
    return (
      <Card
        className={`
          ${interactive ? 'cursor-pointer' : ''}
          ${selected ? 'ring-2 ring-emerald-500' : ''}
          ${className}
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
      >
        <Card.Body className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Room Thumbnail */}
            {booking.rooms && booking.rooms.length > 0 && (
              <div className="flex-shrink-0 hidden lg:block">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {booking.rooms[0].featured_image ? (
                    <img
                      src={booking.rooms[0].featured_image}
                      alt={booking.rooms[0].room_name || 'Room'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HiOutlineCube className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reference & Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">
                  {formatBookingReference(booking.booking_reference)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <BookingStatusBadge status={booking.booking_status} size="sm" />
                  <PaymentStatusBadge status={booking.payment_status} size="sm" />
                </div>
              </div>
            </div>

            {/* Guest */}
            <div className="hidden sm:block min-w-0 flex-shrink">
              <GuestInfoDisplay
                name={booking.guest_name}
                email={booking.guest_email}
                phone={booking.guest_phone}
                adults={booking.adults}
                children={booking.children}
                infants={booking.infants}
                compact
              />
            </div>

            {/* Dates */}
            <div className="hidden md:block">
              <StayInfoDisplay
                checkIn={booking.check_in_date}
                checkOut={booking.check_out_date}
                nights={booking.total_nights}
                compact
              />
            </div>

            {/* Source */}
            <div className="hidden lg:block">
              <BookingSourceBadge source={booking.source} size="sm" />
            </div>

            {/* Price */}
            <div className="flex-shrink-0">
              <BookingPricingDisplay
                roomTotal={booking.room_total}
                addonsTotal={booking.addons_total}
                discountAmount={booking.discount_amount}
                taxAmount={booking.tax_amount}
                totalAmount={booking.total_amount}
                amountPaid={booking.amount_paid}
                currency={booking.currency}
                compact
              />
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex-shrink-0">
                <BookingActions
                  booking={booking}
                  onView={onView}
                  onEdit={onEdit}
                  onCancel={onCancel}
                  onCheckIn={onCheckIn}
                  onCheckOut={onCheckOut}
                  compact
                />
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Full card
  return (
    <Card
      className={`
        ${interactive ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${selected ? 'ring-2 ring-emerald-500' : ''}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
    >
      <Card.Header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
            {formatBookingReference(booking.booking_reference)}
          </span>
          <BookingSourceBadge source={booking.source} />
        </div>
        <div className="flex items-center gap-2">
          <BookingStatusBadge status={booking.booking_status} />
          <PaymentStatusBadge status={booking.payment_status} />
        </div>
      </Card.Header>

      <Card.Body className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Guest Info */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Guest
            </h4>
            <GuestInfoDisplay
              name={booking.guest_name}
              email={booking.guest_email}
              phone={booking.guest_phone}
              adults={booking.adults}
              children={booking.children}
              infants={booking.infants}
            />
          </div>

          {/* Stay Info */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Stay Details
            </h4>
            <StayInfoDisplay
              checkIn={booking.check_in_date}
              checkOut={booking.check_out_date}
              nights={booking.total_nights}
              propertyName={booking.property_name}
              rooms={booking.rooms?.map(r => ({
                room_name: r.room_name,
                room_code: r.room_code,
                adults: r.adults,
                children: r.children,
              }))}
            />
          </div>
        </div>

        {/* Rooms with Thumbnails */}
        {booking.rooms && booking.rooms.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Rooms ({booking.rooms.length})
            </h4>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {booking.rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex-shrink-0 flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg min-w-[200px]"
                >
                  {/* Room Thumbnail */}
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {room.featured_image ? (
                      <img
                        src={room.featured_image}
                        alt={room.room_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiOutlineCube className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {/* Room Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {room.room_name}
                    </p>
                    {room.room_code && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {room.room_code}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {room.adults} adult{room.adults !== 1 ? 's' : ''}
                      {room.children > 0 && `, ${room.children} child${room.children !== 1 ? 'ren' : ''}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Payment
          </h4>
          <BookingPricingDisplay
            roomTotal={booking.room_total}
            addonsTotal={booking.addons_total}
            discountAmount={booking.discount_amount}
            taxAmount={booking.tax_amount}
            totalAmount={booking.total_amount}
            amountPaid={booking.amount_paid}
            currency={booking.currency}
          />
        </div>

        {/* Special Requests */}
        {booking.special_requests && (
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Special Requests
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{booking.special_requests}</p>
          </div>
        )}
      </Card.Body>

      {showActions && (
        <Card.Footer className="flex items-center justify-end">
          <BookingActions
            booking={booking}
            onView={onView}
            onEdit={onEdit}
            onCancel={onCancel}
            onCheckIn={onCheckIn}
            onCheckOut={onCheckOut}
          />
        </Card.Footer>
      )}
    </Card>
  );
};

export default BookingCard;
