/**
 * RatesTab Types
 *
 * Tab component for displaying room rates and availability
 */

export interface RatesTabProps {
  /**
   * Array of rooms with their pricing information
   */
  rooms: {
    id: string;
    name: string;
    max_guests: number;
    base_price_per_night: number;
    currency: string;
    seasonal_rates?: Array<{
      id: string;
      name: string;
      description?: string;
      start_date: string;
      end_date: string;
      price_per_night: number;
      additional_person_rate?: number;
      child_price_per_night?: number;
      min_nights?: number;
      is_active: boolean;
    }>;
    is_active: boolean;
    is_paused: boolean;
  }[];

  /**
   * Currency code (e.g., "ZAR", "USD")
   */
  currency: string;

  /**
   * Callback when a date is selected for booking
   */
  onDateSelect?: (date: Date, roomId: string) => void;
}
