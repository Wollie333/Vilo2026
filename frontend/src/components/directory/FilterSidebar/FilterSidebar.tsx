/**
 * FilterSidebar Component
 * Advanced filters for property search
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FilterSidebarProps } from './FilterSidebar.types';
import { PREDEFINED_CATEGORIES, PREDEFINED_AMENITY_GROUPS } from './FilterSidebar.constants';
import { Button } from '@/components/ui';

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  className = '',
}) => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    categories: true,
    amenities: true,
    price: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];

    onFilterChange({ ...filters, categories: newCategories });
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];

    onFilterChange({ ...filters, amenities: newAmenities });
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;

    if (type === 'min') {
      onFilterChange({ ...filters, priceMin: numValue });
    } else {
      onFilterChange({ ...filters, priceMax: numValue });
    }
  };

  const hasActiveFilters =
    (filters.categories && filters.categories.length > 0) ||
    (filters.amenities && filters.amenities.length > 0) ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined;

  return (
    <div
      className={`bg-white dark:bg-dark-card rounded-lg shadow-md p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-primary hover:text-primary/80"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Price Range Section */}
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full mb-4"
        >
          <h4 className="font-medium text-gray-900 dark:text-white">
            Price Range
          </h4>
          {expandedSections.price ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {expandedSections.price && (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="priceMin"
                className="block text-sm text-gray-600 dark:text-white-secondary mb-1"
              >
                Min Price
              </label>
              <input
                id="priceMin"
                type="number"
                placeholder="0"
                value={filters.priceMin || ''}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="priceMax"
                className="block text-sm text-gray-600 dark:text-white-secondary mb-1"
              >
                Max Price
              </label>
              <input
                id="priceMax"
                type="number"
                placeholder="10000"
                value={filters.priceMax || ''}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full mb-4"
        >
          <h4 className="font-medium text-gray-900 dark:text-white">
            Categories
            {filters.categories && filters.categories.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {filters.categories.length}
              </span>
            )}
          </h4>
          {expandedSections.categories ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {expandedSections.categories && (
          <div className="space-y-2 max-h-64 overflow-y-auto styled-scrollbar">
            {PREDEFINED_CATEGORIES.map((category) => (
              <label
                key={category}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category) || false}
                  onChange={() => handleCategoryToggle(category)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-white">
                  {category}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Amenities Section */}
      <div>
        <button
          onClick={() => toggleSection('amenities')}
          className="flex items-center justify-between w-full mb-4"
        >
          <h4 className="font-medium text-gray-900 dark:text-white">
            Amenities
            {filters.amenities && filters.amenities.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {filters.amenities.length}
              </span>
            )}
          </h4>
          {expandedSections.amenities ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {expandedSections.amenities && (
          <div className="space-y-4 max-h-96 overflow-y-auto styled-scrollbar">
            {Object.entries(PREDEFINED_AMENITY_GROUPS).map(([key, group]) => (
              <div key={key}>
                <h5 className="text-sm font-medium text-gray-700 dark:text-white mb-2">
                  {group.label}
                </h5>
                <div className="space-y-2 ml-2">
                  {group.items.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={
                          filters.amenities?.includes(amenity) || false
                        }
                        onChange={() => handleAmenityToggle(amenity)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-white">
                        {amenity}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
