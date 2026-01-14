/**
 * ConfirmationStep Component
 *
 * Step 4: Show booking confirmation and guide user to portal
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { HiCheckCircle, HiEye, HiEyeOff, HiDownload } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

interface ConfirmationStepProps {
  bookingReference: string;
  bookingId: string;
  propertyName: string;
  propertyImage?: string;
  checkIn: Date;
  checkOut: Date;
  guestName: string;
  guestEmail: string;
  totalAmount: number;
  currency: string;
  propertySlug: string;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  bookingReference,
  bookingId,
  propertyName,
  propertyImage,
  checkIn,
  checkOut,
  guestName,
  guestEmail,
  totalAmount,
  currency,
  propertySlug,
}) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleGoToPortal = () => {
    navigate(`/portal/bookings/${bookingId}`);
  };

  const handleBackToProperty = () => {
    navigate(`/accommodation/${propertySlug}`);
  };

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download
    console.log('Download receipt for booking:', bookingId);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Success Icon */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <HiCheckCircle className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Your reservation has been successfully completed
        </p>
      </div>

      {/* Booking Reference */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Booking Reference
        </div>
        <div className="text-3xl font-bold text-primary tracking-wider">
          {bookingReference}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Please save this reference number for your records
        </div>
      </div>

      {/* Booking Summary */}
      <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
        {/* Property Image */}
        {propertyImage && (
          <div className="h-48 overflow-hidden">
            <img
              src={propertyImage}
              alt={propertyName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Summary Details */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {propertyName}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Check-in</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatDate(checkIn)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Check-out</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatDate(checkOut)}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Guest Name</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {guestName}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Amount Paid
              </span>
              <span className="text-2xl font-bold text-primary">
                {currency} {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Created */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Your Account Has Been Created!
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          You can now access your booking portal to view your reservation details, communicate with
          the host, and manage your booking.
        </p>
        <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</div>
          <div className="font-medium text-gray-900 dark:text-white mb-3">
            {guestEmail}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            A confirmation email with your account details has been sent to this address.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          onClick={handleGoToPortal}
          className="flex-1 flex items-center justify-center gap-2"
        >
          Go to My Portal
        </Button>
        <Button
          variant="outline"
          onClick={handleBackToProperty}
          className="flex-1"
        >
          Back to Property
        </Button>
        <Button
          variant="outline"
          onClick={handleDownloadReceipt}
          className="flex items-center justify-center gap-2"
        >
          <HiDownload className="w-5 h-5" />
          Download Receipt
        </Button>
      </div>

      {/* Next Steps */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-500">
        <p>
          Check your email for booking confirmation and account details. If you have any questions,
          please contact the property host through your portal.
        </p>
      </div>
    </div>
  );
};
