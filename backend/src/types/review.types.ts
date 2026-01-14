/**
 * Review Types
 * TypeScript interfaces for property review system
 */

import { Booking } from './booking.types';

// ============================================================================
// REVIEW ENTITY
// ============================================================================

export interface Review {
  // Identifiers
  id: string;
  booking_id: string;
  property_id: string;
  guest_id: string | null;

  // Guest info (snapshot)
  guest_name: string;
  guest_email: string;

  // Stay details (snapshot)
  check_in_date: string;
  check_out_date: string;

  // Category Ratings (1-5 scale)
  rating_safety: number;
  rating_cleanliness: number;
  rating_location: number;
  rating_comfort: number;
  rating_scenery: number;
  rating_overall: number; // Computed average

  // Content
  review_title?: string | null;
  review_text: string;
  photos: ReviewPhoto[];

  // Status and visibility
  status: ReviewStatus;
  is_text_hidden: boolean;
  is_photos_hidden: boolean;

  // Withdrawal tracking
  withdrawn_at?: string | null;
  withdrawn_by?: string | null;
  withdrawal_reason?: string | null;
  withdrawal_requested_by?: string | null;
  withdrawal_requested_at?: string | null;

  // Owner response
  owner_response?: string | null;
  owner_response_by?: string | null;
  owner_response_at?: string | null;

  // Metadata
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REVIEW PHOTO
// ============================================================================

export interface ReviewPhoto {
  url: string;
  caption?: string;
  order: number;
}

// ============================================================================
// REVIEW STATUS
// ============================================================================

export type ReviewStatus = 'published' | 'hidden' | 'withdrawn';

// ============================================================================
// REVIEW WITH RELATIONS
// ============================================================================

export interface ReviewWithProperty extends Review {
  property_name: string;
  property_slug: string;
}

export interface ReviewWithGuest extends Review {
  guest_avatar?: string;
  guest_total_reviews?: number;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateReviewInput {
  booking_id: string;
  rating_safety: number;
  rating_cleanliness: number;
  rating_location: number;
  rating_comfort: number;
  rating_scenery: number;
  review_title?: string;
  review_text: string;
  photos?: ReviewPhoto[];
}

export interface UpdateReviewInput {
  review_title?: string;
  review_text?: string;
  photos?: ReviewPhoto[];
}

export interface HideReviewContentInput {
  hide_text: boolean;
  hide_photos: boolean;
  reason: string;
}

export interface WithdrawReviewInput {
  reason: string;
}

export interface AddOwnerResponseInput {
  response: string;
}

// ============================================================================
// REVIEW STATISTICS
// ============================================================================

export interface ReviewStats {
  totalReviews: number;
  overallRating: number;
  categoryRatings: CategoryRatings;
  ratingDistribution: RatingDistribution;
  recentReviews: Review[];
  recommendationPercentage: number; // % of 4-5 star reviews
}

export interface CategoryRatings {
  safety: number;
  cleanliness: number;
  location: number;
  comfort: number;
  scenery: number;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

// ============================================================================
// ELIGIBLE BOOKING FOR REVIEW
// ============================================================================

export interface EligibleBooking {
  id: string;
  booking_reference: string;
  property_id: string;
  property_name: string;
  check_in_date: string;
  check_out_date: string;
  checked_out_at: string;
  days_remaining: number; // Days left to submit review (out of 90)
  has_reviewed: boolean;
}

// ============================================================================
// REVIEW FILTERS
// ============================================================================

export interface ReviewFilters {
  status?: ReviewStatus;
  minRating?: number;
  maxRating?: number;
  sortBy?: 'date' | 'rating_high' | 'rating_low' | 'helpful';
  page?: number;
  limit?: number;
}

export interface PaginatedReviews {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// REVIEW ELIGIBILITY
// ============================================================================

export interface ReviewEligibility {
  eligible: boolean;
  reason?: string;
  booking?: Booking;
  existingReview?: Review;
}

// ============================================================================
// WITHDRAWAL REQUEST
// ============================================================================

export interface WithdrawalRequest {
  review_id: string;
  review: ReviewWithProperty;
  requested_by: string;
  requested_at: string;
  reason: string;
}

// ============================================================================
// REVIEW NOTIFICATION DATA
// ============================================================================

export interface ReviewRequestNotification {
  booking_id: string;
  guest_id: string;
  guest_name: string;
  guest_email: string;
  property_id: string;
  property_name: string;
  check_in_date: string;
  check_out_date: string;
  days_remaining: number;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const REVIEW_CONSTANTS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MAX_PHOTOS: 5,
  ELIGIBILITY_DAYS: 90,
  EDIT_WINDOW_HOURS: 24,
  MIN_REVIEW_TEXT_LENGTH: 10,
  MAX_REVIEW_TEXT_LENGTH: 5000,
  MAX_REVIEW_TITLE_LENGTH: 255,
  MAX_OWNER_RESPONSE_LENGTH: 2000,
} as const;

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isReviewStatus(value: string): value is ReviewStatus {
  return ['published', 'hidden', 'withdrawn'].includes(value);
}

export function isValidRating(rating: number): boolean {
  return rating >= REVIEW_CONSTANTS.MIN_RATING && rating <= REVIEW_CONSTANTS.MAX_RATING;
}

// ============================================================================
// CATEGORY LABELS
// ============================================================================

export const CATEGORY_LABELS: Record<keyof CategoryRatings, string> = {
  safety: 'Safety',
  cleanliness: 'Cleanliness',
  location: 'Location',
  comfort: 'Comfort',
  scenery: 'Scenery',
} as const;

export const CATEGORY_DESCRIPTIONS: Record<keyof CategoryRatings, string> = {
  safety: 'How safe did you feel during your stay?',
  cleanliness: 'How clean was the property?',
  location: 'How would you rate the location and accessibility?',
  comfort: 'How comfortable was your accommodation?',
  scenery: 'How would you rate the views and surroundings?',
} as const;
