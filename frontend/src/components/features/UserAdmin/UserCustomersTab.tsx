/**
 * UserCustomersTab Component
 *
 * Displays customers for a specific user (unique guests who booked at their properties)
 * Super admin only - used in User Detail Page
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Spinner,
  Badge,
  Input,
  SearchIcon,
  DownloadIcon,
  MailIcon,
  PhoneIcon,
} from '@/components/ui';
import { usersService } from '@/services';
import { formatCurrency } from '@/utils/currency';

interface Customer {
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  first_booking_date: string;
  last_booking_date: string;
  total_bookings: number;
  total_spent: number;
  currency: string;
  properties: string[];
  customer_id?: string | null;
}

interface UserCustomersTabProps {
  userId: string;
  userName: string;
}

export const UserCustomersTab: React.FC<UserCustomersTabProps> = ({ userId, userName }) => {
  const navigate = useNavigate();

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, [userId]);

  // Filter customers based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const search = searchTerm.toLowerCase();
    const filtered = customers.filter((customer) => {
      return (
        customer.guest_name?.toLowerCase().includes(search) ||
        customer.guest_email?.toLowerCase().includes(search) ||
        customer.guest_phone?.toLowerCase().includes(search)
      );
    });
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersService.getCustomersByUser(userId);
      setCustomers(result);
      setFilteredCustomers(result);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // CSV Export Function
  const handleExportCSV = useCallback(() => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Properties',
      'Total Bookings',
      'Total Spent',
      'First Booking',
      'Last Booking',
    ];

    const rows = filteredCustomers.map((customer) => [
      customer.guest_name,
      customer.guest_email || '',
      customer.guest_phone || '',
      customer.properties.join('; '),
      customer.total_bookings.toString(),
      `${customer.currency} ${customer.total_spent.toFixed(2)}`,
      formatDate(customer.first_booking_date),
      formatDate(customer.last_booking_date),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = `customers_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }, [filteredCustomers, userName]);

  const handleExportCSVWithLoading = () => {
    setIsExporting(true);
    try {
      handleExportCSV();
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  // Calculate statistics
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const totalBookings = customers.reduce((sum, c) => sum + c.total_bookings, 0);
  const averageValue = customers.length > 0 ? totalRevenue / customers.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Customers for {userName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {customers.length} unique customer{customers.length !== 1 ? 's' : ''} • {totalBookings} total booking{totalBookings !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Download CSV Button */}
        <Button
          variant="outline"
          size="md"
          leftIcon={<DownloadIcon size="sm" />}
          onClick={handleExportCSVWithLoading}
          disabled={filteredCustomers.length === 0 || isExporting}
          isLoading={isExporting}
        >
          Download CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(totalRevenue, customers[0]?.currency || 'ZAR')}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalBookings}
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Customer Value</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(averageValue, customers[0]?.currency || 'ZAR')}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <Input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Properties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  First/Last Booking
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Spinner size="md" className="mx-auto" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading customers...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searchTerm
                        ? 'No customers match your search.'
                        : 'No customers found. Customers who have booked at this user\'s properties will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr
                    key={index}
                    onClick={() => customer.customer_id && navigate(`/manage/customers/${customer.customer_id}`)}
                    className={`transition-colors ${
                      customer.customer_id
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer.guest_name}
                      </div>
                      {customer.total_bookings > 5 && (
                        <Badge variant="primary" size="sm" className="mt-1">
                          VIP Customer
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {customer.guest_email && (
                          <a
                            href={`mailto:${customer.guest_email}`}
                            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                            title={customer.guest_email}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MailIcon size="sm" />
                          </a>
                        )}
                        {customer.guest_phone && (
                          <a
                            href={`tel:${customer.guest_phone}`}
                            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                            title={customer.guest_phone}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PhoneIcon size="sm" />
                          </a>
                        )}
                        {!customer.guest_email && !customer.guest_phone && (
                          <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.properties.length} propert{customer.properties.length !== 1 ? 'ies' : 'y'}
                      </div>
                      {customer.properties.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {customer.properties.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" size="sm">
                        {customer.total_bookings} booking{customer.total_bookings !== 1 ? 's' : ''}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(customer.total_spent, customer.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(customer.first_booking_date)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        to {formatDate(customer.last_booking_date)}
                      </div>
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
