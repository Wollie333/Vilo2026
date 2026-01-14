/**
 * AddonsPage
 *
 * Main page for managing add-ons.
 * Users select a property first, then manage add-ons for that property.
 */

import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Card, Spinner, Alert } from '@/components/ui';
import { propertyService } from '@/services';
import { AddonsTab } from './components';

interface Property {
  id: string;
  name: string;
  slug: string;
}

// Icons
const BuildingIcon = () => (
  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const AddonsPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load properties on mount
  useEffect(() => {
    const loadProperties = async () => {
      setIsLoadingProperties(true);
      setError(null);
      try {
        const response = await propertyService.getMyProperties();
        const props = response.properties || response || [];
        setProperties(props);

        // Auto-select first property if only one exists
        if (props.length === 1) {
          setSelectedPropertyId(props[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties');
      } finally {
        setIsLoadingProperties(false);
      }
    };

    loadProperties();
  }, []);

  return (
    <AuthenticatedLayout
      title="Add-ons"
      subtitle="Manage optional extras for your properties"
    >
      <div className="max-w-7xl mx-auto">
        {/* Loading state */}
        {isLoadingProperties && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* No properties state */}
        {!isLoadingProperties && properties.length === 0 && (
          <Card variant="bordered">
            <Card.Body className="py-16">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <BuildingIcon />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Properties Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Create a property first before you can add optional extras for guests.
                </p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Property selector and add-ons */}
        {!isLoadingProperties && properties.length > 0 && (
          <div className="space-y-6">
            {/* Property selector (if multiple properties) */}
            {properties.length > 1 && (
              <Card variant="bordered">
                <Card.Body className="py-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
                      Select Property:
                    </label>
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Choose a property...</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Addons content */}
            {selectedPropertyId ? (
              <AddonsTab propertyId={selectedPropertyId} />
            ) : (
              <Card variant="bordered">
                <Card.Body className="py-16">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <ChevronDownIcon />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a Property
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose a property above to manage its add-ons
                    </p>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};
