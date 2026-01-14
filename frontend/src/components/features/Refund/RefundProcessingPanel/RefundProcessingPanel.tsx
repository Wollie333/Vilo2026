/**
 * RefundProcessingPanel Component
 *
 * Displays refund breakdown by payment method with processing status and actions.
 *
 * Features:
 * - Shows each payment method used in the booking
 * - Displays proportional refund amount per method
 * - Status badges (pending, processing, completed, failed)
 * - Process button for each method (admin only)
 * - Real-time status updates
 */

import React from 'react';
import { Button, Badge, AmountDisplay } from '@/components/ui';
import { formatCurrency } from '@/types/booking.types';
import type { RefundProcessingPanelProps } from './RefundProcessingPanel.types';
import type { RefundBreakdownItem } from '@/types/refund.types';

export const RefundProcessingPanel: React.FC<RefundProcessingPanelProps> = ({
  refund,
  paymentMethods,
  onProcess,
  processingMethodId = null,
}) => {
  // Get breakdown from refund or calculate proportionally
  const getBreakdown = (): RefundBreakdownItem[] => {
    if (refund.refund_breakdown && refund.refund_breakdown.length > 0) {
      return refund.refund_breakdown;
    }

    // Calculate proportional breakdown if not provided
    return paymentMethods.map((payment) => {
      const proportionalAmount = (payment.amount / (refund.booking?.total_amount || payment.amount)) * (refund.approved_amount || refund.requested_amount);

      return {
        payment_id: payment.id,
        method: payment.payment_method,
        amount: proportionalAmount,
        status: 'pending' as const,
        gateway_refund_id: null,
        processed_at: null,
        error_message: null,
      };
    });
  };

  const breakdown = getBreakdown();

  const getStatusBadgeVariant = (
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'manual_pending'
  ): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      case 'manual_pending':
        return 'warning';
      case 'pending':
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: 'pending' | 'processing' | 'completed' | 'failed' | 'manual_pending'): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'manual_pending':
        return 'Manual Processing Required';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      card: 'Credit/Debit Card',
      bank_transfer: 'Bank Transfer',
      paypal: 'PayPal',
      eft: 'EFT',
      cash: 'Cash',
    };
    return labels[method] || method;
  };

  const canProcess = (item: RefundBreakdownItem): boolean => {
    return item.status === 'pending' || item.status === 'failed';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">Refund Processing Breakdown</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total: <span className="font-semibold">{formatCurrency(refund.approved_amount || refund.requested_amount, refund.currency)}</span>
        </div>
      </div>

      {/* Payment Method Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Refund Amount
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {breakdown.map((item, index) => (
              <tr key={item.payment_id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {/* Payment Method */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getPaymentMethodLabel(item.method)}
                      </div>
                      {item.gateway_refund_id && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Gateway ID: {item.gateway_refund_id}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Refund Amount */}
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <AmountDisplay
                    amount={item.amount}
                    currency={refund.currency}
                    size="sm"
                    className="font-semibold"
                  />
                </td>

                {/* Status */}
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                    {getStatusLabel(item.status)}
                  </Badge>
                  {item.processed_at && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(item.processed_at).toLocaleDateString()}
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {canProcess(item) ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onProcess(item.payment_id)}
                      isLoading={processingMethodId === item.payment_id}
                      disabled={processingMethodId === item.payment_id}
                    >
                      {item.status === 'failed' ? 'Retry' : 'Process'}
                    </Button>
                  ) : item.status === 'completed' ? (
                    <div className="flex items-center justify-center text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : item.status === 'processing' ? (
                    <div className="flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error Messages */}
      {breakdown.some((item) => item.error_message) && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h5 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
            Processing Errors:
          </h5>
          <ul className="list-disc list-inside space-y-1">
            {breakdown
              .filter((item) => item.error_message)
              .map((item, index) => (
                <li key={index} className="text-sm text-red-700 dark:text-red-300">
                  {getPaymentMethodLabel(item.method)}: {item.error_message}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Manual Processing Notice */}
      {breakdown.some((item) => item.status === 'manual_pending') && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h5 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                Manual Processing Required
              </h5>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Some payment methods (EFT, Cash) require manual processing. Please process these refunds manually and update the status accordingly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Methods</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{breakdown.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {breakdown.filter((item) => item.status === 'completed').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Processing</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {breakdown.filter((item) => item.status === 'processing').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Failed</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              {breakdown.filter((item) => item.status === 'failed').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
