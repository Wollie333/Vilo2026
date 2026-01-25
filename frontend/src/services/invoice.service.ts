import { api } from './api.service';
import type {
  Invoice,
  SubscriptionInvoice,
  BookingInvoice,
  InvoiceSettings,
  UpdateInvoiceSettingsData,
  InvoiceListParams,
  InvoiceListResponse,
} from '@/types/invoice.types';

class InvoiceService {
  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  /**
   * Get current user's invoices
   */
  async getMyInvoices(params?: InvoiceListParams): Promise<InvoiceListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append('status', params.status);
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/invoices/my-invoices${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<InvoiceListResponse>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch invoices');
    }
    return response.data;
  }

  /**
   * Get a single invoice
   */
  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get<{ invoice: Invoice }>(`/invoices/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch invoice');
    }
    return response.data.invoice;
  }

  /**
   * Download invoice PDF
   * Opens in new tab or triggers download
   */
  async downloadInvoice(id: string): Promise<void> {
    const response = await api.get<{ download_url: string }>(`/invoices/${id}/download`);
    if (!response.success || !response.data?.download_url) {
      throw new Error(response.error?.message || 'Failed to get download URL');
    }

    // Open the signed URL in a new tab to trigger download
    window.open(response.data.download_url, '_blank');
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  /**
   * Get invoice settings (admin only)
   */
  async getSettings(): Promise<InvoiceSettings> {
    const response = await api.get<{ settings: InvoiceSettings }>('/invoices/admin/settings');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch invoice settings');
    }
    return response.data.settings;
  }

  /**
   * Update invoice settings (admin only)
   */
  async updateSettings(data: UpdateInvoiceSettingsData): Promise<InvoiceSettings> {
    const response = await api.patch<{ settings: InvoiceSettings }>('/invoices/admin/settings', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update invoice settings');
    }
    return response.data.settings;
  }

  /**
   * List all invoices (admin only)
   */
  async listAllInvoices(params?: InvoiceListParams): Promise<InvoiceListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/invoices/admin/list${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<InvoiceListResponse>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch invoices');
    }
    return response.data;
  }

  /**
   * Void an invoice (admin only)
   */
  async voidInvoice(id: string): Promise<Invoice> {
    const response = await api.post<{ invoice: Invoice }>(`/invoices/admin/${id}/void`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to void invoice');
    }
    return response.data.invoice;
  }

  /**
   * Regenerate PDF for an invoice (admin only)
   */
  async regeneratePDF(id: string): Promise<void> {
    const response = await api.post(`/invoices/admin/${id}/regenerate-pdf`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to regenerate PDF');
    }
  }

  /**
   * Upload invoice logo (admin only)
   */
  async uploadLogo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.upload<{ logo_url: string }>('/api/invoices/admin/logo', formData);
    if (!response.success || !response.data?.logo_url) {
      throw new Error(response.error?.message || 'Failed to upload logo');
    }
    return response.data.logo_url;
  }

  /**
   * Delete invoice logo (admin only)
   */
  async deleteLogo(): Promise<void> {
    const response = await api.delete('/invoices/admin/logo');
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete logo');
    }
  }

  // ============================================================================
  // TYPE-SPECIFIC ENDPOINTS
  // ============================================================================

  /**
   * Get subscription invoices for current user (SaaS billing)
   * Returns invoices where the user is the payer (subscription owner)
   */
  async getSubscriptionInvoices(): Promise<SubscriptionInvoice[]> {
    const response = await api.get<SubscriptionInvoice[]>('/invoices/subscription');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch subscription invoices');
    }
    return response.data;
  }

  /**
   * Get booking invoices issued by current user (property owner perspective)
   * Returns invoices where the user is the issuer (property owner)
   */
  async getIssuedBookingInvoices(): Promise<BookingInvoice[]> {
    const response = await api.get<BookingInvoice[]>('/invoices/booking/issued');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch issued booking invoices');
    }
    return response.data;
  }

  /**
   * Get booking invoices received by current user (guest perspective)
   * Returns invoices for bookings where the user is the guest
   */
  async getReceivedBookingInvoices(): Promise<BookingInvoice[]> {
    const response = await api.get<BookingInvoice[]>('/invoices/booking/received');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch received booking invoices');
    }
    return response.data;
  }
}

export const invoiceService = new InvoiceService();
