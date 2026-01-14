/**
 * PaymentHistoryList Component
 *
 * Displays a list of user invoices with the ability to download PDFs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Spinner, Badge, Button, Alert } from '@/components/ui';
import { invoiceService } from '@/services';
import type { Invoice } from '@/types/invoice.types';
import type { PaymentHistoryListProps, PaymentHistoryItemProps } from './PaymentHistoryList.types';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/types/invoice.types';

// Icons
const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ReceiptIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Helper functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(cents / 100);
}

// PaymentHistoryItem Component
const PaymentHistoryItem: React.FC<PaymentHistoryItemProps> = ({
  invoiceNumber,
  date,
  amountCents,
  currency,
  status,
  description,
  compact,
  onDownload,
  isDownloading,
}) => {
  const statusVariant = INVOICE_STATUS_COLORS[status] === 'green' ? 'success' :
                        INVOICE_STATUS_COLORS[status] === 'red' ? 'error' : 'default';

  if (compact) {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {invoiceNumber}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(date)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant} size="sm">
            {INVOICE_STATUS_LABELS[status]}
          </Badge>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(amountCents, currency)}
          </span>
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="p-1.5 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
            title="Download PDF"
          >
            {isDownloading ? (
              <Spinner size="sm" />
            ) : (
              <DownloadIcon />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-dark-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 dark:bg-dark-bg rounded-lg flex items-center justify-center">
          <span className="text-gray-400">
            <ReceiptIcon />
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {invoiceNumber}
          </p>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatDate(date)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant={statusVariant} size="sm">
          {INVOICE_STATUS_LABELS[status]}
        </Badge>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(amountCents, currency)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          disabled={isDownloading}
          className="flex items-center gap-1"
        >
          {isDownloading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <DownloadIcon />
              <span className="hidden sm:inline">Download</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Main PaymentHistoryList Component
export const PaymentHistoryList: React.FC<PaymentHistoryListProps> = ({
  className,
  pageSize = 10,
  compact = false,
  statusFilter,
  onDownload,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await invoiceService.getMyInvoices({
        page,
        limit: pageSize,
        status: statusFilter,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      setInvoices(response.invoices);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handle download
  const handleDownload = async (invoiceId: string) => {
    try {
      setDownloadingId(invoiceId);
      await invoiceService.downloadInvoice(invoiceId);
      onDownload?.(invoiceId);
    } catch (err) {
      console.error('Failed to download invoice:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Get description from line items
  const getDescription = (invoice: Invoice): string | undefined => {
    if (invoice.line_items && invoice.line_items.length > 0) {
      return invoice.line_items[0].description;
    }
    return undefined;
  };

  // Loading state
  if (loading && invoices.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 ${className || ''}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  // Empty state
  if (invoices.length === 0) {
    return (
      <div className={`text-center py-8 ${className || ''}`}>
        <EmptyStateIcon />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No payment history yet
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Your invoices will appear here after your first payment
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Invoice List */}
      <div className={compact ? 'divide-y divide-gray-100 dark:divide-dark-border' : ''}>
        {invoices.map((invoice) => (
          <PaymentHistoryItem
            key={invoice.id}
            id={invoice.id}
            invoiceNumber={invoice.invoice_number}
            date={invoice.created_at}
            amountCents={invoice.total_cents}
            currency={invoice.currency}
            status={invoice.status}
            description={getDescription(invoice)}
            compact={compact}
            onDownload={() => handleDownload(invoice.id)}
            isDownloading={downloadingId === invoice.id}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
