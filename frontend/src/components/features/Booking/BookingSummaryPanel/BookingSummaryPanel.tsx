/**
 * BookingSummaryPanel Component
 *
 * Sticky payment breakdown summary panel with CTAs
 */

import React from 'react';
import type { BookingSummaryPanelProps } from './BookingSummaryPanel.types';
import { Button, Card } from '@/components/ui';
import { formatCurrency } from '@/types/booking.types';

export const BookingSummaryPanel: React.FC<BookingSummaryPanelProps> = ({
  booking,
  onRecordPayment,
}) => {
  const balance = booking.total_amount - booking.amount_paid;
  const paymentPercentage = (booking.amount_paid / booking.total_amount) * 100;

  return (
    <div className="w-full">
      <Card
        variant="bordered"
        className="border-2"
        style={{ boxShadow: '0 10px 40px rgba(4, 120, 87, 0.15)' }}
      >
        <Card.Body className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Payment Summary
              </h3>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Room Total</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(booking.room_total || 0, booking.currency)}
                </span>
              </div>

              {(booking.addons_total || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Add-ons</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(booking.addons_total || 0, booking.currency)}
                  </span>
                </div>
              )}

              {(booking.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-success dark:text-success">Discount</span>
                  <span className="font-medium text-success">
                    -{formatCurrency(booking.discount_amount || 0, booking.currency)}
                  </span>
                </div>
              )}

              {(booking.tax_amount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(booking.tax_amount || 0, booking.currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-3 border-t-2 border-gray-300 dark:border-gray-600">
              <div className="flex justify-between items-baseline">
                <span className="text-base font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(booking.total_amount, booking.currency)}
                </span>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Amount Paid</span>
                <span className="text-base font-semibold text-success">
                  {formatCurrency(booking.amount_paid, booking.currency)}
                </span>
              </div>

              {balance > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Outstanding</span>
                  <span className="text-base font-semibold text-warning">
                    {formatCurrency(balance, booking.currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {balance > 0 && (
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success to-primary transition-all duration-500"
                    style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {Math.round(paymentPercentage)}% paid
                </p>
              </div>
            )}

            {/* Fully Paid Status */}
            {balance === 0 && (
              <div className="flex items-center justify-center gap-2 text-success p-4 bg-success/10 rounded-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Fully Paid</span>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
