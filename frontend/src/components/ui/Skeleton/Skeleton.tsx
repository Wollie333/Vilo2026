export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const defaultHeight = variant === 'text' ? '1rem' : undefined;

  return (
    <div
      className={`
        bg-gray-200 dark:bg-dark-border
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={{
        width: width,
        height: height || defaultHeight,
      }}
    />
  );
}

// Pre-built skeleton patterns
export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '75%' : '100%'}
          height="0.875rem"
        />
      ))}
    </div>
  );
}

export interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  showAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({
  className = '',
  showImage = true,
  showAvatar = false,
  lines = 3,
}: SkeletonCardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden ${className}`}>
      {showImage && (
        <Skeleton variant="rectangular" width="100%" height="150px" animation="pulse" />
      )}
      <div className="p-4 space-y-3">
        {showAvatar && (
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="40px" height="40px" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" height="0.875rem" />
              <Skeleton variant="text" width="40%" height="0.75rem" />
            </div>
          </div>
        )}
        <Skeleton variant="text" width="80%" height="1rem" />
        <SkeletonText lines={lines} />
      </div>
    </div>
  );
}

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: SkeletonTableProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-gray-200 dark:border-dark-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1" height="1rem" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-3 border-b border-gray-100 dark:border-dark-border"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              className="flex-1"
              height="0.875rem"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
