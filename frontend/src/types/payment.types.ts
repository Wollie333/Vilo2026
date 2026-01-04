/**
 * Payment Integration Types
 */

// Payment provider enum
export type PaymentProvider = 'paystack' | 'paypal' | 'eft';

// Environment types
export type PaymentEnvironment = 'test' | 'live';

// Verification status
export type VerificationStatus = 'unverified' | 'verified' | 'failed';

// Base payment integration interface
export interface PaymentIntegration {
  id: string;
  provider: PaymentProvider;
  display_name: string;
  description: string | null;
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
export interface UpdatePaymentIntegrationDTO {
  is_enabled?: boolean;
  is_primary?: boolean;
  environment?: PaymentEnvironment;
  config?: PaymentIntegrationConfig;
}

// Test connection result
export interface TestConnectionResult {
  success: boolean;
  message: string;
  verified_at?: string;
}

// Webhook URLs
export interface WebhookURLs {
  paystack: string;
  paypal: string;
}

// API responses
export interface PaymentIntegrationsListResponse {
  integrations: PaymentIntegration[];
  webhookUrls: WebhookURLs;
}

export interface PaymentIntegrationResponse {
  integration: PaymentIntegration;
  webhookUrls: WebhookURLs;
}

export interface TestConnectionResponse {
  result: TestConnectionResult;
}
