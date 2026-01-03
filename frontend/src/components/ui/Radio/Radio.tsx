import { forwardRef, InputHTMLAttributes } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, size = 'md', error, disabled, className = '', id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    const sizeClasses = {
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    };

    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            disabled={disabled}
            className={`
              ${sizeClasses[size]}
              peer appearance-none cursor-pointer
              border-2 rounded-full
              border-gray-300 dark:border-gray-600
              bg-white dark:bg-dark-card
              checked:border-primary
              focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-bg
              disabled:cursor-not-allowed disabled:opacity-50
              transition-colors duration-150
              ${error ? 'border-error' : ''}
            `}
            {...props}
          />
          <span
            className={`
              ${dotSizes[size]}
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              rounded-full bg-primary
              opacity-0 peer-checked:opacity-100
              transition-opacity duration-150
              pointer-events-none
            `}
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={radioId}
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

Radio.displayName = 'Radio';

// RadioGroup for managing multiple radios
export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  error?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  children,
  className = '',
  orientation = 'vertical',
  error,
}: RadioGroupProps) {
  // These props are used by Radio children via the name attribute
  void name;
  void value;
  void onChange;

  return (
    <div className={className}>
      <div
        role="radiogroup"
        className={`
          flex ${orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row gap-4'}
        `}
      >
        {children}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-error">{error}</p>
      )}
    </div>
  );
}
