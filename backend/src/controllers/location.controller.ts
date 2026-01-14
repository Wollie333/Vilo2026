import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as locationService from '../services/location.service';

// ============================================================================
// COUNTRIES
// ============================================================================

/**
 * GET /api/locations/countries
 * List all active countries
 */
export const listCountries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const countries = await locationService.listCountries();
    sendSuccess(res, { countries });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/locations/countries/:id
 * Get a single country by ID
 */
export const getCountry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const country = await locationService.getCountryById(req.params.id);
    if (!country) {
      res.status(404).json({ success: false, error: { message: 'Country not found' } });
      return;
    }
    sendSuccess(res, { country });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PROVINCES
// ============================================================================

/**
 * GET /api/locations/provinces/:countryId
 * List provinces for a country
 */
export const listProvinces = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const provinces = await locationService.listProvinces(req.params.countryId);
    sendSuccess(res, { provinces });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/locations/province/:id
 * Get a single province by ID
 */
export const getProvince = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const province = await locationService.getProvinceById(req.params.id);
    if (!province) {
      res.status(404).json({ success: false, error: { message: 'Province not found' } });
      return;
    }
    sendSuccess(res, { province });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CITIES
// ============================================================================

/**
 * GET /api/locations/cities/:provinceId
 * List cities for a province
 */
export const listCities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cities = await locationService.listCities(req.params.provinceId);
    sendSuccess(res, { cities });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/locations/city/:id
 * Get a single city by ID
 */
export const getCity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const city = await locationService.getCityById(req.params.id);
    if (!city) {
      res.status(404).json({ success: false, error: { message: 'City not found' } });
      return;
    }
    sendSuccess(res, { city });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/locations/cities/search?q=query
 * Search cities by name
 */
export const searchCities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      sendSuccess(res, { cities: [] });
      return;
    }
    const limit = parseInt(req.query.limit as string) || 20;
    const cities = await locationService.searchCities(query, limit);
    sendSuccess(res, { cities });
  } catch (error) {
    next(error);
  }
};
