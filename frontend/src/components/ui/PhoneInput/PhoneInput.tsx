import { forwardRef, useState, useEffect } from 'react';
import type { PhoneInputProps } from './PhoneInput.types';

const sizeStyles = {
  sm: 'py-1 text-xs',
  md: 'py-1.5 text-sm',
  lg: 'py-2 text-sm',
};

// Format phone number as XX XXX XXXX
const formatPhoneDisplay = (digits: string): string => {
  const cleaned = digits.replace(/\D/g, '').slice(0, 9);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
};

// Extract digits only from formatted value
const extractDigits = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      value = '',
      onChange,
      onBlur,
      disabled = false,
      fullWidth = false,
      name,
      placeholder = 'XX XXX XXXX',
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(() => formatPhoneDisplay(value));
    const inputId = `phone-input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    // Sync display value when external value changes
    useEffect(() => {
      setDisplayValue(formatPhoneDisplay(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      // Remove the +27 prefix if user somehow pastes it
      const cleanedInput = input.replace(/^\+27\s*/, '');
      const digits = extractDigits(cleanedInput);
      const formatted = formatPhoneDisplay(digits);

      setDisplayValue(formatted);
      onChange?.(digits);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow navigation and deletion keys
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
      if (allowedKeys.includes(e.key)) return;

      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey || e.metaKey) return;

      // Only allow digits
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const baseInputStyles = `
      block rounded-r-md border bg-white
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
      dark:bg-dark-card dark:text-white dark:disabled:bg-dark-bg dark:disabled:text-gray-500
      pl-3 pr-3
    `;

    const borderStyles = hasError
      ? 'border-error focus:border-error focus:ring-error/20'
      : 'border-gray-300 focus:border-primary focus:ring-primary/20 dark:border-dark-border dark:focus:border-primary';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}

        <div className="flex">
          {/* Country Code Prefix */}
          <div
            className={`
              flex items-center gap-1.5 px-3 rounded-l-md border border-r-0
              bg-gray-50 dark:bg-dark-bg
              ${hasError
                ? 'border-error'
                : 'border-gray-300 dark:border-dark-border'
              }
              ${sizeStyles[size]}
            `}
          >
            {/* South African Flag */}
            <span className="text-base" role="img" aria-label="South Africa">
              <svg width="20" height="14" viewBox="0 0 900 600" className="rounded-sm">
                <rect fill="#007749" width="900" height="600"/>
                <polygon fill="#FFB81C" points="0,0 450,300 0,600"/>
                <polygon fill="#000" points="0,0 375,300 0,600"/>
                <polygon fill="#DE3831" points="0,0 450,200 900,200 900,0"/>
                <polygon fill="#002395" points="0,600 450,400 900,400 900,600"/>
                <polygon fill="#fff" points="0,0 450,225 900,225 900,175 450,175 0,0"/>
                <polygon fill="#fff" points="0,600 450,375 900,375 900,425 450,425 0,600"/>
              </svg>
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">+27</span>
          </div>

          {/* Phone Input */}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="tel"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={`
              ${baseInputStyles}
              ${borderStyles}
              ${sizeStyles[size]}
              ${fullWidth ? 'flex-1' : 'w-32'}
            `}
          />
        </div>

        {hasError && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-xs text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !hasError && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
