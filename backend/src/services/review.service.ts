/**
 * Review Service
 * Business logic for property review management
 */

import { getAdminClient } from '../config/supabase';

const supabaseAdmin = getAdminClient();
import { AppError } from '../utils/errors';
import type {
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewStats,
  CategoryRatings,
  RatingDistribution,
  EligibleBooking,
  ReviewEligibility,
  ReviewFilters,
  PaginatedReviews,
  WithdrawalRequest,
  ReviewPhoto,
  REVIEW_CONSTANTS,
} from '../types/review.types';
import type { Booking } from '../types/booking.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const ELIGIBILITY_DAYS = 90;
const EDIT_WINDOW_HOURS = 24;
const MAX_PHOTOS = 5;

// ============================================================================
// REVIEW CRUD OPERATIONS
// ============================================================================

/**
 * Create a new review
 */
export async function createReview(
  userId: string,
  data: CreateReviewInput
): Promise<Review> {
  // 1. Check eligibility
  const eligibility = await checkReviewEligibility(data.booking_id, userId);

  if (!eligibility.eligible) {
    throw new AppError('FORBIDDEN', eligibility.reason || 'You are not eligible to review this booking');
  }

  const booking = eligibility.booking!;

  // 2. Validate ratings
  const ratings = [
    data.rating_safety,
    data.rating_cleanliness,
    data.rating_location,
    data.rating_comfort,
    data.rating_scenery,
  ];

  for (const rating of ratings) {
    if (rating < 1 || rating > 5) {
      throw new AppError('VALIDATION_ERROR', 'All ratings must be between 1 and 5');
    }
  }

  // 3. Validate photos
  if (data.photos && data.photos.length > MAX_PHOTOS) {
    throw new AppError('VALIDATION_ERROR', `Maximum ${MAX_PHOTOS} photos allowed`);
  }

  // 4. Create review
  const { data: review, error } = await supabaseAdmin
    .from('property_reviews')
    .insert({
      booking_id: data.booking_id,
      property_id: booking.property_id,
      guest_id: userId,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      rating_safety: data.rating_safety,
      rating_cleanliness: data.rating_cleanliness,
      rating_location: data.rating_location,
      rating_comfort: data.rating_comfort,
      rating_scenery: data.rating_scenery,
      review_title: data.review_title || null,
      review_text: data.review_text,
      photos: data.photos || [],
      status: 'published',
    })
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to create review: ${error.message}`);
  }

  return review;
}

/**
 * Get a single review by ID
 */
export async function getReview(reviewId: string): Promise<Review> {
  const { data: review, error } = await supabaseAdmin
    .from('property_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (error || !review) {
    throw new AppError('NOT_FOUND', 'Review not found');
  }

  return review;
}

/**
 * Update a review (guest can only update text/photos within 24h)
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  data: UpdateReviewInput
): Promise<Review> {
  // 1. Get existing review
  const review = await getReview(reviewId);

  // 2. Verify ownership
  if (review.guest_id !== userId) {
    throw new AppError('FORBIDDEN', 'You can only update your own reviews');
  }

  // 3. Check if within edit window (24 hours)
  const createdAt = new Date(review.created_at);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceCreation > EDIT_WINDOW_HOURS) {
    throw new AppError('FORBIDDEN', 'Reviews can only be edited within 24 hours of posting');
  }

  // 4. Validate photos if provided
  if (data.photos && data.photos.length > MAX_PHOTOS) {
    throw new AppError('VALIDATION_ERROR', `Maximum ${MAX_PHOTOS} photos allowed`);
  }

  // 5. Update review (text and photos only, NOT ratings)
  const updateData: any = {};
  if (data.review_title !== undefined) updateData.review_title = data.review_title;
  if (data.review_text !== undefined) updateData.review_text = data.review_text;
  if (data.photos !== undefined) updateData.photos = data.photos;

  const { data: updatedReview, error } = await supabaseAdmin
    .from('property_reviews')
    .update(updateData)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to update review: ${error.message}`);
  }

  return updatedReview;
}

