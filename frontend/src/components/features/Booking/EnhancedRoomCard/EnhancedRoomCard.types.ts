/**
 * EnhancedRoomCard Types
 */

export interface RoomDetails {
  id: string;
  room_id: string;
  room_name: string;
  room_code?: string;
  adults: number;
  children: number;
  room_subtotal: number;
  featured_image?: string;
}

export interface EnhancedRoomCardProps {
  room: RoomDetails;
  currency: string;
}
