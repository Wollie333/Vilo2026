import { api } from './api.service';
import type {
  InitializeCheckoutData,
  InitializeCheckoutResponse,
  SelectProviderData,
  SelectProviderResponse,
  VerifyPaymentData,
  VerifyPaymentResponse,
  PaymentMethodsResponse,
  CheckoutWithDetails,
} from '@/types/checkout.types';

class CheckoutService {
  // ============================================================================
  // CHECKOUT FLOW
  // ============================================================================

  /**
   * Initialize a new checkout session
   */
  async initializeCheckout(data: InitializeCheckoutData): Promise<InitializeCheckoutResponse> {
    const response = await api.post<InitializeCheckoutResponse>('/checkout/initialize', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to initialize checkout');
    }
    return response.data;
  }

  /**
   * Select payment provider and get initialization data
   */
  async selectProvider(data: SelectProviderData): Promise<SelectProviderResponse> {
    const response = await api.post<SelectProviderResponse>('/checkout/select-provider', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to select payment provider');
    }
    return response.data;
  }

  /**
   * Verify payment after returning from provider
   */
  async verifyPayment(data: VerifyPaymentData): Promise<VerifyPaymentResponse> {
    const response = await api.post<VerifyPaymentResponse>('/checkout/verify', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to verify payment');
    }
    return response.data;
  }

  /**
   * Cancel a checkout session
   */
  async cancelCheckout(checkout_id: string): Promise<void> {
    const response = await api.post('/checkout/cancel', { checkout_id });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to cancel checkout');
    }
  }

  /**
   * Get checkout details
   */
  async getCheckout(id: string): Promise<CheckoutWithDetails> {
    const response = await api.get<{ checkout: CheckoutWithDetails }>(`/api/checkout/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch checkout');
    }
    return response.data.checkout;
  }

  // ============================================================================
  // PAYMENT METHODS (Public endpoint)
  // ============================================================================

  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    const response = await api.get<PaymentMethodsResponse>('/checkout/payment-methods');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch payment methods');
    }
    return response.data;
  }
}

export const checkoutService = new CheckoutService();
