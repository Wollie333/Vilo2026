import { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  helperText?: string; // Alias for hint
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      helperText,
      options,
      placeholder,
      size = 'md',
      fullWidth = true,
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Support both hint and helperText (helperText takes precedence)
    const hintText = helperText || hint;
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`
              block rounded-lg border bg-white dark:bg-dark-card
              transition-colors duration-200
              appearance-none cursor-pointer
              pr-10
              ${sizeStyles[size]}
              ${fullWidth ? 'w-full' : ''}
              ${
                error
                  ? 'border-error focus:ring-error focus:border-error'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'
              }
              ${
                disabled
                  ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
                  : 'hover:border-gray-400 dark:hover:border-gray-500'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-0
              text-gray-900 dark:text-white
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-error">{error}</p>
        )}
        {hintText && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hintText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
