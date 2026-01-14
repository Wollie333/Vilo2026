import React from 'react';
import type { CTAButtonProps } from './CTAButton.types';

/**
 * CTAButton - A prominent call-to-action button for key conversion points
 *
 * Features:
 * - Larger size with prominent typography
 * - Subtle gradient for depth
 * - Smooth hover/active states
 * - Loading state with spinner
 * - Multiple variants (primary, secondary, dark)
 */
export const CTAButton: React.FC<CTAButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText = 'Processing...',
  icon,
  iconPosition = 'right',
  variant = 'primary',
  size = 'default',
  fullWidth = true,
  className = '',
  type = 'button',
  id,
  dataAttributes = {},
}) => {
  const isDisabled = disabled || loading;

  // Base styles
  const baseStyles = `
    relative inline-flex items-center justify-center gap-3
    font-semibold tracking-wide
    rounded-2xl
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed
    overflow-hidden
  `;

  // Size styles
  const sizeStyles = {
    default: 'px-8 py-4 text-base min-h-[56px]',
    large: 'px-10 py-5 text-lg min-h-[64px]',
  };

  // Variant styles
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-primary to-emerald-600
      text-white
      shadow-lg shadow-primary/25
      hover:shadow-xl hover:shadow-primary/30
      hover:from-primary hover:to-emerald-500
      hover:-translate-y-0.5
      active:translate-y-0 active:shadow-md
      focus:ring-primary/50
      disabled:from-gray-400 disabled:to-gray-500
      disabled:shadow-none disabled:hover:translate-y-0
    `,
    secondary: `
      bg-white
      text-gray-900
      border-2 border-gray-200
      shadow-md
      hover:border-primary hover:text-primary
      hover:shadow-lg hover:-translate-y-0.5
      active:translate-y-0 active:shadow-sm
      focus:ring-primary/50
      disabled:bg-gray-100 disabled:text-gray-400
      disabled:border-gray-200 disabled:hover:translate-y-0
    `,
    dark: `
      bg-gradient-to-r from-gray-900 to-gray-800
      text-white
      shadow-lg shadow-gray-900/25
      hover:shadow-xl hover:shadow-gray-900/30
      hover:from-gray-800 hover:to-gray-700
      hover:-translate-y-0.5
      active:translate-y-0 active:shadow-md
      focus:ring-gray-500/50
      disabled:from-gray-600 disabled:to-gray-700
      disabled:shadow-none disabled:hover:translate-y-0
    `,
  };

  // Spinner component
  const Spinner = () => (
    <svg
      className="animate-spin h-5 w-5"
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
  );

  // Convert dataAttributes to data-* props
  const dataProps = Object.entries(dataAttributes).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [`data-${key}`]: value,
    }),
    {}
  );

  return (
    <button
      type={type}
      id={id}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...dataProps}
    >
      {/* Shine effect overlay */}
      {variant === 'primary' && !isDisabled && (
        <span className="absolute inset-0 overflow-hidden rounded-2xl">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
        </span>
      )}

      {/* Content */}
      <span className="relative flex items-center justify-center gap-3">
        {loading ? (
          <>
            <Spinner />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
            <span>{children}</span>
            {icon && iconPosition === 'right' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
          </>
        )}
      </span>
    </button>
  );
};

export default CTAButton;
