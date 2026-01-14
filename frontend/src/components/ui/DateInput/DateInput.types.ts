/**
 * DateInput Types
 */

export interface DateInputProps {
  /**
   * Date value in YYYY-MM-DD format
   */
  value: string;

  /**
   * Callback when date changes
   */
  onChange: (value: string) => void;

  /**
   * Input label
   */
  label?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Error message
   */
  error?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Minimum selectable date
   */
  minDate?: Date;

  /**
   * Maximum selectable date
   */
  maxDate?: Date;

  /**
   * Array of disabled dates
   */
  disabledDates?: Date[];

  /**
   * Additional CSS classes
   */
  className?: string;
}
