/**
 * CustomerDetailSidebar Component
 *
 * Dark sidebar with customer profile, key metrics, and quick actions
 * Matches the design pattern of BookingDetailSidebar
 */

import React from 'react';
import type { CustomerDetailSidebarProps } from './CustomerDetailSidebar.types';
import { Button, Badge } from '@/components/ui';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineChat,
  HiOutlineCalendar,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_COLORS,
  CUSTOMER_SOURCE_LABELS,
} from '@/types/customer.types';

export const CustomerDetailSidebar: React.FC<CustomerDetailSidebarProps> = ({
  customer,
  activeConversationsCount,
  onSendEmail,
  onCall,
  onNavigateBack,
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge variant
  const statusVariant = CUSTOMER_STATUS_COLORS[customer.status] as any;

  return (
    <div className="w-full bg-gray-950 text-white border-b border-gray-800">
      {/* Horizontal Top Bar Layout */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Left: Customer Avatar */}
        <div className="relative w-full lg:w-64 h-48 lg:h-auto flex-shrink-0 rounded-lg overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <HiOutlineUser className="w-24 h-24 text-primary" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />

          {/* Back Button Overlay */}
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900/80 hover:bg-gray-900 text-white text-xs font-medium rounded-md backdrop-blur-sm transition-all duration-200 hover:scale-105"
            >
              <HiOutlineArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}

          {/* Status Badge Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <Badge variant={statusVariant} size="lg">
              {CUSTOMER_STATUS_LABELS[customer.status]}
            </Badge>
          </div>
        </div>

        {/* Center: Main Info */}
        <div className="flex-1 space-y-4">
          {/* Top Row: Name & Source */}
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              {customer.full_name || 'No Name Provided'}
            </h1>
            <p className="text-sm text-gray-300">{customer.email}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Source:</span>
              <Badge variant="default" size="sm">
                {CUSTOMER_SOURCE_LABELS[customer.source]}
              </Badge>
            </div>
          </div>

          {/* Key Metadata - Horizontal Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Total Bookings */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Bookings</p>
              <div className="flex items-center gap-2">
                <HiOutlineShoppingBag className="w-4 h-4 text-gray-400" />
                <p className="text-lg font-bold text-white">{customer.total_bookings}</p>
              </div>
            </div>

            {/* Total Spent */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Spent</p>
              <div className="flex items-center gap-2">
                <HiOutlineCurrencyDollar className="w-4 h-4 text-gray-400" />
                <p className="text-lg font-bold text-white">
                  {formatCurrency(customer.total_spent, customer.currency)}
                </p>
              </div>
            </div>

            {/* Active Chats */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Active Chats</p>
              <div className="flex items-center gap-2">
                <HiOutlineChat className="w-4 h-4 text-gray-400" />
                <p className="text-lg font-bold text-white">{activeConversationsCount}</p>
              </div>
            </div>

            {/* Last Booking */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Last Booking</p>
              <div className="flex items-center gap-2">
                <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-medium text-white">
                  {formatDate(customer.last_booking_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Company & Property Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500">Company: </span>
              <span className="text-gray-200 font-medium">{customer.company.name}</span>
            </div>
            {customer.first_property && (
              <div>
                <span className="text-gray-500">First Property: </span>
                <span className="text-gray-200 font-medium">{customer.first_property.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-start">
          {customer.email && onSendEmail && (
            <Button
              variant="primary"
              onClick={onSendEmail}
              className="whitespace-nowrap"
            >
              <HiOutlineMail className="w-5 h-5 mr-2" />
              Send Email
            </Button>
          )}

          {customer.phone && onCall && (
            <Button
              variant="outline"
              className="text-white border-gray-700 hover:bg-gray-800 whitespace-nowrap"
              onClick={onCall}
            >
              <HiOutlinePhone className="w-5 h-5 mr-2" />
              Call Customer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
