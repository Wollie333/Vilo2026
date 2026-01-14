/**
 * PaymentHistoryTable Component
 *
 * Enhanced payment history display with receipt download links.
 * Groups payments by milestone if schedule exists.
 */

import React from 'react';
import { Badge, Button } from '@/components/ui';
import { HiOutlineDownload, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  receipt_number?: string | null;
  receipt_url?: string | null;
  payment_reference?: string | null;
  applied_to_milestone_id?: string | null;
  notes?: string | null;
}

interface PaymentHistoryTableProps {
  payments: Payment[];
  bookingId: string;
  onDownloadReceipt?: (paymentId: string) => Promise<string>;
}

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  payments,
  bookingId,
  onDownloadReceipt,
}) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No payments recorded yet.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      cash: 'Cash',
      card: 'Card',
      bank_transfer: 'Bank Transfer',
      eft: 'EFT',
      payfast: 'PayFast',
      stripe: 'Stripe',
      other: 'Other',
    };
    return methodMap[method] || method;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return (
          <Badge variant="success" size="sm">
            <HiOutlineCheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm">
            <HiOutlineClock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" size="sm">
            Failed
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="default" size="sm">
            Refunded
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const handleDownload = async (payment: Payment) => {
    if (!onDownloadReceipt) {
      console.error('onDownloadReceipt callback not provided');
      return;
    }

    if (!payment.receipt_url) {
      console.error('No receipt URL available for payment:', payment.id);
      return;
    }

    if (!payment.id) {
      console.error('Payment ID missing');
      return;
    }

    try {
      console.log('Downloading receipt for payment:', payment.id);
      const downloadUrl = await onDownloadReceipt(payment.id);
      console.log('Got download URL:', downloadUrl);

      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      } else {
        console.error('Download URL is empty or undefined');
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-dark-sidebar">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Receipt #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Reference
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Method
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Notes
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-gray-700">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-dark-sidebar/50">
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {formatDate(payment.paid_at || payment.created_at)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                {payment.receipt_number ? (
                  <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-900 dark:text-white">
                    {payment.receipt_number}
                  </code>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">No receipt</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                {payment.payment_reference ? (
                  <code className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs font-mono text-blue-700 dark:text-blue-300">
                    {payment.payment_reference}
                  </code>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(payment.amount, payment.currency)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {formatPaymentMethod(payment.payment_method)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {getStatusBadge(payment.status)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                {payment.notes || '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                {payment.receipt_url && payment.receipt_number && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(payment)}
                    title="Download Receipt"
                  >
                    <HiOutlineDownload className="w-4 h-4" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Row */}
      <div className="bg-gray-50 dark:bg-dark-sidebar px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Payments: {payments.length}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Total:{' '}
            {formatCurrency(
              payments
                .filter((p) => p.status === 'completed' || p.status === 'verified')
                .reduce((sum, p) => sum + p.amount, 0),
              payments[0]?.currency || 'ZAR'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
