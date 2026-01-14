/**
 * PropertySelector Component
 *
 * Displays the currently selected property and allows switching between properties.
 * Shows in the sidebar above the main navigation.
 * Auto-selects for single property users, provides switcher for multi-property users.
 */

import React, { useState } from 'react';
import { HiOutlineOfficeBuilding, HiOutlineSwitchHorizontal } from 'react-icons/hi';
import { useProperty } from '@/context/PropertyContext';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { PropertySelectorProps } from './PropertySelector.types';

export const PropertySelector: React.FC<PropertySelectorProps> = ({ className = '' }) => {
  const {
    properties,
    selectedProperty,
    isLoading,
    error,
    hasMultipleProperties,
    selectProperty,
  } = useProperty();

  const [showSwitcher, setShowSwitcher] = useState(false);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleOpenSwitcher = () => {
    setShowSwitcher(true);
  };

  const handleCloseSwitcher = () => {
    setShowSwitcher(false);
  };

  const handleSelectProperty = (propertyId: string) => {
    selectProperty(propertyId);
    setShowSwitcher(false);
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
          Active Property
        </div>
        <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card rounded-lg p-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-dark-border rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-dark-border rounded w-3/4"></div>
              <div className="h-2 bg-gray-200 dark:bg-dark-border rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
          Active Property
        </div>
        <div className="border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Empty State (No Properties)
  // ============================================================================

  if (properties.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
          Active Property
        </div>
        <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card rounded-lg p-4 shadow-sm text-center">
          <HiOutlineOfficeBuilding className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            No properties yet
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => (window.location.href = '/properties/new')}
          >
            Create Property
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Property Card Content
  // ============================================================================

  const renderPropertyContent = (property: typeof selectedProperty) => {
    if (!property) return null;

    // Get property image - prioritize featured image, then logo, then icon
    const propertyImage = property.featured_image_url || property.logo_url;

    return (
      <div className="flex items-center gap-3">
        {/* Property Thumbnail/Image */}
        <div className="flex-shrink-0">
          {propertyImage ? (
            <img
              src={propertyImage}
              alt={property.name}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded flex items-center justify-center">
              <HiOutlineOfficeBuilding className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {property.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {property.address_city || property.address_country || 'No location'}
          </div>
        </div>

        {/* Switch Button (only for multiple properties) */}
        {hasMultipleProperties && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<HiOutlineSwitchHorizontal className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenSwitcher();
            }}
            className="flex-shrink-0"
          >
            Switch
          </Button>
        )}
      </div>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Current Property Display */}
      <div className={`space-y-2 ${className}`}>
        <div className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
          Active Property
        </div>

        {/* Single Property - Read-only Card */}
        {!hasMultipleProperties && selectedProperty && (
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card rounded-lg p-4 shadow-sm">
            {renderPropertyContent(selectedProperty)}
          </div>
        )}

        {/* Multiple Properties - Clickable Card */}
        {hasMultipleProperties && selectedProperty && (
          <div
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card rounded-lg p-4 shadow-sm cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
            onClick={handleOpenSwitcher}
          >
            {renderPropertyContent(selectedProperty)}
          </div>
        )}
      </div>

      {/* Property Switcher Modal */}
      {hasMultipleProperties && (
        <Modal
          isOpen={showSwitcher}
          onClose={handleCloseSwitcher}
          title="Switch Property"
          size="md"
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Select a property to switch context. All lists and forms will update to show data
              for the selected property.
            </p>

            {/* Property List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {properties.map((property) => {
                // Get property image - prioritize featured image, then logo, then icon
                const propertyImage = property.featured_image_url || property.logo_url;

                return (
                  <SelectableCard
                    key={property.id}
                    id={property.id}
                    selected={selectedProperty?.id === property.id}
                    onSelect={handleSelectProperty}
                  >
                    <div className="flex items-center gap-3">
                      {/* Property Thumbnail/Image */}
                      <div className="flex-shrink-0">
                        {propertyImage ? (
                          <img
                            src={propertyImage}
                            alt={property.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded flex items-center justify-center">
                            <HiOutlineOfficeBuilding className="w-6 h-6 text-primary" />
                          </div>
                        )}
                      </div>

                    {/* Property Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {property.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {property.address_city && property.address_country
                          ? `${property.address_city}, ${property.address_country}`
                          : property.address_city || property.address_country || 'No location'}
                      </div>
                      {property.company_name && (
                        <div className="text-2xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {property.company_name}
                        </div>
                      )}
                    </div>
                    </div>
                  </SelectableCard>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
