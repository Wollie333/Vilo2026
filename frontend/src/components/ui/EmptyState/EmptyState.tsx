import { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-6 px-4',
      icon: 'w-10 h-10 mb-3',
      title: 'text-sm',
      description: 'text-xs',
    },
    md: {
      container: 'py-10 px-6',
      icon: 'w-12 h-12 mb-4',
      title: 'text-base',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'w-16 h-16 mb-6',
      title: 'text-lg',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${sizes.container}
        ${className}
      `}
    >
      {icon && (
        <div className={`${sizes.icon} text-gray-400 dark:text-gray-500`}>
          {icon}
        </div>
      )}
      <h3 className={`${sizes.title} font-semibold text-gray-900 dark:text-white`}>
        {title}
      </h3>
      {description && (
        <p className={`${sizes.description} text-gray-500 dark:text-gray-400 mt-1 max-w-sm`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Pre-built empty state variants
export interface EmptyStateNoDataProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyStateNoData({
  title = 'No data found',
  description = "We couldn't find any data to display.",
  action,
  className,
}: EmptyStateNoDataProps) {
  return (
    <EmptyState
      icon={<NoDataIcon />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function EmptyStateNoResults({
  title = 'No results',
  description = 'Try adjusting your search or filters.',
  action,
  className,
}: EmptyStateNoDataProps) {
  return (
    <EmptyState
      icon={<SearchIcon />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function EmptyStateError({
  title = 'Something went wrong',
  description = 'An error occurred while loading. Please try again.',
  action,
  className,
}: EmptyStateNoDataProps) {
  return (
    <EmptyState
      icon={<ErrorIcon />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

// Icons
const NoDataIcon = () => (
  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);
