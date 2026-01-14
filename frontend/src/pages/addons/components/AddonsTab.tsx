/**
 * AddonsTab
 *
 * Manages add-ons for a property.
 * Includes filtering by type and search functionality.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, ConfirmDialog, Alert, FilterToggleButton } from '@/components/ui';
import { addonService } from '@/services';
import { AddonCard } from './AddonCard';
import type { AddOn } from '@/types/addon.types';

interface AddonsTabProps {
  propertyId: string;
}

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const GiftIcon = () => (
  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

// Type filter options
const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'service', label: 'Services' },
  { value: 'product', label: 'Products' },
  { value: 'experience', label: 'Experiences' },
];

// Status filter options
const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const AddonsTab: React.FC<AddonsTabProps> = ({ propertyId }) => {
  const navigate = useNavigate();

  // Data state
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Delete confirmation state
  const [deletingAddon, setDeletingAddon] = useState<AddOn | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter toggle state
  const [showFilters, setShowFilters] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (typeFilter) count++;
    if (statusFilter) count++;
    return count;
  }, [searchQuery, typeFilter, statusFilter]);

  // Load addons
  const loadAddons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await addonService.getAddOns({
        property_id: propertyId,
        sortBy: 'sort_order',
        sortOrder: 'asc',
        limit: 100,
      });
      setAddons(response.addons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load add-ons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      loadAddons();
    }
  }, [propertyId]);

  // Filter addons
  const filteredAddons = useMemo(() => {
    let filtered = addons;

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter((addon) => addon.type === typeFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((addon) => addon.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((addon) => !addon.is_active);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (addon) =>
          addon.name.toLowerCase().includes(query) ||
          addon.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [addons, typeFilter, statusFilter, searchQuery]);

  // Handlers
  const handleCreate = () => {
    // Navigate to the new addon page with property context
    navigate(`/addons/new?property_id=${propertyId}`);
  };

  const handleEdit = (addon: AddOn) => {
    // Navigate to the edit addon page
    navigate(`/addons/${addon.id}/edit`);
  };

  const handleDelete = (addon: AddOn) => {
    setDeletingAddon(addon);
  };

  const confirmDelete = async () => {
    if (!deletingAddon) return;

    setIsDeleting(true);
    setError(null);
    try {
      await addonService.deleteAddOn(deletingAddon.id);
      setSuccess('Add-on deleted successfully');
      await loadAddons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete add-on');
    } finally {
      setIsDeleting(false);
      setDeletingAddon(null);
    }
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Count by type
  const typeCounts = useMemo(() => {
    return {
      total: addons.length,
      service: addons.filter((a) => a.type === 'service').length,
      product: addons.filter((a) => a.type === 'product').length,
      experience: addons.filter((a) => a.type === 'experience').length,
    };
  }, [addons]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add-ons
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Optional extras that guests can purchase with their booking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {addons.length > 0 && (
            <FilterToggleButton
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
              activeFilterCount={activeFilterCount}
            />
          )}
          <Button variant="primary" onClick={handleCreate} leftIcon={<PlusIcon />}>
            Add Add-on
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      {addons.length > 0 && showFilters && (
        <Card variant="bordered">
          <Card.Body className="py-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search add-ons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Type filter */}
              <div className="w-full sm:w-40">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {TYPE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="w-full sm:w-36">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type counts */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400">
                Total: {typeCounts.total}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary-700 dark:text-primary-400">
                Services: {typeCounts.service}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                Products: {typeCounts.product}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Experiences: {typeCounts.experience}
              </span>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Add-ons Grid */}
      {addons.length === 0 ? (
        <Card variant="bordered">
          <Card.Body className="py-16">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <GiftIcon />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Add-ons Yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Create add-ons to offer optional extras like airport transfers, breakfast packages,
                or special experiences to your guests.
              </p>
              <Button variant="primary" onClick={handleCreate} leftIcon={<PlusIcon />}>
                Create Your First Add-on
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : filteredAddons.length === 0 ? (
        <Card variant="bordered">
          <Card.Body className="py-12">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No add-ons match your filters
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('');
                  setStatusFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAddons.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Info */}
      {addons.length > 0 && (
        <Alert variant="info">
          <p className="text-sm">
            <strong>How it works:</strong> Add-ons created here will be available for guests to
            select during the booking checkout process. You can assign add-ons to specific rooms
            or make them available for all rooms.
          </p>
        </Alert>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingAddon}
        onClose={() => setDeletingAddon(null)}
        onConfirm={confirmDelete}
        title="Delete Add-on"
        message={`Are you sure you want to delete "${deletingAddon?.name}"? This add-on will no longer be available for booking.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
