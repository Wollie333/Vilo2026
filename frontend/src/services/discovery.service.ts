/**
 * Discovery Service (Frontend)
 * API client for public property directory
 */

import { api } from './api.service';
import type {
  PropertySearchFilters,
  PropertySearchResponse,
  PublicPropertyDetail,
  FeaturedPropertiesResponse,
  CategoryProperties,
} from '@/types';

/**
 * Search public properties with filters
 */
export async function searchPublicProperties(
  filters: PropertySearchFilters
): Promise<PropertySearchResponse> {
  const params = new URLSearchParams();

  // Add filter params
  if (filters.country_id) params.append('country_id', filters.country_id);
  if (filters.province_id) params.append('province_id', filters.province_id);
  if (filters.city_id) params.append('city_id', filters.city_id);
  if (filters.checkIn) params.append('checkIn', filters.checkIn);
  if (filters.checkOut) params.append('checkOut', filters.checkOut);
  if (filters.guests) params.append('guests', filters.guests.toString());
  if (filters.categories) {
    filters.categories.forEach((cat) => params.append('categories', cat));
  }
  if (filters.amenities) {
    filters.amenities.forEach((amenity) => params.append('amenities', amenity));
  }
  if (filters.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
  if (filters.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
  if (filters.keyword) params.append('keyword', filters.keyword);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/discovery/properties?${params.toString()}`);
  return response as any as PropertySearchResponse;
}

/**
 * Search public rooms with filters
 */
export async function searchPublicRooms(
  filters: PropertySearchFilters
): Promise<any> {
  const params = new URLSearchParams();

  // Add filter params
  if (filters.country_id) params.append('country_id', filters.country_id);
  if (filters.province_id) params.append('province_id', filters.province_id);
  if (filters.city_id) params.append('city_id', filters.city_id);
  if (filters.checkIn) params.append('checkIn', filters.checkIn);
  if (filters.checkOut) params.append('checkOut', filters.checkOut);
  if (filters.guests) params.append('guests', filters.guests.toString());
  if (filters.amenities) {
    filters.amenities.forEach((amenity) => params.append('amenities', amenity));
  }
  if (filters.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
  if (filters.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
  if (filters.keyword) params.append('keyword', filters.keyword);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/discovery/rooms?${params.toString()}`);
  return response as any;
}

/**
 * Get public property detail by slug
 */
export async function getPublicPropertyDetail(
  slug: string
): Promise<PublicPropertyDetail> {
  console.log('🌐 [Discovery Service] Fetching property detail for slug:', slug);
  const response = await api.get(`/discovery/properties/${slug}`);
  console.log('📥 [Discovery Service] API Response:', {
    slug,
    hasData: !!response,
    hasAddons: !!(response as any)?.addons,
    addonsCount: (response as any)?.addons?.length || 0,
    addons: (response as any)?.addons,
    responseKeys: response ? Object.keys(response) : []
  });
  return response as any as PublicPropertyDetail;
}

/**
 * Get featured properties for homepage
 */
export async function getFeaturedProperties(
  limit: number = 12
): Promise<FeaturedPropertiesResponse> {
  const response = await api.get(`/discovery/featured?limit=${limit}`);
  return response as any as FeaturedPropertiesResponse;
}

/**
 * Get properties by category
 */
export async function getPropertiesByCategory(
  category: string,
  limit: number = 20
): Promise<CategoryProperties> {
  const response = await api.get(`/discovery/categories/${category}?limit=${limit}`);
  return response as any as CategoryProperties;
}
