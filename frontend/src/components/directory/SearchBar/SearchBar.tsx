/**
 * SearchBar Component
 * Hero search bar for property discovery
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users } from 'lucide-react';
import type { SearchBarProps, SearchFilters } from './SearchBar.types';
import { Button, DateRangePicker } from '@/components/ui';

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  initialFilters = {},
  compact = false,
  hideLabels = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    location: initialFilters.location || '',
    checkIn: initialFilters.checkIn || '',
    checkOut: initialFilters.checkOut || '',
    guests: initialFilters.guests || 2,
    adults: initialFilters.adults || 2,
    children: initialFilters.children || 0,
  });

  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  const handleSearch = () => {
    // Build search URL with query parameters
    const params = new URLSearchParams();

    if (filters.location) params.append('location', filters.location);
    if (filters.checkIn) params.append('checkIn', filters.checkIn);
    if (filters.checkOut) params.append('checkOut', filters.checkOut);
    if (filters.guests) params.append('guests', filters.guests.toString());

    // Navigate to search results page
    navigate(`/search?${params.toString()}`);

    // Call onSearch callback if provided
    if (onSearch) {
      onSearch(filters);
    }
  };

  const handleGuestChange = (type: 'adults' | 'children', increment: boolean) => {
    setFilters((prev) => {
      const currentValue = prev[type] || 0;
      const newValue = increment
        ? currentValue + 1
        : Math.max(0, currentValue - 1);

      const adults = type === 'adults' ? newValue : prev.adults || 0;
      const children = type === 'children' ? newValue : prev.children || 0;

      return {
        ...prev,
        [type]: newValue,
        guests: adults + children,
      };
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div
      className={`${
        compact
          ? 'bg-transparent p-3'
          : 'bg-white dark:bg-dark-card rounded-2xl'
      } ${className}`}
    >
      <div
        className={`${
          compact
            ? 'flex flex-col md:flex-row gap-2'
            : 'flex flex-col lg:flex-row gap-4 p-6'
        }`}
      >
        {/* Location Input */}
        <div className="flex-1 min-w-0">
          {!hideLabels && (
            <label
              htmlFor="location"
              className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1"
            >
              Location
            </label>
          )}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="location"
              type="text"
              placeholder="Choose destination"
              value={filters.location}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, location: e.target.value }))
              }
              onKeyPress={handleKeyPress}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm placeholder:text-gray-400 placeholder:text-sm"
            />
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col h-full">
            {!hideLabels && (
              <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">
                Check-in - Check-out
              </label>
            )}
            <div className="flex-1">
              <DateRangePicker
                value={{
                  startDate: filters.checkIn || null,
                  endDate: filters.checkOut || null,
                }}
                onChange={(range) =>
                  setFilters((prev) => ({
                    ...prev,
                    checkIn: range.startDate || '',
                    checkOut: range.endDate || '',
                  }))
                }
                minDate={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        {/* Guests Dropdown */}
        <div className="flex-1 min-w-0 relative">
          {!hideLabels && (
            <label
              htmlFor="guests"
              className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1"
            >
              Guests
            </label>
          )}
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowGuestDropdown(!showGuestDropdown)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-bg text-left text-gray-900 dark:text-white text-sm"
            >
              {filters.guests || 0} {filters.guests === 1 ? 'Guest' : 'Guests'}
            </button>

            {/* Guest Dropdown */}
            {showGuestDropdown && (
              <div className="absolute right-0 z-10 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-5">
                {/* Adults */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Adults
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleGuestChange('adults', false)}
                      className="w-9 h-9 flex items-center justify-center border-2 border-gray-300 dark:border-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium text-lg"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-base font-semibold text-gray-900 dark:text-white">
                      {filters.adults || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleGuestChange('adults', true)}
                      className="w-9 h-9 flex items-center justify-center border-2 border-gray-300 dark:border-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Children
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleGuestChange('children', false)}
                      className="w-9 h-9 flex items-center justify-center border-2 border-gray-300 dark:border-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium text-lg"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-base font-semibold text-gray-900 dark:text-white">
                      {filters.children || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleGuestChange('children', true)}
                      className="w-9 h-9 flex items-center justify-center border-2 border-gray-300 dark:border-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <div className={compact ? 'md:self-end' : 'lg:self-end'}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSearch}
            className="w-full md:w-auto"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};
