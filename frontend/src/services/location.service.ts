import { api } from './api.service';
import type {
  Country,
  Province,
  City,
  CountryListResponse,
  ProvinceListResponse,
  CityListResponse,
} from '@/types/location.types';

class LocationService {
  // ============================================================================
  // COUNTRIES
  // ============================================================================

  /**
   * Get all active countries
   */
  async getCountries(): Promise<Country[]> {
    const response = await api.get<CountryListResponse>('/locations/countries');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch countries');
    }

    return response.data.countries;
  }

  /**
   * Get a single country by ID
   */
  async getCountry(id: string): Promise<Country> {
    const response = await api.get<{ country: Country }>(`/locations/countries/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch country');
    }

    return response.data.country;
  }

  // ============================================================================
  // PROVINCES
  // ============================================================================

  /**
   * Get provinces for a country
   */
  async getProvinces(countryId: string): Promise<Province[]> {
    const response = await api.get<ProvinceListResponse>(`/locations/provinces/${countryId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch provinces');
    }

    return response.data.provinces;
  }

  /**
   * Get a single province by ID
   */
  async getProvince(id: string): Promise<Province> {
    const response = await api.get<{ province: Province }>(`/locations/province/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch province');
    }

    return response.data.province;
  }

  // ============================================================================
  // CITIES
  // ============================================================================

  /**
   * Get cities for a province
   */
  async getCities(provinceId: string): Promise<City[]> {
    const response = await api.get<CityListResponse>(`/locations/cities/${provinceId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch cities');
    }

    return response.data.cities;
  }

  /**
   * Get a single city by ID
   */
  async getCity(id: string): Promise<City> {
    const response = await api.get<{ city: City }>(`/locations/city/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch city');
    }

    return response.data.city;
  }

  /**
   * Search cities by name
   */
  async searchCities(query: string, limit = 20): Promise<City[]> {
    const response = await api.get<CityListResponse>(
      `/locations/cities/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to search cities');
    }

    return response.data.cities;
  }
}

export const locationService = new LocationService();
