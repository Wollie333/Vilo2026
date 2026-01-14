/**
 * ReviewStep Component
 *
 * Step 5 of the booking wizard: Review all details and confirm.
 */

import React from 'react';
import { BookingFooter } from '../components/BookingFooter';
import type { ReviewStepProps } from '../CreateBookingPage.types';
import { BOOKING_SOURCE_LABELS, formatCurrency } from '@/types/booking.types';

// ============================================================================
// Icons
// ============================================================================

const ClipboardCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

// ============================================================================
// Detail Row Component
// ============================================================================

const DetailRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between py-2">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-gray-900 dark:text-white font-medium text-right">{value}</span>
  </div>
);

// ============================================================================
// Component
// ============================================================================

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  properties,
  estimatedTotal,
  addonsTotal,
  currency,
  nights,
  totalGuests: _totalGuests, // eslint-disable-line @typescript-eslint/no-unused-vars
  onBack,
  onSubmit,
  onCancel,
  submitting,
}) => {
  // Get property name
  const propertyName = properties.find((p) => p.id === formData.property_id)?.name || 'Unknown';

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    await onSubmit();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 text-primary items-center justify-center mb-4">
          <ClipboardCheckIcon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review & Confirm</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Please review the booking details before confirming
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Booking Details */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <CalendarIcon />
            Booking Details
          </h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <DetailRow label="Property" value={propertyName} />
            <DetailRow label="Check-in" value={formatDate(formData.check_in_date)} />
            <DetailRow label="Check-out" value={formatDate(formData.check_out_date)} />
            <DetailRow label="Duration" value={`${nights} night${nights !== 1 ? 's' : ''}`} />
            <DetailRow label="Source" value={BOOKING_SOURCE_LABELS[formData.source]} />
          </div>
        </div>

        {/* Guest Details */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UserIcon />
            Guest Details
          </h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <DetailRow label="Name" value={formData.guest_name} />
            <DetailRow
              label="Email"
              value={
                <span className="flex items-center gap-1">
                  <MailIcon className="w-3.5 h-3.5 text-gray-400" />
                  {formData.guest_email}
                </span>
              }
            />
            {formData.guest_phone && (
              <DetailRow
                label="Phone"
                value={
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                    {formData.guest_phone}
                  </span>
                }
              />
            )}
          </div>
        </div>

        {/* Selected Rooms */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Selected Rooms ({formData.rooms.length})
          </h3>
          <div className="space-y-3">
            {formData.rooms.map((roomSelection) => (
              <div
                key={roomSelection.room_id}
                className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {roomSelection.room.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {roomSelection.adults} adult{roomSelection.adults !== 1 ? 's' : ''}
                    {roomSelection.children > 0 &&
                      `, ${roomSelection.children} child${roomSelection.children !== 1 ? 'ren' : ''}`}
                  </p>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(
                    roomSelection.room.base_price_per_night * nights,
                    roomSelection.room.currency
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Add-ons */}
        {formData.addons.length > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3">
              Add-ons ({formData.addons.length})
            </h3>
            <div className="space-y-2">
              {formData.addons.map((addonSelection) => (
                <div
                  key={addonSelection.addon_id}
                  className="flex items-center justify-between py-1"
                >
                  <div>
                    <span className="text-purple-900 dark:text-purple-100">
                      {addonSelection.addon.name}
                    </span>
                    {addonSelection.quantity > 1 && (
                      <span className="text-purple-600 dark:text-purple-400 ml-2">
                        ×{addonSelection.quantity}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-purple-800 dark:text-purple-200">
                    {formatCurrency(addonSelection.addon.price * addonSelection.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 flex justify-between">
              <span className="text-sm text-purple-700 dark:text-purple-300">Add-ons Subtotal</span>
              <span className="font-semibold text-purple-800 dark:text-purple-200">
                {formatCurrency(addonsTotal, currency)}
              </span>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                Estimated Total
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {formData.addons.length > 0
                  ? `Rooms + Add-ons`
                  : 'Final price calculated at checkout'}
              </p>
            </div>
            <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
              {formatCurrency(estimatedTotal + addonsTotal, currency)}
            </span>
          </div>
        </div>

        {/* Special Requests */}
        {formData.special_requests && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Special Requests
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
              {formData.special_requests}
            </p>
          </div>
        )}

        {/* Internal Notes */}
        {formData.internal_notes && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Internal Notes
            </h3>
            <p className="text-amber-700 dark:text-amber-300 text-sm whitespace-pre-wrap">
              {formData.internal_notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <BookingFooter
        onCancel={onCancel}
        onContinue={handleSubmit}
        onBack={onBack}
        showBack
        continueLabel="Create Booking"
        isLoading={submitting}
        isFinalStep
      />
    </div>
  );
};

export default ReviewStep;
