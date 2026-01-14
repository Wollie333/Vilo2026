/**
 * Type definitions for the Create Booking wizard
 */

import type { RoomWithDetails } from '@/types/room.types';
import type { PropertyWithCompany } from '@/types/property.types';
import type { BookingSource, PaymentMethod } from '@/types/booking.types';
import type { AddOn } from '@/types/addon.types';

// ============================================================================
// Step Configuration
// ============================================================================

export interface BookingStepConfig {
  key: string;
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

// ============================================================================
// Form Data
// ============================================================================

export interface BookingRoomSelection {
  room_id: string;
  room: RoomWithDetails;
  adults: number;
  children: number;
  children_ages: number[];
}

export interface BookingAddonSelection {
  addon_id: string;
  addon: AddOn;
  quantity: number;
}

export interface BookingFormData {
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  rooms: BookingRoomSelection[];
  addons: BookingAddonSelection[];
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  adults: number;
  children: number;
  children_ages: number[];
  source: BookingSource;
  payment_method: PaymentMethod | '';
  special_requests: string;
  internal_notes: string;
}

export const initialBookingFormData: BookingFormData = {
  property_id: '',
  check_in_date: '',
  check_out_date: '',
  rooms: [],
  addons: [],
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  adults: 1,
  children: 0,
  children_ages: [],
  source: 'manual',
  payment_method: '',
  special_requests: '',
  internal_notes: '',
};

// ============================================================================
// Step Props
// ============================================================================

export interface BaseStepProps {
  formData: BookingFormData;
  onUpdate: (updates: Partial<BookingFormData>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface PropertyDatesStepProps extends BaseStepProps {
  properties: PropertyWithCompany[];
  onContinue: () => void;
}

export interface RoomsStepProps extends BaseStepProps {
  availableRooms: RoomWithDetails[];
  roomsLoading: boolean;
  estimatedTotal: number;
  currency: string;
  nights: number;
  onBack: () => void;
  onContinue: () => void;
}

export interface AddonsStepProps extends BaseStepProps {
  availableAddons: AddOn[];
  addonsLoading: boolean;
  nights: number;
  totalGuests: number;
  currency: string;
  onBack: () => void;
  onContinue: () => void;
}

export interface GuestInfoStepProps extends BaseStepProps {
  onBack: () => void;
  onContinue: () => void;
}

export interface ReviewStepProps extends BaseStepProps {
  properties: PropertyWithCompany[];
  estimatedTotal: number;
  addonsTotal: number;
  currency: string;
  nights: number;
  totalGuests: number;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
}

// ============================================================================
// Component Props
// ============================================================================

export interface BookingProgressSidebarProps {
  currentStep: number;
  onCancelClick: () => void;
}

export interface BookingFooterProps {
  onCancel: () => void;
  onContinue: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  showBack?: boolean;
  cancelLabel?: string;
  continueLabel?: string;
  continueDisabled?: boolean;
  isFinalStep?: boolean;
}

export interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
