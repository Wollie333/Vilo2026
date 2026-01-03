export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  maxHeight?: number;
  groupBy?: boolean;
}
