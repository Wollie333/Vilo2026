import { getAdminClient, getUserClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { logger } from '../utils/logger';
import { encryptString, decryptString } from '../utils/encryption';
import {
  CompanyPaymentIntegration,
  PaymentProvider,
  UpdateCompanyPaymentIntegrationDTO,
  CreateCompanyPaymentIntegrationDTO,
  TestConnectionResult,
  PaystackConfig,
  PayPalConfig,
  EFTConfig,
  CompanyPaymentIntegrationsListResponse,
  PaymentEnvironment,
} from '../types/payment.types';

// ============================================================================
// ENCRYPTION HELPERS
// ============================================================================

/**
 * Encrypt sensitive fields in payment config before saving to database
 */
function encryptPaymentConfig(provider: PaymentProvider, config: Record<string, unknown>): Record<string, unknown> {
  const encryptedConfig = { ...config };

  try {
    switch (provider) {
      case 'paystack':
        // Encrypt secret_key (keep public_key in plaintext - it's safe to expose)
        if (encryptedConfig.secret_key && typeof encryptedConfig.secret_key === 'string') {
          encryptedConfig.secret_key = encryptString(encryptedConfig.secret_key);
        }
        break;

      case 'paypal':
        // Encrypt client_secret (keep client_id in plaintext)
        if (encryptedConfig.client_secret && typeof encryptedConfig.client_secret === 'string') {
          encryptedConfig.client_secret = encryptString(encryptedConfig.client_secret);
        }
        break;

      case 'eft':
        // EFT has no secrets - just bank details (all safe to store in plaintext)
        break;
    }
  } catch (error) {
    logger.error('Failed to encrypt payment config:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to encrypt payment credentials');
  }

  return encryptedConfig;
}

/**
 * Decrypt sensitive fields in payment config after retrieving from database
 */
function decryptPaymentConfig(provider: PaymentProvider, config: Record<string, unknown>): Record<string, unknown> {
  const decryptedConfig = { ...config };

  try {
    switch (provider) {
      case 'paystack':
        // Decrypt secret_key if it exists and looks encrypted (contains ':')
        if (decryptedConfig.secret_key && typeof decryptedConfig.secret_key === 'string') {
          if (decryptedConfig.secret_key.includes(':')) {
            decryptedConfig.secret_key = decryptString(decryptedConfig.secret_key);
          }
        }
        break;

      case 'paypal':
        // Decrypt client_secret if it exists and looks encrypted
        if (decryptedConfig.client_secret && typeof decryptedConfig.client_secret === 'string') {
          if (decryptedConfig.client_secret.includes(':')) {
            decryptedConfig.client_secret = decryptString(decryptedConfig.client_secret);
          }
        }
        break;

      case 'eft':
        // EFT has no encrypted fields
        break;
    }
  } catch (error) {
    logger.error('Failed to decrypt payment config:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to decrypt payment credentials. Encryption key may have changed.');
  }

  return decryptedConfig;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate Paystack API key format
 */
function validatePaystackKey(key: string, type: 'public' | 'secret'): boolean {
  const prefix = type === 'public' ? 'pk_' : 'sk_';
  return key.startsWith(prefix) && key.length > 10;
}

/**
 * Validate PayPal Client ID format (alphanumeric with dashes/underscores, ~60-100 chars)
 */
function validatePayPalClientId(clientId: string): boolean {
  return /^[A-Za-z0-9_-]{60,100}$/.test(clientId);
}

/**
 * Validate PayPal Client Secret format (alphanumeric with dashes/underscores, 20-100 chars)
 */
function validatePayPalClientSecret(secret: string): boolean {
  return /^[A-Za-z0-9_-]{20,100}$/.test(secret);
}

/**
 * Validate EFT bank details format
 */
function validateEFTBankDetails(config: EFTConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Account number: 8-20 alphanumeric characters (flexible for international banks)
  if (!config.account_number || config.account_number.trim().length < 4) {
    errors.push('Account number is required (minimum 4 characters)');
  }
  if (config.account_number && config.account_number.length > 34) {
    errors.push('Account number must be maximum 34 characters (IBAN standard)');
  }

  // Branch code: optional, 4-11 alphanumeric characters if provided
  // Flexible for: South African (6 digits), UK sort code (6 digits), SWIFT/BIC (8-11), etc.
  if (config.branch_code && config.branch_code.trim().length > 0) {
    if (!/^[A-Za-z0-9-]{4,11}$/.test(config.branch_code)) {
      errors.push('Branch code must be 4-11 alphanumeric characters (e.g., sort code, routing number, or SWIFT code)');
    }
  }

  // Account holder: required, non-empty
  if (!config.account_holder || config.account_holder.trim().length === 0) {
    errors.push('Account holder name is required');
  }

  // Bank name: required, non-empty
  if (!config.bank_name || config.bank_name.trim().length === 0) {
    errors.push('Bank name is required');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// COMPANY PAYMENT INTEGRATIONS
// ============================================================================

/**
 * List all payment integrations for a company
 */
export const listCompanyIntegrations = async (
  companyId: string
): Promise<CompanyPaymentIntegrationsListResponse> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('company_payment_integrations')
    .select('*')
    .eq('company_id', companyId)
    .order('is_primary', { ascending: false });

  if (error) {
    logger.error('Failed to fetch company payment integrations:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch payment integrations');
  }

  // Decrypt configs before returning
  const decryptedIntegrations = (data || []).map((integration) => ({
    ...integration,
    config: decryptPaymentConfig(integration.provider as PaymentProvider, integration.config),
  }));

  // Generate webhook URLs for this company
  const webhookUrls = generateWebhookURLs(companyId);

  return {
    integrations: decryptedIntegrations,
    webhookUrls,
  };
};

/**
 * Get a single payment integration for a company by provider
 */
export const getCompanyIntegration = async (
  companyId: string,
  provider: PaymentProvider
): Promise<CompanyPaymentIntegration> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('company_payment_integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', `Payment integration '${provider}' not found for this company`);
  }

  // Decrypt config before returning
  return {
    ...data,
    config: decryptPaymentConfig(provider, data.config),
  };
};

/**
 * Create or update a payment integration for a company (upsert)
 */
export const upsertCompanyIntegration = async (
  companyId: string,
  provider: PaymentProvider,
  input: UpdateCompanyPaymentIntegrationDTO | CreateCompanyPaymentIntegrationDTO,
  actorId: string
): Promise<CompanyPaymentIntegration> => {
  const supabase = getAdminClient();

  console.log('=== [PAYMENT_INTEGRATION_SERVICE] upsertCompanyIntegration called ===');
  console.log('[PAYMENT_INTEGRATION_SERVICE] Company ID:', companyId);
  console.log('[PAYMENT_INTEGRATION_SERVICE] Provider:', provider);
  console.log('[PAYMENT_INTEGRATION_SERVICE] Input:', JSON.stringify(input, null, 2));
  console.log('[PAYMENT_INTEGRATION_SERVICE] Actor ID:', actorId);

  // Check if integration exists
  console.log('[PAYMENT_INTEGRATION_SERVICE] Checking if integration exists...');
  const { data: existing } = await supabase
    .from('company_payment_integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('provider', provider)
    .maybeSingle();

  console.log('[PAYMENT_INTEGRATION_SERVICE] Existing integration:', existing ? 'Found' : 'Not found');

  // Validate credentials before saving
  console.log('[PAYMENT_INTEGRATION_SERVICE] Validating credentials...');
  if (input.config) {
    console.log('[PAYMENT_INTEGRATION_SERVICE] Config to validate:', JSON.stringify(input.config, null, 2));

    switch (provider) {
      case 'paystack': {
        console.log('[PAYMENT_INTEGRATION_SERVICE] Validating Paystack config...');
        const paystackConfig = input.config as PaystackConfig;
        if (paystackConfig.public_key && !validatePaystackKey(paystackConfig.public_key, 'public')) {
          console.error('[PAYMENT_INTEGRATION_SERVICE] Validation failed: Invalid Paystack public key');
          throw new AppError('VALIDATION_ERROR', 'Invalid Paystack public key format (must start with pk_)');
        }
        if (paystackConfig.secret_key && !validatePaystackKey(paystackConfig.secret_key, 'secret')) {
          console.error('[PAYMENT_INTEGRATION_SERVICE] Validation failed: Invalid Paystack secret key');
          throw new AppError('VALIDATION_ERROR', 'Invalid Paystack secret key format (must start with sk_)');
        }
        console.log('[PAYMENT_INTEGRATION_SERVICE] Paystack validation passed');
        break;
      }
      case 'paypal': {
        console.log('[PAYMENT_INTEGRATION_SERVICE] Validating PayPal config...');
        const paypalConfig = input.config as PayPalConfig;
        if (paypalConfig.client_id && !validatePayPalClientId(paypalConfig.client_id)) {
          console.error('[PAYMENT_INTEGRATION_SERVICE] Validation failed: Invalid PayPal Client ID');
          throw new AppError('VALIDATION_ERROR', 'Invalid PayPal Client ID format (expected 60-100 alphanumeric characters)');
        }
        if (paypalConfig.client_secret && !validatePayPalClientSecret(paypalConfig.client_secret)) {
          console.error('[PAYMENT_INTEGRATION_SERVICE] Validation failed: Invalid PayPal Client Secret');
          throw new AppError('VALIDATION_ERROR', 'Invalid PayPal Client Secret format (expected 20-100 alphanumeric characters)');
        }
        console.log('[PAYMENT_INTEGRATION_SERVICE] PayPal validation passed');
        break;
      }
      case 'eft': {
        console.log('[PAYMENT_INTEGRATION_SERVICE] Validating EFT config...');
        const eftConfig = input.config as EFTConfig;
        console.log('[PAYMENT_INTEGRATION_SERVICE] EFT config details:', {
          bank_name: eftConfig.bank_name,
          account_number: eftConfig.account_number ? `${eftConfig.account_number.length} chars` : 'missing',
          branch_code: eftConfig.branch_code,
          account_holder: eftConfig.account_holder,
        });

        const { valid, errors } = validateEFTBankDetails(eftConfig);
        if (!valid) {
          console.error('[PAYMENT_INTEGRATION_SERVICE] EFT validation failed:', errors);
          throw new AppError('VALIDATION_ERROR', `EFT validation failed: ${errors.join(', ')}`);
        }
        console.log('[PAYMENT_INTEGRATION_SERVICE] EFT validation passed');
        break;
      }
    }
  } else {
    console.log('[PAYMENT_INTEGRATION_SERVICE] No config provided to validate');
  }

  // If setting as primary, unset other primaries for this company
  if (input.is_primary === true) {
    console.log('[PAYMENT_INTEGRATION_SERVICE] Unsetting other primary integrations...');
    await supabase
      .from('company_payment_integrations')
      .update({ is_primary: false })
      .eq('company_id', companyId)
      .neq('provider', provider);
  }

  let result: CompanyPaymentIntegration;

  if (existing) {
    // Update existing integration
    console.log('[PAYMENT_INTEGRATION_SERVICE] Updating existing integration...');
    const updateData: Record<string, unknown> = {};

    if ('display_name' in input && input.display_name !== undefined) {
      updateData.display_name = input.display_name;
    }
    if (input.is_enabled !== undefined) {
      updateData.is_enabled = input.is_enabled;
    }
    if (input.is_primary !== undefined) {
      updateData.is_primary = input.is_primary;
    }
    if (input.environment !== undefined) {
      updateData.environment = input.environment;
    }
    if (input.config !== undefined) {
      console.log('[PAYMENT_INTEGRATION_SERVICE] Merging config with existing...');
      // Merge with existing config to preserve fields not being updated
      const mergedConfig = { ...existing.config, ...input.config };
      console.log('[PAYMENT_INTEGRATION_SERVICE] Merged config:', JSON.stringify(mergedConfig, null, 2));
      // Encrypt sensitive fields before saving
      updateData.config = encryptPaymentConfig(provider, mergedConfig);
    }
    if ('webhook_secret' in input && input.webhook_secret !== undefined) {
      updateData.webhook_secret = input.webhook_secret;
    }

    console.log('[PAYMENT_INTEGRATION_SERVICE] Update data prepared:', JSON.stringify(updateData, null, 2));

    const { data, error } = await supabase
      .from('company_payment_integrations')
      .update(updateData)
      .eq('company_id', companyId)
      .eq('provider', provider)
      .select()
      .single();

    if (error || !data) {
      console.error('[PAYMENT_INTEGRATION_SERVICE] Database update failed:', error);
      logger.error('Failed to update company payment integration:', error);
      throw new AppError('INTERNAL_ERROR', 'Failed to update payment integration');
    }

    console.log('[PAYMENT_INTEGRATION_SERVICE] Update successful, ID:', data.id);
    result = data;

    await createAuditLog({
      actor_id: actorId,
      action: 'company_payment_integration.update',
      entity_type: 'company_payment_integration',
      entity_id: data.id,
      old_data: existing as unknown as Record<string, unknown>,
      new_data: data as unknown as Record<string, unknown>,
    });
  } else {
    // Create new integration
    console.log('[PAYMENT_INTEGRATION_SERVICE] Creating new integration...');
    const displayNameMap: Record<PaymentProvider, string> = {
      paystack: 'Paystack',
      paypal: 'PayPal',
      eft: 'EFT (Bank Transfer)',
    };

    const insertData = {
      company_id: companyId,
      provider,
      display_name: 'display_name' in input ? input.display_name : displayNameMap[provider],
      // Default is_enabled to true when config is provided (user is configuring it, so enable it)
      is_enabled: input.is_enabled ?? (input.config ? true : false),
      is_primary: input.is_primary ?? false,
      environment: input.environment ?? 'test',
      config: encryptPaymentConfig(provider, input.config || {}),
      webhook_secret: 'webhook_secret' in input ? input.webhook_secret : null,
    };

    console.log('[PAYMENT_INTEGRATION_SERVICE] Insert data prepared:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('company_payment_integrations')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.error('[PAYMENT_INTEGRATION_SERVICE] Database insert failed:', error);
      logger.error('Failed to create company payment integration:', error);
      throw new AppError('INTERNAL_ERROR', 'Failed to create payment integration');
    }

    console.log('[PAYMENT_INTEGRATION_SERVICE] Insert successful, ID:', data.id);
    result = data;

    await createAuditLog({
      actor_id: actorId,
      action: 'company_payment_integration.create',
      entity_type: 'company_payment_integration',
      entity_id: data.id,
      new_data: data as unknown as Record<string, unknown>,
    });
  }

  console.log('✅ [PAYMENT_INTEGRATION_SERVICE] upsertCompanyIntegration completed successfully');
  console.log('[PAYMENT_INTEGRATION_SERVICE] Final result:', {
    id: result.id,
    provider: result.provider,
    is_enabled: result.is_enabled,
    is_primary: result.is_primary,
  });

  return result;
};

/**
 * Toggle payment integration enabled/disabled
 * Auto-creates integration with minimal config if it doesn't exist
 */
export const toggleCompanyIntegration = async (
  companyId: string,
  provider: PaymentProvider,
  enabled: boolean,
  actorId: string
): Promise<CompanyPaymentIntegration> => {
  const supabase = getAdminClient();

  console.log('🟡 [PAYMENT_INTEGRATION_SERVICE] toggleCompanyIntegration called');
  console.log('🟡 [PAYMENT_INTEGRATION_SERVICE] Company:', companyId, 'Provider:', provider, 'Enabled:', enabled);

  // Check if integration exists
  const { data: existing } = await supabase
    .from('company_payment_integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('provider', provider)
    .maybeSingle();

  let result: CompanyPaymentIntegration;

  if (!existing) {
    // Integration doesn't exist - create it with minimal config
    console.log('🟡 [PAYMENT_INTEGRATION_SERVICE] Integration does not exist, creating...');

    const displayNameMap: Record<PaymentProvider, string> = {
      paystack: 'Paystack',
      paypal: 'PayPal',
      eft: 'EFT (Bank Transfer)',
    };

    const { data: created, error: createError } = await supabase
      .from('company_payment_integrations')
      .insert({
        company_id: companyId,
        provider,
        display_name: displayNameMap[provider],
        is_enabled: enabled,
        is_primary: false,
        environment: 'test',
        config: {}, // Empty config - user needs to configure later
      })
      .select()
      .single();

    if (createError || !created) {
      console.error('🔴 [PAYMENT_INTEGRATION_SERVICE] Failed to create integration:', createError);
      logger.error('Failed to create company payment integration:', createError);
      throw new AppError('INTERNAL_ERROR', 'Failed to create payment integration');
    }

    console.log('✅ [PAYMENT_INTEGRATION_SERVICE] Integration created:', created.id);

    await createAuditLog({
      actor_id: actorId,
      action: 'company_payment_integration.create',
      entity_type: 'company_payment_integration',
      entity_id: created.id,
      new_data: created as unknown as Record<string, unknown>,
    });

    result = created;
  } else {
    // Integration exists - just toggle it
    console.log('🟡 [PAYMENT_INTEGRATION_SERVICE] Integration exists, updating...');

    const { data: updated, error: updateError } = await supabase
      .from('company_payment_integrations')
      .update({ is_enabled: enabled })
      .eq('company_id', companyId)
      .eq('provider', provider)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('🔴 [PAYMENT_INTEGRATION_SERVICE] Failed to update integration:', updateError);
      logger.error('Failed to toggle company payment integration:', updateError);
      throw new AppError('INTERNAL_ERROR', 'Failed to toggle payment integration');
    }

    console.log('✅ [PAYMENT_INTEGRATION_SERVICE] Integration updated:', updated.id);

    await createAuditLog({
      actor_id: actorId,
      action: `company_payment_integration.${enabled ? 'enable' : 'disable'}`,
      entity_type: 'company_payment_integration',
      entity_id: updated.id,
      old_data: existing as unknown as Record<string, unknown>,
      new_data: updated as unknown as Record<string, unknown>,
    });

    result = updated;
  }

  console.log('✅ [PAYMENT_INTEGRATION_SERVICE] Toggle completed successfully');

  return result;
};

/**
 * Set payment integration as primary
 */
export const setPrimaryCompanyIntegration = async (
  companyId: string,
  provider: PaymentProvider,
  actorId: string
): Promise<CompanyPaymentIntegration> => {
  const supabase = getAdminClient();

  // Unset all primaries for this company
  await supabase
    .from('company_payment_integrations')
    .update({ is_primary: false })
    .eq('company_id', companyId);

  // Set this one as primary
  const { data, error } = await supabase
    .from('company_payment_integrations')
    .update({ is_primary: true })
    .eq('company_id', companyId)
    .eq('provider', provider)
    .select()
    .single();

  if (error || !data) {
    logger.error('Failed to set primary company payment integration:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to set primary payment integration');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'company_payment_integration.set_primary',
    entity_type: 'company_payment_integration',
    entity_id: data.id,
  });

  return data;
};

/**
 * Delete a company payment integration
 */
export const deleteCompanyIntegration = async (
  companyId: string,
  provider: PaymentProvider,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  const existing = await getCompanyIntegration(companyId, provider);

  const { error } = await supabase
    .from('company_payment_integrations')
    .delete()
    .eq('company_id', companyId)
    .eq('provider', provider);

  if (error) {
    logger.error('Failed to delete company payment integration:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to delete payment integration');
  }

  await createAuditLog({
    actor_id: actorId,
    action: 'company_payment_integration.delete',
    entity_type: 'company_payment_integration',
    entity_id: existing.id,
    old_data: existing as unknown as Record<string, unknown>,
  });
};

/**
 * Test connection to a payment provider for a company
 */
export const testCompanyConnection = async (
  companyId: string,
  provider: PaymentProvider,
  actorId: string
): Promise<TestConnectionResult> => {
  const supabase = getAdminClient();
  const integration = await getCompanyIntegration(companyId, provider);

  let result: TestConnectionResult;

  try {
    switch (provider) {
      case 'paystack':
        result = await testPaystackConnection(integration.config as PaystackConfig);
        break;
      case 'paypal':
        result = await testPayPalConnection(
          integration.config as PayPalConfig,
          integration.environment
        );
        break;
      case 'eft':
        result = testEFTConnection(integration.config as EFTConfig);
        break;
      default:
        throw new AppError('BAD_REQUEST', 'Unknown payment provider');
    }

    // Update verification status
    const verificationStatus = result.success ? 'verified' : 'failed';
    await supabase
      .from('company_payment_integrations')
      .update({
        verification_status: verificationStatus,
        last_verified_at: result.success ? new Date().toISOString() : null,
      })
      .eq('company_id', companyId)
      .eq('provider', provider);

    await createAuditLog({
      actor_id: actorId,
      action: 'company_payment_integration.test_connection',
      entity_type: 'company_payment_integration',
      entity_id: integration.id,
      new_data: { result } as Record<string, unknown>,
    });

    return result;
  } catch (error) {
    // Update verification status to failed
    await supabase
      .from('company_payment_integrations')
      .update({
        verification_status: 'failed',
      })
      .eq('company_id', companyId)
      .eq('provider', provider);

    if (error instanceof AppError) throw error;
    logger.error('Failed to test company payment connection:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to test connection');
  }
};

/**
 * Get primary payment integration for a company
 */
export const getPrimaryCompanyIntegration = async (
  companyId: string
): Promise<CompanyPaymentIntegration | null> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('company_payment_integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_primary', true)
    .eq('is_enabled', true)
    .maybeSingle();

  if (error) {
    logger.error('Failed to get primary company payment integration:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to get primary payment integration');
  }

  return data;
};

