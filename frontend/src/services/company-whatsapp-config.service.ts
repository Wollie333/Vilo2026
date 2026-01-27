/**
 * Company WhatsApp Configuration Service (Frontend)
 * API client for managing WhatsApp Business API credentials
 */

import { api } from './api.service';
import type {
  CompanyWhatsAppConfig,
  WhatsAppCredentialsInput,
  TestConnectionResult,
  GetCompanyWhatsAppConfigResponse,
  UpsertCompanyWhatsAppConfigResponse,
  TestConnectionResponse,
  ToggleConfigResponse,
  DeleteConfigResponse,
} from '../types/company-whatsapp-config.types';

class CompanyWhatsAppConfigService {
  private basePath = '/company-whatsapp-config';

  /**
   * Get WhatsApp configuration for a company
   * Returns null if no configuration exists
   */
  async getCompanyWhatsAppConfig(companyId: string): Promise<CompanyWhatsAppConfig | null> {
    try {
      const response = await api.get<GetCompanyWhatsAppConfigResponse>(
        `${this.basePath}/${companyId}`
      );
      return response.data?.config || null;
    } catch (error: any) {
      // Return null if not found (404)
      if (error.response?.status === 404 || error.code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create or update WhatsApp configuration
   * Credentials will be encrypted on the backend
   */
  async upsertCompanyWhatsAppConfig(
    companyId: string,
    credentials: WhatsAppCredentialsInput
  ): Promise<CompanyWhatsAppConfig> {
    const response = await api.put<UpsertCompanyWhatsAppConfigResponse>(
      `${this.basePath}/${companyId}`,
      credentials
    );
    return response.data.config;
  }

  /**
   * Test WhatsApp API connection
   * Verifies credentials with Meta API before saving
   */
  async testConnection(companyId: string): Promise<TestConnectionResult> {
    const response = await api.post<TestConnectionResponse>(
      `${this.basePath}/${companyId}/test`
    );
    return response.data.result;
  }

  /**
   * Toggle WhatsApp configuration active status
   * Enable or disable WhatsApp for this company
   */
  async toggleConfig(companyId: string, isActive: boolean): Promise<void> {
    await api.patch<ToggleConfigResponse>(
      `${this.basePath}/${companyId}/toggle`,
      { is_active: isActive }
    );
  }

  /**
   * Delete WhatsApp configuration
   * Removes all credentials from database
   */
  async deleteConfig(companyId: string): Promise<void> {
    await api.delete<DeleteConfigResponse>(`${this.basePath}/${companyId}`);
  }

  /**
   * Check if company has WhatsApp configured and active
   * Convenience method for quick checks
   */
  async hasWhatsAppConfigured(companyId: string): Promise<boolean> {
    try {
      const config = await this.getCompanyWhatsAppConfig(companyId);
      return config?.is_active && config?.verification_status === 'verified';
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const companyWhatsAppConfigService = new CompanyWhatsAppConfigService();
