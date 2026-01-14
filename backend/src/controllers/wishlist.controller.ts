/**
 * Wishlist Controller
 * Handles HTTP requests for wishlist functionality
 */

import { Request, Response } from 'express';
import * as wishlistService from '../services/wishlist.service';
import { AddToWishlistRequest, UpdateWishlistNotesRequest } from '../types/wishlist.types';

/**
 * Add property to wishlist
 * POST /api/wishlist
 */
export async function addToWishlistHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { property_id, notes }: AddToWishlistRequest = req.body;

    if (!property_id) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    await wishlistService.addToWishlist(userId, property_id, notes);

    res.status(201).json({
      success: true,
      message: 'Property added to wishlist',
    });
  } catch (error: any) {
    console.error('Error in addToWishlistHandler:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to add property to wishlist',
    });
  }
}

/**
 * Remove property from wishlist
 * DELETE /api/wishlist/:propertyId
 */
export async function removeFromWishlistHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    await wishlistService.removeFromWishlist(userId, propertyId);

    res.json({
      success: true,
      message: 'Property removed from wishlist',
    });
  } catch (error: any) {
    console.error('Error in removeFromWishlistHandler:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to remove property from wishlist',
    });
  }
}

/**
 * Get user's wishlist
 * GET /api/wishlist
 */
export async function getWishlistHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await wishlistService.getUserWishlist(userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getWishlistHandler:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to fetch wishlist',
    });
  }
}

/**
 * Check if property is in wishlist
 * GET /api/wishlist/check/:propertyId
 */
export async function checkWishlistStatusHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    const result = await wishlistService.isPropertyInWishlist(userId, propertyId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in checkWishlistStatusHandler:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to check wishlist status',
    });
  }
}

/**
 * Update wishlist item notes
 * PATCH /api/wishlist/:propertyId/notes
 */
export async function updateWishlistNotesHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { propertyId } = req.params;
    const { notes }: UpdateWishlistNotesRequest = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    if (notes === undefined) {
      return res.status(400).json({ error: 'Notes field is required' });
    }

    await wishlistService.updateWishlistNotes(userId, propertyId, notes);

    res.json({
      success: true,
      message: 'Wishlist notes updated',
    });
  } catch (error: any) {
    console.error('Error in updateWishlistNotesHandler:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to update wishlist notes',
    });
  }
}
