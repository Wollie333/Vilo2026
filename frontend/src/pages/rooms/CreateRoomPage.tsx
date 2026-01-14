/**
 * CreateRoomPage Component
 *
 * Page for creating a new room using the RoomWizard.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { RoomWizard } from '@/components/features/Room';
import { Spinner, Alert, Button } from '@/components/ui';
import { roomService, propertyService } from '@/services';
import type { PropertyWithCompany } from '@/types/property.types';
import type { RoomLimitInfo, CreateRoomRequest, UpdateRoomRequest } from '@/types/room.types';
import { HiOutlineArrowLeft } from 'react-icons/hi';

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property_id');

  // State
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithCompany | undefined>();
  const [limitInfo, setLimitInfo] = useState<RoomLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch properties and limit info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [propertiesRes, limitRes] = await Promise.all([
          propertyService.getMyProperties(),
          roomService.getRoomLimit(),
        ]);

        setProperties(propertiesRes.properties);
        setLimitInfo(limitRes);

        // Auto-select if only one property exists (skip selector entirely)
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
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId]);

  // Handle form submission
  const handleSubmit = async (data: CreateRoomRequest | UpdateRoomRequest) => {
    try {
      setSubmitting(true);
      setError(null);

      // Check if room was already created during wizard step progression
      const existingRoomId = (data as any).existingRoomId;

      let roomId: string;
      if (existingRoomId) {
        // Room already exists, just use the existing ID
        roomId = existingRoomId;
      } else {
        // Create new room
        const room = await roomService.createRoom(data as CreateRoomRequest);
        roomId = room.id;
      }

      // Navigate to the room's detail page
      navigate(`/manage/rooms/${roomId}`, {
        state: { success: 'Room created successfully!' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room';
      setError(message);
      throw err; // Re-throw so wizard can handle it
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
      <AuthenticatedLayout title="Create Room">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // No properties
  if (properties.length === 0) {
    return (
      <AuthenticatedLayout title="Create Room">
        <Alert variant="warning">
          You need to create a property before you can add rooms.{' '}
          <button
            onClick={() => navigate('/manage/properties/new')}
            className="font-medium underline"
          >
            Create a property
          </button>
        </Alert>
      </AuthenticatedLayout>
    );
  }

  // Limit reached
  if (limitInfo && !limitInfo.can_create) {
    return (
      <AuthenticatedLayout title="Create Room">
        <Alert variant="warning">
          You have reached your room limit ({limitInfo.max_allowed}). Upgrade your plan to create more rooms.
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/manage/rooms')}>
            <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
            Back to Rooms
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title="Create Room"
      subtitle="Add a new room to your property"
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleCancel}
        >
          <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Room Wizard */}
        <RoomWizard
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
