import type { RoomWithDetails } from '@/types/room.types';

export interface RoomCardProps {
  /** The room data to display */
  room: RoomWithDetails;
  /** Whether the card is interactive (clickable) */
  interactive?: boolean;
  /** Whether the card is currently selected */
  selected?: boolean;
  /** Callback when the card is clicked */
  onClick?: () => void;
  /** Callback for edit action */
  onEdit?: () => void;
  /** Callback for delete action */
  onDelete?: () => void;
  /** Callback for pause/unpause action */
  onTogglePause?: () => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Show compact version of the card */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

export interface RoomStatusBadgeProps {
  isActive: boolean;
  isPaused: boolean;
  pausedReason?: string | null;
  size?: 'sm' | 'md';
}

export interface RoomCompletionBadgeProps {
  /** Completion score (0-100). Badge is hidden if undefined, null, 0, or 100 */
  score?: number | null;
  size?: 'sm' | 'md';
}

export interface BedConfigDisplayProps {
  beds: RoomWithDetails['beds'];
  compact?: boolean;
}

export interface PriceDisplayProps {
  price: number;
  currency: string;
  pricingMode: 'per_unit' | 'per_person' | 'per_person_sharing';
  compact?: boolean;
}
