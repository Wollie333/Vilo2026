/**
 * OverviewTab Types
 */

export interface CancellationPolicyDetail {
  id: string;
  name: string;
  description: string | null;
  tiers: Array<{ days: number; refund: number }>;
}

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
  cancellationPolicyDetail?: CancellationPolicyDetail | null;
  termsAndConditions?: string | null;
  propertyName?: string;
  propertyId?: string;
  maxGuests?: number;
}
