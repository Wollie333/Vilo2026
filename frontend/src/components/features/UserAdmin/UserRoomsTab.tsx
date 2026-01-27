/**
 * UserRoomsTab Component
 *
 * Displays all rooms from a user's properties (owned + assigned)
 * Super admin only - used in User Detail Page
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Spinner,
  Badge,
  Input,
  SearchIcon,
  Select,
} from '@/components/ui';
import { usersService } from '@/services';
import { formatCurrency } from '@/utils/currency';

interface Room {
  id: string;
  property_id: string;
  property_name: string;
  name: string;
  room_code: string;
  pricing_mode: 'per_unit' | 'per_person' | 'per_person_sharing';
  inventory_mode: 'single_unit' | 'room_type';
  base_price_per_night: number;
  additional_person_rate: number;
  currency: string;
  max_occupancy: number;
  num_beds: number;
  bed_types: string[] | null;
  is_active: boolean;
  created_at: string;
}

interface UserRoomsTabProps {
  userId: string;
  userName: string;
}

export const UserRoomsTab: React.FC<UserRoomsTabProps> = ({ userId, userName }) => {
  const navigate = useNavigate();

  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  // Fetch rooms
  useEffect(() => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }
    fetchRooms();
  }, [userId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersService.getUserRooms(userId);
      setRooms(result || []);
    } catch (err: any) {
      console.error('Error fetching user rooms:', err);
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  // Get unique properties for filter
  const properties = useMemo(() => {
    try {
      const uniqueProperties = new Map<string, string>();
      rooms.forEach((room) => {
        if (!uniqueProperties.has(room.property_id)) {
          uniqueProperties.set(room.property_id, room.property_name);
        }
      });
      return Array.from(uniqueProperties, ([id, name]) => ({ id, name }));
    } catch (err) {
      console.error('Error processing properties:', err);
      return [];
    }
  }, [rooms]);

  // Filter rooms based on search and property filter
  const filteredRooms = useMemo(() => {
    let filtered = rooms;

    // Filter by property
    if (selectedProperty !== 'all') {
      filtered = filtered.filter((room) => room.property_id === selectedProperty);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(search) ||
          room.property_name.toLowerCase().includes(search) ||
          room.room_code?.toLowerCase().includes(search) ||
          room.pricing_mode?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [rooms, selectedProperty, searchTerm]);

  // Group rooms by property for display
  const roomsByProperty = useMemo(() => {
    const grouped = new Map<string, Room[]>();
    filteredRooms.forEach((room) => {
      const existing = grouped.get(room.property_id) || [];
      grouped.set(room.property_id, [...existing, room]);
    });
    return grouped;
  }, [filteredRooms]);

  const formatBedTypes = (bedTypes: string[] | null) => {
    if (!bedTypes || bedTypes.length === 0) return 'N/A';
    return bedTypes.join(', ');
  };

  const handleViewRoom = (roomId: string, propertyId: string) => {
    navigate(`/properties/${propertyId}/rooms/${roomId}`);
  };

  const totalRooms = rooms.length;
  const activeRooms = rooms.filter((r) => r.is_active).length;
  const inactiveRooms = totalRooms - activeRooms;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Rooms for {userName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalRooms} room{totalRooms !== 1 ? 's' : ''} across {properties.length} propert
            {properties.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Rooms</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalRooms}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Rooms</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {activeRooms}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Inactive Rooms</div>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
              {inactiveRooms}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <Input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Property Filter */}
        <div className="sm:w-64">
          <Select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            options={[
              { value: 'all', label: `All Properties (${totalRooms})` },
              ...properties.map((property) => {
                const count = rooms.filter((r) => r.property_id === property.id).length;
                return {
                  value: property.id,
                  label: `${property.name} (${count})`,
                };
              }),
            ]}
          />
        </div>
      </div>

      {/* Rooms Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Room Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Beds
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price/Night
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Spinner size="md" className="mx-auto" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading rooms...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searchTerm || selectedProperty !== 'all'
                        ? 'No rooms match your filters.'
                        : 'No rooms found for this user. Add properties and rooms to see them here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {room.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {room.property_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {room.room_code || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white capitalize">
                        {room.pricing_mode?.replace(/_/g, ' ') || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {room.max_occupancy} {room.max_occupancy === 1 ? 'guest' : 'guests'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {room.num_beds} {room.num_beds === 1 ? 'bed' : 'beds'}
                      </div>
                      {room.bed_types && room.bed_types.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatBedTypes(room.bed_types)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(room.base_price_per_night, room.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={room.is_active ? 'success' : 'secondary'} size="sm">
                        {room.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRoom(room.id, room.property_id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
