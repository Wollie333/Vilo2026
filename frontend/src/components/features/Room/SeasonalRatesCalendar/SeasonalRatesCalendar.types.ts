/**
 * SeasonalRatesCalendar Types
 *
 * Component for displaying seasonal rates in a calendar/table format
 */

export interface SeasonalRatesCalendarProps {
  /**
   * Room information
   */
  room: {
    id: string;
    name: string;
    max_guests: number;
    base_price_per_night: number;
    currency: string;
    seasonal_rates?: SeasonalRateInfo[];
  };

  /**
   * Starting date for the calendar view
   * Defaults to today
   */
  startDate?: Date;

  /**
   * Number of days to display
   * Defaults to 7
   */
  daysToShow?: number;

  /**
   * Optional booked dates to show as "FULL"
   */
  bookedDates?: Date[];

  /**
   * Compact mode for smaller displays
   */
  compact?: boolean;

  /**
   * Show navigation arrows
   */
  showNavigation?: boolean;

  /**
   * Callback when date range changes
   */
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;

  /**
   * Callback when a date is selected for booking
   */
  onDateSelect?: (date: Date) => void;
}

export interface SeasonalRateInfo {
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
}

export interface DateCellInfo {
  date: Date;
  dateString: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  price: number;
  rateName?: string;
  isBooked: boolean;
  isWeekend: boolean;
  isToday: boolean;
}
