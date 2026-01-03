import { forwardRef } from 'react';
import type { InputProps } from './Input.types';

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

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

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

    const paddingStyles = leftIcon
      ? 'pl-10'
      : rightIcon || isLoading
      ? 'pr-10'
      : '';

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
            disabled={disabled || isLoading}
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
              ${className}
            `}
            {...props}
          />

          {(rightIcon || isLoading) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {isLoading ? (
                <svg
                  className={`animate-spin text-gray-400 ${iconSizeStyles[size]}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <span className={`text-gray-400 dark:text-gray-500 ${iconSizeStyles[size]}`}>
                  {rightIcon}
                </span>
              )}
            </div>
          )}
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

Input.displayName = 'Input';
