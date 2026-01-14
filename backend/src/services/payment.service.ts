import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { logger } from '../utils/logger';
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

  await createAuditLog({
    actor_id: actorId,
    action: 'payment_integration.update',
    entity_type: 'payment_integration',
    entity_id: data.id,
    old_data: existing as unknown as Record<string, unknown>,
    new_data: data as unknown as Record<string, unknown>,
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
        result = testEFTConnection(integration.config as Record<string, unknown>);
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

    await createAuditLog({
      actor_id: actorId,
      action: 'payment_integration.test_connection',
      entity_type: 'payment_integration',
      entity_id: integration.id,
      new_data: { result } as Record<string, unknown>,
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
      const errorData = await response.json().catch(() => ({})) as { error_description?: string };
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
 * Get PayPal OAuth access token
 * Helper function for PayPal API calls
 */
async function getPayPalAccessToken(clientId: string, clientSecret: string, environment: string): Promise<string> {
  const baseUrl = environment === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new AppError('INTERNAL_ERROR', 'Failed to get PayPal access token');
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

/**
 * Verify PayPal webhook signature
 * https://developer.paypal.com/api/rest/webhooks/rest/
 */
export const verifyPayPalWebhookSignature = async (
  webhookId: string,
  headers: Record<string, string>,
  body: any
): Promise<boolean> => {
  try {
    const integration = await getIntegration('paypal');
    if (!integration?.is_enabled) {
      throw new AppError('BAD_REQUEST', 'PayPal integration not enabled');
    }

    const { client_id, client_secret } = integration.config as PayPalConfig;
    if (!client_id || !client_secret) {
      throw new AppError('INTERNAL_ERROR', 'PayPal credentials not configured');
    }

    const accessToken = await getPayPalAccessToken(client_id, client_secret, integration.environment);

    const verificationUrl = integration.environment === 'live'
      ? 'https://api-m.paypal.com/v1/notifications/verify-webhook-signature'
      : 'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature';

    const verificationPayload = {
      transmission_id: headers['paypal-transmission-id'],
      transmission_time: headers['paypal-transmission-time'],
      cert_url: headers['paypal-cert-url'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      webhook_id: webhookId,
      webhook_event: body,
    };

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(verificationPayload),
    });

    if (!response.ok) {
      logger.error('PayPal webhook verification failed', {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    const result = await response.json() as { verification_status: string };
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    logger.error('PayPal webhook verification error', { error });
    return false;
  }
};

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

// ============================================================================
// REFUND API METHODS
// ============================================================================

/**
 * Process refund via Paystack
 */
export const refundPaystackTransaction = async (
  gatewayReference: string,
  amount: number,
  currency: string,
  reason?: string
): Promise<{
  success: boolean;
  refund_id?: string;
  status?: string;
  message?: string;
  error?: string;
}> => {
  try {
    // Get Paystack integration config
    const integration = await getIntegration('paystack');

    if (!integration.is_enabled) {
      return {
        success: false,
        error: 'Paystack integration is not enabled',
      };
    }

    const config = integration.config as PaystackConfig;
    const secretKey = config.secret_key;

    if (!secretKey) {
      return {
        success: false,
        error: 'Paystack secret key not configured',
      };
    }

    // Convert amount to kobo (Paystack uses lowest currency unit)
    const amountInKobo = Math.round(amount * 100);

    // Call Paystack Refund API
    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: gatewayReference,
        amount: amountInKobo,
        currency,
        customer_note: reason || 'Refund processed',
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      return {
        success: false,
        error: result.message || 'Paystack refund failed',
      };
    }

    return {
      success: true,
      refund_id: result.data?.id?.toString() || result.data?.refund_reference,
      status: result.data?.status || 'pending',
      message: result.message || 'Refund initiated successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to process Paystack refund',
    };
  }
};

/**
 * Get Paystack refund status
 */
export const getPaystackRefundStatus = async (
  refundId: string
): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> => {
  try {
    const integration = await getIntegration('paystack');
    const config = integration.config as PaystackConfig;
    const secretKey = config.secret_key;

    if (!secretKey) {
      return {
        success: false,
        error: 'Paystack secret key not configured',
      };
    }

    const response = await fetch(`https://api.paystack.co/refund/${refundId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      return {
        success: false,
        error: result.message || 'Failed to get refund status',
      };
    }

    return {
      success: true,
      status: result.data?.status || 'unknown',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get Paystack refund status',
    };
  }
};

/**
 * Process refund via PayPal
 */
export const refundPayPalTransaction = async (
  captureId: string,
  amount: number,
  currency: string,
  reason?: string
): Promise<{
  success: boolean;
  refund_id?: string;
  status?: string;
  message?: string;
  error?: string;
}> => {
  try {
    // Get PayPal integration config
    const integration = await getIntegration('paypal');

    if (!integration.is_enabled) {
      return {
        success: false,
        error: 'PayPal integration is not enabled',
      };
    }

    const config = integration.config as PayPalConfig;
    const { client_id, client_secret } = config;

    if (!client_id || !client_secret) {
      return {
        success: false,
        error: 'PayPal credentials not configured',
      };
    }

    // Determine API base URL based on environment
    const baseUrl =
      integration.environment === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    // Get OAuth token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      return {
        success: false,
        error: 'Failed to authenticate with PayPal',
      };
    }

    const authData = (await authResponse.json()) as { access_token: string };
    const accessToken = authData.access_token;

    // Process refund
    const refundResponse = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency_code: currency,
        },
        note_to_payer: reason || 'Refund processed',
      }),
    });

    if (!refundResponse.ok) {
      const errorData = await refundResponse.json().catch(() => ({}));
      return {
        success: false,
        error: (errorData as any).message || 'PayPal refund failed',
      };
    }

    const refundData = (await refundResponse.json()) as {
      id: string;
      status: string;
    };

    return {
      success: true,
      refund_id: refundData.id,
      status: refundData.status,
      message: 'Refund processed successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to process PayPal refund',
    };
  }
};

/**
 * Get PayPal refund status
 */
export const getPayPalRefundStatus = async (
  refundId: string
): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> => {
  try {
    const integration = await getIntegration('paypal');
    const config = integration.config as PayPalConfig;
    const { client_id, client_secret } = config;

    if (!client_id || !client_secret) {
      return {
        success: false,
        error: 'PayPal credentials not configured',
      };
    }

    const baseUrl =
      integration.environment === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    // Get OAuth token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      return {
        success: false,
        error: 'Failed to authenticate with PayPal',
      };
    }

    const authData = (await authResponse.json()) as { access_token: string };
    const accessToken = authData.access_token;

    // Get refund details
    const response = await fetch(`${baseUrl}/v2/payments/refunds/${refundId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to get refund status',
      };
    }

    const refundData = (await response.json()) as { status: string };

    return {
      success: true,
      status: refundData.status,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get PayPal refund status',
    };
  }
};
