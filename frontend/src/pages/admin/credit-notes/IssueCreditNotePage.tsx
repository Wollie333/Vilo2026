/**
 * IssueCreditNotePage Component
 *
 * Form to issue a new credit note for an invoice.
 * Routes: /admin/credit-notes/issue
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Spinner,
  Alert,
  Card,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import { creditNoteService, invoiceService } from '@/services';
import type { Invoice } from '@/types/invoice.types';
import type { CreateCreditNoteInput } from '@/types/credit-note.types';
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

// ============================================================================
// Component
// ============================================================================

export const IssueCreditNotePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedInvoiceId = searchParams.get('invoiceId');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Invoice selection
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(preSelectedInvoiceId || '');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form state
  const [creditType, setCreditType] = useState<'refund' | 'cancellation' | 'adjustment' | 'error_correction'>('refund');
  const [reason, setReason] = useState('');
  const [creditAmount, setCreditAmount] = useState('');

  // ============================================================================
  // Load Invoice
  // ============================================================================

  useEffect(() => {
    if (selectedInvoiceId) {
      loadInvoice(selectedInvoiceId);
    }
  }, [selectedInvoiceId]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setInvoiceLoading(true);
      setError(null);
      const invoice = await invoiceService.getInvoice(invoiceId);
      setSelectedInvoice(invoice);

      // Pre-fill credit amount with invoice total (can be edited)
      setCreditAmount((invoice.total_cents / 100).toFixed(2));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invoice';
      setError(errorMessage);
      setSelectedInvoice(null);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // ============================================================================
  // Calculations
  // ============================================================================

  const creditAmountCents = Math.round(parseFloat(creditAmount || '0') * 100);
  const originalInvoiceTotal = selectedInvoice?.total_cents || 0;
  const outstandingBalance = originalInvoiceTotal - creditAmountCents;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoice) {
      setError('Please select an invoice');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the credit note');
      return;
    }

    if (creditAmountCents <= 0) {
      setError('Credit amount must be greater than zero');
      return;
    }

    if (creditAmountCents > originalInvoiceTotal) {
      setError('Credit amount cannot exceed the original invoice total');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const input: CreateCreditNoteInput = {
        invoice_id: selectedInvoice.id,
        credit_type: creditType,
        reason: reason.trim(),
        credit_total_cents: creditAmountCents,
        // Line items will be auto-generated from invoice line items
      };

      const creditNote = await creditNoteService.issueCreditNote(input);

      navigate(`/admin/credit-notes`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to issue credit note';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/credit-notes');
  };

  // ============================================================================
  // Helpers
  // ============================================================================

  const formatCurrency = (cents: number) => {
    const currency = selectedInvoice?.currency || 'ZAR';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AuthenticatedLayout
      title="Issue Credit Note"
      subtitle="Create a credit note for an existing invoice"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <div>
          <Button variant="outline" onClick={handleCancel}>
            <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
            Back to Credit Notes
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Selection */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="w-5 h-5" />
                <span>Select Invoice</span>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Invoice ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter invoice ID or invoice number"
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    disabled={!!preSelectedInvoiceId}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {preSelectedInvoiceId
                      ? 'Invoice pre-selected from invoice detail page'
                      : 'Paste the invoice UUID or invoice number'}
                  </p>
                </div>

                {invoiceLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Spinner size="sm" />
                    <span>Loading invoice...</span>
                  </div>
                )}

                {selectedInvoice && !invoiceLoading && (
                  <div className="p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg border border-gray-200 dark:border-dark-border">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Invoice Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Invoice Number:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedInvoice.invoice_number}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Invoice Date:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(selectedInvoice.created_at)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Customer:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedInvoice.company_name || selectedInvoice.user_id}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(selectedInvoice.total_cents)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Credit Note Details */}
          {selectedInvoice && (
            <Card>
              <Card.Header>Credit Note Details</Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Credit Type <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={creditType}
                      onChange={(e) => setCreditType(e.target.value as any)}
                    >
                      <option value="refund">Refund</option>
                      <option value="cancellation">Cancellation</option>
                      <option value="adjustment">Adjustment</option>
                      <option value="error_correction">Error Correction</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Credit Amount <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={(originalInvoiceTotal / 100).toFixed(2)}
                      placeholder="0.00"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum: {formatCurrency(originalInvoiceTotal)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      rows={4}
                      placeholder="Explain the reason for issuing this credit note..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {reason.length}/500 characters
                    </p>
                  </div>

                  {/* Outstanding Balance Preview */}
                  {creditAmountCents > 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Outstanding Balance Calculation
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700 dark:text-gray-300">
                            Original Invoice Total:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(originalInvoiceTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-red-600 dark:text-red-400">
                          <span>Credit Amount:</span>
                          <span className="font-medium">
                            -{formatCurrency(creditAmountCents)}
                          </span>
                        </div>
                        <div className="h-px bg-gray-300 dark:bg-gray-700 my-2" />
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Outstanding Balance:
                          </span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(outstandingBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Actions */}
          {selectedInvoice && (
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                disabled={!selectedInvoice || !reason.trim() || creditAmountCents <= 0}
              >
                <HiOutlineCheckCircle className="w-5 h-5 mr-2" />
                Issue Credit Note
              </Button>
            </div>
          )}
        </form>
      </div>
    </AuthenticatedLayout>
  );
};
