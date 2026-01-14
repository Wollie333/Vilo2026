/**
 * Wishlist Routes
 * Routes for user wishlist/favorites functionality (authentication required)
 */

import { Router } from 'express';
import {
  addToWishlistHandler,
  removeFromWishlistHandler,
  getWishlistHandler,
  checkWishlistStatusHandler,
  updateWishlistNotesHandler,
} from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All wishlist routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/wishlist
 * @desc    Add property to user's wishlist
 * @access  Private
 */
router.post('/', addToWishlistHandler);

/**
 * @route   GET /api/wishlist
 * @desc    Get user's wishlist
 * @access  Private
 */
router.get('/', getWishlistHandler);

/**
 * @route   GET /api/wishlist/check/:propertyId
 * @desc    Check if property is in wishlist
 * @access  Private
 */
router.get('/check/:propertyId', checkWishlistStatusHandler);

/**
 * @route   PATCH /api/wishlist/:propertyId/notes
 * @desc    Update wishlist item notes
 * @access  Private
 */
router.patch('/:propertyId/notes', updateWishlistNotesHandler);

/**
 * @route   DELETE /api/wishlist/:propertyId
 * @desc    Remove property from wishlist
 * @access  Private
 */
router.delete('/:propertyId', removeFromWishlistHandler);

export default router;
