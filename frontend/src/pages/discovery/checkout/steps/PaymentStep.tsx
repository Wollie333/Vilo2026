/**
 * PaymentStep
 *
 * Checkout step for reviewing the booking summary and completing payment.
 * Part of the guest booking checkout wizard.
 */

import React, { useState, useMemo } from 'react';
import { Card, Button, Input, Alert, Badge, Radio, RadioGroup } from '@/components/ui';
import { bookingService } from '@/services/booking.service';
import type { RoomSelection } from './DatesAndRoomsStep';
import type { GuestDetails } from './GuestDetailsStep';
import { BED_TYPE_LABELS } from '@/types/room.types';
import type { PaymentMethod } from '@/types/booking.types';

// ============================================================================
// Types
// ============================================================================

export interface PaymentStepProps {
  propertyId: string;
  propertyName: string;
  checkIn: Date;
  checkOut: Date;
  roomSelections: RoomSelection[];
  totalRoomsCost: number;
  selectedAddOns: Map<string, number>;
  addOnsTotal: number;
  guestDetails: GuestDetails;
  onBack: () => void;
  onComplete: (bookingId: string, bookingReference: string) => void;
}

interface CouponValidation {
  isValid: boolean;
  discount_amount: number;
  discount_description?: string;
  error?: string;
}

// ============================================================================
// Icons
// ============================================================================

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (amount: number, currency: string = 'ZAR'): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const calculateNights = (checkIn: Date, checkOut: Date): number => {
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
};

const getBedsSummary = (beds: RoomSelection['room']['beds']): string => {
  if (!beds || beds.length === 0) return '';
  return beds
    .map((bed) => `${bed.quantity} ${BED_TYPE_LABELS[bed.bed_type]}`)
    .join(', ');
};

// ============================================================================
// Payment Method Component
// ============================================================================

