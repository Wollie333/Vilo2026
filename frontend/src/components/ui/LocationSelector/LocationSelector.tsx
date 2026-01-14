import React, { useState, useEffect, useCallback } from 'react';
import { Select } from '../Select';
import { Input } from '../Input';
import { locationService } from '@/services/location.service';
import type { Country, Province, City } from '@/types/location.types';
import type { LocationSelectorProps } from './LocationSelector.types';
export type { LocationData } from './LocationSelector.types';

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedCountryId,
  selectedProvinceId,
  selectedCityId,
  lat,
  lng,
  onLocationChange,
  disabled = false,
  showCoordinates = true,
  helperText,
}) => {
  // Data states
  const [countries, setCountries] = useState<Country[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Loading states
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Local state for coordinates
  const [localLat, setLocalLat] = useState<string>(lat?.toString() || '');
  const [localLng, setLocalLng] = useState<string>(lng?.toString() || '');

  // Track if location tables exist
  const [tablesExist, setTablesExist] = useState(true);

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        const data = await locationService.getCountries();
        setCountries(data);
        setTablesExist(true);
      } catch (err) {
        // If tables don't exist, fall back to coordinate-only mode
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        if (errorMsg.includes('schema cache') || errorMsg.includes('does not exist')) {
          setTablesExist(false);
        } else {
          setError('Failed to load countries');
        }
        console.error('Location service error:', err);
      } finally {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);

  // Load provinces when country changes
  useEffect(() => {
    if (!selectedCountryId) {
      setProvinces([]);
      return;
    }

    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const data = await locationService.getProvinces(selectedCountryId);
        setProvinces(data);
      } catch (err) {
        setError('Failed to load provinces');
        console.error(err);
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, [selectedCountryId]);

  // Load cities when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      return;
    }

    const loadCities = async () => {
      try {
        setLoadingCities(true);
        const data = await locationService.getCities(selectedProvinceId);
        setCities(data);
      } catch (err) {
        setError('Failed to load cities');
        console.error(err);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, [selectedProvinceId]);

  // Sync external lat/lng changes
  useEffect(() => {
    setLocalLat(lat?.toString() || '');
  }, [lat]);

  useEffect(() => {
    setLocalLng(lng?.toString() || '');
  }, [lng]);

  // Country options
  const countryOptions = [
    { value: '', label: 'Select country...' },
    ...countries.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Province options
  const provinceOptions = [
    { value: '', label: selectedCountryId ? 'Select province...' : 'Select country first' },
    ...provinces.map((p) => ({ value: p.id, label: p.name })),
  ];

  // City options
  const cityOptions = [
    { value: '', label: selectedProvinceId ? 'Select city...' : 'Select province first' },
    ...cities.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Handle country change
  const handleCountryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const countryId = e.target.value || undefined;
      const country = countries.find((c) => c.id === countryId);

      onLocationChange({
        countryId,
        countryName: country?.name,
        provinceId: undefined,
        provinceName: undefined,
        cityId: undefined,
        cityName: undefined,
        lat: undefined,
        lng: undefined,
      });
    },
    [countries, onLocationChange]
  );

  // Handle province change
  const handleProvinceChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const provinceId = e.target.value || undefined;
      const province = provinces.find((p) => p.id === provinceId);
      const country = countries.find((c) => c.id === selectedCountryId);

      onLocationChange({
        countryId: selectedCountryId,
        countryName: country?.name,
        provinceId,
        provinceName: province?.name,
        cityId: undefined,
        cityName: undefined,
        lat: undefined,
        lng: undefined,
      });
    },
    [provinces, countries, selectedCountryId, onLocationChange]
  );

  // Handle city change
  const handleCityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cityId = e.target.value || undefined;
      const city = cities.find((c) => c.id === cityId);
      const province = provinces.find((p) => p.id === selectedProvinceId);
      const country = countries.find((c) => c.id === selectedCountryId);

      onLocationChange({
        countryId: selectedCountryId,
        countryName: country?.name,
        provinceId: selectedProvinceId,
        provinceName: province?.name,
        cityId,
        cityName: city?.name,
        // Keep coordinates when changing city
        lat: lat,
        lng: lng,
      });
    },
    [cities, provinces, countries, selectedCountryId, selectedProvinceId, lat, lng, onLocationChange]
  );

  // Handle coordinate change
  const handleLatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalLat(value);

      const parsedLat = value ? parseFloat(value) : undefined;
      if (value === '' || (!isNaN(parsedLat!) && parsedLat !== undefined)) {
        const country = countries.find((c) => c.id === selectedCountryId);
        const province = provinces.find((p) => p.id === selectedProvinceId);
        const city = cities.find((c) => c.id === selectedCityId);

        onLocationChange({
          countryId: selectedCountryId,
          countryName: country?.name,
          provinceId: selectedProvinceId,
          provinceName: province?.name,
          cityId: selectedCityId,
          cityName: city?.name,
          lat: parsedLat,
          lng: lng,
        });
      }
    },
    [countries, provinces, cities, selectedCountryId, selectedProvinceId, selectedCityId, lng, onLocationChange]
  );

  const handleLngChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalLng(value);

      const parsedLng = value ? parseFloat(value) : undefined;
      if (value === '' || (!isNaN(parsedLng!) && parsedLng !== undefined)) {
        const country = countries.find((c) => c.id === selectedCountryId);
        const province = provinces.find((p) => p.id === selectedProvinceId);
        const city = cities.find((c) => c.id === selectedCityId);

        onLocationChange({
          countryId: selectedCountryId,
          countryName: country?.name,
          provinceId: selectedProvinceId,
          provinceName: province?.name,
          cityId: selectedCityId,
          cityName: city?.name,
          lat: lat,
          lng: parsedLng,
        });
      }
    },
    [countries, provinces, cities, selectedCountryId, selectedProvinceId, selectedCityId, lat, onLocationChange]
  );

  // If tables don't exist, show coordinates-only mode
  if (!tablesExist) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Location database not configured. Using coordinate-based location.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Latitude"
            type="number"
            step="0.00000001"
            value={localLat}
            onChange={handleLatChange}
            placeholder="-33.9249"
            helperText="e.g., -33.9249 for Cape Town"
            disabled={disabled}
          />
          <Input
            label="Longitude"
            type="number"
            step="0.00000001"
            value={localLng}
            onChange={handleLngChange}
            placeholder="18.4241"
            helperText="e.g., 18.4241 for Cape Town"
            disabled={disabled}
          />
        </div>

        <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Tip:</strong> You can find coordinates by right-clicking on Google Maps and selecting the coordinates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {helperText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {/* Country Select */}
      <Select
        label="Country"
        value={selectedCountryId || ''}
        onChange={handleCountryChange}
        options={countryOptions}
        disabled={disabled || loadingCountries}
        fullWidth
      />

      {/* Province Select */}
      <Select
        label="Province / State"
        value={selectedProvinceId || ''}
        onChange={handleProvinceChange}
        options={provinceOptions}
        disabled={disabled || !selectedCountryId || loadingProvinces}
        fullWidth
      />

      {/* City Select */}
      <Select
        label="City"
        value={selectedCityId || ''}
        onChange={handleCityChange}
        options={cityOptions}
        disabled={disabled || !selectedProvinceId || loadingCities}
        fullWidth
      />

      {/* Coordinates */}
      {showCoordinates && (
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Map Coordinates (optional)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="0.00000001"
              value={localLat}
              onChange={handleLatChange}
              placeholder="-33.9249"
              helperText="e.g., -33.9249 for Cape Town"
              disabled={disabled}
            />
            <Input
              label="Longitude"
              type="number"
              step="0.00000001"
              value={localLng}
              onChange={handleLngChange}
              placeholder="18.4241"
              helperText="e.g., 18.4241 for Cape Town"
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};
