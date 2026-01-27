/**
 * Company WhatsApp Configuration Types (Frontend)
 * Public-safe types for WhatsApp Business API integration
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
 * Public WhatsApp configuration (safe for frontend)
 * Excludes encrypted credentials, shows masked values instead
 */
export interface CompanyWhatsAppConfig {
  id: string;
  company_id: string;

  // Masked credentials for display
  phone_number_id_masked: string; // e.g., "***1234"
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
 * Input for creating/updating WhatsApp configuration
 * Credentials are sent as plaintext from frontend, encrypted in backend
 */
export interface WhatsAppCredentialsInput {
  phone_number_id: string;
  access_token: string;
  webhook_secret?: string;
  api_version?: string;
  is_active?: boolean;
  environment?: WhatsAppEnvironment;
}

/**
 * Result of testing WhatsApp API connection
 */
export interface TestConnectionResult {
  success: boolean;
  verified_at?: string;
  error?: string;
  phone_display_name?: string; // Display name from Meta API
  verification_status?: VerificationStatus;
}

/**
 * API response for getting config
 */
export interface GetCompanyWhatsAppConfigResponse {
  success: boolean;
  data: {
    config: CompanyWhatsAppConfig | null;
  };
}

/**
 * API response for upserting config
 */
export interface UpsertCompanyWhatsAppConfigResponse {
  success: boolean;
  data: {
    config: CompanyWhatsAppConfig;
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
