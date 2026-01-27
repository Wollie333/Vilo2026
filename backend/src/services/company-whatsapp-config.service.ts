/**
 * Company WhatsApp Configuration Service
 * Manages per-company WhatsApp Business API credentials with AES-256 encryption
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import {
  encryptString,
  decryptString,
  maskCredential,
} from '../utils/encryption';
import type {
  CompanyWhatsAppConfig,
  CompanyWhatsAppConfigPublic,
  UpsertWhatsAppConfigDTO,
  DecryptedWhatsAppCredentials,
  TestConnectionResult,
} from '../types/company-whatsapp-config.types';

const WHATSAPP_API_BASE = process.env.WHATSAPP_API_BASE || 'https://graph.facebook.com';

/**
 * Convert internal config to public version (strip encrypted fields, add masked values)
 */
function toPublicConfig(config: CompanyWhatsAppConfig): CompanyWhatsAppConfigPublic {
  // Decrypt to get last 4 digits for masking
  let phoneNumberIdMasked = '****';
  try {
    const decrypted = decryptString(config.phone_number_id_encrypted);
    phoneNumberIdMasked = maskCredential(decrypted);
  } catch (error) {
    console.error('Failed to decrypt phone number for masking:', error);
  }

  return {
    id: config.id,
    company_id: config.company_id,
    phone_number_id_masked: phoneNumberIdMasked,
    has_credentials: !!(config.phone_number_id_encrypted && config.access_token_encrypted),
    api_version: config.api_version,
    is_active: config.is_active,
    environment: config.environment,
    last_verified_at: config.last_verified_at,
    verification_status: config.verification_status,
    verification_error: config.verification_error,
    created_at: config.created_at,
    updated_at: config.updated_at,
  };
}

/**
 * Get company WhatsApp configuration
 * Returns public version (no encrypted credentials)
 */
export async function getCompanyWhatsAppConfig(
  companyId: string
): Promise<CompanyWhatsAppConfigPublic | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('company_whatsapp_config')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No config found
      return null;
    }
    console.error('Error fetching WhatsApp config:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch WhatsApp configuration');
  }

  return toPublicConfig(data as CompanyWhatsAppConfig);
}

/**
 * Get decrypted WhatsApp credentials for sending messages
 * INTERNAL USE ONLY - never expose to frontend
 */
export async function getDecryptedWhatsAppCredentials(
  companyId: string
): Promise<DecryptedWhatsAppCredentials | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('company_whatsapp_config')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No config found
      return null;
    }
    console.error('Error fetching WhatsApp credentials:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch WhatsApp credentials');
  }

  const config = data as CompanyWhatsAppConfig;

  try {
    return {
      phoneNumberId: decryptString(config.phone_number_id_encrypted),
      accessToken: decryptString(config.access_token_encrypted),
      webhookSecret: config.webhook_secret_encrypted
        ? decryptString(config.webhook_secret_encrypted)
        : null,
      apiVersion: config.api_version,
      environment: config.environment,
    };
  } catch (error) {
    console.error('Failed to decrypt WhatsApp credentials:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to decrypt WhatsApp credentials');
  }
}

/**
 * Create or update WhatsApp configuration
 * Encrypts credentials before storing
 */
export async function upsertCompanyWhatsAppConfig(
  companyId: string,
  input: UpsertWhatsAppConfigDTO,
  actorId: string
): Promise<CompanyWhatsAppConfigPublic> {
  const supabase = getAdminClient();

  // Validate input
  if (!input.phone_number_id || !input.access_token) {
    throw new AppError('VALIDATION_ERROR', 'Phone Number ID and Access Token are required');
  }

  // Encrypt credentials
  let phoneNumberIdEncrypted: string;
  let accessTokenEncrypted: string;
  let webhookSecretEncrypted: string | null = null;

  try {
    phoneNumberIdEncrypted = encryptString(input.phone_number_id);
    accessTokenEncrypted = encryptString(input.access_token);

    if (input.webhook_secret) {
      webhookSecretEncrypted = encryptString(input.webhook_secret);
    }
  } catch (error) {
    console.error('Encryption error:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to encrypt credentials');
  }

  // Check if config already exists
  const { data: existing } = await supabase
    .from('company_whatsapp_config')
    .select('id')
    .eq('company_id', companyId)
    .single();

  const payload = {
    company_id: companyId,
    phone_number_id_encrypted: phoneNumberIdEncrypted,
    access_token_encrypted: accessTokenEncrypted,
    webhook_secret_encrypted: webhookSecretEncrypted,
    api_version: input.api_version || 'v18.0',
    is_active: input.is_active !== undefined ? input.is_active : false,
    environment: input.environment || 'test',
    created_by: actorId,
    // Reset verification status when credentials change
    verification_status: 'unverified' as const,
    last_verified_at: null,
    verification_error: null,
  };

  if (existing) {
    // Update existing config
    const { data, error } = await supabase
      .from('company_whatsapp_config')
      .update(payload)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating WhatsApp config:', error);
      throw new AppError('INTERNAL_ERROR', 'Failed to update WhatsApp configuration');
    }

    // Update phone mapping table for webhook routing
    await upsertPhoneMapping(supabase, input.phone_number_id, companyId);

    return toPublicConfig(data as CompanyWhatsAppConfig);
  } else {
    // Insert new config
    const { data, error } = await supabase
      .from('company_whatsapp_config')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating WhatsApp config:', error);
      throw new AppError('INTERNAL_ERROR', 'Failed to create WhatsApp configuration');
    }

    // Insert phone mapping table for webhook routing
    await upsertPhoneMapping(supabase, input.phone_number_id, companyId);

    return toPublicConfig(data as CompanyWhatsAppConfig);
  }
}

