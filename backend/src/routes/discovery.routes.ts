/**
 * Discovery Routes
 * Public routes for property directory (no authentication required)
 */

import { Router } from 'express';
import {
  searchPublicPropertiesHandler,
  searchPublicRoomsHandler,
  getPublicPropertyDetailHandler,
  getFeaturedPropertiesHandler,
  getPropertiesByCategoryHandler,
} from '../controllers/discovery.controller';
import * as promoClaimController from '../controllers/promo-claim.controller';
import { optionalAuth, validateBody } from '../middleware';
import { claimPromotionSchema } from '../validators/promotion.validators';

const router = Router();

/**
 * @route   GET /api/discovery/properties
 * @desc    Search public properties with filters
 * @access  Public (optional auth for wishlist status)
 */
router.get('/properties', optionalAuth, searchPublicPropertiesHandler);

/**
 * @route   GET /api/discovery/rooms
 * @desc    Search public rooms with filters
 * @access  Public
 */
router.get('/rooms', searchPublicRoomsHandler);

/**
 * @route   GET /api/discovery/properties/:slug
 * @desc    Get public property detail by slug
 * @access  Public (optional auth for wishlist status)
 */
router.get('/properties/:slug', optionalAuth, getPublicPropertyDetailHandler);

/**
 * @route   GET /api/discovery/featured
 * @desc    Get featured properties for homepage
 * @access  Public (optional auth for wishlist status)
 */
router.get('/featured', optionalAuth, getFeaturedPropertiesHandler);

/**
 * @route   GET /api/discovery/categories/:category
 * @desc    Get properties by category
 * @access  Public (optional auth for wishlist status)
 */
router.get('/categories/:category', optionalAuth, getPropertiesByCategoryHandler);

/**
 * @route   POST /api/discovery/promotions/claim
 * @desc    Claim a promotion (creates guest account, chat conversation)
 * @access  Public (no authentication required)
 */
router.post('/promotions/claim', validateBody(claimPromotionSchema), promoClaimController.claimPromotion);

export default router;
