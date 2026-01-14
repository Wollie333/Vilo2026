import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { logger } from '../utils/logger';
import * as billingService from './billing.service';
import * as paymentService from './payment.service';
import * as invoiceService from './invoice.service';
import type {
  Checkout,
  CheckoutWithDetails,
  CheckoutStatus,
  PaymentProvider,
  InitializeCheckoutData,
  InitializeCheckoutResponse,
  SelectProviderData,
  SelectProviderResponse,
  VerifyPaymentData,
  VerifyPaymentResponse,
  PaymentMethodsResponse,
  AvailablePaymentMethod,
  ConfirmEFTPaymentData,
  CheckoutListParams,
  CheckoutListResponse,
  PaystackInitData,
  PayPalInitData,
  EFTInitData,
} from '../types/checkout.types';
import type { BillingInterval } from '../types/billing.types';
import type { PaystackConfig, PayPalConfig, EFTConfig } from '../types/payment.types';

// ============================================================================
// CHECKOUT INITIALIZATION
// ============================================================================

/**
 * Initialize a new checkout session
 */
export const initializeCheckout = async (
  userId: string,
  input: InitializeCheckoutData
): Promise<InitializeCheckoutResponse> => {
  const supabase = getAdminClient();

  // Verify subscription type exists and is active
  const subscriptionType = await billingService.getSubscriptionType(input.subscription_type_id);
  if (!subscriptionType.is_active) {
    throw new AppError('BAD_REQUEST', 'This subscription plan is not available');
  }

  // Prevent checkout for free tier (R0 plans)
  if (subscriptionType.price_cents === 0 || subscriptionType.name === 'free_tier') {
    throw new AppError(
      'BAD_REQUEST',
      'Free tier subscriptions do not require payment. You already have access to free tier features.'
    );
  }

  // Check if user already has an active subscription
  const existingSubscription = await billingService.getUserSubscription(userId);
  if (existingSubscription) {
    // Allow upgrades from free tier, but block downgrades or lateral moves
    const existingType = await billingService.getSubscriptionType(existingSubscription.subscription_type_id);

    // If upgrading from free tier to paid plan, allow it
    if (existingType.name === 'free_tier' && subscriptionType.price_cents > 0) {
      logger.info(`User ${userId} upgrading from free tier to ${subscriptionType.name}`);
      // Continue with checkout - upgrade will be handled in completeCheckout
    } else {
      // Block if not upgrading from free tier
      throw new AppError(
        'CONFLICT',
        'You already have an active subscription. Please cancel it first to subscribe to a new plan.'
      );
    }
  }

  // Check for pending checkouts and expire them
  await supabase
    .from('checkouts')
    .update({ status: 'expired' })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());

  // Get the price based on billing interval
  const pricing = subscriptionType.pricing || { monthly: 0, annual: 0 };
  const amountCents = input.billing_interval === 'monthly' ? pricing.monthly : pricing.annual;

  // Create checkout record
  const { data: checkout, error } = await supabase
    .from('checkouts')
    .insert({
      user_id: userId,
      subscription_type_id: input.subscription_type_id,
      billing_interval: input.billing_interval,
      amount_cents: amountCents,
      currency: subscriptionType.currency,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !checkout) {
    console.error('Checkout creation failed:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to create checkout session: ${error?.message || 'Unknown error'}`);
  }

  // Get available payment providers
  const integrations = await paymentService.listIntegrations();
  const availableProviders = integrations
    .filter(i => i.is_enabled && i.verification_status === 'verified')
    .map(i => i.provider as PaymentProvider);

  return {
    checkout_id: checkout.id,
    status: checkout.status,
    amount_cents: checkout.amount_cents,
    currency: checkout.currency,
    expires_at: checkout.expires_at,
    available_providers: availableProviders,
  };
};

// ============================================================================
// PAYMENT PROVIDER SELECTION
// ============================================================================

/**
 * Select a payment provider and get initialization data
 */
export const selectPaymentProvider = async (
  userId: string,
  input: SelectProviderData
): Promise<SelectProviderResponse> => {
  const supabase = getAdminClient();

  // Get checkout and verify ownership
  const checkout = await getCheckout(input.checkout_id);
  if (checkout.user_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have access to this checkout');
  }

  if (checkout.status !== 'pending') {
    throw new AppError('BAD_REQUEST', 'This checkout is no longer pending');
  }

  // Verify provider is enabled
  const integration = await paymentService.getIntegration(input.provider);
  if (!integration.is_enabled) {
    throw new AppError('BAD_REQUEST', 'This payment method is not available');
  }

  // Get user email for payment initialization
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  console.log('=== SELECT PROVIDER DEBUG ===');
  console.log('User ID:', userId);
  console.log('User data:', user);
  console.log('User error:', userError);

  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  if (!user.email) {
    throw new AppError('BAD_REQUEST', 'User email not found');
  }

  let response: SelectProviderResponse = {
    checkout_id: input.checkout_id,
    provider: input.provider,
  };

  // Initialize payment with selected provider
  switch (input.provider) {
    case 'paystack':
      response.paystack_data = await initializePaystackPayment(
        checkout,
        integration.config as PaystackConfig,
        user.email
      );
      break;

    case 'paypal':
      response.paypal_data = await initializePayPalPayment(
        checkout,
        integration.config as PayPalConfig,
        integration.environment
      );
      break;

    case 'eft':
      response.eft_data = await initializeEFTPayment(
        checkout,
        integration.config as EFTConfig
      );
      break;

    default:
      throw new AppError('BAD_REQUEST', 'Unknown payment provider');
  }

  // Update checkout with provider info
  const { error } = await supabase
    .from('checkouts')
    .update({
      payment_provider: input.provider,
      status: 'processing',
      provider_data: response.paystack_data || response.paypal_data || response.eft_data || {},
    })
    .eq('id', input.checkout_id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update checkout');
  }

  return response;
};

/**
 * Initialize Paystack payment
 */
async function initializePaystackPayment(
  checkout: Checkout,
  config: PaystackConfig,
  email: string
): Promise<PaystackInitData> {
  if (!config.secret_key) {
    throw new AppError('INTERNAL_ERROR', 'Paystack is not configured');
  }

  const reference = `vilo_${checkout.id}_${Date.now()}`;

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secret_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: checkout.amount_cents, // Paystack expects amount in cents
        currency: checkout.currency,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/checkout/callback?provider=paystack`,
        metadata: {
          checkout_id: checkout.id,
          subscription_type_id: checkout.subscription_type_id,
          billing_interval: checkout.billing_interval,
        },
      }),
    });

    const data = await response.json() as { status: boolean; data?: { authorization_url: string; access_code: string; reference: string }; message?: string };

    if (!data.status || !data.data) {
      throw new AppError('INTERNAL_ERROR', data.message || 'Failed to initialize Paystack payment');
    }

    return {
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('INTERNAL_ERROR', 'Failed to connect to Paystack');
  }
}

/**
 * Initialize PayPal payment
 */
async function initializePayPalPayment(
  checkout: Checkout,
  config: PayPalConfig,
  environment: string
): Promise<PayPalInitData> {
  if (!config.client_id || !config.client_secret) {
    throw new AppError('INTERNAL_ERROR', 'PayPal is not configured');
  }

  const baseUrl = environment === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  try {
    // Get OAuth token
    const credentials = Buffer.from(`${config.client_id}:${config.client_secret}`).toString('base64');
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json() as { access_token?: string };
    if (!tokenData.access_token) {
      throw new AppError('INTERNAL_ERROR', 'Failed to authenticate with PayPal');
    }

    // Create order
    const amountInCurrency = (checkout.amount_cents / 100).toFixed(2);
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: checkout.id,
          amount: {
            currency_code: checkout.currency,
            value: amountInCurrency,
          },
          description: 'Vilo Subscription',
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/checkout/callback?provider=paypal`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout?cancelled=true`,
        },
      }),
    });

    const orderData = await orderResponse.json() as { id?: string; links?: Array<{ rel: string; href: string }> };
    if (!orderData.id) {
      throw new AppError('INTERNAL_ERROR', 'Failed to create PayPal order');
    }

    const approvalUrl = orderData.links?.find(link => link.rel === 'approve')?.href;
    if (!approvalUrl) {
      throw new AppError('INTERNAL_ERROR', 'Failed to get PayPal approval URL');
    }

    return {
      order_id: orderData.id,
      approval_url: approvalUrl,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('INTERNAL_ERROR', 'Failed to connect to PayPal');
  }
}

/**
 * Initialize EFT payment (manual bank transfer)
 */
async function initializeEFTPayment(
  checkout: Checkout,
  config: EFTConfig
): Promise<EFTInitData> {
  if (!config.bank_name || !config.account_number) {
    throw new AppError('INTERNAL_ERROR', 'EFT is not configured');
  }

  const supabase = getAdminClient();

  // Generate unique reference
  const prefix = config.reference_prefix || 'VILO';
  const reference = `${prefix}-${checkout.id.substring(0, 8).toUpperCase()}`;

  // Update checkout with reference
  await supabase
    .from('checkouts')
    .update({ payment_reference: reference })
    .eq('id', checkout.id);

  const amountFormatted = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: checkout.currency,
  }).format(checkout.amount_cents / 100);

  return {
    reference,
    bank_name: config.bank_name,
    account_number: config.account_number,
    account_name: config.account_holder || 'Vilo',
    branch_code: config.branch_code || '',
    amount: amountFormatted,
    currency: checkout.currency,
    instructions: config.instructions || 'Please use the reference number when making your payment. Your subscription will be activated once we confirm payment receipt.',
  };
}

// ============================================================================
// PAYMENT VERIFICATION
// ============================================================================

/**
 * Verify payment and create subscription
 */
export const verifyPayment = async (
  userId: string,
  input: VerifyPaymentData
): Promise<VerifyPaymentResponse> => {
  const supabase = getAdminClient();

  console.log('=== VERIFY PAYMENT DEBUG ===');
  console.log('User ID:', userId);
  console.log('Input:', JSON.stringify(input, null, 2));

  // Get checkout
  const checkout = await getCheckout(input.checkout_id);
  console.log('Checkout found:', JSON.stringify(checkout, null, 2));
  if (checkout.user_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have access to this checkout');
  }

  if (checkout.status === 'completed') {
    // Already completed, return success
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return {
      success: true,
      checkout_id: input.checkout_id,
      subscription_id: subscription?.id,
    };
  }

  if (checkout.status !== 'processing') {
    throw new AppError('BAD_REQUEST', 'This checkout cannot be verified');
  }

  let isPaymentValid = false;
  let paymentReference = input.payment_reference;

  // Verify with payment provider
  switch (input.provider) {
    case 'paystack':
      isPaymentValid = await verifyPaystackPayment(checkout, input.paystack_reference || paymentReference);
      paymentReference = input.paystack_reference || paymentReference;
      break;

    case 'paypal':
      isPaymentValid = await verifyPayPalPayment(checkout, input.paypal_order_id);
      paymentReference = input.paypal_order_id;
      break;

    case 'eft':
      // EFT is verified manually by admin
      return {
        success: false,
        checkout_id: input.checkout_id,
        error: 'EFT payments require manual confirmation by admin',
      };

    default:
      throw new AppError('BAD_REQUEST', 'Unknown payment provider');
  }

  if (!isPaymentValid) {
    await supabase
      .from('checkouts')
      .update({
        status: 'failed',
        error_message: 'Payment verification failed',
      })
      .eq('id', input.checkout_id);

    return {
      success: false,
      checkout_id: input.checkout_id,
      error: 'Payment verification failed',
    };
  }

  // Create subscription
  const subscriptionId = await completeCheckout(checkout, paymentReference, userId);

  return {
    success: true,
    checkout_id: input.checkout_id,
    subscription_id: subscriptionId,
  };
};

/**
 * Verify Paystack payment
 */
async function verifyPaystackPayment(checkout: Checkout, reference?: string): Promise<boolean> {
  console.log('=== PAYSTACK VERIFY DEBUG ===');
  console.log('Reference:', reference);
  console.log('Checkout amount_cents:', checkout.amount_cents);

  if (!reference) {
    console.log('No reference provided');
    return false;
  }

  const integration = await paymentService.getIntegration('paystack');
  const config = integration.config as PaystackConfig;

  if (!config.secret_key) {
    console.log('No Paystack secret key configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.secret_key}`,
      },
    });

    const data = await response.json() as { status: boolean; data?: { status: string; amount: number }; message?: string };
    console.log('Paystack API response:', JSON.stringify(data, null, 2));

    const isValid = data.status &&
      data.data?.status === 'success' &&
      data.data?.amount === checkout.amount_cents;

    console.log('Payment valid:', isValid);
    console.log('- API status:', data.status);
    console.log('- Payment status:', data.data?.status);
    console.log('- Amount from Paystack:', data.data?.amount);
    console.log('- Amount expected:', checkout.amount_cents);

    return isValid;
  } catch (error) {
    console.error('Paystack verification error:', error);
    return false;
  }
}