/**
 * Delete a review (admin only, hard delete)
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('property_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to delete review: ${error.message}`);
  }
}

// ============================================================================
// LISTING & FILTERING
// ============================================================================

/**
 * Get reviews for a property (with pagination and filters)
 */
export async function getPropertyReviews(
  propertyId: string,
  filters: ReviewFilters = {}
): Promise<PaginatedReviews> {
  const {
    status, // Don't use default - let it be undefined to get all statuses
    minRating,
    maxRating,
    sortBy = 'date',
    page = 1,
    limit = 10,
  } = filters;

  let query = supabaseAdmin
    .from('property_reviews')
    .select('*', { count: 'exact' })
    .eq('property_id', propertyId);

  // Filter by status (if specified, otherwise get all)
  if (status !== undefined) {
    query = query.eq('status', status);
  }

  // Filter by rating range
  if (minRating !== undefined) {
    query = query.gte('rating_overall', minRating);
  }
  if (maxRating !== undefined) {
    query = query.lte('rating_overall', maxRating);
  }

  // Sorting
  switch (sortBy) {
    case 'rating_high':
      query = query.order('rating_overall', { ascending: false });
      break;
    case 'rating_low':
      query = query.order('rating_overall', { ascending: true });
      break;
    case 'helpful':
      query = query.order('helpful_count', { ascending: false });
      break;
    case 'date':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data: reviews, error, count } = await query;

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to fetch reviews: ${error.message}`);
  }

  return {
    reviews: reviews || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get all reviews by a guest
 */
export async function getGuestReviews(guestId: string): Promise<Review[]> {
  const { data: reviews, error } = await supabaseAdmin
    .from('property_reviews')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to fetch guest reviews: ${error.message}`);
  }

  return reviews || [];
}

/**
 * Get all reviews for a specific user (written by user + for user's properties)
 * Used by super admin to view all user's reviews
 */
