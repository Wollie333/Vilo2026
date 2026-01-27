/**
 * UserPaymentHistoryTab Component
 *
 * Displays payment history including invoices and transactions
 * Super admin only - used in User Detail Page
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Spinner,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { usersService } from '@/services';
import { formatCurrency } from '@/utils/currency';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Checkout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

interface PaymentStats {
  total_paid: number;
  total_outstanding: number;
  failed_payments_count: number;
  currency: string;
}

interface UserPaymentHistoryTabProps {
  userId: string;
  userName: string;
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
  draft: 'Draft',
  void: 'Void',
  failed: 'Failed',
};

const INVOICE_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'secondary'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'error',
  draft: 'secondary',
  void: 'secondary',
  failed: 'error',
};

const CHECKOUT_STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const CHECKOUT_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'secondary'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error',
  cancelled: 'secondary',
};

export const UserPaymentHistoryTab: React.FC<UserPaymentHistoryTabProps> = ({
  userId,
  userName,
}) => {
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('invoices');

  // Fetch payment history
  useEffect(() => {
    fetchPaymentHistory();
  }, [userId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersService.getUserPaymentHistory(userId);
      setInvoices(result.invoices || []);
      setCheckouts(result.checkouts || []);
      setStats(result.stats || null);
    } catch (err: any) {
      console.error('Error fetching payment history:', err);
      setError(err.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment History for {userName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Invoices, transactions, and payment records
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <Card.Body>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Paid</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(stats.total_paid, stats.currency)}
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="text-sm text-gray-600 dark:text-gray-400">Outstanding</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {formatCurrency(stats.total_outstanding, stats.currency)}
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed Payments</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.failed_payments_count}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Loading / Error States */}
      {loading ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <Spinner size="md" className="mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading payment history...</p>
          </Card.Body>
        </Card>
      ) : error ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </Card.Body>
        </Card>
      ) : invoices.length === 0 && checkouts.length === 0 ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No payment history found for this user.
            </p>
          </Card.Body>
        </Card>
      ) : (
        /* Tabs for Invoices and Transactions */
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <Card.Header className="border-b border-gray-200 dark:border-gray-700">
              <TabsList>
                <TabsTrigger value="invoices">
                  Invoices ({invoices.length})
                </TabsTrigger>
                <TabsTrigger value="transactions">
                  Transactions ({checkouts.length})
                </TabsTrigger>
              </TabsList>
            </Card.Header>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Paid At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-gray-700">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            No invoices found.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {invoice.invoice_number}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {invoice.description || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={INVOICE_STATUS_VARIANTS[invoice.status] || 'secondary'}
                              size="sm"
                            >
                              {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatDate(invoice.due_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatDate(invoice.paid_at)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-gray-700">
                    {checkouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            No transactions found.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      checkouts.map((checkout) => (
                        <tr
                          key={checkout.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatDate(checkout.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {checkout.description || 'Subscription Payment'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(checkout.amount, checkout.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {checkout.payment_method || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={CHECKOUT_STATUS_VARIANTS[checkout.status] || 'secondary'}
                              size="sm"
                            >
                              {CHECKOUT_STATUS_LABELS[checkout.status] || checkout.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {checkout.payment_reference || 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
};
