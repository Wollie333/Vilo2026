/**
 * UserPropertiesTab Component
 *
 * Displays all properties for a specific user (owned + assigned)
 * Super admin only - used in User Detail Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Spinner,
  PlusIcon,
  Badge,
} from '@/components/ui';
import { usersService } from '@/services';
import { AssignPropertyModal } from './AssignPropertyModal';

interface PropertyWithRelationship {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_country: string;
  featured_image: string | null;
  is_active: boolean;
  created_at: string;
  owner_id: string;
  relationship: 'owner' | 'assigned';
  is_primary: boolean;
  assigned_at?: string;
  room_count?: number;
}

interface UserPropertiesTabProps {
  userId: string;
  userName: string;
}

export const UserPropertiesTab: React.FC<UserPropertiesTabProps> = ({ userId, userName }) => {
  const navigate = useNavigate();

  // State
  const [properties, setProperties] = useState<PropertyWithRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unassigning, setUnassigning] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Fetch properties
  useEffect(() => {
    fetchProperties();
  }, [userId]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersService.getUserProperties(userId);
      setProperties(result);
    } catch (err: any) {
      console.error('Error fetching user properties:', err);
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (propertyId: string, propertyName: string) => {
    if (!confirm(`Are you sure you want to unassign "${propertyName}" from ${userName}?`)) {
      return;
    }

    try {
      setUnassigning(propertyId);
      await usersService.unassignProperty(userId, propertyId);
      // Refresh the list
      await fetchProperties();
    } catch (err: any) {
      console.error('Error unassigning property:', err);
      alert(err.message || 'Failed to unassign property');
    } finally {
      setUnassigning(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAddress = (property: PropertyWithRelationship) => {
    const parts = [
      property.address_city,
      property.address_state,
      property.address_country
    ].filter(Boolean);
    return parts.join(', ') || 'No address';
  };

  const ownedCount = properties.filter(p => p.relationship === 'owner').length;
  const assignedCount = properties.filter(p => p.relationship === 'assigned').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Properties for {userName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} total
            ({ownedCount} owned, {assignedCount} assigned)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Assign Property */}
          <Button
            variant="primary"
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon size="sm" />
            Assign Property
          </Button>
        </div>
      </div>

      {/* Properties Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rooms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Relationship
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Spinner size="md" className="mx-auto" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading properties...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No properties found for this user. Assign properties using the button above.
                    </p>
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr
                    key={property.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {property.featured_image ? (
                          <img
                            src={property.featured_image}
                            alt={property.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-gray-400 dark:text-gray-500"
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
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {property.name}
                          </div>
                          {property.is_primary && (
                            <Badge variant="primary" size="sm" className="mt-1">
                              Primary
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatAddress(property)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {property.room_count || 0} room{property.room_count !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={property.relationship === 'owner' ? 'primary' : 'secondary'}
                        size="sm"
                      >
                        {property.relationship === 'owner' ? 'Owner' : 'Assigned'}
                      </Badge>
                      {property.assigned_at && property.relationship === 'assigned' && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Since {formatDate(property.assigned_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={property.is_active ? 'success' : 'warning'}
                        size="sm"
                      >
                        {property.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          View
                        </Button>
                        {property.relationship === 'assigned' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnassign(property.id, property.name)}
                            disabled={unassigning === property.id}
                            isLoading={unassigning === property.id}
                          >
                            Unassign
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assign Property Modal */}
      {showAssignModal && (
        <AssignPropertyModal
          userId={userId}
          userName={userName}
          onClose={() => setShowAssignModal(false)}
          onSuccess={fetchProperties}
        />
      )}
    </div>
  );
};