/**
 * Verify PayPal payment
 */
async function verifyPayPalPayment(checkout: Checkout, orderId?: string): Promise<boolean> {
  if (!orderId) return false;

  const integration = await paymentService.getIntegration('paypal');
  const config = integration.config as PayPalConfig;

  if (!config.client_id || !config.client_secret) return false;

  const baseUrl = integration.environment === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  try {
    // Get OAuth token
    const credentials = Buffer.from(`${config.client_id}:${config.client_secret}`).toString('base64');
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json() as { access_token?: string };
    if (!tokenData.access_token) return false;

    // Capture the order
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureResponse.json() as { status?: string };
    return captureData.status === 'COMPLETED';
  } catch {
    return false;
  }
}

/**
 * Complete checkout and create subscription
 */
async function completeCheckout(checkout: Checkout, paymentReference?: string, actorId?: string): Promise<string> {
  const supabase = getAdminClient();

  // Get subscription type for trial period
  const subscriptionType = await billingService.getSubscriptionType(checkout.subscription_type_id);

  // Calculate expiry date based on billing interval
  const startDate = new Date();
  let expiresAt: Date | null = null;

  if (subscriptionType.is_recurring) {
    expiresAt = new Date(startDate);
    if (checkout.billing_interval === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
  }

  // Calculate trial end date if applicable
  let trialEndsAt: Date | null = null;
  let status: 'active' | 'trial' = 'active';

  if (subscriptionType.trial_period_days && subscriptionType.trial_period_days > 0) {
    trialEndsAt = new Date(startDate);
    trialEndsAt.setDate(trialEndsAt.getDate() + subscriptionType.trial_period_days);
    status = 'trial';
  }

  // Check if user has existing active subscription (for upgrades)
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('id, subscription_type_id, subscription_types!inner(name)')
    .eq('user_id', checkout.user_id)
    .eq('is_active', true)
    .single();

  if (existingSubscription) {
    // Deactivate old subscription (typically upgrading from free tier)
    await supabase
      .from('user_subscriptions')
      .update({
        is_active: false,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Upgraded to paid plan',
      })
      .eq('id', existingSubscription.id);

    const oldPlanName = (existingSubscription.subscription_types as any)?.name || 'unknown';
    logger.info(
      `Deactivated subscription ${existingSubscription.id} (${oldPlanName}) for user ${checkout.user_id} - upgrading to ${subscriptionType.name}`
    );

    // Audit log for subscription cancellation
    await createAuditLog({
      actor_id: actorId || checkout.user_id,
      action: 'subscription.cancelled',
      entity_type: 'subscription',
      entity_id: existingSubscription.id,
      old_data: existingSubscription,
      new_data: {
        is_active: false,
        cancellation_reason: 'Upgraded to paid plan',
      },
    });
  }

  // Create new subscription
  const subscription = await billingService.createUserSubscription({
    user_id: checkout.user_id,
    subscription_type_id: checkout.subscription_type_id,
    status,
    expires_at: expiresAt?.toISOString(),
    trial_ends_at: trialEndsAt?.toISOString(),
  }, actorId || checkout.user_id);

  // Update checkout to completed
  await supabase
    .from('checkouts')
    .update({
      status: 'completed',
      payment_reference: paymentReference,
      completed_at: new Date().toISOString(),
    })
    .eq('id', checkout.id);

  await createAuditLog({
    actor_id: actorId || checkout.user_id,
    action: 'subscription.created',
    entity_type: 'subscription',
    entity_id: subscription.id,
    new_data: {
      checkout_id: checkout.id,
      payment_provider: checkout.payment_provider,
      amount_cents: checkout.amount_cents,
      billing_interval: checkout.billing_interval,
    },
  });

  // Generate invoice for completed payment
  try {
    await invoiceService.generateInvoice(checkout.id);
  } catch (error) {
    // Log but don't fail checkout - invoice can be regenerated
    logger.error('Failed to generate invoice', { checkout_id: checkout.id, error });
  }

  return subscription.id;
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

/**
 * Get available payment methods
 */
export const getPaymentMethods = async (): Promise<PaymentMethodsResponse> => {
  const integrations = await paymentService.listIntegrations();
  console.log('All integrations:', JSON.stringify(integrations, null, 2));

  // Filter to only enabled integrations and map to payment methods
  const enabledIntegrations = integrations.filter(integration => integration.is_enabled);
  console.log('Enabled integrations:', enabledIntegrations.length);

  const methods: AvailablePaymentMethod[] = enabledIntegrations
    .map(integration => {
    const method: AvailablePaymentMethod = {
      provider: integration.provider as PaymentProvider,
      label: integration.display_name,
      is_enabled: true, // Already filtered to enabled only
    };

    // Add public config for client-side initialization
    if (integration.provider === 'paystack') {
      const config = integration.config as PaystackConfig;
      method.config = {
        public_key: config.public_key,
      };
    } else if (integration.provider === 'paypal') {
      const config = integration.config as PayPalConfig;
      method.config = {
        client_id: config.client_id,
      };
    } else if (integration.provider === 'eft') {
      const config = integration.config as EFTConfig;
      method.config = {
        bank_name: config.bank_name,
        account_name: config.account_holder,
      };
    }

    return method;
  });

  return { methods };
};

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

/**
 * Confirm EFT payment (admin only)
 */
export const confirmEFTPayment = async (
  input: ConfirmEFTPaymentData,
  adminId: string
): Promise<VerifyPaymentResponse> => {
  const checkout = await getCheckout(input.checkout_id);

  if (checkout.status === 'completed') {
    return {
      success: true,
      checkout_id: input.checkout_id,
    };
  }

  if (checkout.payment_provider !== 'eft' || checkout.status !== 'processing') {
    throw new AppError('BAD_REQUEST', 'This checkout cannot be confirmed');
  }

  // Complete the checkout
  const subscriptionId = await completeCheckout(checkout, input.payment_reference, adminId);

  // Audit log for admin action
  await createAuditLog({
    actor_id: adminId,
    action: 'checkout.eft_confirmed',
    entity_type: 'checkout',
    entity_id: checkout.id,
    new_data: {
      payment_reference: input.payment_reference,
      notes: input.notes,
    },
  });

  return {
    success: true,
    checkout_id: input.checkout_id,
    subscription_id: subscriptionId,
  };
};

/**
 * List checkouts (admin)
 */
export const listCheckouts = async (params: CheckoutListParams): Promise<CheckoutListResponse> => {
  const supabase = getAdminClient();

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('checkouts')
    .select(`
      *,
      subscription_type:subscription_types (id, name, display_name, description),
      user:users (id, email, full_name)
    `, { count: 'exact' });

  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.payment_provider) {
    query = query.eq('payment_provider', params.payment_provider);
  }
  if (params.user_id) {
    query = query.eq('user_id', params.user_id);
  }
  if (params.from_date) {
    query = query.gte('created_at', params.from_date);
  }
  if (params.to_date) {
    query = query.lte('created_at', params.to_date);
  }

  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch checkouts');
  }

  const total = count || 0;

  return {
    checkouts: (data || []) as CheckoutWithDetails[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Cancel a checkout
 */
export const cancelCheckout = async (checkoutId: string, userId: string): Promise<void> => {
  const supabase = getAdminClient();

  const checkout = await getCheckout(checkoutId);

  if (checkout.user_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have access to this checkout');
  }

  if (!['pending', 'processing'].includes(checkout.status)) {
    throw new AppError('BAD_REQUEST', 'This checkout cannot be cancelled');
  }

  await supabase
    .from('checkouts')
    .update({ status: 'cancelled' })
    .eq('id', checkoutId);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get checkout by ID
 */
export const getCheckout = async (id: string): Promise<Checkout> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('checkouts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Checkout not found');
  }

  return data;
};

/**
 * Get checkout with details
 */
export const getCheckoutWithDetails = async (id: string): Promise<CheckoutWithDetails> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('checkouts')
    .select(`
      *,
      subscription_type:subscription_types (id, name, display_name, description),
      user:users (id, email, full_name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Checkout not found');
  }

  return data as CheckoutWithDetails;
};

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle Paystack webhook event
 */
export const handlePaystackWebhook = async (event: string, data: Record<string, unknown>): Promise<void> => {
  const supabase = getAdminClient();

  if (event === 'charge.success') {
    const reference = data.reference as string;
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const checkoutId = metadata?.checkout_id as string;

    if (!checkoutId) {
      console.error('Paystack webhook: No checkout_id in metadata');
      return;
    }

    try {
      const checkout = await getCheckout(checkoutId);

      if (checkout.status === 'processing') {
        // Verify the amount matches
        const amount = data.amount as number;
        if (amount !== checkout.amount_cents) {
          console.error('Paystack webhook: Amount mismatch', { expected: checkout.amount_cents, received: amount });
          return;
        }

        // Complete the checkout
        await completeCheckout(checkout, reference, checkout.user_id);
      }
    } catch (error) {
      console.error('Paystack webhook error:', error);
    }
  }
};

/**
 * Handle PayPal webhook event
 */
export const handlePayPalWebhook = async (eventType: string, resource: Record<string, unknown>): Promise<void> => {
  if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    const orderId = resource.id as string;
    const purchaseUnits = resource.purchase_units as Array<{ reference_id?: string }> | undefined;
    const checkoutId = purchaseUnits?.[0]?.reference_id;

    if (!checkoutId) {
      console.error('PayPal webhook: No checkout_id in purchase_units');
      return;
    }

    try {
      const checkout = await getCheckout(checkoutId);

      if (checkout.status === 'processing') {
        // For PayPal, we need to capture the payment if it was just approved
        if (eventType === 'CHECKOUT.ORDER.APPROVED') {
          // The payment will be captured when the user returns to the callback
          // Or we can capture it here
          const isValid = await verifyPayPalPayment(checkout, orderId);
          if (isValid) {
            await completeCheckout(checkout, orderId, checkout.user_id);
          }
        } else {
          // Payment was already captured
          await completeCheckout(checkout, orderId, checkout.user_id);
        }
      }
    } catch (error) {
      console.error('PayPal webhook error:', error);
    }
  }
};
