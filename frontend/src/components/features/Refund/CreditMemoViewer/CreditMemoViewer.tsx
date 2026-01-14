import React, { useState } from 'react';
import { Button, AmountDisplay, Badge } from '@/components/ui';
import { creditMemoService } from '@/services';
import type { CreditMemo } from '@/types/credit-memo.types';

export interface CreditMemoViewerProps {
  creditMemo: CreditMemo;
  className?: string;
}

export const CreditMemoViewer: React.FC<CreditMemoViewerProps> = ({
  creditMemo,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await creditMemoService.getCreditMemoDownloadUrl(creditMemo.id);

      // Open in new tab
      window.open(response.download_url, '_blank');
    } catch (error) {
      console.error('Error downloading credit memo:', error);
      alert('Failed to download credit memo. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = () => {
    switch (creditMemo.status) {
      case 'issued':
        return <Badge variant="success">Issued</Badge>;
      case 'void':
        return <Badge variant="error">Void</Badge>;
      case 'draft':
        return <Badge variant="warning">Draft</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  return (
    <div className={`bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Credit Memo
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {creditMemo.credit_memo_number}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            isLoading={isDownloading}
            disabled={creditMemo.status === 'void' || !creditMemo.pdf_url}
          >
            📄 Download PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Credit Amount
          </span>
          <AmountDisplay
            amount={Math.abs(creditMemo.total_cents / 100)}
            currency={creditMemo.currency}
            size="lg"
            isCredit={true}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Issue Date</span>
          <span className="text-gray-900 dark:text-gray-100">
            {creditMemo.issued_at
              ? new Date(creditMemo.issued_at).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : new Date(creditMemo.created_at).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
          </span>
        </div>

        {creditMemo.refund_method && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Refund Method</span>
            <span className="text-gray-900 dark:text-gray-100 capitalize">
              {creditMemo.refund_method}
            </span>
          </div>
        )}

        {creditMemo.refund_reference && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Refund Reference</span>
            <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">
              {creditMemo.refund_reference}
            </span>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      <div className="border-t border-gray-200 dark:border-dark-border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
        >
          <span>View Details</span>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 space-y-4">
            {/* Line Items */}
            {creditMemo.line_items && creditMemo.line_items.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Line Items
                </h4>
                <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-dark-hover">
                      <tr>
                        <th className="text-left p-2 text-gray-600 dark:text-gray-400">Description</th>
                        <th className="text-right p-2 text-gray-600 dark:text-gray-400">Qty</th>
                        <th className="text-right p-2 text-gray-600 dark:text-gray-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditMemo.line_items.map((item, index) => (
                        <tr
                          key={index}
                          className="border-t border-gray-200 dark:border-dark-border"
                        >
                          <td className="p-2 text-gray-900 dark:text-gray-100">
                            {item.description}
                          </td>
                          <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                            {item.quantity}
                          </td>
                          <td className="p-2 text-right text-gray-900 dark:text-gray-100">
                            {creditMemo.currency}
                            {formatCurrency(Math.abs(item.total_cents))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Financial Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Financial Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {creditMemo.currency}
                    {formatCurrency(Math.abs(creditMemo.subtotal_cents))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tax ({creditMemo.tax_rate}%)
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {creditMemo.currency}
                    {formatCurrency(Math.abs(creditMemo.tax_cents))}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-dark-border font-semibold">
                  <span className="text-gray-900 dark:text-gray-100">Total Credit</span>
                  <AmountDisplay
                    amount={Math.abs(creditMemo.total_cents / 100)}
                    currency={creditMemo.currency}
                    size="md"
                    isCredit={true}
                  />
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Customer Information
              </h4>
              <div className="text-sm space-y-1">
                <p className="text-gray-900 dark:text-gray-100">{creditMemo.customer_name}</p>
                <p className="text-gray-600 dark:text-gray-400">{creditMemo.customer_email}</p>
                {creditMemo.customer_phone && (
                  <p className="text-gray-600 dark:text-gray-400">{creditMemo.customer_phone}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            {creditMemo.notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{creditMemo.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
