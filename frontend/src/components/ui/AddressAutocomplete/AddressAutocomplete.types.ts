/**
 * AddressAutocomplete Types
 */

export interface AddressData {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (address: AddressData) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
}
