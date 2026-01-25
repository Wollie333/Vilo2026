/**
 * ReviewListPage
 * Dual-mode page:
 * - Property Owner Mode: Manage reviews for owned properties
 * - Guest Mode: View and manage own reviews
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { ReviewCard, ReviewStats as ReviewStatsComponent } from '@/components/features/Review';
import { Button, Tabs, TabsList, TabsTrigger, Select, Modal, Textarea, Alert, Spinner } from '@/components/ui';
import { reviewService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import type { Review, ReviewStats, ReviewStatus } from '@/types/review.types';

export const ReviewListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, subscriptionAccess } = useAuth();
  const { properties, selectedProperty, selectProperty, hasMultipleProperties } = useProperty();

  // Determine if user is a property owner
  const isPropertyOwner = useMemo(() => {
    if (!user) return false;

    const hasActiveSubscription = subscriptionAccess?.hasActiveSubscription || subscriptionAccess?.hasFullAccess;
    const hasOwnerType = ['paid', 'free'].includes(user.user_type?.name || '');
    const hasPropertyRole = user.roles?.some((role) =>
      ['property_admin', 'property_manager'].includes(role.name)
    );
    const hasProperties = user.properties && user.properties.length > 0;

    return hasActiveSubscription || hasOwnerType || hasPropertyRole || hasProperties;
  }, [user, subscriptionAccess]);

  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'hidden' | 'pending'>('all');

  // Modal states
  const [showResponseModal, setShowResponseModal] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const [showHideModal, setShowHideModal] = useState<string | null>(null);
  const [hideText, setHideText] = useState(false);
  const [hidePhotos, setHidePhotos] = useState(false);
  const [hideReason, setHideReason] = useState('');
  const [isSubmittingHide, setIsSubmittingHide] = useState(false);

  const [showWithdrawalModal, setShowWithdrawalModal] = useState<string | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  // Load reviews and stats
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // GUEST MODE: Load reviews written by this user
        if (!isPropertyOwner) {
          console.log('[ReviewListPage] Loading guest reviews');

          // For guests, we load reviews they wrote
          const guestReviews = await reviewService.getMyReviews();
          setReviews(Array.isArray(guestReviews) ? guestReviews : []);

          // No stats for guests
          setStats(null);
        }
        // PROPERTY OWNER MODE: Load reviews for selected property
        else {
          if (!selectedProperty?.id) {
            setIsLoading(false);
            return;
          }

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
        }
      } catch (err: any) {
        console.error('[ReviewListPage] Failed to load reviews:', err);
        setError(err.message || 'Failed to load reviews');
        setReviews([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isPropertyOwner, selectedProperty?.id, activeTab]);

  // Handle owner response - open modal
  const handleRespond = (reviewId: string) => {
    setShowResponseModal(reviewId);
    setResponseText('');
  };

  // Submit owner response
  const handleSubmitResponse = async () => {
    if (!showResponseModal || !responseText.trim()) return;

    try {
      setIsSubmittingResponse(true);
      await reviewService.addOwnerResponse(showResponseModal, { response: responseText });
      setShowResponseModal(null);
      setResponseText('');
      setSuccess('Response added successfully');
      setActiveTab(activeTab); // Trigger reload
    } catch (err: any) {
      setError('Failed to add response: ' + err.message);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Handle hide content - open modal
  const handleHideContent = (reviewId: string) => {
    setShowHideModal(reviewId);
    setHideText(false);
    setHidePhotos(false);
    setHideReason('');
  };

  // Submit hide content
  const handleSubmitHide = async () => {
    if (!showHideModal || !hideReason.trim() || (!hideText && !hidePhotos)) {
      setError('Please select what to hide and provide a reason');
      return;
    }

    try {
      setIsSubmittingHide(true);
      await reviewService.hideContent(showHideModal, {
        reason: hideReason,
        hideText,
        hidePhotos,
      });
      setShowHideModal(null);
      setHideText(false);
      setHidePhotos(false);
      setHideReason('');
      setSuccess('Content hidden successfully');
      setActiveTab(activeTab);
    } catch (err: any) {
      setError('Failed to hide content: ' + err.message);
    } finally {
      setIsSubmittingHide(false);
    }
  };

  // Handle request withdrawal - open modal
  const handleRequestWithdrawal = (reviewId: string) => {
    setShowWithdrawalModal(reviewId);
    setWithdrawalReason('');
  };

  // Submit withdrawal request
  const handleSubmitWithdrawal = async () => {
    if (!showWithdrawalModal || !withdrawalReason.trim()) return;

    try {
      setIsSubmittingWithdrawal(true);
      await reviewService.requestWithdrawal(showWithdrawalModal, { reason: withdrawalReason });
      setShowWithdrawalModal(null);
      setWithdrawalReason('');
      setSuccess('Withdrawal request submitted. Pending admin approval.');
      setActiveTab(activeTab);
    } catch (err: any) {
      setError('Failed to request withdrawal: ' + err.message);
    } finally {
      setIsSubmittingWithdrawal(false);
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
      title={isPropertyOwner ? "Review Manager" : "My Reviews"}
      subtitle={isPropertyOwner ? "Manage and respond to guest reviews" : "Reviews you've written"}
    >
      {/* Success/Error Alerts */}
      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)} className="mb-6">
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

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
      {/* GUEST MODE: Simple reviews list */}
      {!isPropertyOwner ? (
        <div className="space-y-6">
          {/* Reviews count */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Reviews you've written for properties you've stayed at
              </p>
            </div>
            <Button onClick={() => navigate('/portal/bookings')}>
              View My Bookings
            </Button>
          </div>

          {/* Guest Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
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
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Reviews Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You haven't written any reviews yet. Book a stay and share your experience!
                </p>
                <Button onClick={() => navigate('/portal/properties')}>
                  Browse Properties
                </Button>
              </div>
            ) : (
              reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showModeration={false}
                  showActions={false}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <>
        {/* PROPERTY OWNER MODE: Full review management */}
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
            <Button onClick={() => navigate('/manage/properties/new')}>Create Property</Button>
          </div>
        )}
        </>
      )}
      </>
      )}

      {/* Owner Response Modal */}
      {showResponseModal && (
        <Modal
          isOpen={!!showResponseModal}
          onClose={() => setShowResponseModal(null)}
          title="Respond to Review"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Response
              </label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Thank you for your feedback..."
                rows={6}
                maxLength={2000}
                fullWidth
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {responseText.length} / 2000 characters
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowResponseModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitResponse}
                isLoading={isSubmittingResponse}
                disabled={!responseText.trim() || isSubmittingResponse}
              >
                Post Response
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Hide Content Modal */}
      {showHideModal && (
        <Modal
          isOpen={!!showHideModal}
          onClose={() => setShowHideModal(null)}
          title="Hide Offensive Content"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select which parts of the review to hide and provide a reason. This action is immediate and does not require admin approval.
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideText}
                  onChange={(e) => setHideText(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Hide review text
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidePhotos}
                  onChange={(e) => setHidePhotos(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Hide review photos
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (Internal) <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                placeholder="e.g., Contains offensive language"
                rows={3}
                fullWidth
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowHideModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleSubmitHide}
                isLoading={isSubmittingHide}
                disabled={(!hideText && !hidePhotos) || !hideReason.trim() || isSubmittingHide}
              >
                Hide Content
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Withdrawal Modal */}
      {showWithdrawalModal && (
        <Modal
          isOpen={!!showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(null)}
          title="Request Review Withdrawal"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Withdrawal requests require admin approval. The review will remain visible until approved.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Withdrawal <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder="Please explain why this review should be withdrawn..."
                rows={4}
                fullWidth
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Provide a detailed explanation for the admin to review.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowWithdrawalModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitWithdrawal}
                isLoading={isSubmittingWithdrawal}
                disabled={!withdrawalReason.trim() || isSubmittingWithdrawal}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AuthenticatedLayout>
  );
};
