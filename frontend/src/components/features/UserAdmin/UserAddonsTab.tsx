/**
 * UserAddonsTab Component
 *
 * Displays all addons from a user's properties (owned + assigned)
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

interface Addon {
  id: string;
  property_id: string;
  property_name: string;
  name: string;
  description: string | null;
  type: 'service' | 'product' | 'experience';
  pricing_type: 'per_booking' | 'per_night' | 'per_guest' | 'per_guest_per_night';
  price: number;
  currency: string;
  max_quantity: number | null;
  is_active: boolean;
  created_at: string;
}

interface UserAddonsTabProps {
  userId: string;
  userName: string;
}

const ADDON_TYPE_LABELS: Record<string, string> = {
  service: 'Service',
  product: 'Product',
  experience: 'Experience',
};

const PRICING_TYPE_LABELS: Record<string, string> = {
  per_booking: 'Per Booking',
  per_night: 'Per Night',
  per_guest: 'Per Guest',
  per_guest_per_night: 'Per Guest Per Night',
};

export const UserAddonsTab: React.FC<UserAddonsTabProps> = ({ userId, userName }) => {
  const navigate = useNavigate();

  // State
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  // Fetch addons
  useEffect(() => {
    fetchAddons();
  }, [userId]);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersService.getUserAddons(userId);
      setAddons(result);
    } catch (err: any) {
      console.error('Error fetching user addons:', err);
      setError(err.message || 'Failed to load addons');
    } finally {
      setLoading(false);
    }
  };

  // Get unique properties for filter
  const properties = useMemo(() => {
    const uniqueProperties = new Map<string, string>();
    addons.forEach((addon) => {
      if (!uniqueProperties.has(addon.property_id)) {
        uniqueProperties.set(addon.property_id, addon.property_name);
      }
    });
    return Array.from(uniqueProperties, ([id, name]) => ({ id, name }));
  }, [addons]);

  // Filter addons based on search and property filter
  const filteredAddons = useMemo(() => {
    let filtered = addons;

    // Filter by property
    if (selectedProperty !== 'all') {
      filtered = filtered.filter((addon) => addon.property_id === selectedProperty);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (addon) =>
          addon.name.toLowerCase().includes(search) ||
          addon.property_name.toLowerCase().includes(search) ||
          addon.description?.toLowerCase().includes(search) ||
          addon.type?.toLowerCase().includes(search) ||
          addon.pricing_type?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [addons, selectedProperty, searchTerm]);

  const handleViewAddon = (addonId: string, propertyId: string) => {
    navigate(`/properties/${propertyId}/addons/${addonId}`);
  };

  const totalAddons = addons.length;
  const activeAddons = addons.filter((a) => a.is_active).length;
  const inactiveAddons = totalAddons - activeAddons;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add-ons for {userName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalAddons} addon{totalAddons !== 1 ? 's' : ''} across {properties.length} propert
            {properties.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Add-ons</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalAddons}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Add-ons</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {activeAddons}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Inactive Add-ons</div>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
              {inactiveAddons}
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
            placeholder="Search addons..."
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
              { value: 'all', label: `All Properties (${totalAddons})` },
              ...properties.map((property) => {
                const count = addons.filter((a) => a.property_id === property.id).length;
                return {
                  value: property.id,
                  label: `${property.name} (${count})`,
                };
              }),
            ]}
          />
        </div>
      </div>

      {/* Addons Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Add-on
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Max Quantity
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading addons...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </td>
                </tr>
              ) : filteredAddons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searchTerm || selectedProperty !== 'all'
                        ? 'No addons match your filters.'
                        : 'No addons found for this user. Add properties and addons to see them here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAddons.map((addon) => (
                  <tr
                    key={addon.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {addon.name}
                      </div>
                      {addon.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                          {addon.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {addon.property_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" size="sm">
                        {ADDON_TYPE_LABELS[addon.type] || addon.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {PRICING_TYPE_LABELS[addon.pricing_type] || addon.pricing_type?.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(addon.price, addon.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {addon.max_quantity || 'Unlimited'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={addon.is_active ? 'success' : 'secondary'} size="sm">
                        {addon.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAddon(addon.id, addon.property_id)}
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