/**
 * Upsert phone number mapping for webhook routing
 * Maps Meta's phone_number_id to company for incoming message routing
 */
async function upsertPhoneMapping(
  supabase: any,
  phoneNumberId: string,
  companyId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('whatsapp_phone_company_mapping')
      .upsert(
        {
          phone_number_id: phoneNumberId, // Plain text for routing
          company_id: companyId,
        },
        { onConflict: 'phone_number_id' }
      );

    if (error) {
      console.error('Failed to update phone mapping:', error);
      // Don't throw - this is not critical for config save to succeed
    } else {
      console.log(`✅ Updated phone mapping: ${phoneNumberId} → Company ${companyId}`);
    }
  } catch (error) {
    console.error('Error upserting phone mapping:', error);
    // Don't throw - this is not critical for config save to succeed
  }
}

/**
 * Test WhatsApp API connection with current credentials
 * Makes API call to Meta to verify credentials work
 */
export async function testWhatsAppConnection(
  companyId: string
): Promise<TestConnectionResult> {
  const supabase = getAdminClient();

  // Get decrypted credentials
  const credentials = await getDecryptedWhatsAppCredentials(companyId);

  if (!credentials) {
    return {
      success: false,
      error: 'WhatsApp not configured for this company',
      verification_status: 'failed',
    };
  }

  try {
    // Test connection by fetching phone number details from Meta API
    const url = `${WHATSAPP_API_BASE}/${credentials.apiVersion}/${credentials.phoneNumberId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message || `Meta API error: ${response.status}`;

      // Update verification status in database
      await supabase
        .from('company_whatsapp_config')
        .update({
          verification_status: 'failed',
          verification_error: errorMessage,
          last_verified_at: new Date().toISOString(),
        })
        .eq('company_id', companyId);

      return {
        success: false,
        error: errorMessage,
        verification_status: 'failed',
        verified_at: new Date().toISOString(),
      };
    }

    // Success - parse response
    const data = await response.json();
    const phoneDisplayName = data.display_phone_number || data.verified_name || 'Unknown';

    // Update verification status in database
    await supabase
      .from('company_whatsapp_config')
      .update({
        verification_status: 'verified',
        verification_error: null,
        last_verified_at: new Date().toISOString(),
      })
      .eq('company_id', companyId);

    return {
      success: true,
      phone_display_name: phoneDisplayName,
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Connection test error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update verification status in database
    await supabase
      .from('company_whatsapp_config')
      .update({
        verification_status: 'failed',
        verification_error: errorMessage,
        last_verified_at: new Date().toISOString(),
      })
      .eq('company_id', companyId);

    return {
      success: false,
      error: errorMessage,
      verification_status: 'failed',
      verified_at: new Date().toISOString(),
    };
  }
}

/**
 * Toggle WhatsApp configuration active status
 */
export async function toggleWhatsAppConfig(
  companyId: string,
  isActive: boolean
): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('company_whatsapp_config')
    .update({ is_active: isActive })
    .eq('company_id', companyId);

  if (error) {
    console.error('Error toggling WhatsApp config:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to toggle WhatsApp configuration');
  }
}

/**
 * Delete WhatsApp configuration
 */
export async function deleteCompanyWhatsAppConfig(
  companyId: string,
  actorId: string
): Promise<void> {
  const supabase = getAdminClient();

  // TODO: Add audit log entry for credential deletion

  const { error } = await supabase
    .from('company_whatsapp_config')
    .delete()
    .eq('company_id', companyId);

  if (error) {
    console.error('Error deleting WhatsApp config:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to delete WhatsApp configuration');
  }
}

/**
 * Check if company has WhatsApp configured and active
 */
export async function hasWhatsAppConfigured(companyId: string): Promise<boolean> {
  const config = await getCompanyWhatsAppConfig(companyId);
  return config?.is_active && config?.verification_status === 'verified';
}
