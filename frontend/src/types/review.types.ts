/**
 * Review Types
 * Type definitions for the Review Manager feature
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type ReviewStatus = 'published' | 'hidden' | 'withdrawn';

export const REVIEW_CATEGORIES = [
  'safety',
  'cleanliness',
  'location',
  'comfort',
  'scenery',
] as const;

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  safety: 'Safety',
  cleanliness: 'Cleanliness',
  location: 'Location',
  comfort: 'Comfort',
  scenery: 'Scenery',
};

export const CATEGORY_DESCRIPTIONS: Record<ReviewCategory, string> = {
  safety: 'How safe did you feel during your stay?',
  cleanliness: 'How clean was the property?',
  location: 'How would you rate the location and accessibility?',
  comfort: 'How comfortable was your accommodation?',
  scenery: 'How would you rate the views and surroundings?',
};

// ============================================================================
// REVIEW INTERFACES
// ============================================================================

export interface ReviewPhoto {
  url: string;
  caption?: string;
  order: number;
}

export interface Review {
  id: string;
  booking_id: string;
  property_id: string;
  guest_id: string | null;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;

  // Category Ratings
  rating_safety: number;
  rating_cleanliness: number;
  rating_location: number;
  rating_comfort: number;
  rating_scenery: number;
  rating_overall: number;

  // Content
  review_title?: string | null;
  review_text: string;
  photos: ReviewPhoto[];

  // Status & Visibility
  status: ReviewStatus;
  is_text_hidden: boolean;
  is_photos_hidden: boolean;

  // Withdrawal Tracking
  withdrawn_at?: string | null;
  withdrawn_by?: string | null;
  withdrawal_reason?: string | null;
  withdrawal_requested_by?: string | null;
  withdrawal_requested_at?: string | null;

  // Owner Response
  owner_response?: string | null;
  owner_response_by?: string | null;
  owner_response_at?: string | null;

  // Metadata
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INPUT/OUTPUT TYPES
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

export interface CategoryRatings {
  safety: number;
  cleanliness: number;
  location: number;
  comfort: number;
  scenery: number;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ReviewStats {
  totalReviews: number;
  overallRating: number;
  categoryRatings: CategoryRatings;
  ratingDistribution: RatingDistribution;
  recentReviews: Review[];
  recommendationPercentage: number;
}

export interface EligibleBooking {
  id: string;
  booking_reference: string;
  property_id: string;
  property_name: string;
  check_in_date: string;
  check_out_date: string;
  checked_out_at: string;
  days_remaining: number;
  has_reviewed: boolean;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason?: string;
  booking?: any;
}

// ============================================================================
// FILTER & PAGINATION TYPES
// ============================================================================

export interface ReviewFilters {
  status?: ReviewStatus;
  minRating?: number;
  maxRating?: number;
  hasPhotos?: boolean;
  hasOwnerResponse?: boolean;
  pendingWithdrawal?: boolean;
  search?: string;
  sortBy?: 'date' | 'rating' | 'helpful';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedReviews {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// MODERATION TYPES
// ============================================================================

export interface HideContentRequest {
  reason: string;
  hideText: boolean;
  hidePhotos: boolean;
}

export interface WithdrawalRequest {
  reason: string;
}

export interface OwnerResponseRequest {
  response: string;
}

// ============================================================================
// UI HELPER TYPES
// ============================================================================

export interface ReviewFormData {
  ratings: CategoryRatings;
  title: string;
  text: string;
  photos: File[];
}

export interface ReviewCardProps {
  review: Review;
  showModeration?: boolean;
  showActions?: boolean;
  onRespond?: (reviewId: string) => void;
  onHideContent?: (reviewId: string) => void;
  onRequestWithdrawal?: (reviewId: string) => void;
  onWithdraw?: (reviewId: string) => void;
}

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValue?: boolean;
}

export interface CategoryRatingsProps {
  ratings: CategoryRatings;
  readonly?: boolean;
  onChange?: (category: ReviewCategory, value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function isValidRating(rating: number): boolean {
  return rating >= 1 && rating <= 5;
}

export function calculateOverallRating(ratings: CategoryRatings): number {
  const sum =
    ratings.safety +
    ratings.cleanliness +
    ratings.location +
    ratings.comfort +
    ratings.scenery;
  return Math.round((sum / 5) * 10) / 10; // Round to 1 decimal
}

export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Average';
  if (rating >= 2.0) return 'Below Average';
  return 'Poor';
}

export function getReviewAgeLabel(createdAt: string): string {
  const now = new Date();
  const reviewDate = new Date(createdAt);
  const daysDiff = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Yesterday';
  if (daysDiff < 7) return `${daysDiff} days ago`;
  if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
  if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} months ago`;
  return `${Math.floor(daysDiff / 365)} years ago`;
}

export function formatStayDuration(checkIn: string, checkOut: string): string {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (nights === 1) return '1 night';
  return `${nights} nights`;
}