export async function getReviewsByUser(
  userId: string,
  params?: { status?: string; rating?: number; property_id?: string }
): Promise<Review[]> {
  // First, get all property IDs owned by this user
  const { data: properties } = await supabaseAdmin
    .from('properties')
    .select('id')
    .eq('owner_id', userId);

  const propertyIds = properties?.map((p) => p.id) || [];

  // Build query to fetch reviews where:
  // 1. User wrote the review (guest_id = userId)
  // 2. OR review is for a property owned by user (property_id in propertyIds)
  let query = supabaseAdmin
    .from('property_reviews')
    .select(`
      *,
      property:properties!inner (
        id,
        name
      )
    `);

  // Apply OR filter: reviewer OR property owner
  if (propertyIds.length > 0) {
    query = query.or(`guest_id.eq.${userId},property_id.in.(${propertyIds.join(',')})`);
  } else {
    // If user has no properties, only show reviews written by them
    query = query.eq('guest_id', userId);
  }

  // Apply additional filters
  if (params?.property_id) {
    query = query.eq('property_id', params.property_id);
  }

  if (params?.status) {
    if (params.status === 'withdrawn') {
      query = query.not('withdrawn_at', 'is', null);
    } else if (params.status === 'published') {
      query = query.is('withdrawn_at', null);
    }
  }

  if (params?.rating) {
    query = query.eq('overall_rating', params.rating);
  }

  // Order by creation date
  query = query.order('created_at', { ascending: false });

  const { data: reviews, error } = await query;

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to fetch user reviews: ${error.message}`);
  }

  return reviews || [];
}

// ============================================================================
// ELIGIBILITY CHECKING
// ============================================================================

/**
 * Check if a user is eligible to review a booking
 */
export async function checkReviewEligibility(
  bookingId: string,
  userId: string
): Promise<ReviewEligibility> {
  // 1. Get booking
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return {
      eligible: false,
      reason: 'Booking not found',
    };
  }

  // 2. Check ownership
  if (booking.guest_id !== userId) {
    return {
      eligible: false,
      reason: 'This booking does not belong to you',
      booking,
    };
  }

  // 3. Check if checked out
  const isCheckedOut =
    booking.booking_status === 'checked_out' ||
    booking.booking_status === 'completed';

  if (!isCheckedOut || !booking.checked_out_at) {
    return {
      eligible: false,
      reason: 'You can only review after checking out',
      booking,
    };
  }

  // 4. Check if within 90-day window
  const checkedOutDate = new Date(booking.checked_out_at);
  const now = new Date();
  const daysSinceCheckout = (now.getTime() - checkedOutDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceCheckout > ELIGIBILITY_DAYS) {
    return {
      eligible: false,
      reason: `Reviews must be submitted within ${ELIGIBILITY_DAYS} days of checkout`,
      booking,
    };
  }

  // 5. Check if already reviewed
  const { data: existingReview } = await supabaseAdmin
    .from('property_reviews')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (existingReview) {
    return {
      eligible: false,
      reason: 'You have already reviewed this booking',
      booking,
      existingReview,
    };
  }

  // All checks passed
  return {
    eligible: true,
    booking,
  };
}

/**
 * Get all bookings a user can review
 */
export async function getEligibleBookingsForReview(
  userId: string
): Promise<EligibleBooking[]> {
  // Get all checked-out bookings for the user
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('*, property:properties(name)')
    .eq('guest_id', userId)
    .in('booking_status', ['checked_out', 'completed'])
    .not('checked_out_at', 'is', null)
    .gte(
      'checked_out_at',
      new Date(Date.now() - ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000).toISOString()
    )
    .order('checked_out_at', { ascending: false });

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to fetch eligible bookings: ${error.message}`);
  }

  if (!bookings || bookings.length === 0) {
    return [];
  }

  // Check which ones have been reviewed
  const bookingIds = bookings.map((b: any) => b.id);
  const { data: existingReviews } = await supabaseAdmin
    .from('property_reviews')
    .select('booking_id')
    .in('booking_id', bookingIds);

  const reviewedBookingIds = new Set(existingReviews?.map((r) => r.booking_id) || []);

  // Map to EligibleBooking format
  const eligibleBookings: EligibleBooking[] = bookings.map((booking: any) => {
    const checkedOutDate = new Date(booking.checked_out_at);
    const now = new Date();
    const daysSinceCheckout = (now.getTime() - checkedOutDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, ELIGIBILITY_DAYS - Math.floor(daysSinceCheckout));

    return {
      id: booking.id,
      booking_reference: booking.booking_reference,
      property_id: booking.property_id,
      property_name: booking.property?.name || 'Unknown Property',
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      checked_out_at: booking.checked_out_at,
      days_remaining: daysRemaining,
      has_reviewed: reviewedBookingIds.has(booking.id),
    };
  });

  return eligibleBookings;
}

/**
 * Get review status for a specific booking (for BookingDetailPage integration)
 */
export async function getBookingReviewStatus(bookingId: string): Promise<{
  eligible: boolean;
  hasReview: boolean;
  review: Review | null;
  daysRemaining: number;
  reason?: string;
}> {
  // Get booking details
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return {
      eligible: false,
      hasReview: false,
      review: null,
      daysRemaining: 0,
      reason: 'Booking not found',
    };
  }

  // Check if review already exists
  const { data: existingReview } = await supabaseAdmin
    .from('property_reviews')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (existingReview) {
    return {
      eligible: false,
      hasReview: true,
      review: existingReview,
      daysRemaining: 0,
      reason: 'Review already submitted',
    };
  }

  // Check eligibility
  const eligibility = await checkReviewEligibility(bookingId, booking.guest_id);

  // Calculate days remaining if checked out
  let daysRemaining = 0;
  if (booking.checked_out_at) {
    const checkedOutDate = new Date(booking.checked_out_at);
    const expiryDate = new Date(checkedOutDate.getTime() + ELIGIBILITY_DAYS * 24 * 60 * 60 * 1000);
    const now = new Date();
    daysRemaining = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return {
    eligible: eligibility.eligible,
    hasReview: false,
    review: null,
    daysRemaining,
    reason: eligibility.reason,
  };
}

// ============================================================================
// MODERATION
// ============================================================================

/**
 * Hide review content (text/photos) - property owner can hide offensive content
 */
