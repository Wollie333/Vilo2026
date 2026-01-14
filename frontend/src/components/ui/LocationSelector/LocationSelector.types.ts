// ============================================================================
// LocationSelector Types
// ============================================================================

export interface LocationData {
  countryId?: string;
  provinceId?: string;
  cityId?: string;
  countryName?: string;
  provinceName?: string;
  cityName?: string;
  lat?: number;
  lng?: number;
}

export interface LocationSelectorProps {
  /** Currently selected country ID */
  selectedCountryId?: string;
  /** Currently selected province ID */
  selectedProvinceId?: string;
  /** Currently selected city ID */
  selectedCityId?: string;
  /** Current latitude */
  lat?: number;
  /** Current longitude */
  lng?: number;
  /** Callback when location changes */
  onLocationChange: (location: LocationData) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Whether to show coordinate inputs */
  showCoordinates?: boolean;
  /** Helper text for the component */
  helperText?: string;
}