const AVAILABLE_PAYMENT_METHODS: { value: PaymentMethod; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'paystack',
    label: 'Pay with Card',
    description: 'Secure card payment via Paystack',
    icon: <CreditCardIcon />,
  },
  {
    value: 'eft',
    label: 'EFT / Bank Transfer',
    description: 'Pay directly to our bank account',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    value: 'card_on_arrival',
    label: 'Pay on Arrival',
    description: 'Pay when you arrive at the property',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const PaymentStep: React.FC<PaymentStepProps> = ({
  propertyId,
  propertyName,
  checkIn,
  checkOut,
  roomSelections,
  totalRoomsCost,
  selectedAddOns,
  addOnsTotal,
  guestDetails,
  onBack,
  onComplete,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate totals
  const nights = calculateNights(checkIn, checkOut);
  const subtotal = totalRoomsCost + addOnsTotal;
  const discountAmount = couponValidation?.isValid ? couponValidation.discount_amount : 0;
  const total = subtotal - discountAmount;

  // Get total guests
  const totalGuests = useMemo(() => {
    let adults = 0;
    let children = 0;
    for (const selection of roomSelections) {
      adults += selection.adults * selection.quantity;
      children += selection.children * selection.quantity;
    }
    return { adults, children, total: adults + children };
  }, [roomSelections]);

  // Validate coupon
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponValidation(null);

    try {
      const result = await bookingService.validateCoupon({
        code: couponCode.trim(),
        property_id: propertyId,
        room_ids: roomSelections.map((s) => s.room_id),
        booking_amount: subtotal,
        nights,
      });

      setCouponValidation({
        isValid: result.valid,
        discount_amount: result.promotion?.calculated_discount || 0,
        discount_description: result.promotion?.name,
        error: result.error,
      });
    } catch (err) {
      setCouponValidation({
        isValid: false,
        discount_amount: 0,
        error: err instanceof Error ? err.message : 'Failed to validate coupon',
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Clear coupon
  const handleClearCoupon = () => {
    setCouponCode('');
    setCouponValidation(null);
  };

  // Process payment
  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create the booking through the checkout flow
      const checkoutResult = await bookingService.initiateCheckout({
        property_id: propertyId,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
        rooms: roomSelections.map((s) => ({
          room_id: s.room_id,
          adults: s.adults,
          children: s.children,
        })),
        addons: Array.from(selectedAddOns.entries()).map(([id, quantity]) => ({
          addon_id: id,
          quantity,
        })),
        guest_info: {
          name: `${guestDetails.first_name} ${guestDetails.last_name}`,
          email: guestDetails.email,
          phone: `${guestDetails.country_code}${guestDetails.phone}`,
        },
        special_requests: guestDetails.special_requests,
        coupon_code: couponValidation?.isValid ? couponCode : undefined,
      });

      // For now, complete directly (payment integration TBD)
      onComplete(checkoutResult.booking_id, checkoutResult.booking_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process booking');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <CreditCardIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Review & Pay
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review your booking details and complete your payment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side - Booking summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stay details */}
          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-900 dark:text-white">Stay Details</h3>
            </Card.Header>
            <Card.Body className="space-y-4">
              {/* Property */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{propertyName}</h4>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Check-in</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatFullDate(checkIn)}
                    </div>
                  </div>
                </div>
                <div className="text-gray-300 dark:text-gray-600">|</div>
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Check-out</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatFullDate(checkOut)}
                    </div>
                  </div>
                </div>
                <Badge variant="default">{nights} night{nights !== 1 ? 's' : ''}</Badge>
              </div>

              {/* Guests */}
              <div className="flex items-center gap-2 text-sm">
                <UserIcon />
                <span className="text-gray-600 dark:text-gray-400">
                  {totalGuests.adults} adult{totalGuests.adults !== 1 ? 's' : ''}
                  {totalGuests.children > 0 && `, ${totalGuests.children} child${totalGuests.children !== 1 ? 'ren' : ''}`}
                </span>
              </div>

              {/* Rooms */}
              <div className="border-t border-gray-200 dark:border-dark-border pt-4 space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Rooms</h4>
                {roomSelections.map((selection) => (
                  <div
                    key={selection.room_id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {selection.room.featured_image && (
                        <img
                          src={selection.room.featured_image}
                          alt={selection.room.name}
                          className="w-16 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {selection.quantity > 1 && `${selection.quantity}x `}
                          {selection.room.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {selection.adults} adult{selection.adults !== 1 ? 's' : ''}
                          {selection.children > 0 && `, ${selection.children} child${selection.children !== 1 ? 'ren' : ''}`}
                          {' • '}
                          {getBedsSummary(selection.room.beds)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {selection.pricing
                          ? formatCurrency(selection.pricing.total * selection.quantity, selection.pricing.currency)
                          : formatCurrency(selection.room.base_price_per_night * nights * selection.quantity, selection.room.currency)
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add-ons */}
              {selectedAddOns.size > 0 && (
                <div className="border-t border-gray-200 dark:border-dark-border pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add-ons</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedAddOns.size} add-on{selectedAddOns.size !== 1 ? 's' : ''} selected
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {formatCurrency(addOnsTotal, 'ZAR')}
                    </span>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Guest Details Summary */}
          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-900 dark:text-white">Guest Details</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Name</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {guestDetails.first_name} {guestDetails.last_name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Email</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {guestDetails.email}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Phone</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {guestDetails.country_code} {guestDetails.phone}
                  </div>
                </div>
                {guestDetails.arrival_time && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Arrival Time</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {guestDetails.arrival_time === 'late' ? 'Late arrival' : guestDetails.arrival_time}
                    </div>
                  </div>
                )}
              </div>
              {guestDetails.special_requests && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Special Requests</div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {guestDetails.special_requests}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Payment Method */}
          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-900 dark:text-white">Payment Method</h3>
            </Card.Header>
            <Card.Body>
              <RadioGroup
                name="payment_method"
                value={paymentMethod}
                onChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <div className="space-y-3">
                  {AVAILABLE_PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${paymentMethod === method.value
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <Radio value={method.value} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">{method.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {method.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {method.description}
                        </p>
                      </div>
                      {paymentMethod === method.value && (
                        <CheckIcon />
                      )}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </Card.Body>
          </Card>
        </div>

        {/* Right side - Order summary & coupon */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {/* Order Summary */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold text-gray-900 dark:text-white">Order Summary</h3>
              </Card.Header>
              <Card.Body className="space-y-4">
                {/* Line items */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Rooms ({nights} night{nights !== 1 ? 's' : ''})
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(totalRoomsCost, 'ZAR')}
                    </span>
                  </div>
                  {addOnsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Add-ons</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(addOnsTotal, 'ZAR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtotal */}
                <div className="flex justify-between border-t border-gray-200 dark:border-dark-border pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(subtotal, 'ZAR')}
                  </span>
                </div>

                {/* Discount */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount, 'ZAR')}</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between border-t border-gray-200 dark:border-dark-border pt-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(total, 'ZAR')}
                  </span>
                </div>
              </Card.Body>
            </Card>

            {/* Coupon Code */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TagIcon />
                  Promo Code
                </h3>
              </Card.Header>
              <Card.Body>
                {couponValidation?.isValid ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <div className="font-medium text-green-700 dark:text-green-400">
                        {couponCode.toUpperCase()}
                      </div>
                      {couponValidation.discount_description && (
                        <div className="text-sm text-green-600 dark:text-green-500">
                          {couponValidation.discount_description}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClearCoupon}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1"
                        disabled={isValidatingCoupon}
                      />
                      <Button
                        variant="outline"
                        onClick={handleValidateCoupon}
                        disabled={!couponCode.trim() || isValidatingCoupon}
                        isLoading={isValidatingCoupon}
                      >
                        Apply
                      </Button>
                    </div>
                    {couponValidation?.error && (
                      <p className="text-sm text-red-500">{couponValidation.error}</p>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Error message */}
            {error && (
              <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Pay button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handlePayment}
              disabled={isProcessing}
              isLoading={isProcessing}
              leftIcon={<LockIcon />}
            >
              {paymentMethod === 'paystack'
                ? `Pay ${formatCurrency(total, 'ZAR')}`
                : paymentMethod === 'eft'
                  ? 'Complete Booking'
                  : 'Reserve Now'
              }
            </Button>

            {/* Security note */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
              <LockIcon />
              Secure payment powered by Paystack
            </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeftIcon />}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default PaymentStep;