export async function hideReviewContent(
  reviewId: string,
  userId: string,
  hideText: boolean,
  hidePhotos: boolean,
  reason: string
): Promise<Review> {
  // 1. Get review
  const review = await getReview(reviewId);

  // 2. Verify property ownership
  const { data: property, error: propertyError } = await supabaseAdmin
    .from('properties')
    .select('owner_id')
    .eq('id', review.property_id)
    .single();

  if (propertyError || !property || property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You can only moderate reviews for your own properties');
  }

  // 3. Update visibility flags
  const { data: updatedReview, error } = await supabaseAdmin
    .from('property_reviews')
    .update({
      is_text_hidden: hideText,
      is_photos_hidden: hidePhotos,
      // Note: We don't store the hide reason in the schema, but we could add it
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to hide content: ${error.message}`);
  }

  return updatedReview;
}

/**
 * Request withdrawal of a review (property owner requests, admin approves)
 */
export async function requestWithdrawal(
  reviewId: string,
  userId: string,
  reason: string
): Promise<Review> {
  // 1. Get review
  const review = await getReview(reviewId);

  // 2. Verify property ownership
  const { data: property, error: propertyError } = await supabaseAdmin
    .from('properties')
    .select('owner_id')
    .eq('id', review.property_id)
    .single();

  if (propertyError || !property || property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You can only request withdrawal for reviews on your properties');
  }

  // 3. Mark as withdrawal requested
  const { data: updatedReview, error } = await supabaseAdmin
    .from('property_reviews')
    .update({
      withdrawal_requested_by: userId,
      withdrawal_requested_at: new Date().toISOString(),
      withdrawal_reason: reason,
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to request withdrawal: ${error.message}`);
  }

  // TODO: Create notification for admins

  return updatedReview;
}

/**
 * Withdraw a review (guest withdraws their own, or admin approves withdrawal)
 */
export async function withdrawReview(
  reviewId: string,
  userId: string,
  reason: string,
  isAdmin: boolean = false
): Promise<Review> {
  // 1. Get review
  const review = await getReview(reviewId);

  // 2. Check authorization
  const isOwner = review.guest_id === userId;

  if (!isOwner && !isAdmin) {
    throw new AppError('FORBIDDEN', 'You can only withdraw your own reviews or be an admin');
  }

  // 3. Withdraw review
  const { data: updatedReview, error } = await supabaseAdmin
    .from('property_reviews')
    .update({
      status: 'withdrawn',
      withdrawn_at: new Date().toISOString(),
      withdrawn_by: userId,
      withdrawal_reason: reason,
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to withdraw review: ${error.message}`);
  }

  return updatedReview;
}

/**
 * Get pending withdrawal requests (admin only)
 */
export async function getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const { data: reviews, error } = await supabaseAdmin
    .from('property_reviews')
    .select('*, property:properties(name, slug)')
    .not('withdrawal_requested_at', 'is', null)
    .is('withdrawn_at', null)
    .order('withdrawal_requested_at', { ascending: false });

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to fetch withdrawal requests: ${error.message}`);
  }

  return (reviews || []).map((review: any) => ({
    review_id: review.id,
    review: {
      ...review,
      property_name: review.property?.name,
      property_slug: review.property?.slug,
    },
    requested_by: review.withdrawal_requested_by,
    requested_at: review.withdrawal_requested_at,
    reason: review.withdrawal_reason,
  }));
}

// ============================================================================
// OWNER RESPONSES
// ============================================================================

/**
 * Add owner response to a review
 */
export async function addOwnerResponse(
  reviewId: string,
  userId: string,
  response: string
): Promise<Review> {
  // 1. Get review
  const review = await getReview(reviewId);

  // 2. Check if response already exists
  if (review.owner_response) {
    throw new AppError('CONFLICT', 'Owner response already exists. Use update instead.');
  }

  // 3. Verify property ownership
  const { data: property, error: propertyError } = await supabaseAdmin
    .from('properties')
    .select('owner_id')
    .eq('id', review.property_id)
    .single();

  if (propertyError || !property || property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You can only respond to reviews for your own properties');
  }

  // 4. Add response
  const { data: updatedReview, error } = await supabaseAdmin
    .from('property_reviews')
    .update({
      owner_response: response,
      owner_response_by: userId,
      owner_response_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to add response: ${error.message}`);
  }

  return updatedReview;
}

/**
 * Update owner response
 */
export async function updateOwnerResponse(
  reviewId: string,
  userId: string,
  response: string
): Promise<Review> {
  // 1. Get review
  const review = await getReview(reviewId);

  // 2. Verify ownership of response
  if (review.owner_response_by !== userId) {
    throw new AppError('FORBIDDEN', 'You can only update your own responses');
  }

  // 3. Update response
  const { data: updatedReview, error } = await supabaseAdmin
    .from('property_reviews')
    .update({
      owner_response: response,
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to update response: ${error.message}`);
  }

  return updatedReview;
}

