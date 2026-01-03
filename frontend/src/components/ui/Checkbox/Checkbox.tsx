import { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
  error?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, size = 'md', indeterminate, error, disabled, className = '', id, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
      onChange?.(e);
    };
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    const sizeClasses = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const iconSizes = {
      sm: 'w-2.5 h-2.5',
      md: 'w-3 h-3',
      lg: 'w-3.5 h-3.5',
    };

    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <div className="relative flex items-center">
          <input
            ref={(el) => {
              if (el) {
                el.indeterminate = indeterminate || false;
              }
              if (typeof ref === 'function') {
                ref(el);
              } else if (ref) {
                ref.current = el;
              }
            }}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            onChange={handleChange}
            className={`
              ${sizeClasses[size]}
              peer appearance-none cursor-pointer
              border-2 rounded
              border-gray-300 dark:border-gray-600
              bg-white dark:bg-dark-card
              checked:bg-primary checked:border-primary
              focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-bg
              disabled:cursor-not-allowed disabled:opacity-50
              transition-colors duration-150
              ${error ? 'border-error' : ''}
            `}
            {...props}
          />
          <svg
            className={`
              ${iconSizes[size]}
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              pointer-events-none opacity-0 peer-checked:opacity-100
              text-brand-black transition-opacity duration-150
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {/* Indeterminate indicator */}
          <svg
            className={`
              ${iconSizes[size]}
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              pointer-events-none opacity-0 peer-indeterminate:opacity-100 peer-checked:opacity-0
              text-brand-black transition-opacity duration-150
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className={`
                  text-sm font-medium text-gray-900 dark:text-white cursor-pointer select-none
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </span>
            )}
            {error && (
              <span className="text-xs text-error mt-0.5">{error}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
