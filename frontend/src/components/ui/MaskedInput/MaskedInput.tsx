import { forwardRef, useState, useEffect } from 'react';
import type { MaskedInputProps, MaskType } from './MaskedInput.types';

const sizeStyles = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-3.5 py-2 text-sm',
};

const iconSizeStyles = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4 w-4',
};

// Mask configurations
const maskConfigs: Record<MaskType, {
  format: (value: string) => string;
  maxLength: number;
  placeholder: string;
  pattern: RegExp;
}> = {
  // VAT: 10 digits (e.g., 4123456789)
  vat: {
    format: (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      return digits;
    },
    maxLength: 10,
    placeholder: '4XXXXXXXXX',
    pattern: /^\d$/,
  },
  // Company Registration: YYYY/NNNNNN/NN (e.g., 2020/123456/07)
  company_registration: {
    format: (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 12);
      if (digits.length === 0) return '';
      if (digits.length <= 4) return digits;
      if (digits.length <= 10) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
      return `${digits.slice(0, 4)}/${digits.slice(4, 10)}/${digits.slice(10)}`;
    },
    maxLength: 14, // 12 digits + 2 slashes
    placeholder: 'YYYY/NNNNNN/NN',
    pattern: /^\d$/,
  },
};

// Extract raw value (digits only)
const extractRaw = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
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
      placeholder,
      mask,
      leftIcon,
    },
    ref
  ) => {
    const config = maskConfigs[mask];
    const [displayValue, setDisplayValue] = useState(() => config.format(value));
    const inputId = `masked-input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    // Sync display value when external value changes
    useEffect(() => {
      setDisplayValue(config.format(value));
    }, [value, config]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const rawDigits = extractRaw(input);
      const formatted = config.format(rawDigits);

      setDisplayValue(formatted);
      onChange?.(rawDigits);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow navigation and deletion keys
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
      if (allowedKeys.includes(e.key)) return;

      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey || e.metaKey) return;

      // Only allow digits
      if (!config.pattern.test(e.key)) {
        e.preventDefault();
      }
    };

    const baseInputStyles = `
      block rounded-md border bg-white
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
      dark:bg-dark-card dark:text-white dark:disabled:bg-dark-bg dark:disabled:text-gray-500
    `;

    const borderStyles = hasError
      ? 'border-error focus:border-error focus:ring-error/20'
      : 'border-gray-300 focus:border-primary focus:ring-primary/20 dark:border-dark-border dark:focus:border-primary';

    const paddingStyles = leftIcon ? 'pl-10' : '';

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

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={`text-gray-400 dark:text-gray-500 ${iconSizeStyles[size]}`}>
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder || config.placeholder}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={`
              ${baseInputStyles}
              ${borderStyles}
              ${sizeStyles[size]}
              ${paddingStyles}
              ${fullWidth ? 'w-full' : ''}
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

MaskedInput.displayName = 'MaskedInput';
