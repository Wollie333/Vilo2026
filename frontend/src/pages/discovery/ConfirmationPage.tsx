/**
 * ConfirmationPage
 *
 * Displays booking confirmation after successful checkout.
 * Routes: /discovery/confirmation/:id
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Spinner, Alert } from '@/components/ui';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/features';
import { bookingService } from '@/services/booking.service';
import {
  PAYMENT_METHOD_LABELS,
  formatCurrency,
  formatDateRange,
} from '@/types/booking.types';
import type { BookingWithDetails } from '@/types/booking.types';

// ============================================================================
// Icons
// ============================================================================

const CheckCircleIcon = () => (
  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
    />
  </svg>
);

const LogoIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 2L4 8v16l12 6 12-6V8L16 2zm0 2.236l9.6 4.8L16 13.836l-9.6-4.8L16 4.236zM6 10.618l9 4.5V26.382l-9-4.5V10.618zm20 0v11.264l-9 4.5V15.118l9-4.5z" />
  </svg>
);

// ============================================================================
// Main Component
// ============================================================================

export const ConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingReference = searchParams.get('ref');

  // Load booking details
  useEffect(() => {
    const loadBooking = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const bookingData = await bookingService.getBooking(id);
        setBooking(bookingData);
      } catch (err) {
        // Try by reference if ID fails
        if (bookingReference) {
          try {
            const bookingData = await bookingService.getBookingByReference(bookingReference);
            setBooking(bookingData);
          } catch {
            setError('Booking not found');
          }
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load booking');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadBooking();
  }, [id, bookingReference]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download (would generate PDF in real implementation)
  const handleDownload = async () => {
    if (!booking) return;

    try {
      await bookingService.generateInvoice(booking.id);
      // The service would trigger a download
    } catch (err) {
      console.error('Failed to generate invoice:', err);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Render error state
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <Card.Body className="text-center py-12">
            <Alert variant="error" className="mb-4">
              {error || 'Booking not found'}
            </Alert>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const isConfirmed = booking.booking_status === 'confirmed' || booking.payment_status === 'paid';
  const isPending = booking.payment_status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Header */}
      <header className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-primary">
              <LogoIcon />
              <span className="font-semibold">Vilo</span>
            </Link>
            <div className="flex items-center gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<PrintIcon />}>
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} leftIcon={<DownloadIcon />}>
                Download
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success/Pending banner */}
        <Card className="mb-8">
          <Card.Body className="text-center py-12">
            <div
              className={`inline-flex items-center justify-center mb-4 ${
                isConfirmed ? 'text-green-500' : 'text-yellow-500'
              }`}
            >
              {isConfirmed ? <CheckCircleIcon /> : <ClockIcon />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isConfirmed ? 'Booking Confirmed!' : 'Booking Received'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {isConfirmed
                ? 'Your booking has been confirmed. A confirmation email has been sent to your email address.'
                : isPending
                  ? 'Your booking has been received and is awaiting payment confirmation.'
                  : 'Your booking has been received. The host will confirm your booking shortly.'}
            </p>

            {/* Booking reference */}
            <div className="mt-6 inline-block px-6 py-3 bg-gray-100 dark:bg-dark-card rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Booking Reference</div>
              <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                {booking.booking_reference}
              </div>
            </div>
          </Card.Body>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Booking details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stay details */}
            <Card>
              <Card.Header>
                <h2 className="font-semibold text-gray-900 dark:text-white">Stay Details</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                {/* Property */}
                <div className="flex items-start gap-3">
                  <HomeIcon />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {booking.property_name || 'Property'}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start gap-3">
                  <CalendarIcon />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatDateRange(booking.check_in_date, booking.check_out_date)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {booking.total_nights} night{booking.total_nights !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div className="flex items-start gap-3">
                  <UserIcon />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                      {booking.children > 0 && `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}`}
                    </div>
                  </div>
                </div>

                {/* Rooms */}
                {booking.rooms && booking.rooms.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-dark-border pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Rooms</h4>
                    {booking.rooms.map((room, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div>
                          {room.room_name || 'Room'}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(room.room_subtotal || 0, booking.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add-ons */}
                {booking.addons && booking.addons.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-dark-border pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Add-ons</h4>
                    {booking.addons.map((addon, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div>
                          {addon.quantity > 1 && `${addon.quantity}x `}
                          {addon.addon_name || 'Add-on'}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(addon.addon_total || 0, booking.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Special requests */}
                {booking.special_requests && (
                  <div className="border-t border-gray-200 dark:border-dark-border pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Special Requests
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.special_requests}
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Guest details */}
            <Card>
              <Card.Header>
                <h2 className="font-semibold text-gray-900 dark:text-white">Guest Details</h2>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <UserIcon />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {booking.guest_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <EmailIcon />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {booking.guest_email}
                      </div>
                    </div>
                  </div>
                  {booking.guest_phone && (
                    <div className="flex items-center gap-3">
                      <PhoneIcon />
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {booking.guest_phone}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* EFT payment instructions (if applicable) */}
            {booking.payment_method === 'eft' && booking.payment_status === 'pending' && (
              <Alert variant="info">
                <h4 className="font-semibold mb-2">EFT Payment Instructions</h4>
                <p className="text-sm mb-4">
                  Please complete your payment using the following bank details. Use your booking
                  reference as the payment reference.
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm bg-white/50 dark:bg-dark-card/50 rounded p-3">
                  <div className="text-gray-600 dark:text-gray-400">Bank:</div>
                  <div className="font-medium">First National Bank</div>
                  <div className="text-gray-600 dark:text-gray-400">Account Name:</div>
                  <div className="font-medium">Vilo Properties</div>
                  <div className="text-gray-600 dark:text-gray-400">Account Number:</div>
                  <div className="font-medium">62123456789</div>
                  <div className="text-gray-600 dark:text-gray-400">Branch Code:</div>
                  <div className="font-medium">250655</div>
                  <div className="text-gray-600 dark:text-gray-400">Reference:</div>
                  <div className="font-medium font-mono">{booking.booking_reference}</div>
                </div>
              </Alert>
            )}
          </div>

          {/* Right column - Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <Card.Header>
                <h2 className="font-semibold text-gray-900 dark:text-white">Payment Summary</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <BookingStatusBadge status={booking.booking_status} />
                  <PaymentStatusBadge status={booking.payment_status} />
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(booking.subtotal, booking.currency)}
                    </span>
                  </div>
                  {booking.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-{formatCurrency(booking.discount_amount, booking.currency)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between border-t border-gray-200 dark:border-dark-border pt-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(booking.total_amount, booking.currency)}
                  </span>
                </div>

                {/* Payment method */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Payment: {booking.payment_method ? (PAYMENT_METHOD_LABELS[booking.payment_method] || booking.payment_method) : 'N/A'}
                </div>
              </Card.Body>
            </Card>

            {/* Actions */}
            <div className="mt-4 space-y-2 print:hidden">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/portal/bookings')}
              >
                View My Bookings
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-dark-border py-6 mt-8 print:hidden">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div>
              Questions? Contact us at{' '}
              <a href="mailto:support@vilo.co.za" className="text-primary hover:underline">
                support@vilo.co.za
              </a>
            </div>
            <div className="flex gap-4">
              <Link to="/terms" className="hover:text-gray-700 dark:hover:text-gray-200">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-gray-700 dark:hover:text-gray-200">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ConfirmationPage;
