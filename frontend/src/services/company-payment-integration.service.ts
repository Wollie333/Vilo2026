import { api } from './api.service';
import type {
  PaymentProvider,
  CompanyPaymentIntegrationsListResponse,
  CompanyPaymentIntegration,
  UpdateCompanyPaymentIntegrationDTO,
  TestConnectionResult,
} from '@/types/company-payment-integration.types';

class CompanyPaymentIntegrationService {
  private basePath = '/company-payment-integrations';

  /**
   * List all payment integrations for a company
   */
  async listCompanyIntegrations(companyId: string): Promise<CompanyPaymentIntegrationsListResponse> {
    const response = await api.get<CompanyPaymentIntegrationsListResponse>(`${this.basePath}/${companyId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch integrations');
    }
    return response.data;
  }

  /**
   * Get a single payment integration for a company by provider
   */
  async getCompanyIntegration(companyId: string, provider: PaymentProvider): Promise<CompanyPaymentIntegration> {
    const response = await api.get<{ integration: CompanyPaymentIntegration }>(
      `${this.basePath}/${companyId}/${provider}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch integration');
    }
    return response.data.integration;
  }

  /**
   * Create or update a payment integration for a company
   */
  async upsertCompanyIntegration(
    companyId: string,
    provider: PaymentProvider,
    data: UpdateCompanyPaymentIntegrationDTO
  ): Promise<CompanyPaymentIntegration> {
    const response = await api.put<{ integration: CompanyPaymentIntegration }>(
      `${this.basePath}/${companyId}/${provider}`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to save integration');
    }
    return response.data.integration;
  }

  /**
   * Toggle payment integration enabled/disabled
   */
  async toggleCompanyIntegration(
    companyId: string,
    provider: PaymentProvider,
    enabled: boolean
  ): Promise<CompanyPaymentIntegration> {
    const response = await api.patch<{ integration: CompanyPaymentIntegration }>(
      `${this.basePath}/${companyId}/${provider}/toggle`,
      { enabled }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to toggle integration');
    }
    return response.data.integration;
  }

  /**
   * Set payment integration as primary
   */
  async setPrimaryCompanyIntegration(
    companyId: string,
    provider: PaymentProvider
  ): Promise<CompanyPaymentIntegration> {
    const response = await api.post<{ integration: CompanyPaymentIntegration }>(
      `${this.basePath}/${companyId}/${provider}/set-primary`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to set primary integration');
    }
    return response.data.integration;
  }

  /**
   * Test connection to a payment provider
   */
  async testCompanyConnection(companyId: string, provider: PaymentProvider): Promise<TestConnectionResult> {
    const response = await api.post<{ result: TestConnectionResult }>(
      `${this.basePath}/${companyId}/${provider}/test`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to test connection');
    }
    return response.data.result;
  }

  /**
   * Delete a company payment integration
   */
  async deleteCompanyIntegration(companyId: string, provider: PaymentProvider): Promise<void> {
    const response = await api.delete(`${this.basePath}/${companyId}/${provider}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete integration');
    }
  }
}

export const companyPaymentIntegrationService = new CompanyPaymentIntegrationService();
