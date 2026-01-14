/**
 * Booking Wizard Type Definitions
 *
 * Types for the multi-step booking reservation wizard
 */

export type PaymentProvider = 'paystack' | 'paypal' | 'eft';

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
  pricing_type: 'per_booking' | 'per_night' | 'per_guest' | 'per_room';
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  specialRequests?: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
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
  check_in_date: string; // ISO date
  check_out_date: string; // ISO date
  nights: number;
  rooms: RoomSelection[];
  addons: AddOnSelection[];
  guest: GuestDetails;
  payment_method: PaymentProvider;
  total_amount: number;
  currency: string;
}

export interface BookingWizardStep {
  number: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

export interface PropertyBranding {
  id: string;
  name: string;
  listing_title?: string;
  featured_image_url?: string;
  property_type: string;
  city_name?: string;
  province_name?: string;
  country_name?: string;
  overall_rating: number | null;
  review_count: number;
  currency: string;
}
