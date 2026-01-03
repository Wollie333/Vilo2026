import { Spinner } from '../Spinner';
import type {
  TableProps,
  TableHeadProps,
  TableBodyProps,
  TableRowProps,
  TableHeaderProps,
  TableCellProps,
  TableFooterProps,
} from './Table.types';

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Table({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  loading = false,
  emptyState,
  stickyHeader = false,
}: TableProps) {
  return (
    <div className="w-full overflow-auto relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-dark-bg/60 flex items-center justify-center z-10">
          <Spinner size="lg" />
        </div>
      )}
      <table
        className={`
          w-full text-left
          ${className}
        `}
        data-variant={variant}
        data-size={size}
        data-sticky-header={stickyHeader}
      >
        {children}
      </table>
      {/* Empty state - rendered outside table for proper layout */}
      {emptyState && !loading && (
        <div className="hidden [table:empty+&]:block">
          {emptyState}
        </div>
      )}
    </div>
  );
}

export function TableHead({ children, className = '' }: TableHeadProps) {
  return (
    <thead
      className={`
        bg-gray-50 dark:bg-dark-card
        [table[data-sticky-header="true"]_&]:sticky
        [table[data-sticky-header="true"]_&]:top-0
        [table[data-sticky-header="true"]_&]:z-10
        ${className}
      `}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return (
    <tbody
      className={`
        divide-y divide-gray-100 dark:divide-dark-border
        [table[data-variant="striped"]_&>tr:nth-child(even)]:bg-gray-50
        dark:[table[data-variant="striped"]_&>tr:nth-child(even)]:bg-dark-card/50
        ${className}
      `}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = '',
  onClick,
  selected,
  disabled,
}: TableRowProps) {
  return (
    <tr
      onClick={disabled ? undefined : onClick}
      className={`
        bg-white dark:bg-dark-bg
        ${onClick && !disabled ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card' : ''}
        ${selected ? 'bg-primary/5 dark:bg-primary/10' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  className = '',
  sortable = false,
  sortDirection,
  onSort,
  align = 'left',
  width,
  ...props
}: TableHeaderProps) {
  const widthStyle = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined;

  return (
    <th
      className={`
        px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider
        [table[data-size="sm"]_&]:px-3 [table[data-size="sm"]_&]:py-2
        [table[data-size="lg"]_&]:px-5 [table[data-size="lg"]_&]:py-4
        ${alignClasses[align]}
        ${sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-dark-border' : ''}
        ${className}
      `}
      onClick={sortable ? onSort : undefined}
      style={widthStyle}
      {...props}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {children}
        {sortable && (
          <span className="inline-flex flex-col">
            <svg
              className={`w-3 h-3 ${sortDirection === 'asc' ? 'text-primary' : 'text-gray-400'}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 5l-7 7h14l-7-7z" />
            </svg>
            <svg
              className={`w-3 h-3 -mt-1 ${sortDirection === 'desc' ? 'text-primary' : 'text-gray-400'}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 19l7-7H5l7 7z" />
            </svg>
          </span>
        )}
      </div>
    </th>
  );
}

export function TableCell({
  children,
  className = '',
  align = 'left',
  truncate = false,
  ...props
}: TableCellProps) {
  return (
    <td
      className={`
        px-4 py-3 text-sm text-gray-700 dark:text-gray-300
        [table[data-size="sm"]_&]:px-3 [table[data-size="sm"]_&]:py-2 [table[data-size="sm"]_&]:text-xs
        [table[data-size="lg"]_&]:px-5 [table[data-size="lg"]_&]:py-4
        ${alignClasses[align]}
        ${truncate ? 'truncate max-w-0' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableFooter({ children, className = '' }: TableFooterProps) {
  return (
    <tfoot
      className={`
        bg-gray-50 dark:bg-dark-card
        border-t border-gray-200 dark:border-dark-border
        ${className}
      `}
    >
      {children}
    </tfoot>
  );
}
