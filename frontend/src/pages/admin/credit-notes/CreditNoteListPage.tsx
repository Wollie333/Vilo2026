/**
 * CreditNoteListPage Component
 *
 * View and manage all credit notes issued to customers.
 * Routes: /admin/credit-notes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Spinner,
  Alert,
  Card,
  Badge,
  Input,
  Select,
  Table,
  EmptyState,
} from '@/components/ui';
import { creditNoteService } from '@/services';
import type { CreditNote } from '@/types/credit-note.types';
import {
  HiOutlinePlus,
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineSearch,
} from 'react-icons/hi';

// ============================================================================
// Component
// ============================================================================

export const CreditNoteListPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchCreditNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit,
        sortBy: 'issued_at',
        sortOrder: 'desc',
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await creditNoteService.listCreditNotes(params);

      setCreditNotes(response.creditNotes || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load credit notes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchCreditNotes();
  }, [fetchCreditNotes]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleDownload = async (creditNoteId: string) => {
    try {
      await creditNoteService.downloadCreditNote(creditNoteId);
      setSuccess('Credit note downloaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download credit note';
      setError(errorMessage);
    }
  };

  const handleVoid = async (creditNoteId: string) => {
    if (!confirm('Are you sure you want to void this credit note? This action cannot be undone.')) {
      return;
    }

    try {
      await creditNoteService.voidCreditNote(creditNoteId);
      setSuccess('Credit note voided successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchCreditNotes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to void credit note';
      setError(errorMessage);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    fetchCreditNotes();
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  // ============================================================================
  // Helpers
  // ============================================================================

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'default' | 'danger'> = {
      issued: 'success',
      draft: 'default',
      void: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AuthenticatedLayout
      title="Credit Notes"
      subtitle="View and manage credit notes issued to customers"
    >
      <div className="space-y-6">
        {/* Alerts */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="primary"
            onClick={() => navigate('/admin/credit-notes/issue')}
          >
            <HiOutlinePlus className="w-5 h-5 mr-2" />
            Issue Credit Note
          </Button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'credit note' : 'credit notes'}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <Card.Body>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by credit note number, customer name, or invoice number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<HiOutlineSearch />}
                />
              </div>

              <div className="w-full md:w-48">
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="issued">Issued</option>
                  <option value="draft">Draft</option>
                  <option value="void">Void</option>
                </Select>
              </div>

              <Button type="button" variant="outline" onClick={handleResetFilters}>
                Reset
              </Button>
            </form>
          </Card.Body>
        </Card>

        {/* Credit Notes Table */}
        <Card>
          <Card.Body className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : creditNotes.length === 0 ? (
              <EmptyState
                icon={<HiOutlineDocumentText />}
                title="No credit notes found"
                description={
                  statusFilter !== 'all' || searchQuery
                    ? 'Try adjusting your filters'
                    : 'Issue your first credit note to get started'
                }
                action={
                  <Button variant="primary" onClick={() => navigate('/admin/credit-notes/issue')}>
                    <HiOutlinePlus className="w-5 h-5 mr-2" />
                    Issue Credit Note
                  </Button>
                }
              />
            ) : (
              <>
                <Table>
                  <Table.Head>
                    <Table.Row>
                      <Table.Header>Credit Note #</Table.Header>
                      <Table.Header>Customer</Table.Header>
                      <Table.Header>Invoice Ref</Table.Header>
                      <Table.Header>Amount</Table.Header>
                      <Table.Header>Status</Table.Header>
                      <Table.Header>Issued Date</Table.Header>
                      <Table.Header className="text-right">Actions</Table.Header>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {creditNotes.map((cn) => (
                      <Table.Row key={cn.id}>
                        <Table.Cell>
                          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                            {cn.credit_note_number}
                          </code>
                        </Table.Cell>
                        <Table.Cell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {cn.customer_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {cn.customer_email}
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <code className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs font-mono text-blue-700 dark:text-blue-300">
                            {cn.invoice_number}
                          </code>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(cn.credit_total_cents, cn.currency)}
                          </span>
                        </Table.Cell>
                        <Table.Cell>{getStatusBadge(cn.status)}</Table.Cell>
                        <Table.Cell>{formatDate(cn.issued_at)}</Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(cn.id)}
                              title="Download PDF"
                            >
                              <HiOutlineDownload className="w-4 h-4" />
                            </Button>
                            {cn.status === 'issued' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVoid(cn.id)}
                                title="Void Credit Note"
                                className="text-red-600 hover:text-red-700"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-dark-border">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};
