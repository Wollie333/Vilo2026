import type {
  RoomWithDetails,
  CreateRoomRequest,
  UpdateRoomRequest,
  PricingMode,
  InventoryMode,
  BedType,
  GalleryImage,
} from '@/types/room.types';
import type { PropertyWithCompany } from '@/types/property.types';
import type { PaymentRuleFormData, PaymentRule } from '@/types/payment-rules.types';

// ============================================================================
// Wizard Step IDs
// ============================================================================

export const ROOM_WIZARD_STEPS = {
  BASIC_INFO: 1,
  MEDIA: 2,
  PRICING: 3,
  BOOKING_RULES: 4,
  SEASONAL_RATES: 5,
  PAYMENT_RULES: 6,
  ADDONS: 7,
  PROMO_CODES: 8,
} as const;

export type RoomWizardStep = (typeof ROOM_WIZARD_STEPS)[keyof typeof ROOM_WIZARD_STEPS];

export const ROOM_WIZARD_STEP_LABELS: Record<RoomWizardStep, string> = {
  [ROOM_WIZARD_STEPS.BASIC_INFO]: 'Basic Info',
  [ROOM_WIZARD_STEPS.MEDIA]: 'Media',
  [ROOM_WIZARD_STEPS.PRICING]: 'Pricing',
  [ROOM_WIZARD_STEPS.BOOKING_RULES]: 'Booking Rules',
  [ROOM_WIZARD_STEPS.SEASONAL_RATES]: 'Seasonal Rates',
  [ROOM_WIZARD_STEPS.PAYMENT_RULES]: 'Payment Rules',
  [ROOM_WIZARD_STEPS.ADDONS]: 'Add-ons',
  [ROOM_WIZARD_STEPS.PROMO_CODES]: 'Promo Codes',
};

// ============================================================================
// Form Data Types
// ============================================================================

export interface BedFormData {
  id?: string;
  bed_type: BedType;
  quantity: number;
  sleeps: number;
}

export interface BasicInfoFormData {
  name: string;
  description: string;
  max_guests: number;
  max_adults: number | null;
  max_children: number | null;
  beds: BedFormData[];
  amenities: string[];
  room_size_sqm: number | null;
}

export interface MediaFormData {
  featured_image: string | null;
  gallery_images: GalleryImage[];
}

export interface PricingFormData {
  pricing_mode: PricingMode;
  base_price_per_night: number;
  additional_person_rate: number | null;
  currency: string;
  child_price_per_night: number | null;
  child_free_until_age: number | null;
  child_age_limit: number | null;
}

export interface BookingRulesFormData {
  min_nights: number;
  max_nights: number | null;
  inventory_mode: InventoryMode;
  total_units: number;
}

export interface SeasonalRateFormData {
  id?: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  additional_person_rate?: number | null;
  child_price_per_night?: number | null;
  min_nights?: number | null;
  is_active: boolean;
}

export interface PromotionFormData {
  id?: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
  discount_value: number;
  min_nights?: number | null;
  max_uses?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}

export interface MarketingFormData {
  seasonal_rates: SeasonalRateFormData[];
  promotions: PromotionFormData[];
  payment_rules: PaymentRuleFormData[];
}

export interface RoomFormData {
  property_id: string;
  basicInfo: BasicInfoFormData;
  media: MediaFormData;
  pricing: PricingFormData;
  bookingRules: BookingRulesFormData;
  marketing: MarketingFormData;
  addonIds: string[]; // Add-on IDs assigned to this room
}

// ============================================================================
// Step Props
// ============================================================================

export interface BaseStepProps {
  isLoading?: boolean;
  onBack?: () => void;
}

export interface BasicInfoStepProps extends BaseStepProps {
  data: BasicInfoFormData;
  onChange: (data: BasicInfoFormData) => void;
  onNext: () => void;
}

