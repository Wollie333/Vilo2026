import type { TablePaginationProps } from './Table.types';

/**
 * Integrated pagination component for tables
 * Designed to be used within TableFooter
 */
export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = false,
  showItemCount = true,
  className = '',
}: TablePaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      {/* Item count */}
      <div className="flex items-center gap-4">
        {showItemCount && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Showing {startItem}-{endItem} of {totalItems} items
          </span>
        )}

        {/* Page size selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Rows per page:
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="
                text-xs px-2 py-1 rounded border
                border-gray-300 dark:border-dark-border
                bg-white dark:bg-dark-card
                text-gray-700 dark:text-gray-300
                focus:ring-2 focus:ring-primary focus:border-primary
              "
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="
            p-1.5 rounded
            text-gray-600 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-dark-card
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  min-w-[28px] h-7 px-2 rounded text-xs font-medium
                  transition-colors
                  ${
                    currentPage === pageNum
                      ? 'bg-primary text-brand-black'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
                  }
                `}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="
            p-1.5 rounded
            text-gray-600 dark:text-gray-400
            hover:bg-gray-100 dark:hover:bg-dark-card
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
