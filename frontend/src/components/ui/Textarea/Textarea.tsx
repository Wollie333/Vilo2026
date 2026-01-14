import { forwardRef, TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  size?: 'sm' | 'md' | 'lg';
  /** Whether the textarea should take full width. Defaults to true. */
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      resize = 'vertical',
      size = 'md',
      fullWidth = true,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const sizeClasses = {
      sm: 'text-sm px-3 py-2 min-h-[100px]',
      md: 'text-sm px-4 py-3 min-h-[140px]',
      lg: 'text-base px-4 py-3 min-h-[180px]',
    };

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            ${resizeClasses[resize]}
            ${fullWidth ? 'w-full' : ''}
            rounded-lg border
            bg-white dark:bg-dark-card
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-gray-200 dark:border-dark-border focus:border-primary focus:ring-primary/20'
            }
            ${disabled
              ? 'cursor-not-allowed opacity-50 bg-gray-50 dark:bg-dark-border'
              : ''
            }
          `}
          {...props}
        />
        {(helperText || error) && (
          <p
            className={`mt-1.5 text-xs ${
              error ? 'text-error' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
