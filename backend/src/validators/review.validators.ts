/**
 * Review Validators
 * Zod schemas for review input validation
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_RATING = 1;
const MAX_RATING = 5;
const MAX_PHOTOS = 5;
const MIN_REVIEW_TEXT_LENGTH = 10;
const MAX_REVIEW_TEXT_LENGTH = 5000;
const MAX_REVIEW_TITLE_LENGTH = 255;
const MAX_OWNER_RESPONSE_LENGTH = 2000;

// ============================================================================
// SCHEMAS
// ============================================================================

// Review Photo Schema
export const reviewPhotoSchema = z.object({
  url: z.string().url('Invalid photo URL'),
  caption: z.string().max(200, 'Caption must be 200 characters or less').optional(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
});

// Create Review Schema
export const createReviewSchema = z.object({
  booking_id: z.string().uuid('Invalid booking ID'),
  rating_safety: z
    .number()
    .min(MIN_RATING, `Safety rating must be at least ${MIN_RATING}`)
    .max(MAX_RATING, `Safety rating must be at most ${MAX_RATING}`),
  rating_cleanliness: z
    .number()
    .min(MIN_RATING, `Cleanliness rating must be at least ${MIN_RATING}`)
    .max(MAX_RATING, `Cleanliness rating must be at most ${MAX_RATING}`),
  rating_friendliness: z
    .number()
    .min(MIN_RATING, `Friendliness rating must be at least ${MIN_RATING}`)
    .max(MAX_RATING, `Friendliness rating must be at most ${MAX_RATING}`),
  rating_comfort: z
    .number()
    .min(MIN_RATING, `Comfort rating must be at least ${MIN_RATING}`)
    .max(MAX_RATING, `Comfort rating must be at most ${MAX_RATING}`),
  rating_scenery: z
    .number()
    .min(MIN_RATING, `Scenery rating must be at least ${MIN_RATING}`)
    .max(MAX_RATING, `Scenery rating must be at most ${MAX_RATING}`),
  review_title: z
    .string()
    .max(MAX_REVIEW_TITLE_LENGTH, `Review title must be ${MAX_REVIEW_TITLE_LENGTH} characters or less`)
    .optional(),
  review_text: z
    .string()
    .min(MIN_REVIEW_TEXT_LENGTH, `Review must be at least ${MIN_REVIEW_TEXT_LENGTH} characters`)
    .max(MAX_REVIEW_TEXT_LENGTH, `Review must be ${MAX_REVIEW_TEXT_LENGTH} characters or less`),
  photos: z
    .array(reviewPhotoSchema)
    .max(MAX_PHOTOS, `Maximum ${MAX_PHOTOS} photos allowed`)
    .optional(),
});

// Update Review Schema (only text and photos, not ratings)
export const updateReviewSchema = z.object({
  review_title: z
    .string()
    .max(MAX_REVIEW_TITLE_LENGTH, `Review title must be ${MAX_REVIEW_TITLE_LENGTH} characters or less`)
    .optional(),
  review_text: z
    .string()
    .min(MIN_REVIEW_TEXT_LENGTH, `Review must be at least ${MIN_REVIEW_TEXT_LENGTH} characters`)
    .max(MAX_REVIEW_TEXT_LENGTH, `Review must be ${MAX_REVIEW_TEXT_LENGTH} characters or less`)
    .optional(),
  photos: z
    .array(reviewPhotoSchema)
    .max(MAX_PHOTOS, `Maximum ${MAX_PHOTOS} photos allowed`)
    .optional(),
});

// Hide Content Schema
export const hideContentSchema = z.object({
  hide_text: z.boolean(),
  hide_photos: z.boolean(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be 500 characters or less'),
});

// Withdrawal Schema
export const withdrawalSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be 500 characters or less'),
});

// Owner Response Schema
export const ownerResponseSchema = z.object({
  response: z
    .string()
    .min(10, 'Response must be at least 10 characters')
    .max(MAX_OWNER_RESPONSE_LENGTH, `Response must be ${MAX_OWNER_RESPONSE_LENGTH} characters or less`),
});

// Review Filters Schema (for query parameters)
export const reviewFiltersSchema = z.object({
  status: z.enum(['published', 'hidden', 'withdrawn']).optional(),
  minRating: z.number().min(MIN_RATING).max(MAX_RATING).optional(),
  maxRating: z.number().min(MIN_RATING).max(MAX_RATING).optional(),
  sortBy: z.enum(['date', 'rating_high', 'rating_low', 'helpful']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type HideContentInput = z.infer<typeof hideContentSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type OwnerResponseInput = z.infer<typeof ownerResponseSchema>;
export type ReviewFiltersInput = z.infer<typeof reviewFiltersSchema>;

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate request body against a schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
}
