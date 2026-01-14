/**
 * SearchBar Component Types
 */

export interface SearchBarProps {
  onSearch?: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
  compact?: boolean;
  hideLabels?: boolean;
  className?: string;
}

export interface SearchFilters {
  location?: string;
  country_id?: string;
  province_id?: string;
  city_id?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  adults?: number;
  children?: number;
}
