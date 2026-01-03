export interface ProgressProps {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  label?: string;
  className?: string;
  indeterminate?: boolean;
}

export function Progress({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  label,
  className = '',
  indeterminate = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showValue && !indeterminate && (
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`
          w-full overflow-hidden rounded-full
          bg-gray-200 dark:bg-dark-border
          ${sizeClasses[size]}
        `}
      >
        <div
          className={`
            ${sizeClasses[size]} rounded-full
            ${variantClasses[variant]}
            transition-all duration-300 ease-out
            ${indeterminate ? 'animate-progress-indeterminate w-1/3' : ''}
          `}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Circular Progress variant
export interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  className?: string;
  strokeWidth?: number;
  indeterminate?: boolean;
}

export function CircularProgress({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  className = '',
  strokeWidth = 4,
  indeterminate = false,
}: CircularProgressProps) {
  const percentage = indeterminate ? 25 : Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
  };

  const sizePx = sizeMap[size];
  const radius = (sizePx - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    error: 'stroke-error',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={sizePx}
        height={sizePx}
        className={`-rotate-90 ${indeterminate ? 'animate-spin' : ''}`}
      >
        {/* Background circle */}
        <circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-200 dark:stroke-dark-border"
        />
        {/* Progress circle */}
        <circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${variantColors[variant]} transition-all duration-300 ease-out`}
        />
      </svg>
      {showValue && !indeterminate && (
        <span className="absolute text-xs font-semibold text-gray-700 dark:text-gray-300">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
