/**
 * CreateAddonPage Component
 *
 * Page for creating a new addon following the design system.
 * Similar pattern to CreateRoomPage but simplified for addons.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Spinner, Alert, Button } from '@/components/ui';
import { propertyService, addonService } from '@/services';
import type { PropertyWithCompany } from '@/types/property.types';
import type { CreateAddOnData } from '@/types/addon.types';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { AddonForm } from './components/AddonForm';

export const CreateAddonPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property_id');

  // State
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithCompany | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch properties
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const propertiesRes = await propertyService.getMyProperties();
        setProperties(propertiesRes.properties);

        // Auto-select if only one property exists
        if (propertiesRes.properties.length === 1) {
          setSelectedProperty(propertiesRes.properties[0]);
        }
        // OR if property_id is provided in URL, find and select that property
        else if (propertyId) {
          const property = propertiesRes.properties.find((p) => p.id === propertyId);
          if (property) {
            setSelectedProperty(property);
          }
        }
      } catch (err) {
        setError('Failed to load properties');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId]);

  // Handle form submission
  const handleSubmit = async (data: CreateAddOnData) => {
    try {
      setSubmitting(true);
      setError(null);

      await addonService.createAddOn(data);

      // Navigate back to addons list with success message
      navigate('/addons', {
        state: { success: 'Add-on created successfully!' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create add-on';
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
      <AuthenticatedLayout title="Create Add-on">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // No properties
  if (properties.length === 0) {
    return (
      <AuthenticatedLayout title="Create Add-on">
        <Alert variant="warning">
          You need to create a property before you can add add-ons.{' '}
          <button
            onClick={() => navigate('/properties/new')}
            className="font-medium underline"
          >
            Create a property
          </button>
        </Alert>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Create Add-on"
      subtitle="Add a new optional extra for your guests"
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
          mode="create"
          property={selectedProperty}
          properties={properties}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
        />
      </div>
    </AuthenticatedLayout>
  );
};
