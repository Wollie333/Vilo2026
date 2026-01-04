import { forwardRef, useState } from 'react';
import type { PasswordInputProps } from './PasswordInput.types';

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

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      fullWidth = false,
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `password-input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const baseInputStyles = `
      block rounded-md border bg-white
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
      dark:bg-dark-card dark:text-white dark:disabled:bg-dark-bg dark:disabled:text-gray-500
      pr-10
    `;

    const borderStyles = hasError
      ? 'border-error focus:border-error focus:ring-error/20'
      : 'border-gray-300 focus:border-primary focus:ring-primary/20 dark:border-dark-border dark:focus:border-primary';

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={`
              ${baseInputStyles}
              ${borderStyles}
              ${sizeStyles[size]}
              ${fullWidth ? 'w-full' : ''}
              ${className}
            `}
            {...props}
          />

          <button
            type="button"
            onClick={toggleVisibility}
            disabled={disabled}
            className={`
              absolute inset-y-0 right-0 pr-3 flex items-center
              text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
              disabled:cursor-not-allowed disabled:opacity-50
              transition-colors duration-150
            `}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              // Eye-off icon (password visible, click to hide)
              <svg
                className={iconSizeStyles[size]}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              // Eye icon (password hidden, click to show)
              <svg
                className={iconSizeStyles[size]}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
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

PasswordInput.displayName = 'PasswordInput';
