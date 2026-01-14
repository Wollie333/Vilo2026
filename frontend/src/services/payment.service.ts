import { api } from './api.service';
import type {
  PaymentProvider,
  PaymentIntegrationsListResponse,
  PaymentIntegrationResponse,
  UpdatePaymentIntegrationDTO,
  TestConnectionResponse,
} from '@/types/payment.types';

class PaymentService {
  private basePath = '/payment-integrations';

  /**
   * List all payment integrations
   */
  async listIntegrations(): Promise<PaymentIntegrationsListResponse> {
    const response = await api.get<PaymentIntegrationsListResponse>(this.basePath);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch integrations');
    }
    return response.data;
  }

  /**
   * Get a single payment integration by provider
   */
  async getIntegration(provider: PaymentProvider): Promise<PaymentIntegrationResponse> {
    const response = await api.get<PaymentIntegrationResponse>(`${this.basePath}/${provider}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch integration');
    }
    return response.data;
  }

  /**
   * Update a payment integration
   */
  async updateIntegration(
    provider: PaymentProvider,
    data: UpdatePaymentIntegrationDTO
  ): Promise<PaymentIntegrationResponse> {
    const response = await api.patch<PaymentIntegrationResponse>(`${this.basePath}/${provider}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update integration');
    }
    return response.data;
  }

  /**
   * Test connection to a payment provider
   */
  async testConnection(provider: PaymentProvider): Promise<TestConnectionResponse> {
    const response = await api.post<TestConnectionResponse>(`${this.basePath}/${provider}/test`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to test connection');
    }
    return response.data;
  }
}

export const paymentService = new PaymentService();
