/**
 * Discovery Controller
 * Handles HTTP requests for public property directory
 */

import { Request, Response } from 'express';
import * as discoveryService from '../services/discovery.service';
import type { PropertySearchFilters } from '../types/discovery.types';

/**
 * Search public properties
 * GET /api/discovery/properties
 */
export async function searchPublicPropertiesHandler(req: Request, res: Response) {
  try {
    // Parse query parameters
    const filters: PropertySearchFilters = {
      country_id: req.query.country_id as string | undefined,
      province_id: req.query.province_id as string | undefined,
      city_id: req.query.city_id as string | undefined,
      checkIn: req.query.checkIn as string | undefined,
      checkOut: req.query.checkOut as string | undefined,
      guests: req.query.guests ? parseInt(req.query.guests as string, 10) : undefined,
      categories: req.query.categories
        ? Array.isArray(req.query.categories)
          ? req.query.categories as string[]
          : [req.query.categories as string]
        : undefined,
      amenities: req.query.amenities
        ? Array.isArray(req.query.amenities)
          ? req.query.amenities as string[]
          : [req.query.amenities as string]
        : undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      keyword: req.query.keyword as string | undefined,
      sortBy: req.query.sortBy as any,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    // Get user ID if authenticated (optional)
    const userId = req.user?.id;

    const result = await discoveryService.searchPublicProperties(filters, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in searchPublicPropertiesHandler:', error);
    res.status(500).json({
      error: 'Failed to search properties',
      message: error.message,
    });
  }
}

/**
 * Get public property detail by slug
 * GET /api/discovery/properties/:slug
 */
export async function getPublicPropertyDetailHandler(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        error: 'Property slug is required',
      });
    }

    // Get user ID if authenticated (optional)
    const userId = req.user?.id;

    const property = await discoveryService.getPublicPropertyDetail(slug, userId);

    if (!property) {
      return res.status(404).json({
        error: 'Property not found or not publicly listed',
      });
    }

    res.json(property);
  } catch (error: any) {
    console.error('Error in getPublicPropertyDetailHandler:', error);
    res.status(500).json({
      error: 'Failed to fetch property details',
      message: error.message,
    });
  }
}

/**
 * Search public rooms
 * GET /api/discovery/rooms
 */
export async function searchPublicRoomsHandler(req: Request, res: Response) {
  try {
    // Parse query parameters (similar to properties)
    const filters: PropertySearchFilters = {
      country_id: req.query.country_id as string | undefined,
      province_id: req.query.province_id as string | undefined,
      city_id: req.query.city_id as string | undefined,
      checkIn: req.query.checkIn as string | undefined,
      checkOut: req.query.checkOut as string | undefined,
      guests: req.query.guests ? parseInt(req.query.guests as string, 10) : undefined,
      amenities: req.query.amenities
        ? Array.isArray(req.query.amenities)
          ? req.query.amenities as string[]
          : [req.query.amenities as string]
        : undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      keyword: req.query.keyword as string | undefined,
      sortBy: req.query.sortBy as any,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    const result = await discoveryService.searchPublicRooms(filters);

    res.json(result);
  } catch (error: any) {
    console.error('Error in searchPublicRoomsHandler:', error);
    res.status(500).json({
      error: 'Failed to search rooms',
      message: error.message,
    });
  }
}

/**
 * Get featured properties for homepage
 * GET /api/discovery/featured
 */
export async function getFeaturedPropertiesHandler(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;

    // Get user ID if authenticated (optional)
    const userId = req.user?.id;

    const result = await discoveryService.getFeaturedProperties(limit, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getFeaturedPropertiesHandler:', error);
    res.status(500).json({
      error: 'Failed to fetch featured properties',
      message: error.message,
    });
  }
}

/**
 * Get properties by category
 * GET /api/discovery/categories/:category
 */
export async function getPropertiesByCategoryHandler(req: Request, res: Response) {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        error: 'Category is required',
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    // Get user ID if authenticated (optional)
    const userId = req.user?.id;

    const result = await discoveryService.getPropertiesByCategory(category, limit, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in getPropertiesByCategoryHandler:', error);
    res.status(500).json({
      error: 'Failed to fetch properties by category',
      message: error.message,
    });
  }
}