/**
 * Get payment integration for a property (via company)
 */
export const getIntegrationForProperty = async (
  propertyId: string
): Promise<CompanyPaymentIntegration | null> => {
  const supabase = getAdminClient();

  // Get property to find company_id
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('company_id')
    .eq('id', propertyId)
    .single();

  if (propertyError || !property || !property.company_id) {
    throw new AppError('NOT_FOUND', 'Property not found or not associated with a company');
  }

  // Get primary integration for the company
  return getPrimaryCompanyIntegration(property.company_id);
};

// ============================================================================
// HELPER FUNCTIONS (Reused from payment.service.ts)
// ============================================================================

/**
 * Test Paystack connection
 */
async function testPaystackConnection(config: PaystackConfig): Promise<TestConnectionResult> {
  if (!config.secret_key) {
    return {
      success: false,
      message: 'Secret key is required',
    };
  }

  try {
    // Call Paystack API to verify the key
    const response = await fetch('https://api.paystack.co/transaction/verify/test', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.secret_key}`,
        'Content-Type': 'application/json',
      },
    });

    // 401 = invalid key, 404 = valid key (transaction not found, but auth worked)
    if (response.status === 401) {
      return {
        success: false,
        message: 'Invalid API key. Please check your secret key.',
      };
    }

    // Any other response means the key is valid
    return {
      success: true,
      message: 'Successfully connected to Paystack',
      verified_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to test Paystack connection:', error);
    return {
      success: false,
      message: 'Failed to connect to Paystack. Please check your internet connection.',
    };
  }
}

/**
 * Test PayPal connection
 */
async function testPayPalConnection(
  config: PayPalConfig,
  environment: PaymentEnvironment
): Promise<TestConnectionResult> {
  if (!config.client_id || !config.client_secret) {
    return {
      success: false,
      message: 'Client ID and Client Secret are required',
    };
  }

  try {
    // Determine the correct PayPal API URL based on environment
    const baseUrl =
      environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    // Try to get an OAuth token to verify credentials
    const credentials = Buffer.from(`${config.client_id}:${config.client_secret}`).toString(
      'base64'
    );

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error_description?: string };
      return {
        success: false,
        message: errorData.error_description || 'Invalid PayPal credentials',
      };
    }

    return {
      success: true,
      message: 'Successfully connected to PayPal',
      verified_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to test PayPal connection:', error);
    return {
      success: false,
      message: 'Failed to connect to PayPal. Please check your internet connection.',
    };
  }
}

/**
 * Test EFT connection (validate required fields)
 */
function testEFTConnection(config: EFTConfig): TestConnectionResult {
  const requiredFields = ['bank_name', 'account_number', 'branch_code', 'account_holder'];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!config[field as keyof EFTConfig]) {
      missingFields.push(field.replace('_', ' '));
    }
  }

  if (missingFields.length > 0) {
    return {
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  return {
    success: true,
    message: 'EFT configuration validated successfully',
    verified_at: new Date().toISOString(),
  };
}

/**
 * Generate webhook URLs for a company
 */
function generateWebhookURLs(companyId: string): {
  paystack: string;
  paypal: string;
} {
  const baseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:3001';

  return {
    paystack: `${baseUrl}/api/webhooks/company/${companyId}/paystack`,
    paypal: `${baseUrl}/api/webhooks/company/${companyId}/paypal`,
  };
}
