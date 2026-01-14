/**
 * Location Routes
 * Route definitions for location data endpoints (countries, provinces, cities).
 * These routes are public - no authentication required.
 */

import { Router } from 'express';
import * as locationController from '../controllers/location.controller';

const router = Router();

// ============================================================================
// Countries Routes
// ============================================================================

/**
 * GET /api/locations/countries
 * List all active countries
 */
router.get('/countries', locationController.listCountries);

/**
 * GET /api/locations/countries/:id
 * Get a single country by ID
 */
router.get('/countries/:id', locationController.getCountry);

// ============================================================================
// Provinces Routes
// ============================================================================

/**
 * GET /api/locations/provinces/:countryId
 * List provinces for a country
 */
router.get('/provinces/:countryId', locationController.listProvinces);

/**
 * GET /api/locations/province/:id
 * Get a single province by ID
 */
router.get('/province/:id', locationController.getProvince);

// ============================================================================
// Cities Routes
// ============================================================================

/**
 * GET /api/locations/cities/search?q=query
 * Search cities by name (must be before :provinceId to avoid conflict)
 */
router.get('/cities/search', locationController.searchCities);

/**
 * GET /api/locations/cities/:provinceId
 * List cities for a province
 */
router.get('/cities/:provinceId', locationController.listCities);

/**
 * GET /api/locations/city/:id
 * Get a single city by ID
 */
router.get('/city/:id', locationController.getCity);

export default router;
