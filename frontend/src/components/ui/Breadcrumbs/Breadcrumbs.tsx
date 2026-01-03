import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
  maxItems?: number;
  showHomeIcon?: boolean;
}

export function Breadcrumbs({
  items,
  separator,
  className = '',
  maxItems,
  showHomeIcon = false,
}: BreadcrumbsProps) {
  const defaultSeparator = (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  // Add home icon to first item if showHomeIcon is true
  let displayItems = showHomeIcon && items.length > 0
    ? [{ ...items[0], icon: <HomeIcon className="w-4 h-4" /> }, ...items.slice(1)]
    : items;

  // Handle collapsed breadcrumbs
  if (maxItems && displayItems.length > maxItems) {
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 2));
    displayItems = [
      firstItem,
      { label: '...', href: undefined },
      ...lastItems,
    ];
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-sm">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isCollapsed = item.label === '...';

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-gray-400" aria-hidden="true">
                  {separator || defaultSeparator}
                </span>
              )}
              {isCollapsed ? (
                <span className="text-gray-400 px-1">...</span>
              ) : item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1.5 ${
                    isLast
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Home icon for convenience
export const HomeIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);
