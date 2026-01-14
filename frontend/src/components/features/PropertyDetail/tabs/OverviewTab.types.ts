/**
 * OverviewTab Types
 */

export interface OverviewTabProps {
  description: string | null;
  longDescription: string | null;
  excerpt: string | null;
  videoUrl: string | null;
  showVideo: boolean;
  highlights: string[];
  amenities: string[];
  houseRules: string[];
  whatsIncluded: string[];
  checkInTime: string | null;
  checkOutTime: string | null;
  cancellationPolicy: string | null;
  maxGuests?: number;
}