export interface MediaStepProps extends BaseStepProps {
  data: MediaFormData;
  roomId?: string; // Only available in edit mode
  onChange: (data: MediaFormData) => void;
  onNext: () => void;
}

export interface PricingStepProps extends BaseStepProps {
  data: PricingFormData;
  currency: string;
  onChange: (data: PricingFormData) => void;
  onNext: () => void;
}

export interface BookingRulesStepProps extends BaseStepProps {
  data: BookingRulesFormData;
  onChange: (data: BookingRulesFormData) => void;
  onNext: () => void;
}

export interface SeasonalRatesStepProps extends BaseStepProps {
  data: MarketingFormData;
  currency: string;
  onChange: (data: MarketingFormData) => void;
  onNext: () => void;
}

export interface PaymentRulesStepProps extends BaseStepProps {
  data: MarketingFormData;
  currency: string;
  propertyId: string;
  roomId?: string;
  onChange: (data: MarketingFormData) => void;
  onNext: () => void;
}

export interface AddonsStepProps extends BaseStepProps {
  propertyId: string;
  currency: string;
  selectedAddonIds: string[];
  onChange: (addonIds: string[]) => void;
  onNext: () => void;
}

export interface PromoCodesStepProps extends BaseStepProps {
  data: MarketingFormData;
  currency: string;
  onChange: (data: MarketingFormData) => void;
  onSubmit: () => void;
}

// ============================================================================
// Wizard Props
// ============================================================================

