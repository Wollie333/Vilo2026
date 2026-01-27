import type { PublicRoomSummary } from '@/types/discovery.types';

export interface PromotionsTabProps {
  rooms: PublicRoomSummary[];
  currency: string;
  propertyId: string;
  propertyName: string;
}
