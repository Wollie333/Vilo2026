/**
 * ConfirmationStep Component
 *
 * Step 4: Show booking confirmation and guide user to portal
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { HiCheckCircle, HiEye, HiEyeOff, HiDownload } from 'react-icons/hi';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/config/supabase';
import { bookingService } from '@/services/booking.service';
import { invoiceService } from '@/services/invoice.service';

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
  isNewUser?: boolean; // Whether guest account was newly created
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
  isNewUser = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  // Update URL hash with booking reference when component mounts
  useEffect(() => {
    if (bookingReference) {
      // Update URL to include booking reference in hash
      // Example: /accommodation/pandokkie-house/book#ABC123
      const newUrl = `${location.pathname}#${bookingReference}`;
      window.history.replaceState(null, '', newUrl);
      console.log('[ConfirmationStep] Updated URL hash with booking reference:', bookingReference);
    }
  }, [bookingReference, location.pathname]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleGoToPortal = async () => {
    console.log('[ConfirmationStep] Portal button clicked');
    console.log('[ConfirmationStep] Booking email:', guestEmail);
    console.log('[ConfirmationStep] Is new user:', isNewUser);

    // Check if user is currently logged in
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      console.log('[ConfirmationStep] User is logged in as:', session.user.email);

      // Check if logged-in email matches booking email
      if (session.user.email?.toLowerCase() !== guestEmail.toLowerCase()) {
        console.log('[ConfirmationStep] Email mismatch - logging out and redirecting to login');

        // Auto-logout and redirect to login with booking email pre-filled
        await supabase.auth.signOut();

        // Redirect to login with email pre-filled
        navigate(`/login?email=${encodeURIComponent(guestEmail)}&message=${encodeURIComponent('Please log in with your booking account')}`);
        return;
      }

      // Email matches - user is already logged in with correct account
      console.log('[ConfirmationStep] Email matches - redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    // No session - proceed with normal flow
    if (isNewUser) {
      // New users need to set password first
      console.log('[ConfirmationStep] Redirecting to set password');
      navigate(`/auth/set-password?booking=${bookingReference}&email=${encodeURIComponent(guestEmail)}`);
    } else {
      // Existing users can login directly
      console.log('[ConfirmationStep] Redirecting to login');
      navigate(`/login?email=${encodeURIComponent(guestEmail)}`);
    }
  };

  const handleBackToProperty = () => {
    navigate(`/accommodation/${propertySlug}`);
  };

  const handleDownloadReceipt = async () => {
    console.log('[ConfirmationStep] Download receipt clicked for booking:', bookingId);
    setIsDownloadingReceipt(true);

    try {
      // Step 1: Generate/get invoice for this booking
      console.log('[ConfirmationStep] Generating invoice...');
      const invoice = await bookingService.generateInvoice(bookingId);
      console.log('[ConfirmationStep] Invoice generated:', invoice.id, invoice.invoice_number);

      // Step 2: Download the invoice PDF using the invoice ID
      console.log('[ConfirmationStep] Downloading invoice PDF:', invoice.id);
      await invoiceService.downloadInvoice(invoice.id);
      console.log('[ConfirmationStep] Invoice download initiated successfully');
    } catch (error) {
      console.error('[ConfirmationStep] Failed to download receipt:', error);
      alert('Failed to download receipt. Please try again or contact support.');
    } finally {
      setIsDownloadingReceipt(false);
    }
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

      {/* Account Status */}
      {isNewUser ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            📧 Check Your Email
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We've created your account and sent you an email with a link to set your password.
            Once you set your password, you can access your booking portal.
          </p>
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</div>
            <div className="font-medium text-gray-900 dark:text-white mb-3">
              {guestEmail}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Check your email for the password setup link and booking confirmation.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            ✅ Booking Confirmed
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Your booking has been confirmed! Log in to your portal to view reservation details,
            communicate with the host, and manage your booking.
          </p>
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</div>
            <div className="font-medium text-gray-900 dark:text-white mb-3">
              {guestEmail}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              A booking confirmation has been sent to this address.
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          onClick={handleGoToPortal}
          className="flex-1 flex items-center justify-center gap-2"
        >
          {isNewUser ? 'Set Password & Access Portal' : 'Log into Portal'}
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
          disabled={isDownloadingReceipt}
          isLoading={isDownloadingReceipt}
        >
          <HiDownload className="w-5 h-5" />
          {isDownloadingReceipt ? 'Downloading...' : 'Download Receipt'}
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
