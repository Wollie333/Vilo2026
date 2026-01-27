import { api } from './api.service';
import type {
  Customer,
  CustomerWithCompany,
  CustomerListParams,
  CustomerListResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@/types/customer.types';
import type { Conversation } from '@/types/chat.types';

/**
 * Customer Service
 * API client for customer CRM endpoints
 */

class CustomerService {
  /**
   * List customers with filters and pagination
   */
  async listCustomers(params: CustomerListParams = {}): Promise<CustomerListResponse> {
    const queryParams = new URLSearchParams();

    if (params.company_id) queryParams.append('company_id', params.company_id);
    if (params.property_id) queryParams.append('property_id', params.property_id);
    if (params.status) queryParams.append('status', params.status);
    if (params.source) queryParams.append('source', params.source);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<CustomerListResponse>(
      `/customers?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch customers');
    }

    return response.data;
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<CustomerWithCompany> {
    const response = await api.get<{ customer: CustomerWithCompany }>(`/customers/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch customer');
    }

    return response.data.customer;
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    const response = await api.post<{ customer: Customer }>('/customers', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create customer');
    }

    return response.data.customer;
  }

  /**
   * Update a customer
   */
  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer> {
    const response = await api.patch<{ customer: Customer }>(`/customers/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update customer');
    }

    return response.data.customer;
  }

  /**
   * Delete a customer (soft delete - sets status to inactive)
   */
  async deleteCustomer(id: string): Promise<void> {
    const response = await api.delete(`/customers/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete customer');
    }
  }

  /**
   * Permanently delete a customer
   */
  async hardDeleteCustomer(id: string): Promise<void> {
    const response = await api.delete(`/customers/${id}/hard`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to permanently delete customer');
    }
  }

  /**
   * Get customer's booking history
   */
  async getCustomerBookings(
    customerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    bookings: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await api.get<{
      bookings: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/customers/${customerId}/bookings?page=${page}&limit=${limit}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch customer bookings');
    }

    return response.data;
  }

  /**
   * Manually sync booking statistics for a customer
   */
  async syncCustomerStats(customerId: string): Promise<Customer> {
    const response = await api.post<{ customer: Customer }>(
      `/customers/${customerId}/sync-stats`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to sync customer stats');
    }

    return response.data.customer;
  }

  /**
   * Get customer's conversations scoped to their property
   *
   * Returns conversations where:
   * - Customer is a participant (matched by user_id or email)
   * - Conversation belongs to the customer's property (property isolation)
   * - Matches the archived filter
   *
   * @param customerId - The customer ID
   * @param archived - Filter for archived conversations (default: false)
   * @returns Array of enriched conversations
   */
  async getCustomerConversations(
    customerId: string,
    archived: boolean = false
  ): Promise<Conversation[]> {
    console.log('[CustomerService] Fetching conversations for customer:', customerId);
    console.log('[CustomerService] Archived:', archived);

    const response = await api.get<{ conversations: Conversation[] }>(
      `/customers/${customerId}/conversations?archived=${archived}`
    );

    if (!response.success || !response.data) {
      console.error('[CustomerService] Failed to fetch conversations:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch customer conversations');
    }

    console.log('[CustomerService] Conversations fetched:', response.data.conversations.length);
    return response.data.conversations;
  }

  /**
   * Export customers to CSV
   */
  async exportCustomersToCSV(customers: CustomerWithCompany[]): Promise<void> {
    // CSV headers
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Status',
      'Source',
      'Total Bookings',
      'Total Spent',
      'First Booking',
      'Last Booking',
      'Company',
      'Property',
      'Created At',
    ];

    // CSV rows
    const rows = customers.map((customer) => [
      customer.full_name || '',
      customer.email,
      customer.phone || '',
      customer.status,
      customer.source,
      customer.total_bookings.toString(),
      `${customer.currency} ${customer.total_spent.toFixed(2)}`,
      customer.first_booking_date || '',
      customer.last_booking_date || '',
      customer.company.name,
      customer.property.name,
      new Date(customer.created_at).toLocaleDateString(),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const customerService = new CustomerService();
