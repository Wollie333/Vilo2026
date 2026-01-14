/**
 * DatePickerModal Types
 *
 * Modern date selection modal component
 */

export interface DatePickerModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback to close the modal
   */
  onClose: () => void;

  /**
   * Callback when date(s) are selected
   */
  onDateSelect: (checkIn: Date, checkOut?: Date) => void;

  /**
   * Modal title
   */
  title?: string;

  /**
   * Mode: single date or date range
   */
  mode?: 'single' | 'range';

  /**
   * Minimum selectable date (defaults to today)
   */
  minDate?: Date;

  /**
   * Maximum selectable date
   */
  maxDate?: Date;

  /**
   * Initial check-in date
   */
  initialCheckIn?: Date;

  /**
   * Initial check-out date
   */
  initialCheckOut?: Date;

  /**
   * Array of disabled dates
   */
  disabledDates?: Date[];

  /**
   * Confirm button text
   */
  confirmText?: string;
}
