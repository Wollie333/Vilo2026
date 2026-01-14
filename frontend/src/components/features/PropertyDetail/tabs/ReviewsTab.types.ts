/**
 * ReviewsTab Types
 */

import type { Review } from '@/types/review.types';

export interface ReviewsTabProps {
  overallRating: number | null;
  reviewCount: number;
  ratingBreakdown: {
    safety: number | null;
    cleanliness: number | null;
    location: number | null;
    comfort: number | null;
    scenery: number | null;
  };
  reviews: Review[];
}
