export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  size = 'md',
  className = '',
  disabled = false,
}: PaginationProps) {
  const range = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const generatePagination = () => {
    const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 dots

    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, 'dots', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [1, 'dots', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, 'dots', ...middleRange, 'dots', totalPages];
    }

    return range(1, totalPages);
  };

  const pages = generatePagination();

  const sizeClasses = {
    sm: 'h-7 min-w-7 text-xs',
    md: 'h-9 min-w-9 text-sm',
    lg: 'h-11 min-w-11 text-base',
  };

  const buttonBase = `
    inline-flex items-center justify-center
    rounded-md font-medium
    transition-colors duration-150
    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex items-center gap-1 ${className}`}
    >
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className={`
          ${buttonBase} ${sizeClasses[size]}
          px-2 text-gray-600 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-dark-card
        `}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </button>

      {/* First page button */}
      {showFirstLast && currentPage > siblingCount + 2 && (
        <button
          onClick={() => onPageChange(1)}
          className={`
            ${buttonBase} ${sizeClasses[size]}
            px-3 text-gray-600 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-dark-card
          `}
          aria-label="First page"
        >
          <ChevronsLeftIcon className="w-4 h-4" />
        </button>
      )}

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === 'dots') {
          return (
            <span
              key={`dots-${index}`}
              className={`${sizeClasses[size]} px-2 text-gray-400`}
            >
              ...
            </span>
          );
        }

        const isCurrentPage = page === currentPage;

        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            disabled={isCurrentPage}
            aria-current={isCurrentPage ? 'page' : undefined}
            className={`
              ${buttonBase} ${sizeClasses[size]} px-3
              ${isCurrentPage
                ? 'bg-primary text-brand-black font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
              }
            `}
          >
            {page}
          </button>
        );
      })}

      {/* Last page button */}
      {showFirstLast && currentPage < totalPages - siblingCount - 1 && (
        <button
          onClick={() => onPageChange(totalPages)}
          className={`
            ${buttonBase} ${sizeClasses[size]}
            px-3 text-gray-600 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-dark-card
          `}
          aria-label="Last page"
        >
          <ChevronsRightIcon className="w-4 h-4" />
        </button>
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className={`
          ${buttonBase} ${sizeClasses[size]}
          px-2 text-gray-600 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-dark-card
        `}
        aria-label="Next page"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </nav>
  );
}

// Icons
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronsLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
);

const ChevronsRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);
