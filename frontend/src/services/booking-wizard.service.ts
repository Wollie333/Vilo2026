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
}

export const bookingWizardService = new BookingWizardService();
export default bookingWizardService;
