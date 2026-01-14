/**
 * AddonsStep Component
 *
 * Step for managing add-ons (optional extras for bookings).
 * Users can select existing property add-ons or create new ones.
 */

import React, { useState, useEffect } from 'react';
import { Button, Spinner, Alert } from '@/components/ui';
import { AddonSelector } from '../AddonSelector';
import { AddonEditorModal } from '../AddonEditorModal';
import { addonService } from '@/services';
import type { AddonsStepProps } from './RoomWizard.types';
import type { AddOn } from '@/types/addon.types';

export const AddonsStep: React.FC<AddonsStepProps> = ({
  propertyId,
  currency,
  selectedAddonIds,
  onChange,
  onNext,
  isLoading,
}) => {
  const [propertyAddons, setPropertyAddons] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddOn | null>(null);

  // Fetch active add-ons for this property
  useEffect(() => {
    const fetchAddons = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await addonService.getAddOns({
          property_id: propertyId,
          is_active: true,
        });
        setPropertyAddons(result.addons || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load add-ons');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchAddons();
    }
  }, [propertyId]);

  const handleSelectionChange = (addonIds: string[]) => {
    onChange(addonIds);
  };

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (addon: AddOn) => {
    setEditingAddon(addon);
  };

  const handleSaveAddon = async (addon: AddOn) => {
    // Refresh the add-ons list
    try {
      const result = await addonService.getAddOns({
        property_id: propertyId,
        is_active: true,
      });
      setPropertyAddons(result.addons || []);

      // If it's a new add-on, auto-select it
      if (!selectedAddonIds.includes(addon.id)) {
        onChange([...selectedAddonIds, addon.id]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh add-ons list');
    }

    // Close modal
    setShowCreateModal(false);
    setEditingAddon(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Add-ons
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select optional extras that guests can add to their booking. Create new add-ons or choose from your property's library.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Add-on Selector */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : (
        <AddonSelector
          propertyId={propertyId}
          selectedAddonIds={selectedAddonIds}
          onSelectionChange={handleSelectionChange}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          currency={currency}
          addons={propertyAddons}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-dark-border">
        <Button variant="primary" onClick={onNext} disabled={isLoading || loading}>
          Continue
        </Button>
      </div>

      {/* Create/Edit Modal */}
      <AddonEditorModal
        isOpen={showCreateModal || !!editingAddon}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAddon(null);
        }}
        onSave={handleSaveAddon}
        propertyId={propertyId}
        currency={currency}
        mode={editingAddon ? 'edit' : 'create'}
        addon={editingAddon || undefined}
      />
    </div>
  );
};
