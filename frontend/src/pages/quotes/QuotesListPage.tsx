/**
 * Quotes List Page
 *
 * Central page for property owners to view and manage all quote requests
 * across all their properties
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { QuoteRequestCard, QuoteRequestDetailModal } from '@/components/features/QuoteRequest';
import type { QuoteRequestWithDetails, QuoteRequestStatus, QuoteGroupType } from '@/types/quote-request.types';
import { quoteRequestService } from '@/services';
import { Spinner, Alert, Button } from '@/components/ui';
import {
  Filter,
  Search,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

export const QuotesListPage: React.FC = () => {
  console.log('[QuotesListPage] Rendering');

  // URL search params
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [quotes, setQuotes] = useState<QuoteRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequestWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter state from URL params
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [groupTypeFilter, setGroupTypeFilter] = useState<string>(searchParams.get('group_type') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [propertyFilter, setPropertyFilter] = useState<string>(searchParams.get('property') || 'all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    responded: 0,
    converted: 0,
    conversion_rate: 0,
  });

  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (groupTypeFilter !== 'all') params.group_type = groupTypeFilter;
    if (searchQuery) params.search = searchQuery;
    if (propertyFilter !== 'all') params.property = propertyFilter;
    setSearchParams(params);
  }, [statusFilter, groupTypeFilter, searchQuery, propertyFilter, setSearchParams]);

  // Load quotes
  useEffect(() => {
    loadQuotes();
  }, [statusFilter, groupTypeFilter, searchQuery, propertyFilter, currentPage]);

  const loadQuotes = async () => {
    console.log('[QuotesListPage] Loading quotes...');
    setIsLoading(true);
    setError(null);

    try {
      const params: any = {
        page: currentPage,
        limit: 12,
        sortBy: 'created_at',
        sortOrder: 'desc' as const,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (groupTypeFilter !== 'all') {
        params.group_type = groupTypeFilter;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (propertyFilter !== 'all') {
        params.property_id = propertyFilter;
      }

      const response = await quoteRequestService.list(params);
      console.log('[QuotesListPage] API Response:', response);

      if (!response || !response.quote_requests) {
        console.error('[QuotesListPage] Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      console.log('[QuotesListPage] Loaded quotes:', response.quote_requests.length);

      setQuotes(response.quote_requests);
      setTotalCount(response.total);
      setTotalPages(response.totalPages);
      setStats(response.stats);
    } catch (err: any) {
      console.error('[QuotesListPage] Failed to load quotes:', err);
      console.error('[QuotesListPage] Error details:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to load quote requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quote click
  const handleQuoteClick = (quote: QuoteRequestWithDetails) => {
    console.log('[QuotesListPage] Opening quote:', quote.id);
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  // Handle respond
  const handleRespond = async (quoteId: string, response: string) => {
    console.log('[QuotesListPage] Responding to quote:', quoteId);

    await quoteRequestService.respond(quoteId, {
      response_message: response,
    });

    // Reload quotes
    await loadQuotes();
  };

  // Handle status update
  const handleUpdateStatus = async (quoteId: string, status: string) => {
    console.log('[QuotesListPage] Updating quote status:', quoteId, status);

    try {
      await quoteRequestService.updateStatus(quoteId, {
        status: status as QuoteRequestStatus,
      });

      console.log('[QuotesListPage] Status updated successfully');

      // Reload quotes to reflect the change
      await loadQuotes();
    } catch (err: any) {
      console.error('[QuotesListPage] Failed to update status:', err);
      throw err; // Re-throw so the modal can show the error
    }
  };

  // Handle convert to booking
  const handleConvert = async (quoteId: string) => {
    console.log('[QuotesListPage] Converting quote to booking:', quoteId);

    // Ask user to confirm and provide booking ID
    const bookingId = prompt('Enter the Booking ID to link this quote to:');

    if (!bookingId || !bookingId.trim()) {
      alert('Booking ID is required to convert the quote.');
      return;
    }

    try {
      await quoteRequestService.convertToBooking(quoteId, bookingId.trim());
      console.log('[QuotesListPage] Quote converted successfully');

      // Reload quotes to show updated status
      await loadQuotes();

      alert('Quote converted to booking successfully!');
    } catch (err: any) {
      console.error('[QuotesListPage] Failed to convert:', err);
      const errorMessage = err.message || 'Failed to convert quote to booking. Please try again.';
      alert(errorMessage);
    }
  };

  // Calculate conversion rate percentage
  const conversionRatePercent = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <AuthenticatedLayout
      title="Quote Requests"
      subtitle="Manage all quote requests across your properties"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Total Quotes</p>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.total}</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">Pending</p>
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-800 dark:text-blue-200">Responded</p>
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.responded}</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-800 dark:text-green-200">Conversion Rate</p>
              <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">{conversionRatePercent}%</p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              {stats.converted} converted
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by guest name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="responded">Responded</option>
                <option value="converted">Converted</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Group Type Filter */}
            <select
              value={groupTypeFilter}
              onChange={(e) => setGroupTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Group Types</option>
              <option value="family">Family</option>
              <option value="friends">Friends</option>
              <option value="business">Business</option>
              <option value="wedding">Wedding</option>
              <option value="corporate_event">Corporate Event</option>
              <option value="retreat">Retreat</option>
              <option value="conference">Conference</option>
              <option value="celebration">Celebration</option>
              <option value="other">Other</option>
            </select>

            {/* Reset Filters */}
            {(statusFilter !== 'all' || groupTypeFilter !== 'all' || searchQuery || propertyFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all');
                  setGroupTypeFilter('all');
                  setSearchQuery('');
                  setPropertyFilter('all');
                  setCurrentPage(1);
                }}
              >
                <XCircle className="w-5 h-5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Quote List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="error">{error}</Alert>
        ) : quotes.length === 0 ? (
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-12 text-center">
            <p className="text-gray-600 dark:text-dark-text-secondary text-lg mb-2">
              No quote requests found
            </p>
            <p className="text-gray-500 dark:text-dark-text-tertiary text-sm">
              {statusFilter !== 'all' || groupTypeFilter !== 'all' || searchQuery
                ? 'Try adjusting your filters'
                : 'Quote requests will appear here once guests submit them'}
            </p>
          </div>
        ) : (
          <>
            {/* Quote Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {quotes.map((quote) => (
                <QuoteRequestCard key={quote.id} quote={quote} onClick={handleQuoteClick} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  Showing page {currentPage} of {totalPages} ({totalCount} total quotes)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Quote Detail Modal */}
        <QuoteRequestDetailModal
          quote={selectedQuote}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedQuote(null);
          }}
          onRespond={handleRespond}
          onUpdateStatus={handleUpdateStatus}
          onConvert={handleConvert}
        />
      </div>
    </AuthenticatedLayout>
  );
};
