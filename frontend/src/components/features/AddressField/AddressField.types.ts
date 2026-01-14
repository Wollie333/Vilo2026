import type { Country, Province, City, AddressData } from '@/types/location.types';

export interface AddressFieldProps {
  /** Current address values */
  value: AddressData;
  /** Callback when any field changes */
  onChange: (data: AddressData) => void;
  /** Error messages for each field */
  errors?: Partial<Record<keyof AddressData, string>>;
  /** Whether the entire field is disabled */
  disabled?: boolean;
  /** Whether to show loading state */
  isLoading?: boolean;
  /** Optional class name */
  className?: string;
  /** Whether to require all fields */
  required?: boolean;
  /** Label for the section */
  label?: string;
}

export interface AddressFieldState {
  countries: Country[];
  provinces: Province[];
  cities: City[];
  loadingCountries: boolean;
  loadingProvinces: boolean;
  loadingCities: boolean;
  error: string | null;
}
