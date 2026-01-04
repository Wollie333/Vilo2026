import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import {
  PaymentIntegration,
  PaymentProvider,
  UpdatePaymentIntegrationDTO,
  TestConnectionResult,
  PaystackConfig,
  PayPalConfig,
} from '../types/payment.types';

// ============================================================================
// PAYMENT INTEGRATIONS
// ============================================================================

/**
 * List all payment integrations
 */
export const listIntegrations = async (): Promise<PaymentIntegration[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('payment_integrations')
    .select('*')
    .order('is_primary', { ascending: false });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch payment integrations');
  }

  return data || [];
};

/**
 * Get a single payment integration by provider
 */
export const getIntegration = async (provider: PaymentProvider): Promise<PaymentIntegration> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('payment_integrations')
    .select('*')
    .eq('provider', provider)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', `Payment integration '${provider}' not found`);
  }

  return data;
};

/**
 * Update a payment integration
 */
export const updateIntegration = async (
  provider: PaymentProvider,
  input: UpdatePaymentIntegrationDTO,
  actorId: string
): Promise<PaymentIntegration> => {
  const supabase = getAdminClient();

  // Get existing integration
  const existing = await getIntegration(provider);

  // If setting as primary, unset other primaries
  if (input.is_primary === true) {
    await supabase
      .from('payment_integrations')
      .update({ is_primary: false })
      .neq('provider', provider);
  }

  // Build update object
  const updateData: Record<string, unknown> = {};

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
    // Merge with existing config to preserve fields not being updated
    updateData.config = { ...existing.config, ...input.config };
  }

  const { data, error } = await supabase
    .from('payment_integrations')
    .update(updateData)
    .eq('provider', provider)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update payment integration');
  }

  // Audit log
  await createAuditLog({
    actor_id: actorId,
    action: 'payment_integration.update',
    entity_type: 'payment_integration',
    entity_id: data.id,
    old_data: existing,
    new_data: data,
  });

  return data;
};

/**
 * Test connection to a payment provider
 */
export const testConnection = async (
  provider: PaymentProvider,
  actorId: string
): Promise<TestConnectionResult> => {
  const supabase = getAdminClient();
  const integration = await getIntegration(provider);

  let result: TestConnectionResult;

  try {
    switch (provider) {
      case 'paystack':
        result = await testPaystackConnection(integration.config as PaystackConfig);
        break;
      case 'paypal':
        result = await testPayPalConnection(integration.config as PayPalConfig, integration.environment);
        break;
      case 'eft':
        result = testEFTConnection(integration.config);
        break;
      default:
        throw new AppError('BAD_REQUEST', 'Unknown payment provider');
    }

    // Update verification status
    const verificationStatus = result.success ? 'verified' : 'failed';
    await supabase
      .from('payment_integrations')
      .update({
        verification_status: verificationStatus,
        last_verified_at: result.success ? new Date().toISOString() : null,
      })
      .eq('provider', provider);

    // Audit log
    await createAuditLog({
      actor_id: actorId,
      action: 'payment_integration.test_connection',
      entity_type: 'payment_integration',
      entity_id: integration.id,
      new_data: { result },
    });

    return result;
  } catch (error) {
    // Update verification status to failed
    await supabase
      .from('payment_integrations')
      .update({
        verification_status: 'failed',
      })
      .eq('provider', provider);

    if (error instanceof AppError) throw error;
    throw new AppError('INTERNAL_ERROR', 'Failed to test connection');
  }
};

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
    return {
      success: false,
      message: 'Failed to connect to Paystack. Please check your internet connection.',
    };
  }
}

/**
 * Test PayPal connection
 */
async function testPayPalConnection(config: PayPalConfig, environment: string): Promise<TestConnectionResult> {
  if (!config.client_id || !config.client_secret) {
    return {
      success: false,
      message: 'Client ID and Client Secret are required',
    };
  }

  try {
    // Determine the correct PayPal API URL based on environment
    const baseUrl = environment === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // Try to get an OAuth token to verify credentials
    const credentials = Buffer.from(`${config.client_id}:${config.client_secret}`).toString('base64');

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
    return {
      success: false,
      message: 'Failed to connect to PayPal. Please check your internet connection.',
    };
  }
}

/**
 * Test EFT configuration (just validate required fields)
 */
function testEFTConnection(config: Record<string, unknown>): TestConnectionResult {
  const requiredFields = ['bank_name', 'account_number', 'branch_code', 'account_holder'];
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    return {
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  return {
    success: true,
    message: 'EFT configuration is complete',
    verified_at: new Date().toISOString(),
  };
}

/**
 * Generate webhook URLs for a given base URL
 */
export const generateWebhookURLs = (baseUrl: string): { paystack: string; paypal: string } => {
  return {
    paystack: `${baseUrl}/api/webhooks/paystack`,
    paypal: `${baseUrl}/api/webhooks/paypal`,
  };
};
