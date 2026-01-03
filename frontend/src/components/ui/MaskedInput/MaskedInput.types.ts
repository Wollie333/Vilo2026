import { ReactNode } from 'react';

export type MaskType = 'vat' | 'company_registration';

export interface MaskedInputProps {
  /** Label text displayed above the input */
  label?: string;
  /** Error message to display below the input */
  error?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Size variant of the input */
  size?: 'sm' | 'md' | 'lg';
  /** Current value (raw, without formatting) */
  value?: string;
  /** Callback when value changes (returns raw value) */
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
  /** Mask type to apply */
  mask: MaskType;
  /** Icon to display on the left side */
  leftIcon?: ReactNode;
}
