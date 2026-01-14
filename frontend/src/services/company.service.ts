import { api } from './api.service';
import type {
  CompanyWithPropertyCount,
  CreateCompanyData,
  UpdateCompanyData,
  CompanyListParams,
  CompanyListResponse,
  CompanyLimitInfo,
} from '@/types/company.types';
import type {
  CompanyInvoiceSettingsResponse,
  InvoiceSettings,
  UpdateInvoiceSettingsData,
} from '@/types/invoice.types';

class CompanyService {
  // ============================================================================
  // COMPANY CRUD
  // ============================================================================

  /**
   * List all companies for the current user
   */
  async getMyCompanies(params?: CompanyListParams): Promise<CompanyListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const url = `/companies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<CompanyListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch companies');
    }

    return response.data;
  }

  /**
   * Get a single company by ID
   */
  async getCompany(id: string): Promise<CompanyWithPropertyCount> {
    const response = await api.get<CompanyWithPropertyCount>(`/companies/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch company');
    }

    return response.data;
  }

  /**
   * Create a new company
   */
  async createCompany(data: CreateCompanyData): Promise<CompanyWithPropertyCount> {
    const response = await api.post<CompanyWithPropertyCount>('/companies', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create company');
    }

    return response.data;
  }

  /**
   * Update a company
   */
  async updateCompany(id: string, data: UpdateCompanyData): Promise<CompanyWithPropertyCount> {
    const response = await api.patch<CompanyWithPropertyCount>(`/companies/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update company');
    }

    return response.data;
  }

  /**
   * Delete a company
   */
  async deleteCompany(id: string): Promise<void> {
    const response = await api.delete(`/companies/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete company');
    }
  }

  // ============================================================================
  // COMPANY LIMIT
  // ============================================================================

  /**
   * Get company limit info for the current user
   */
  async getCompanyLimit(): Promise<CompanyLimitInfo> {
    const response = await api.get<CompanyLimitInfo>('/companies/limit');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch company limit');
    }

    return response.data;
  }

  // ============================================================================
  // COMPANY LOGO
  // ============================================================================

  /**
   * Upload a company logo
   */
  async uploadLogo(companyId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.upload<{ logoUrl: string }>(`/companies/${companyId}/logo`, formData);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload logo');
    }

    return response.data.logoUrl;
  }

  // ============================================================================
  // COMPANY PROPERTIES
  // ============================================================================

  /**
   * Get all properties for a company
   */
  async getCompanyProperties(companyId: string): Promise<any[]> {
    const response = await api.get<any[]>(`/companies/${companyId}/properties`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch company properties');
    }

    return response.data;
  }

  /**
   * Link a property to a company
   */
  async linkPropertyToCompany(companyId: string, propertyId: string): Promise<void> {
    const response = await api.post(`/companies/${companyId}/properties/${propertyId}`, {});

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to link property to company');
    }
  }

  /**
   * Unlink a property from a company
   */
  async unlinkPropertyFromCompany(companyId: string, propertyId: string): Promise<void> {
    const response = await api.delete(`/companies/${companyId}/properties/${propertyId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to unlink property from company');
    }
  }

  // ============================================================================
  // COMPANY INVOICE SETTINGS
  // ============================================================================

  /**
   * Get invoice settings for a company
   * Returns company-specific settings or indicates if using global fallback
   */
  async getCompanyInvoiceSettings(companyId: string): Promise<CompanyInvoiceSettingsResponse> {
    const response = await api.get<CompanyInvoiceSettingsResponse>(
      `/companies/${companyId}/invoice-settings`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch invoice settings');
    }

    return response.data;
  }

  /**
   * Create or update company invoice settings
   */
  async updateCompanyInvoiceSettings(
    companyId: string,
    data: UpdateInvoiceSettingsData
  ): Promise<InvoiceSettings> {
    const response = await api.put<InvoiceSettings>(
      `/companies/${companyId}/invoice-settings`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update invoice settings');
    }

    return response.data;
  }

  /**
   * Upload company invoice logo
   */
  async uploadCompanyInvoiceLogo(companyId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.upload<{ logoUrl: string }>(
      `/companies/${companyId}/invoice-settings/logo`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload invoice logo');
    }

    return response.data.logoUrl;
  }

  /**
   * Delete company invoice logo
   */
  async deleteCompanyInvoiceLogo(companyId: string): Promise<void> {
    const response = await api.delete(`/companies/${companyId}/invoice-settings/logo`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete invoice logo');
    }
  }
}

export const companyService = new CompanyService();
