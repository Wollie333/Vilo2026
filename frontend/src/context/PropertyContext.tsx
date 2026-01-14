/**
 * Property Context
 *
 * Global state management for property selection.
 * Allows users with multiple properties to switch context.
 * When a property is selected, all entity lists filter by that property.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { propertyService } from '@/services/property.service';
import { useAuth } from './AuthContext';
import type { PropertyWithCompany } from '@/types/property.types';

// ============================================================================
// Context Type
// ============================================================================

export interface PropertyContextValue {
  // State
  properties: PropertyWithCompany[];
  selectedProperty: PropertyWithCompany | null;
  isLoading: boolean;
  error: string | null;

  // Methods
  selectProperty: (propertyId: string) => void;
  refreshProperties: () => Promise<void>;

  // Computed helpers
  hasMultipleProperties: boolean;
  primaryProperty: PropertyWithCompany | null;
}

// ============================================================================
// Context
// ============================================================================

const PropertyContext = createContext<PropertyContextValue | undefined>(undefined);

// ============================================================================
// LocalStorage Key
// ============================================================================

const STORAGE_KEY = 'vilo_selected_property';

// ============================================================================
// Provider Props
// ============================================================================

interface PropertyProviderProps {
  children: ReactNode;
}

// ============================================================================
// Provider
// ============================================================================

export const PropertyProvider: React.FC<PropertyProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // State
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Fetch Properties
  // ============================================================================

  const fetchProperties = useCallback(async () => {
    if (!isAuthenticated) {
      setProperties([]);
      setSelectedProperty(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await propertyService.getMyProperties();
      const fetchedProperties = response.properties;
      setProperties(fetchedProperties);

      // Auto-select logic
      if (fetchedProperties.length === 0) {
        // No properties - clear selection
        setSelectedProperty(null);
        localStorage.removeItem(STORAGE_KEY);
      } else if (fetchedProperties.length === 1) {
        // Single property - auto-select
        setSelectedProperty(fetchedProperties[0]);
        localStorage.setItem(STORAGE_KEY, fetchedProperties[0].id);
      } else {
        // Multiple properties - check for saved selection or primary
        const savedPropertyId = localStorage.getItem(STORAGE_KEY);

        let propertyToSelect: PropertyWithCompany | null = null;

        // Try to restore saved selection if valid
        if (savedPropertyId) {
          propertyToSelect = fetchedProperties.find(p => p.id === savedPropertyId) || null;
        }

        // If no valid saved selection, find primary property
        if (!propertyToSelect && user?.properties) {
          const primaryUserProperty = user.properties.find(up => up.is_primary);
          if (primaryUserProperty) {
            propertyToSelect = fetchedProperties.find(
              p => p.id === primaryUserProperty.property_id
            ) || null;
          }
        }

        // If still no selection, select first property
        if (!propertyToSelect) {
          propertyToSelect = fetchedProperties[0];
        }

        setSelectedProperty(propertyToSelect);
        if (propertyToSelect) {
          localStorage.setItem(STORAGE_KEY, propertyToSelect.id);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch properties';
      setError(message);
      console.error('Failed to fetch properties:', err);
      setProperties([]);
      setSelectedProperty(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.properties]);

  // ============================================================================
  // Select Property
  // ============================================================================

  const selectProperty = useCallback((propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      localStorage.setItem(STORAGE_KEY, propertyId);
    }
  }, [properties]);

  // ============================================================================
  // Refresh Properties
  // ============================================================================

  const refreshProperties = useCallback(async () => {
    await fetchProperties();
  }, [fetchProperties]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const hasMultipleProperties = useMemo(() => properties.length > 1, [properties]);

  const primaryProperty = useMemo(() => {
    if (!user?.properties || properties.length === 0) return null;

    const primaryUserProperty = user.properties.find(up => up.is_primary);
    if (!primaryUserProperty) return null;

    return properties.find(p => p.id === primaryUserProperty.property_id) || null;
  }, [user?.properties, properties]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Fetch properties when user logs in
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties, user?.id]);

  // Clear on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setProperties([]);
      setSelectedProperty(null);
      setError(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isAuthenticated]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: PropertyContextValue = useMemo(
    () => ({
      properties,
      selectedProperty,
      isLoading,
      error,
      selectProperty,
      refreshProperties,
      hasMultipleProperties,
      primaryProperty,
    }),
    [
      properties,
      selectedProperty,
      isLoading,
      error,
      selectProperty,
      refreshProperties,
      hasMultipleProperties,
      primaryProperty,
    ]
  );

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useProperty = (): PropertyContextValue => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};
