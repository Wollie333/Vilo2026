/**
 * BookingDetailSidebar Component
 *
 * Dark sidebar with property branding, journey progress, metadata, and quick actions
 */

import React from 'react';
import type { BookingDetailSidebarProps } from './BookingDetailSidebar.types';
import { BookingJourneyProgress } from '../BookingJourneyProgress';
import { BookingStatusBadge } from '@/components/features';
import { Button, Badge, CalendarIcon, UserIcon, UsersIcon, HomeIcon } from '@/components/ui';
import { formatBookingReference, formatDateRange } from '@/types/booking.types';

export const BookingDetailSidebar: React.FC<BookingDetailSidebarProps> = ({
  booking,
  onRecordPayment,
  onSendConfirmation,
  onNavigateBack,
}) => {
  const totalGuests = (booking.adults || 0) + (booking.children || 0) + (booking.infants || 0);
  const nights = booking.total_nights || 0;
  const balance = booking.total_amount - booking.amount_paid;

  // Get the first room's featured image, or fallback to property image
  const featuredImage = booking.rooms?.[0]?.featured_image
    || (booking.rooms?.[0] as any)?.image_url
    || (booking.rooms?.[0] as any)?.room_image
    || booking.property?.featured_image_url;

  return (
    <div className="w-full bg-gray-950 text-white border-b border-gray-800">
      {/* Horizontal Top Bar Layout */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Left: Room Image */}
        <div className="relative w-full lg:w-64 h-48 lg:h-auto flex-shrink-0 rounded-lg overflow-hidden">
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={booking.rooms?.[0]?.room_name || booking.property_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />

          {/* Back Button Overlay */}
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900/80 hover:bg-gray-900 text-white text-xs font-medium rounded-md backdrop-blur-sm transition-all duration-200 hover:scale-105"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          )}
        </div>

        {/* Center: Main Info */}
        <div className="flex-1 space-y-4">
          {/* Top Row: Status, Reference, Property Name */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <BookingStatusBadge status={booking.booking_status} size="lg" />
              <h1 className="text-2xl lg:text-3xl font-bold font-mono text-white">
                {formatBookingReference(booking.booking_reference)}
              </h1>
            </div>
            <p className="text-sm text-gray-300">{booking.property_name}</p>
          </div>

          {/* Date Range & Nights */}
          <div className="flex items-center gap-2 text-sm text-gray-200 flex-wrap">
            <CalendarIcon size="sm" />
            <span>{formatDateRange(booking.check_in_date, booking.check_out_date)}</span>
            <Badge variant="default" size="sm">{nights} night{nights !== 1 ? 's' : ''}</Badge>
          </div>

          {/* Key Metadata - Horizontal */}
          <div className="flex flex-wrap gap-6">
            {/* Guest */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Guest</p>
              <div className="flex items-center gap-2">
                <UserIcon size="sm" className="text-gray-400" />
                <p className="text-sm font-medium text-white">{booking.guest_name}</p>
              </div>
            </div>

            {/* Total Guests */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Guests</p>
              <div className="flex items-center gap-2">
                <UsersIcon size="sm" className="text-gray-400" />
                <p className="text-sm font-medium text-white">{totalGuests}</p>
              </div>
            </div>

            {/* Rooms */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Rooms</p>
              <div className="flex items-center gap-2">
                <HomeIcon size="sm" className="text-gray-400" />
                <p className="text-sm font-medium text-white">{booking.rooms?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-start">
          {balance > 0 && onRecordPayment && (
            <Button
              variant="primary"
              onClick={onRecordPayment}
              className="whitespace-nowrap"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Record Payment
            </Button>
          )}

          {onSendConfirmation && (
            <Button
              variant="outline"
              className="text-white border-gray-700 hover:bg-gray-800 whitespace-nowrap"
              onClick={onSendConfirmation}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Confirmation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