export interface RoomWizardProps {
  /** Mode of operation */
  mode: 'create' | 'edit';
  /** Property to create room for (required in create mode) */
  property?: PropertyWithCompany;
  /** Existing room data (required in edit mode) */
  room?: RoomWithDetails;
  /** Available properties to select from (for create mode) */
  properties?: PropertyWithCompany[];
  /** Pre-loaded payment rules (optional, avoids duplicate fetch in edit mode) */
  paymentRules?: PaymentRule[];
  /** Callback when wizard is submitted */
  onSubmit: (data: CreateRoomRequest | UpdateRoomRequest) => Promise<void>;
  /** Callback when wizard is cancelled */
  onCancel: () => void;
  /** Loading state */
  isLoading?: boolean;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_BASIC_INFO: BasicInfoFormData = {
  name: '',
  description: '',
  max_guests: 2,
  max_adults: null,
  max_children: null,
  beds: [],
  amenities: [],
  room_size_sqm: null,
};

export const DEFAULT_MEDIA: MediaFormData = {
  featured_image: null,
  gallery_images: [],
};

export const DEFAULT_PRICING: PricingFormData = {
  pricing_mode: 'per_unit',
  base_price_per_night: 0,
  additional_person_rate: null,
  currency: 'ZAR',
  child_price_per_night: null,
  child_free_until_age: null,
  child_age_limit: null,
};

export const DEFAULT_BOOKING_RULES: BookingRulesFormData = {
  min_nights: 1,
  max_nights: null,
  inventory_mode: 'single_unit',
  total_units: 1,
};

export const DEFAULT_MARKETING: MarketingFormData = {
  seasonal_rates: [],
  promotions: [],
  payment_rules: [],
};

export const DEFAULT_FORM_DATA: Omit<RoomFormData, 'property_id'> = {
  basicInfo: DEFAULT_BASIC_INFO,
  media: DEFAULT_MEDIA,
  pricing: DEFAULT_PRICING,
  bookingRules: DEFAULT_BOOKING_RULES,
  marketing: DEFAULT_MARKETING,
  addonIds: [],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract date part from datetime string for date inputs
 * "2026-01-15T00:00:00.000Z" -> "2026-01-15"
 * "2026-03-27T00:00:00+00:00" -> "2026-03-27"
 */
function extractDatePart(datetime: string | null | undefined): string | null {
  if (!datetime) return null;
  // If already date-only, return as-is
  if (!datetime.includes('T')) return datetime;
  // Extract YYYY-MM-DD from ISO datetime string (handles both Z and +00:00 timezones)
  return datetime.split('T')[0];
}

// ============================================================================
// Helper to convert RoomWithDetails to RoomFormData
// ============================================================================

export function roomToFormData(room: RoomWithDetails): Omit<RoomFormData, 'property_id'> {
  return {
    basicInfo: {
      name: room.name,
      description: room.description || '',
      max_guests: room.max_guests,
      max_adults: room.max_adults ?? null,
      max_children: room.max_children ?? null,
      beds: room.beds.map((bed) => ({
        id: bed.id,
        bed_type: bed.bed_type,
        quantity: bed.quantity,
        sleeps: bed.sleeps,
      })),
      amenities: room.amenities || [],
      room_size_sqm: room.room_size_sqm ?? null,
    },
    media: {
      featured_image: room.featured_image ?? null,
      gallery_images: (room.gallery_images || []).map(img => ({
        ...img,
        caption: img.caption ?? '', // Convert null to empty string
      })),
    },
    pricing: {
      pricing_mode: room.pricing_mode,
      base_price_per_night: room.base_price_per_night,
      additional_person_rate: room.additional_person_rate ?? null,
      currency: room.currency,
      child_price_per_night: room.child_price_per_night ?? null,
      child_free_until_age: room.child_free_until_age ?? null,
      child_age_limit: room.child_age_limit ?? null,
    },
    bookingRules: {
      min_nights: room.min_nights,
      max_nights: room.max_nights ?? null,
      inventory_mode: room.inventory_mode,
      total_units: room.total_units,
    },
    marketing: {
      seasonal_rates: room.seasonal_rates.map((rate) => ({
        id: rate.id,
        name: rate.name,
        description: rate.description || undefined,
        start_date: rate.start_date,
        end_date: rate.end_date,
        price_per_night: rate.price_per_night,
        additional_person_rate: rate.additional_person_rate,
        child_price_per_night: rate.child_price_per_night,
        min_nights: rate.min_nights,
        is_active: rate.is_active,
      })),
      promotions: room.promotions.map((promo) => ({
        id: promo.id,
        code: promo.code,
        name: promo.name,
        description: promo.description || undefined,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_nights: promo.min_nights,
        max_uses: promo.max_uses,
        start_date: extractDatePart(promo.valid_from),  // Extract date part for date input
        end_date: extractDatePart(promo.valid_until),   // Extract date part for date input
        is_active: promo.is_active,
      })),
      payment_rules: (room.payment_rules || []).map((rule) => {
        const baseRule = {
          id: rule.id,
          rule_name: rule.rule_name,
          description: rule.description || '',
          rule_type: rule.rule_type,
          schedule_config: rule.schedule_config || [],
          allowed_payment_methods: rule.allowed_payment_methods || [],
          is_active: rule.is_active,
          applies_to_dates: rule.applies_to_dates,
          start_date: rule.start_date || '',
          end_date: rule.end_date || '',
          priority: rule.priority,
        };

        if (rule.rule_type === 'deposit') {
          return {
            ...baseRule,
            deposit_type: rule.deposit_type || 'percentage',
            deposit_amount: rule.deposit_amount || 0,
            deposit_due: rule.deposit_due || 'at_booking',
            deposit_due_days: rule.deposit_due_days || 0,
            balance_due: rule.balance_due || 'on_checkin',
            balance_due_days: rule.balance_due_days || 0,
          };
        }

        return baseRule;
      })
    },
    addonIds: [], // Loaded separately via addonService.getAddOnsForRoom()
  };
}

// ============================================================================
// Helper to convert RoomFormData to CreateRoomRequest
// ============================================================================

export function formDataToCreateRequest(formData: RoomFormData): CreateRoomRequest {
  return {
    property_id: formData.property_id,
    name: formData.basicInfo.name,
    description: formData.basicInfo.description || undefined,
    max_guests: formData.basicInfo.max_guests,
    max_adults: formData.basicInfo.max_adults || undefined,
    max_children: formData.basicInfo.max_children || undefined,
    amenities: formData.basicInfo.amenities,
    room_size_sqm: formData.basicInfo.room_size_sqm || undefined,
    // Beds
    beds: formData.basicInfo.beds.length > 0
      ? formData.basicInfo.beds.map((bed, index) => ({
          bed_type: bed.bed_type,
          quantity: bed.quantity,
          sleeps: bed.sleeps,
          sort_order: index,
        }))
      : undefined,
    featured_image: formData.media.featured_image || undefined,
    gallery_images: formData.media.gallery_images.map(img => ({
      ...img,
      caption: img.caption || undefined, // Convert empty string to undefined
    })),
    pricing_mode: formData.pricing.pricing_mode,
    base_price_per_night: formData.pricing.base_price_per_night,
    additional_person_rate: formData.pricing.additional_person_rate || undefined,
    currency: formData.pricing.currency,
    child_price_per_night: formData.pricing.child_price_per_night || undefined,
    child_free_until_age: formData.pricing.child_free_until_age || undefined,
    child_age_limit: formData.pricing.child_age_limit || undefined,
    min_nights: formData.bookingRules.min_nights,
    max_nights: formData.bookingRules.max_nights || undefined,
    inventory_mode: formData.bookingRules.inventory_mode,
    total_units: formData.bookingRules.total_units,
    // Marketing data
    seasonal_rates: formData.marketing.seasonal_rates.length > 0
      ? formData.marketing.seasonal_rates.map((rate) => ({
          name: rate.name,
          description: rate.description || undefined,
          start_date: rate.start_date,
          end_date: rate.end_date,
          price_per_night: rate.price_per_night,
          additional_person_rate: rate.additional_person_rate || undefined,
          is_active: rate.is_active,
        }))
      : undefined,
    promotions: formData.marketing.promotions.length > 0
      ? formData.marketing.promotions.map((promo) => ({
          code: promo.code,
          name: promo.name,
          description: promo.description || undefined,
          discount_type: promo.discount_type,
          discount_value: promo.discount_value,
          valid_from: promo.start_date || undefined,
          valid_until: promo.end_date || undefined,
          max_uses: promo.max_uses || undefined,
          min_nights: promo.min_nights || undefined,
          is_active: promo.is_active,
        }))
      : undefined,
    // Note: payment_rules are created separately via usePaymentRulesManagement hook
  };
}

export function formDataToUpdateRequest(formData: Omit<RoomFormData, 'property_id'>): UpdateRoomRequest {
  return {
    name: formData.basicInfo.name,
    description: formData.basicInfo.description || undefined,
    max_guests: formData.basicInfo.max_guests,
    max_adults: formData.basicInfo.max_adults || undefined,
    max_children: formData.basicInfo.max_children || undefined,
    amenities: formData.basicInfo.amenities,
    room_size_sqm: formData.basicInfo.room_size_sqm || undefined,
    featured_image: formData.media.featured_image || undefined,
    gallery_images: formData.media.gallery_images.map(img => ({
      ...img,
      caption: img.caption || undefined, // Convert empty string to undefined
    })),
    pricing_mode: formData.pricing.pricing_mode,
    base_price_per_night: formData.pricing.base_price_per_night,
    additional_person_rate: formData.pricing.additional_person_rate || undefined,
    currency: formData.pricing.currency,
    child_price_per_night: formData.pricing.child_price_per_night || undefined,
    child_free_until_age: formData.pricing.child_free_until_age || undefined,
    child_age_limit: formData.pricing.child_age_limit || undefined,
    min_nights: formData.bookingRules.min_nights,
    max_nights: formData.bookingRules.max_nights || undefined,
    inventory_mode: formData.bookingRules.inventory_mode,
    total_units: formData.bookingRules.total_units,
  };
}
