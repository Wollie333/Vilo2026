/**
 * RoomsTab Types
 */

import type { PublicRoomSummary } from '@/types/discovery.types';

export interface RoomsTabProps {
  rooms: PublicRoomSummary[];
  currency: string;
  onReserve: (roomId: string) => void;
}
