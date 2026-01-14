// ============================================================================
// Location Types
// ============================================================================

export interface Country {
  id: string;
  name: string;
  code: string;      // ISO 3166-1 alpha-3
  code_2: string | null;  // ISO 3166-1 alpha-2
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Province {
  id: string;
  country_id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  province_id: string;
  name: string;
  postal_codes: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Response types for API
export interface CountryListResponse {
  countries: Country[];
}

export interface ProvinceListResponse {
  provinces: Province[];
}

export interface CityListResponse {
  cities: City[];
}
