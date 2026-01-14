/**
 * AddressField Component
 *
 * A compound form component for collecting address information with
 * cascading dropdowns for Country → Province → City → Postal Code.
 * Designed to be compatible with future Google Places API integration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select, Spinner } from '@/components/ui';
import { locationService } from '@/services';
import type { AddressFieldProps, AddressFieldState } from './AddressField.types';

export const AddressField: React.FC<AddressFieldProps> = ({
  value,
  onChange,
  errors = {},
  disabled = false,
  isLoading = false,
  className = '',
  required = false,
  label,
}) => {
  const [state, setState] = useState<AddressFieldState>({
    countries: [],
    provinces: [],
    cities: [],
    loadingCountries: true,
    loadingProvinces: false,
    loadingCities: false,
    error: null,
  });

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setState(prev => ({ ...prev, loadingCountries: true, error: null }));
        const countries = await locationService.getCountries();
        setState(prev => ({ ...prev, countries, loadingCountries: false }));
      } catch {
        setState(prev => ({
          ...prev,
          loadingCountries: false,
          error: 'Failed to load countries',
        }));
      }
    };

    loadCountries();
  }, []);

  // Load provinces when country changes
  useEffect(() => {
    const loadProvinces = async () => {
      if (!value.country_id) {
        setState(prev => ({ ...prev, provinces: [], cities: [] }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loadingProvinces: true, error: null }));
        const provinces = await locationService.getProvinces(value.country_id);
        setState(prev => ({ ...prev, provinces, cities: [], loadingProvinces: false }));
      } catch {
        setState(prev => ({
          ...prev,
          loadingProvinces: false,
          error: 'Failed to load provinces',
        }));
      }
    };

    loadProvinces();
  }, [value.country_id]);

  // Load cities when province changes
  useEffect(() => {
    const loadCities = async () => {
      if (!value.province_id) {
        setState(prev => ({ ...prev, cities: [] }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loadingCities: true, error: null }));
        const cities = await locationService.getCities(value.province_id);
        setState(prev => ({ ...prev, cities, loadingCities: false }));
      } catch {
        setState(prev => ({
          ...prev,
          loadingCities: false,
          error: 'Failed to load cities',
        }));
      }
    };

    loadCities();
  }, [value.province_id]);

  // Handle field changes
  const handleChange = useCallback(
    (field: keyof typeof value, newValue: string) => {
      const updates: Partial<typeof value> = { [field]: newValue };

      // When country changes, reset dependent fields
      if (field === 'country_id') {
        const selectedCountry = state.countries.find(c => c.id === newValue);
        updates.country = selectedCountry?.name || '';
        updates.province_id = '';
        updates.province = '';
        updates.city_id = '';
        updates.city = '';
        updates.postal_code = '';
      }

      // When province changes, reset dependent fields
      if (field === 'province_id') {
        const selectedProvince = state.provinces.find(p => p.id === newValue);
        updates.province = selectedProvince?.name || '';
        updates.city_id = '';
        updates.city = '';
        updates.postal_code = '';
      }

      // When city changes, set city name and clear postal code for re-selection
      if (field === 'city_id') {
        const selectedCity = state.cities.find(c => c.id === newValue);
        updates.city = selectedCity?.name || '';
        // Auto-select postal code if city only has one
        if (selectedCity?.postal_codes?.length === 1) {
          updates.postal_code = selectedCity.postal_codes[0];
        } else {
          updates.postal_code = '';
        }
      }

      onChange({ ...value, ...updates });
    },
    [value, onChange, state.countries, state.provinces, state.cities]
  );

  // Get postal code options for selected city
  const getPostalCodeOptions = () => {
    const selectedCity = state.cities.find(c => c.id === value.city_id);
    if (!selectedCity?.postal_codes?.length) return [];
    return selectedCity.postal_codes.map(code => ({
      value: code,
      label: code,
    }));
  };

  const postalCodeOptions = getPostalCodeOptions();
  const hasPostalCodeOptions = postalCodeOptions.length > 0;

  // Check if we should show loading overlay
  const showLoading = isLoading || state.loadingCountries;

  if (showLoading) {
    return (
      <div className={`relative ${className}`}>
        {label && (
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {label}
          </h4>
        )}
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
        </h4>
      )}

      {state.error && (
        <p className="text-xs text-error mb-2">{state.error}</p>
      )}

      <div className="space-y-4">
        {/* Street Address */}
        <Input
          label="Street Address"
          value={value.street_address || ''}
          onChange={(e) => handleChange('street_address', e.target.value)}
          error={errors.street_address}
          disabled={disabled}
          placeholder="Enter street address"
          fullWidth
          required={required}
        />

        {/* Street Address Line 2 */}
        <Input
          label="Apartment, Suite, Unit, etc. (optional)"
          value={value.street_address_2 || ''}
          onChange={(e) => handleChange('street_address_2', e.target.value)}
          error={errors.street_address_2}
          disabled={disabled}
          placeholder="Apartment, suite, unit, building, floor, etc."
          fullWidth
        />

        {/* Country and Province Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Country */}
          <Select
            label="Country"
            value={value.country_id || ''}
            onChange={(e) => handleChange('country_id', e.target.value)}
            options={state.countries.map(c => ({
              value: c.id,
              label: c.name,
            }))}
            placeholder="Select country"
            error={errors.country}
            disabled={disabled || state.loadingCountries}
          />

          {/* Province/State */}
          <Select
            label="Province / State"
            value={value.province_id || ''}
            onChange={(e) => handleChange('province_id', e.target.value)}
            options={state.provinces.map(p => ({
              value: p.id,
              label: p.name,
            }))}
            placeholder={
              state.loadingProvinces
                ? 'Loading...'
                : value.country_id
                ? 'Select province'
                : 'Select country first'
            }
            error={errors.province}
            disabled={disabled || !value.country_id || state.loadingProvinces}
          />
        </div>

        {/* City and Postal Code Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <Select
            label="City"
            value={value.city_id || ''}
            onChange={(e) => handleChange('city_id', e.target.value)}
            options={state.cities.map(c => ({
              value: c.id,
              label: c.name,
            }))}
            placeholder={
              state.loadingCities
                ? 'Loading...'
                : value.province_id
                ? 'Select city'
                : 'Select province first'
            }
            error={errors.city}
            disabled={disabled || !value.province_id || state.loadingCities}
          />

          {/* Postal Code - Select if options available, otherwise Input */}
          {hasPostalCodeOptions ? (
            <Select
              label="Postal Code"
              value={value.postal_code || ''}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              options={postalCodeOptions}
              placeholder="Select postal code"
              error={errors.postal_code}
              disabled={disabled || !value.city_id}
            />
          ) : (
            <Input
              label="Postal Code"
              value={value.postal_code || ''}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              error={errors.postal_code}
              disabled={disabled}
              placeholder={value.city_id ? 'Enter postal code' : 'Select city first'}
              fullWidth
              required={required}
            />
          )}
        </div>
      </div>
    </div>
  );
};

AddressField.displayName = 'AddressField';
