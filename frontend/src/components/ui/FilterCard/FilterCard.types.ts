import { ReactNode } from 'react';

export interface FilterCardProps {
  /** Filter fields and controls */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Layout direction */
  layout?: 'inline' | 'stacked';
}

export interface FilterCardSearchProps {
  /** Current search value */
  value: string;
  /** Change handler - called after debounce */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Additional CSS classes */
  className?: string;
}

export interface FilterCardFieldProps {
  /** Filter control (usually a Select component) */
  children: ReactNode;
  /** Optional label above the field */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface FilterCardActionsProps {
  /** Action buttons (Reset, etc.) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}
