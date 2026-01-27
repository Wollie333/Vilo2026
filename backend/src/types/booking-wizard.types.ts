/**
 * Booking Wizard Type Definitions
 */

export type PaymentProvider = 'paystack' | 'paypal' | 'eft' | 'book_via_chat';

export interface RoomSelection {
  room_id: string;
  room_name: string;
  room_code?: string;
  featured_image?: string;
  adults: number;
  children: number;
  children_ages: number[];
  unit_price: number;
  total_price: number;
}

export interface AddOnSelection {
  addon_id: string;
  addon_name: string;
  pricing_type: 'per_booking' | 'per_night' | 'per_guest' | 'per_guest_per_night';
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // password field removed - accounts created automatically with backend-generated password
  specialRequests?: string;
  termsAccepted: boolean;
  platformTermsAccepted: boolean;
  marketingConsent?: boolean;
}

export interface PricingBreakdown {
  room_total: number;
  addons_total: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  rooms_detail: Array<{
    room_name: string;
    nights: number;
    price_per_night: number;
    total: number;
  }>;
  addons_detail: Array<{
    addon_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

export interface BookingWizardData {
  property_id: string;
  property_slug: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  rooms: RoomSelection[];
  addons: AddOnSelection[];
  guest: GuestDetails;
  payment_method: PaymentProvider;
  total_amount: number;
  currency: string;
}

export interface ChatBookingResponse {
  booking_id: string;
  booking_reference: string;
  conversation_id: string;
  message_id: string;
  chat_url: string;
}
