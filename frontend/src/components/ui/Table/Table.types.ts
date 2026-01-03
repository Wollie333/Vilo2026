import { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';

// Size options for table components
export type TableSize = 'sm' | 'md' | 'lg';

// Visual variants for the table
export type TableVariant = 'default' | 'striped' | 'bordered';

// Main Table props
export interface TableProps {
  children: ReactNode;
  className?: string;
  variant?: TableVariant;
  size?: TableSize;
  /** Show loading overlay */
  loading?: boolean;
  /** Component to show when table is empty */
  emptyState?: ReactNode;
  /** Keep header visible on scroll */
  stickyHeader?: boolean;
}

// Table head wrapper
export interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

// Table body wrapper
export interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

// Table row
export interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  /** Highlight row as selected */
  selected?: boolean;
  /** Dim row and prevent interaction */
  disabled?: boolean;
  /** Row identifier for selection */
  id?: string;
}

// Table header cell
export interface TableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
  /** Enable sorting UI */
  sortable?: boolean;
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc' | null;
  /** Sort callback */
  onSort?: () => void;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Fixed width */
  width?: string | number;
}

// Table data cell
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  className?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Enable text truncation with ellipsis */
  truncate?: boolean;
}

// Table footer
export interface TableFooterProps {
  children: ReactNode;
  className?: string;
}

// Checkbox cell for row selection
export interface TableCheckboxCellProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Show indeterminate state (for select all) */
  indeterminate?: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Disable the checkbox */
  disabled?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
  /** Render as header cell */
  asHeader?: boolean;
}

// Pagination component props
export interface TablePaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  pageSize: number;
  /** Page change callback */
  onPageChange: (page: number) => void;
  /** Page size change callback */
  onPageSizeChange?: (size: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show item count text */
  showItemCount?: boolean;
  /** Additional classes */
  className?: string;
}

// Toolbar for bulk actions
export interface TableToolbarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Clear selection callback */
  onClearSelection: () => void;
  /** Bulk action buttons */
  actions?: TableBulkAction[];
  /** Additional classes */
  className?: string;
}

// Individual bulk action
export interface TableBulkAction {
  /** Button label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Button style variant */
  variant?: 'default' | 'danger' | 'warning';
  /** Disable the action */
  disabled?: boolean;
}

// Selection state returned by useTableSelection hook
export interface TableSelectionState<T> {
  /** Set of selected item IDs */
  selectedIds: Set<string>;
  /** Whether all items are selected */
  isAllSelected: boolean;
  /** Whether some but not all items are selected */
  isIndeterminate: boolean;
  /** Select all items */
  selectAll: () => void;
  /** Deselect all items */
  deselectAll: () => void;
  /** Toggle selection of a single item */
  toggleSelection: (id: string) => void;
  /** Check if an item is selected */
  isSelected: (id: string) => boolean;
  /** Array of selected items */
  selectedItems: T[];
  /** Number of selected items */
  selectedCount: number;
}

// Options for useTableSelection hook
export interface UseTableSelectionOptions {
  /** Initially selected IDs */
  initialSelectedIds?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<string>) => void;
}
