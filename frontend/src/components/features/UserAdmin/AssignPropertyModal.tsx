/**
 * AssignPropertyModal Component
 *
 * Modal for assigning properties to a user
 * Allows selecting multiple properties and marking one as primary
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Spinner,
  Checkbox,
  Badge,
  SearchIcon,
} from '@/components/ui';
import { propertyService, usersService } from '@/services';
import type { PropertyWithCompany } from '@/types/property.types';

interface AssignPropertyModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignPropertyModal: React.FC<AssignPropertyModalProps> = ({
  userId,
  userName,
  onClose,
  onSuccess,
}) => {
  // State
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [primaryId, setPrimaryId] = useState<string | null>(null);

  // Fetch properties
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await propertyService.getMyProperties({
        limit: 100, // Get all properties for selection
        is_active: true, // Only show active properties
      });
      setProperties(result.properties);
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  // Filter properties by search
  const filteredProperties = properties.filter((property) => {
    const search = searchTerm.toLowerCase();
    return (
      property.name.toLowerCase().includes(search) ||
      property.address_city?.toLowerCase().includes(search) ||
      property.address_country?.toLowerCase().includes(search)
    );
  });

  // Toggle property selection
  const toggleProperty = (propertyId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
      // If removing the primary, clear primary selection
      if (primaryId === propertyId) {
        setPrimaryId(null);
      }
    } else {
      newSelected.add(propertyId);
      // If this is the first selection, make it primary
      if (newSelected.size === 1) {
        setPrimaryId(propertyId);
      }
    }
    setSelectedIds(newSelected);
  };

  // Set as primary
  const handleSetPrimary = (propertyId: string) => {
    if (selectedIds.has(propertyId)) {
      setPrimaryId(propertyId);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one property');
      return;
    }

    try {
      setSaving(true);
      await usersService.assignProperties(userId, {
        propertyIds: Array.from(selectedIds),
        primaryPropertyId: primaryId || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error assigning properties:', err);
      alert(err.message || 'Failed to assign properties');
    } finally {
      setSaving(false);
    }
  };

  const formatAddress = (property: PropertyWithCompany) => {
    const parts = [
      property.address_city,
      property.address_state,
      property.address_country
    ].filter(Boolean);
    return parts.join(', ') || 'No address';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assign Properties
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Assign properties to {userName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={saving}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <Input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedIds.size > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {selectedIds.size} propert{selectedIds.size !== 1 ? 'ies' : 'y'} selected
            </p>
          )}
        </div>

        {/* Property List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-3">Loading properties...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No properties match your search.' : 'No active properties available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProperties.map((property) => {
                const isSelected = selectedIds.has(property.id);
                const isPrimary = primaryId === property.id;

                return (
                  <div
                    key={property.id}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleProperty(property.id)}
                        />
                      </div>

                      {/* Property thumbnail */}
                      <div className="flex-shrink-0">
                        {property.featured_image_url ? (
                          <img
                            src={property.featured_image_url}
                            alt={property.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-400 dark:text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Property details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {property.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {formatAddress(property)}
                            </p>
                          </div>
                          {isPrimary && (
                            <Badge variant="primary" size="sm">
                              Primary
                            </Badge>
                          )}
                        </div>

                        {/* Set as primary button */}
                        {isSelected && !isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(property.id)}
                            className="text-xs text-primary hover:underline mt-2"
                          >
                            Set as Primary
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select properties to assign. One can be marked as primary.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={selectedIds.size === 0 || saving}
              isLoading={saving}
            >
              Assign {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
