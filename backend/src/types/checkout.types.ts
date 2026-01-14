import type { BillingInterval } from './billing.types';

// ============================================================================
// Checkout Status
// ============================================================================

export type CheckoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled';

export const CHECKOUT_STATUS_LABELS: Record<CheckoutStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

// ============================================================================
// Payment Providers
// ============================================================================

export type PaymentProvider = 'paystack' | 'paypal' | 'eft';

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  paystack: 'Paystack',
  paypal: 'PayPal',
  eft: 'Bank Transfer (EFT)',
};

// ============================================================================
// Checkout Entity
// ============================================================================

export interface Checkout {
  id: string;
  user_id: string;
  subscription_type_id: string;
  billing_interval: BillingInterval;
  amount_cents: number;
  currency: string;
  payment_provider: PaymentProvider | null;
  payment_reference: string | null;
  status: CheckoutStatus;
  provider_data: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export interface CheckoutWithDetails extends Checkout {
  subscription_type: {
    id: string;
    name: string;
    display_name: string;
    description: string | null;
  };
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

// ============================================================================
// Initialize Checkout
// ============================================================================

export interface InitializeCheckoutData {
  subscription_type_id: string;
  billing_interval: BillingInterval;
}

export interface InitializeCheckoutResponse {
  checkout_id: string;
  status: CheckoutStatus;
  amount_cents: number;
  currency: string;
  expires_at: string | null;
  available_providers: PaymentProvider[];
}

// ============================================================================
// Select Payment Provider
// ============================================================================

export interface SelectProviderData {
  checkout_id: string;
  provider: PaymentProvider;
}

export interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PayPalInitData {
  order_id: string;
  approval_url: string;
}

export interface EFTInitData {
  reference: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  branch_code: string;
  amount: string;
  currency: string;
  instructions: string;
}

export interface SelectProviderResponse {
  checkout_id: string;
  provider: PaymentProvider;
  paystack_data?: PaystackInitData;
  paypal_data?: PayPalInitData;
  eft_data?: EFTInitData;
}

// ============================================================================
// Verify Payment
// ============================================================================

export interface VerifyPaymentData {
  checkout_id: string;
  provider: PaymentProvider;
  payment_reference?: string;
  // Paystack specific
  paystack_reference?: string;
  // PayPal specific
  paypal_order_id?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  checkout_id: string;
  subscription_id?: string;
  error?: string;
}

// ============================================================================
// Payment Methods
// ============================================================================

export interface AvailablePaymentMethod {
  provider: PaymentProvider;
  label: string;
  is_enabled: boolean;
  config?: {
    public_key?: string;
    client_id?: string;
    bank_name?: string;
    account_name?: string;
  };
}

export interface PaymentMethodsResponse {
  methods: AvailablePaymentMethod[];
}

// ============================================================================
// Admin Operations
// ============================================================================

export interface ConfirmEFTPaymentData {
  checkout_id: string;
  payment_reference?: string;
  notes?: string;
}

export interface CheckoutListParams {
  status?: CheckoutStatus;
  payment_provider?: PaymentProvider;
  user_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'amount_cents';
  sortOrder?: 'asc' | 'desc';
}

export interface CheckoutListResponse {
  checkouts: CheckoutWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
    };
    metadata?: Record<string, unknown>;
    paid_at?: string;
    channel?: string;
  };
}

export interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    status: string;
    purchase_units?: Array<{
      amount: {
        value: string;
        currency_code: string;
      };
    }>;
    payer?: {
      email_address: string;
    };
  };
}
