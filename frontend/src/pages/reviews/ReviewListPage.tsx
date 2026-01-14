/**
 * ReviewListPage
 * Property owner's review management dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { ReviewCard, ReviewStats as ReviewStatsComponent } from '@/components/features/Review';
import { Button, Tabs, TabsList, TabsTrigger, Select } from '@/components/ui';
import { reviewService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import type { Review, ReviewStats, ReviewStatus } from '@/types/review.types';

export const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { properties, selectedProperty, selectProperty, hasMultipleProperties } = useProperty();

  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'hidden' | 'pending'>('all');

  // Load reviews and stats
  useEffect(() => {
    async function loadData() {
      if (!selectedProperty?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Load stats
        const reviewStats = await reviewService.getPropertyStats(selectedProperty.id);
        setStats(reviewStats);

        // Load reviews based on active tab
        const filters: any = {};

        if (activeTab === 'published') {
          filters.status = 'published';
        } else if (activeTab === 'hidden') {
          filters.status = 'hidden';
        } else if (activeTab === 'pending') {
          filters.pendingWithdrawal = true;
        }

        const allReviews = await reviewService.getAllPropertyReviews(
          selectedProperty.id,
          filters
        );

        // Ensure we always set an array
        setReviews(Array.isArray(allReviews) ? allReviews : []);
      } catch (err: any) {
        console.error('Failed to load reviews:', err);
        setError(err.message || 'Failed to load reviews');
        setReviews([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [selectedProperty?.id, activeTab]);

  // Handle owner response
  const handleRespond = async (reviewId: string) => {
    const response = prompt('Enter your response:');
    if (!response) return;

    try {
      await reviewService.addOwnerResponse(reviewId, { response });
      alert('Response added successfully');
      // Reload reviews
      setActiveTab(activeTab); // Trigger reload
    } catch (err: any) {
      alert('Failed to add response: ' + err.message);
    }
  };

  // Handle hide content
  const handleHideContent = async (reviewId: string) => {
    const reason = prompt('Enter reason for hiding content:');
    if (!reason) return;

    const hideText = confirm('Hide review text? Click OK for yes, Cancel for no');
    const hidePhotos = confirm('Hide review photos? Click OK for yes, Cancel for no');

    try {
      await reviewService.hideContent(reviewId, {
        reason,
        hideText,
        hidePhotos,
      });
      alert('Content hidden successfully');
      // Reload reviews
      setActiveTab(activeTab);
    } catch (err: any) {
      alert('Failed to hide content: ' + err.message);
    }
  };

  // Handle request withdrawal
  const handleRequestWithdrawal = async (reviewId: string) => {
    const reason = prompt('Enter reason for withdrawal request:');
    if (!reason) return;

    try {
      await reviewService.requestWithdrawal(reviewId, { reason });
      alert('Withdrawal request submitted. Pending admin approval.');
      // Reload reviews
      setActiveTab(activeTab);
    } catch (err: any) {
      alert('Failed to request withdrawal: ' + err.message);
    }
  };

  // Filter reviews based on activeTab
  const filteredReviews = reviews.filter((review) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'published') return review.status === 'published' && !review.withdrawn_at;
    if (activeTab === 'hidden')
      return review.is_text_hidden || review.is_photos_hidden || review.status === 'hidden';
    if (activeTab === 'pending')
      return review.withdrawal_requested_at && !review.withdrawn_at;
    return true;
  });

  return (
    <AuthenticatedLayout
      title="Review Manager"
      subtitle="Manage and respond to guest reviews"
    >
      {/* Loading state */}
      {isLoading && !reviews.length ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
          </div>
        </div>
      ) : (
        <>

      {/* Property Selector (if user has multiple properties) */}
      {hasMultipleProperties && (
        <div className="mb-8">
          <Select
            value={selectedProperty?.id || ''}
            onChange={(e) => selectProperty(e.target.value)}
            options={properties.map((property) => ({
              value: property.id,
              label: property.name,
            }))}
            placeholder="Select a property"
          />
        </div>
      )}

      {selectedProperty ? (
        <div className="space-y-6">
          {/* Header with Title and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {stats ? `${stats.totalReviews} ${stats.totalReviews === 1 ? 'review' : 'reviews'}` : 'Loading...'}
                {stats && stats.overallRating > 0 && ` · ${stats.overallRating.toFixed(1)} average rating`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList variant="pills">
                  <TabsTrigger value="all" variant="pills">All</TabsTrigger>
                  <TabsTrigger value="published" variant="pills">Published</TabsTrigger>
                  <TabsTrigger value="hidden" variant="pills">Hidden</TabsTrigger>
                  <TabsTrigger value="pending" variant="pills">Pending</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Sidebar */}
            <div className="lg:col-span-1">
              {stats && <ReviewStatsComponent stats={stats} />}
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2">

            {/* Reviews */}
            <div className="mt-6 space-y-6">
              {filteredReviews.length === 0 ? (
                <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Reviews Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {activeTab === 'all'
                      ? 'Your property has not received any reviews yet.'
                      : `No ${activeTab} reviews to display.`}
                  </p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showModeration
                    showActions
                    onRespond={!review.owner_response ? handleRespond : undefined}
                    onHideContent={!review.is_text_hidden ? handleHideContent : undefined}
                    onRequestWithdrawal={
                      !review.withdrawn_at && !review.withdrawal_requested_at
                        ? handleRequestWithdrawal
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Property Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to create a property before managing reviews.
          </p>
          <Button onClick={() => navigate('/properties/new')}>Create Property</Button>
        </div>
      )}
      </>
      )}
    </AuthenticatedLayout>
  );
};
