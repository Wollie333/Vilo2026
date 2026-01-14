import { getAdminClient } from '../config/supabase';
import type { Country, Province, City } from '../types/location.types';

// ============================================================================
// COUNTRIES
// ============================================================================

/**
 * List all active countries
 */
export const listCountries = async (): Promise<Country[]> => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch countries: ${error.message}`);
  }

  return data || [];
};

/**
 * Get a single country by ID
 */
export const getCountryById = async (id: string): Promise<Country | null> => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch country: ${error.message}`);
  }

  return data;
};

/**
 * Get a country by code
 */
export const getCountryByCode = async (code: string): Promise<Country | null> => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch country: ${error.message}`);
  }

  return data;
};

// ============================================================================
// PROVINCES
// ============================================================================

/**
 * List provinces for a country
 */
export const listProvinces = async (countryId: string): Promise<Province[]> => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('provinces')
    .select('*')
    .eq('country_id', countryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch provinces: ${error.message}`);
  }

  return data || [];
};

/**
 * Get a single province by ID
 */
export const getProvinceById = async (id: string): Promise<Province | null> => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('provinces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch province: ${error.message}`);
  }

  return data;
};

// ============================================================================
// CITIES
// ============================================================================

/**
 * List cities for a province
 */
export const listCities = async (provinceId: string): Promise<City[]> => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('province_id', provinceId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch cities: ${error.message}`);
  }

  return data || [];
};

/**
 * Get a single city by ID
 */
export const getCityById = async (id: string): Promise<City | null> => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch city: ${error.message}`);
  }

  return data;
};

/**
 * Search cities by name across all provinces
 */
export const searchCities = async (query: string, limit = 20): Promise<City[]> => {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search cities: ${error.message}`);
  }

  return data || [];
};
