/**
 * Company WhatsApp Configuration Types
 * Types for multi-tenant WhatsApp Business API integration
 */

/**
 * WhatsApp environment type
 */
export type WhatsAppEnvironment = 'test' | 'production';

/**
 * Verification status for WhatsApp connection
 */
export type VerificationStatus = 'unverified' | 'verified' | 'failed';

/**
 * Complete database record (INTERNAL USE ONLY - contains encrypted credentials)
 * This should NEVER be returned to the frontend
 */
export interface CompanyWhatsAppConfig {
  id: string;
  company_id: string;

  // Encrypted credentials (format: "iv:encryptedData")
  phone_number_id_encrypted: string;
  access_token_encrypted: string;
  webhook_secret_encrypted: string | null;

  // Configuration
  api_version: string;
  is_active: boolean;
  environment: WhatsAppEnvironment;

  // Connection verification
  last_verified_at: string | null;
  verification_status: VerificationStatus;
  verification_error: string | null;

  // Audit fields
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Public version of WhatsApp config (safe for frontend)
 * Excludes encrypted credentials, shows masked values instead
 */
export interface CompanyWhatsAppConfigPublic {
  id: string;
  company_id: string;

  // Masked credentials for display
  phone_number_id_masked: string;  // e.g., "***1234"
  has_credentials: boolean;

  // Configuration
  api_version: string;
  is_active: boolean;
  environment: WhatsAppEnvironment;

  // Connection verification
  last_verified_at: string | null;
  verification_status: VerificationStatus;
  verification_error: string | null;

  // Audit fields
  created_at: string;
  updated_at: string;
}

/**
 * DTO for creating/updating WhatsApp configuration
 * Credentials are sent as plaintext from frontend, encrypted in service layer
 */
export interface UpsertWhatsAppConfigDTO {
  phone_number_id: string;
  access_token: string;
  webhook_secret?: string;
  api_version?: string;
  is_active?: boolean;
  environment?: WhatsAppEnvironment;
}

/**
 * Decrypted credentials for internal use (sending messages)
 * Should only exist in memory during message sending operations
 */
export interface DecryptedWhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
  webhookSecret: string | null;
  apiVersion: string;
  environment: WhatsAppEnvironment;
}

/**
 * Result of testing WhatsApp API connection
 */
export interface TestConnectionResult {
  success: boolean;
  verified_at?: string;
  error?: string;
  phone_display_name?: string;  // Display name from Meta API
  verification_status?: VerificationStatus;
}

/**
 * API response for getting config
 */
export interface GetCompanyWhatsAppConfigResponse {
  success: boolean;
  data: {
    config: CompanyWhatsAppConfigPublic | null;
  };
}

/**
 * API response for upserting config
 */
export interface UpsertCompanyWhatsAppConfigResponse {
  success: boolean;
  data: {
    config: CompanyWhatsAppConfigPublic;
    message: string;
  };
}

/**
 * API response for testing connection
 */
export interface TestConnectionResponse {
  success: boolean;
  data: {
    result: TestConnectionResult;
  };
}

/**
 * API response for toggling config
 */
export interface ToggleConfigResponse {
  success: boolean;
  data: {
    message: string;
    is_active: boolean;
  };
}

/**
 * API response for deleting config
 */
export interface DeleteConfigResponse {
  success: boolean;
  data: {
    message: string;
  };
}

/**
 * Query parameters for listing configs (admin only)
 */
export interface ListWhatsAppConfigsParams {
  environment?: WhatsAppEnvironment;
  is_active?: boolean;
  verification_status?: VerificationStatus;
  page?: number;
  limit?: number;
}

/**
 * Response for listing configs (admin only)
 */
export interface ListWhatsAppConfigsResponse {
  success: boolean;
  data: {
    configs: CompanyWhatsAppConfigPublic[];
    total: number;
    page: number;
    limit: number;
  };
}
