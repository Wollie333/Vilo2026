/**
 * WriteReviewPage
 * Page for guests to write/submit a review for their booking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { StarRating, CategoryRatings } from '@/components/features/Review';
import { Button, Input, Textarea } from '@/components/ui';
import { reviewService } from '@/services';
import type { EligibleBooking, CategoryRatings as CategoryRatingsType } from '@/types/review.types';

export const WriteReviewPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const navigate = useNavigate();

  // State
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<EligibleBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [ratings, setRatings] = useState<CategoryRatingsType>({
    safety: 5,
    cleanliness: 5,
    location: 5,
    comfort: 5,
    scenery: 5,
  });
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  // Load eligible bookings or specific booking
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        if (bookingId) {
          // Load specific booking and check eligibility
          const eligibility = await reviewService.checkEligibility(bookingId);

          if (!eligibility.eligible) {
            setError(eligibility.reason || 'This booking is not eligible for review');
            return;
          }

          // Fetch booking details from eligible bookings
          const allBookings = await reviewService.getEligibleBookings();
          const booking = allBookings.find((b) => b.id === bookingId);

          if (booking) {
            setSelectedBooking(booking);
          }
        } else {
          // Load all eligible bookings
          const bookings = await reviewService.getEligibleBookings();
          setEligibleBookings(bookings);

          if (bookings.length === 1) {
            // Auto-select if only one eligible booking
            setSelectedBooking(bookings[0]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load booking information');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [bookingId]);

  // Handle rating change
  const handleRatingChange = (category: keyof CategoryRatingsType, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalPhotos = photos.length + newFiles.length;

      if (totalPhotos > 5) {
        alert('Maximum 5 photos allowed per review');
        return;
      }

      setPhotos((prev) => [...prev, ...newFiles]);
    }
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = (): string | null => {
    if (reviewText.length < 10) {
      return 'Review must be at least 10 characters';
    }

    if (reviewText.length > 5000) {
      return 'Review must be less than 5000 characters';
    }

    if (Object.values(ratings).some((r) => r < 1 || r > 5)) {
      return 'All ratings must be between 1 and 5 stars';
    }

    return null;
  };

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBooking) {
      setError('Please select a booking to review');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create review
      const review = await reviewService.createReview({
        booking_id: selectedBooking.id,
        rating_safety: ratings.safety,
        rating_cleanliness: ratings.cleanliness,
        rating_location: ratings.location,
        rating_comfort: ratings.comfort,
        rating_scenery: ratings.scenery,
        review_title: title || undefined,
        review_text: reviewText,
      });

      // Upload photos if any
      if (photos.length > 0) {
        await Promise.all(
          photos.map((photo) => reviewService.uploadPhoto(review.id, photo))
        );
      }

      // Success - navigate to success page or property page
      alert('Thank you for your review!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthenticatedLayout title="Write a Review">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Error state
  if (error && !selectedBooking) {
    return (
      <AuthenticatedLayout title="Write a Review">
        <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cannot Write Review
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Booking selection view
  if (!selectedBooking && eligibleBookings.length > 0) {
    return (
      <AuthenticatedLayout
        title="Select a Booking to Review"
        subtitle="Choose which stay you'd like to review"
      >
        <div className="max-w-3xl mx-auto">
        <div className="space-y-4">
          {eligibleBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {booking.property_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Booking #{booking.booking_reference}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Stay: {new Date(booking.check_in_date).toLocaleDateString()} -{' '}
                    {new Date(booking.check_out_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  {booking.has_reviewed ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm">
                      Reviewed
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {booking.days_remaining} days left
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // No eligible bookings
  if (!selectedBooking) {
    return (
      <AuthenticatedLayout title="No Bookings to Review">
        <div className="max-w-2xl mx-auto">
        <div className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            No Bookings to Review
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have any eligible bookings to review at this time.
            <br />
            Reviews can be submitted within 90 days after checkout.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Review form
  return (
    <AuthenticatedLayout
      title="Write a Review"
      subtitle={`Share your experience at ${selectedBooking.property_name}`}
    >
      <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Category Ratings */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Rate Your Stay
          </h2>
          <CategoryRatings
            ratings={ratings}
            onChange={handleRatingChange}
            size="md"
          />
        </div>

        {/* Review Title (Optional) */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Review Title <span className="text-sm text-gray-500">(Optional)</span>
          </h2>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience in one line"
            maxLength={255}
          />
        </div>

        {/* Review Text */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Review
          </h2>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell us about your stay... What did you love? What could be improved?"
            rows={8}
            required
            maxLength={5000}
          />
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
            <span>Minimum 10 characters</span>
            <span>{reviewText.length} / 5000</span>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Add Photos <span className="text-sm text-gray-500">(Optional, max 5)</span>
          </h2>

          <div className="flex flex-wrap gap-4 mb-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Preview ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {photos.length < 5 && (
            <div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button type="button" variant="outline" as="span">
                  Upload Photos
                </Button>
              </label>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || reviewText.length < 10}
          >
            Submit Review
          </Button>
        </div>
      </form>
      </div>
    </AuthenticatedLayout>
  );
};
