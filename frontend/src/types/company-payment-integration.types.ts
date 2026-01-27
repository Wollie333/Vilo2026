/**
 * Company Payment Integration Types
 * Types for per-company payment provider configurations
 */

// Re-export common types from main payment types
export type PaymentProvider = 'paystack' | 'paypal' | 'eft';
export type PaymentEnvironment = 'test' | 'live';
export type VerificationStatus = 'unverified' | 'verified' | 'failed';

// Company payment integration interface
export interface CompanyPaymentIntegration {
  id: string;
  company_id: string;
  provider: PaymentProvider;
  display_name: string;
  is_enabled: boolean;
  is_primary: boolean;
  environment: PaymentEnvironment;
  config: PaymentIntegrationConfig;
  webhook_secret: string | null;
  last_verified_at: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

// Config types per provider
export interface PaystackConfig {
  public_key?: string;
  secret_key?: string;
}

export interface PayPalConfig {
  client_id?: string;
  client_secret?: string;
}

export interface EFTConfig {
  bank_name?: string;
  account_number?: string;
  branch_code?: string;
  account_holder?: string;
  reference_prefix?: string;
  instructions?: string;
}

// Union type for all configs
export type PaymentIntegrationConfig = PaystackConfig | PayPalConfig | EFTConfig | Record<string, unknown>;

// Update DTO
export interface UpdateCompanyPaymentIntegrationDTO {
  display_name?: string;
  is_enabled?: boolean;
  is_primary?: boolean;
  environment?: PaymentEnvironment;
  config?: PaymentIntegrationConfig;
  webhook_secret?: string;
}

// Test connection result
export interface TestConnectionResult {
  success: boolean;
  message: string;
  verified_at?: string;
}

// Webhook URLs
export interface CompanyWebhookURLs {
  paystack: string;
  paypal: string;
}

// List response
export interface CompanyPaymentIntegrationsListResponse {
  integrations: CompanyPaymentIntegration[];
  webhookUrls: CompanyWebhookURLs;
}
