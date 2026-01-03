export interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  label?: string;
  startLabel?: string;
  endLabel?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  minDate?: string;
  maxDate?: string;
}
