/**
 * PromoCodeForm Types
 *
 * Type definitions for the PromoCodeForm component.
 */

import { RoomPromotion } from '@/types/room.types';

export interface PromoCodeFormData {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
  discount_value: number;
  min_nights?: number;
  max_uses?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export interface PromoCodeFormProps {
  mode: 'create' | 'edit';
  promoCode?: RoomPromotion;
  propertyId: string;
  onSubmit: (data: PromoCodeFormData) => Promise<void>;
  onCancel: () => void;
}
