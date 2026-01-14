/**
 * EditAddonPage Component
 *
 * Page for editing an existing addon following the design system.
 * Uses the same AddonForm component as CreateAddonPage.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Spinner, Alert, Button } from '@/components/ui';
import { propertyService, addonService } from '@/services';
import type { PropertyWithCompany } from '@/types/property.types';
import type { AddOn, CreateAddOnData } from '@/types/addon.types';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { AddonForm } from './components/AddonForm';

export const EditAddonPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // State
  const [addon, setAddon] = useState<AddOn | null>(null);
  const [property, setProperty] = useState<PropertyWithCompany | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch addon and property data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('No addon ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch the addon
        const addonData = await addonService.getAddOn(id);
        setAddon(addonData);

        // Fetch the property for context
        const propertiesRes = await propertyService.getMyProperties();
        const addonProperty = propertiesRes.properties.find(
          (p) => p.id === addonData.property_id
        );
        setProperty(addonProperty);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load addon');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (data: CreateAddOnData) => {
    if (!id) return;

    try {
      setSubmitting(true);
      setError(null);

      await addonService.updateAddOn(id, data);

      // Navigate back to addons list with success message
      navigate('/addons', {
        state: { success: 'Add-on updated successfully!' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update add-on';
      setError(message);
      throw err; // Re-throw so form can handle it
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout title="Edit Add-on">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // Not found
  if (!addon) {
    return (
      <AuthenticatedLayout title="Edit Add-on">
        <Alert variant="error">
          {error || 'Add-on not found'}
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/addons')}>
            <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
            Back to Add-ons
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Edit Add-on"
      subtitle={`Editing: ${addon.name}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={handleCancel}>
          <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Addon Form */}
        <AddonForm
          mode="edit"
          addon={addon}
          property={property}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
        />
      </div>
    </AuthenticatedLayout>
  );
};
