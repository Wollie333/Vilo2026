/**
 * AddonSelector Component
 *
 * Displays a list of add-ons with checkboxes for selection during room creation/editing.
 * Supports creating new add-ons and editing existing ones.
 */

import React, { useState, useMemo } from 'react';
import { Button, Input, Badge } from '@/components/ui';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil } from 'react-icons/hi';
import type { AddonSelectorProps } from './AddonSelector.types';
import { ADDON_TYPE_LABELS, ADDON_PRICING_TYPE_LABELS } from '@/types/addon.types';

export const AddonSelector: React.FC<AddonSelectorProps> = ({
  propertyId: _propertyId,
  selectedAddonIds,
  onSelectionChange,
  onCreateNew,
  onEdit,
  currency,
  addons,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter add-ons based on search query
  const filteredAddons = useMemo(() => {
    if (!searchQuery) return addons;

    const query = searchQuery.toLowerCase();
    return addons.filter(
      (addon) =>
        addon.name.toLowerCase().includes(query) ||
        addon.description?.toLowerCase().includes(query) ||
        addon.type.toLowerCase().includes(query)
    );
  }, [addons, searchQuery]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Handle checkbox toggle
  const handleToggle = (addonId: string) => {
    if (selectedAddonIds.includes(addonId)) {
      // Deselect
      onSelectionChange(selectedAddonIds.filter((id) => id !== addonId));
    } else {
      // Select
      onSelectionChange([...selectedAddonIds, addonId]);
    }
  };

  // Handle select all / deselect all
  const handleToggleAll = () => {
    if (selectedAddonIds.length === filteredAddons.length) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all
      onSelectionChange(filteredAddons.map((addon) => addon.id));
    }
  };

  const isAllSelected =
    filteredAddons.length > 0 && selectedAddonIds.length === filteredAddons.length;
  const isSomeSelected = selectedAddonIds.length > 0 && !isAllSelected;

  return (
    <div className="space-y-4">
      {/* Search and Create New Button */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search add-ons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            fullWidth
          />
        </div>
        <Button
          variant="outline"
          onClick={onCreateNew}
          className="flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Create New
        </Button>
      </div>

      {/* Select All Checkbox */}
      {filteredAddons.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-dark-sidebar rounded-lg border border-gray-200 dark:border-dark-border">
          <input
            type="checkbox"
            id="select-all"
            checked={isAllSelected}
            ref={(input) => {
              if (input) {
                input.indeterminate = isSomeSelected;
              }
            }}
            onChange={handleToggleAll}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {isAllSelected
              ? `All ${filteredAddons.length} add-ons selected`
              : isSomeSelected
              ? `${selectedAddonIds.length} of ${filteredAddons.length} add-ons selected`
              : `Select all ${filteredAddons.length} add-ons`}
          </label>
        </div>
      )}

      {/* Add-on List */}
      {filteredAddons.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          {searchQuery ? (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No add-ons found matching "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No add-ons available yet. Create your first add-on to get started.
              </p>
              <Button variant="primary" onClick={onCreateNew}>
                <HiOutlinePlus className="w-5 h-5 mr-2" />
                Create First Add-on
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAddons.map((addon) => {
            const isSelected = selectedAddonIds.includes(addon.id);

            return (
              <div
                key={addon.id}
                className={`
                  p-4 rounded-lg border transition-all
                  ${
                    isSelected
                      ? 'bg-primary/5 border-primary dark:bg-primary/10'
                      : 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border'
                  }
                  hover:shadow-md
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    id={`addon-${addon.id}`}
                    checked={isSelected}
                    onChange={() => handleToggle(addon.id)}
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                  />

                  {/* Add-on Details */}
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`addon-${addon.id}`}
                      className="cursor-pointer block"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {addon.name}
                          </h4>
                          {addon.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {addon.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(addon.price)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {ADDON_PRICING_TYPE_LABELS[addon.pricing_type]}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="info" size="sm">
                          {ADDON_TYPE_LABELS[addon.type]}
                        </Badge>
                        {addon.max_quantity > 1 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Max qty: {addon.max_quantity}
                          </span>
                        )}
                      </div>
                    </label>

                    {/* Edit Button (only for selected add-ons) */}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(addon);
                        }}
                        className="mt-3 flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                        Edit Add-on
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {selectedAddonIds.length > 0 && (
        <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/30">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">{selectedAddonIds.length}</span> add-on
            {selectedAddonIds.length !== 1 ? 's' : ''} will be available for guests
            to add to their booking.
          </p>
        </div>
      )}
    </div>
  );
};
