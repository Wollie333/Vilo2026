export interface PhoneInputProps {
  /** Label text displayed above the input */
  label?: string;
  /** Error message to display below the input */
  error?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Size variant of the input */
  size?: 'sm' | 'md' | 'lg';
  /** Current value (digits only, without country code) */
  value?: string;
  /** Callback when value changes (returns digits only) */
  onChange?: (value: string) => void;
  /** Callback when input loses focus */
  onBlur?: () => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Full width input */
  fullWidth?: boolean;
  /** Input name attribute */
  name?: string;
  /** Placeholder text */
  placeholder?: string;
}
