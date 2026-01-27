/**
 * Booking Wizard Service
 *
 * Frontend service for guest booking flow API calls
 */

import { api } from './api.service';
import type {
  BookingWizardData,
  PricingBreakdown,
  RoomSelection,
  AddOnSelection,
  AvailablePaymentMethod,
  ChatBookingResponse,
} from '../types/booking-wizard.types';

interface CalculatePricingRequest {
  property_id: string;
  rooms: Array<{
    room_id: string;
    adults: number;
    children: number;
    unit_price: number;
    nights: number;
  }>;
  addons: Array<{
    addon_id: string;
    addon_type: 'per_booking' | 'per_night' | 'per_person' | 'per_room';
    quantity: number;
    unit_price: number;
  }>;
  nights: number;
  total_guests: number;
  room_count: number;
}

interface InitiateBookingResponse {
  booking_id: string;
  booking_reference: string;
  booking_status: 'pending';
}

interface ConfirmBookingResponse {
  booking_id: string;
  booking_reference: string;
  booking_status: 'confirmed';
}

interface CheckEmailResponse {
  exists: boolean;
}

interface RegisterGuestRequest {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  marketing_consent?: boolean;
}

interface RegisterGuestResponse {
  user: {
    id: string;
    email: string;
    user_type: string;
  };
  accessToken: string;
  refreshToken: string;
}

class BookingWizardService {
  /**
   * Calculate pricing breakdown for booking
   */
  async calculatePricing(data: CalculatePricingRequest): Promise<PricingBreakdown> {
    const response = await api.post<PricingBreakdown>(
      '/booking-wizard/calculate-pricing',
      data
    );
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  /**
   * Initiate booking (create pending booking before payment)
   */
  async initiateBooking(data: BookingWizardData): Promise<InitiateBookingResponse> {
    const response = await api.post<InitiateBookingResponse>(
      '/booking-wizard/initiate',
      data
    );
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  /**
   * Confirm booking after payment success
   */
  async confirmBooking(data: {
    booking_id: string;
    user_id: string;
    payment_reference: string;
  }): Promise<ConfirmBookingResponse> {
    const response = await api.post<ConfirmBookingResponse>(
      '/booking-wizard/confirm',
      data
    );
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  /**
   * Check if email already exists
   */
  async checkEmail(email: string): Promise<boolean> {
    const response = await api.post<CheckEmailResponse>(
      '/auth/check-email',
      { email }
    );
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.exists;
  }

  /**
   * Register a guest user (creates account during booking)
   */
  async registerGuest(data: RegisterGuestRequest): Promise<RegisterGuestResponse> {
    const response = await api.post<RegisterGuestResponse>(
      '/auth/register-guest',
      data
    );
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  /**
   * Initialize payment with Paystack
   */
  async initializePayment(data: {
    booking_id: string;
    property_id: string;
    guest_email: string;
    amount: number;
    currency: string;
  }): Promise<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }> {
    const response = await api.post<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>('/booking-wizard/initialize-payment', data);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  /**
   * Verify payment with Paystack
   */
  async verifyPayment(data: {
    reference: string;
    booking_id: string;
    property_id: string;
  }): Promise<{
    is_valid: boolean;
    amount: number;
    currency: string;
    status: string;
  }> {
    const response = await api.post<{
      is_valid: boolean;
      amount: number;
      currency: string;
      status: string;
    }>('/booking-wizard/verify-payment', data);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  /**
   * Get available payment methods for a property
   */
  async getAvailablePaymentMethods(
    propertyId: string
  ): Promise<{ payment_methods: AvailablePaymentMethod[] }> {
    console.log('🟦 [BOOKING_WIZARD_SERVICE] Getting payment methods for property:', propertyId);
    const response = await api.get<{ payment_methods: AvailablePaymentMethod[] }>(
      `/booking-wizard/${propertyId}/payment-methods`
    );
    if (!response.data) {
      console.error('🔴 [BOOKING_WIZARD_SERVICE] No data received from server');
      throw new Error('No data received from server');
    }
    console.log('🟦 [BOOKING_WIZARD_SERVICE] Payment methods received:', JSON.stringify(response.data, null, 2));
    console.log('🟦 [BOOKING_WIZARD_SERVICE] Payment methods array:', response.data.payment_methods);
    console.log('🟦 [BOOKING_WIZARD_SERVICE] Number of methods:', response.data.payment_methods?.length || 0);

    // Check specifically for book_via_chat
    const hasBookViaChat = response.data.payment_methods?.some(m => m.provider === 'book_via_chat');
    console.log('🟦 [BOOKING_WIZARD_SERVICE] Has book_via_chat:', hasBookViaChat);

    return response.data;
  }

  /**
   * Create booking via chat
   */
  async createBookingViaChat(data: BookingWizardData): Promise<ChatBookingResponse> {
    console.log('[BOOKING_WIZARD_SERVICE] Creating booking via chat');
    const response = await api.post<ChatBookingResponse>('/booking-wizard/initiate', {
      ...data,
      payment_method: 'book_via_chat',
    });
    if (!response.data) {
      throw new Error('No data received from server');
    }
    console.log('[BOOKING_WIZARD_SERVICE] Booking via chat created:', response.data);
    return response.data;
  }
}

export const bookingWizardService = new BookingWizardService();
export default bookingWizardService;
