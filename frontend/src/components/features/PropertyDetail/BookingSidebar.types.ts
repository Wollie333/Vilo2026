/**
 * BookingSidebar Types
 */

export interface BookingSidebarProps {
  minPrice: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number;
  companyName?: string;
  companyLogo?: string;
  onReserve: () => void;
  onMessageHost: () => void;
  onRequestQuote?: () => void;
}