/**
 * Delete owner response
 */
export async function deleteOwnerResponse(
  reviewId: string,
  userId: string
): Promise<Review> {
  // 1. Get review
  const review = await getReview(reviewId);

  // 2. Verify ownership of response
  if (review.owner_response_by !== userId) {
    throw new AppError('FORBIDDEN', 'You can only delete your own responses');
  }

  // 3. Delete response
  const { data: updatedReview, error } = await supabaseAdmin
    .from('property_reviews')
    .update({
      owner_response: null,
      owner_response_by: null,
      owner_response_at: null,
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to delete response: ${error.message}`);
  }

  return updatedReview;
}

// ============================================================================
// STATISTICS & AGGREGATION
// ============================================================================

/**
 * Get review statistics for a property
 */
export async function getPropertyReviewStats(
  propertyId: string
): Promise<ReviewStats> {
  // Get all published reviews
  const { data: reviews, error } = await supabaseAdmin
    .from('property_reviews')
    .select('*')
    .eq('property_id', propertyId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('DATABASE_ERROR', `Failed to fetch review stats: ${error.message}`);
  }

  if (!reviews || reviews.length === 0) {
    return {
      totalReviews: 0,
      overallRating: 0,
      categoryRatings: {
        safety: 0,
        cleanliness: 0,
        location: 0,
        comfort: 0,
        scenery: 0,
      },
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recentReviews: [],
      recommendationPercentage: 0,
    };
  }

  // Calculate averages
  const totalReviews = reviews.length;
  const sumRatings = reviews.reduce(
    (acc, review) => ({
      safety: acc.safety + review.rating_safety,
      cleanliness: acc.cleanliness + review.rating_cleanliness,
      location: acc.location + review.rating_location,
      comfort: acc.comfort + review.rating_comfort,
      scenery: acc.scenery + review.rating_scenery,
      overall: acc.overall + review.rating_overall,
    }),
    { safety: 0, cleanliness: 0, location: 0, comfort: 0, scenery: 0, overall: 0 }
  );

  const categoryRatings: CategoryRatings = {
    safety: Number((sumRatings.safety / totalReviews).toFixed(1)),
    cleanliness: Number((sumRatings.cleanliness / totalReviews).toFixed(1)),
    location: Number((sumRatings.location / totalReviews).toFixed(1)),
    comfort: Number((sumRatings.comfort / totalReviews).toFixed(1)),
    scenery: Number((sumRatings.scenery / totalReviews).toFixed(1)),
  };

  const overallRating = Number((sumRatings.overall / totalReviews).toFixed(1));

  // Rating distribution
  const ratingDistribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((review) => {
    const rounded = Math.round(review.rating_overall) as 1 | 2 | 3 | 4 | 5;
    ratingDistribution[rounded]++;
  });

  // Recommendation percentage (4-5 star reviews)
  const recommendedCount = ratingDistribution[4] + ratingDistribution[5];
  const recommendationPercentage = Number(((recommendedCount / totalReviews) * 100).toFixed(0));

  // Recent reviews (top 5)
  const recentReviews = reviews.slice(0, 5);

  return {
    totalReviews,
    overallRating,
    categoryRatings,
    ratingDistribution,
    recentReviews,
    recommendationPercentage,
  };
}

/**
 * Calculate overall rating for a property
 */
export async function calculateOverallRating(propertyId: string): Promise<number> {
  const stats = await getPropertyReviewStats(propertyId);
  return stats.overallRating;
}

/**
 * Get category breakdown for a property
 */
export async function getCategoryBreakdown(propertyId: string): Promise<CategoryRatings> {
  const stats = await getPropertyReviewStats(propertyId);
  return stats.categoryRatings;
}

// ============================================================================
// PHOTO MANAGEMENT
// ============================================================================

/**
 * Upload review photo to Supabase storage
 * Note: This is typically handled on the frontend, but we provide this helper
 */
export async function uploadReviewPhoto(
  reviewId: string,
  userId: string,
  file: Buffer,
  filename: string
): Promise<string> {
  // Construct file path: /review-photos/{user_id}/{review_id}/{timestamp}_{filename}
  const timestamp = Date.now();
  const filePath = `${userId}/${reviewId}/${timestamp}_${filename}`;

  const { data, error } = await supabaseAdmin.storage
    .from('review-photos')
    .upload(filePath, file, {
      contentType: 'image/jpeg', // TODO: Detect from file
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new AppError('UPLOAD_ERROR', `Failed to upload photo: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from('review-photos')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Delete review photo from storage
 */
export async function deleteReviewPhoto(
  reviewId: string,
  userId: string,
  photoUrl: string
): Promise<void> {
  // Extract file path from URL
  const urlParts = photoUrl.split('/review-photos/');
  if (urlParts.length < 2) {
    throw new AppError('VALIDATION_ERROR', 'Invalid photo URL');
  }

  const filePath = urlParts[1];

  // Verify ownership (file path should start with user ID)
  if (!filePath.startsWith(userId)) {
    throw new AppError('FORBIDDEN', 'You can only delete your own photos');
  }

  const { error } = await supabaseAdmin.storage
    .from('review-photos')
    .remove([filePath]);

  if (error) {
    throw new AppError('DELETE_ERROR', `Failed to delete photo: ${error.message}`);
  }
}

// ============================================================================
// MANUAL REVIEW REQUEST
// ============================================================================

/**
 * Send manual review request for a completed booking
 */
export async function sendManualReviewRequest(
  bookingId: string,
  userId: string
): Promise<void> {
  // 1. Get booking details
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('*, property:properties(id, name, owner_id), guest:users!bookings_guest_id_fkey(id, full_name, email)')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new AppError('NOT_FOUND', 'Booking not found');
  }

  // 2. Verify user owns the property
  if (booking.property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You can only send review requests for your own properties');
  }

  // 3. Verify booking is completed/checked out
  if (!['completed', 'checked_out'].includes(booking.booking_status)) {
    throw new AppError('VALIDATION_ERROR', 'Can only send review requests for completed bookings');
  }

  // 4. Check if review already exists
  const { data: existingReview } = await supabaseAdmin
    .from('property_reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .single();

  if (existingReview) {
    throw new AppError('VALIDATION_ERROR', 'Guest has already reviewed this booking');
  }

  // 5. Check eligibility (within 90 days)
  const checkoutDate = new Date(booking.checked_out_at || booking.check_out_date);
  const daysSinceCheckout = Math.floor(
    (Date.now() - checkoutDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCheckout > 90) {
    throw new AppError('VALIDATION_ERROR', 'Review window has expired (90 days after checkout)');
  }

  // 6. TODO: Send email notification
  // await emailService.sendReviewRequest({
  //   guest_email: booking.guest.email,
  //   guest_name: booking.guest.full_name,
  //   property_name: booking.property.name,
  //   booking_id: bookingId,
  //   check_in_date: booking.check_in_date,
  //   check_out_date: booking.check_out_date,
  //   days_remaining: 90 - daysSinceCheckout,
  // });

  // 7. TODO: Create in-app notification
  // await notificationService.create({
  //   user_id: booking.guest_id,
  //   type: 'review_request',
  //   title: 'Leave a review for your recent stay',
  //   message: `Share your experience at ${booking.property.name}`,
  //   action_url: `/reviews/write/${bookingId}`,
  // });

  // For now, just log that we would send the request
  console.log(`Review request would be sent to ${booking.guest.email} for booking ${bookingId}`);
}
