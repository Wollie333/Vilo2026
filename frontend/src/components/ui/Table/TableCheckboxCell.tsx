import { useRef, useEffect } from 'react';
import type { TableCheckboxCellProps } from './Table.types';

/**
 * Specialized checkbox cell for table row selection
 * Supports indeterminate state for "select all" functionality
 */
export function TableCheckboxCell({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  ariaLabel,
  asHeader = false,
}: TableCheckboxCellProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Handle indeterminate state (can only be set via JS)
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const Cell = asHeader ? 'th' : 'td';

  return (
    <Cell className="w-10 px-3 py-2">
      <div className="flex items-center justify-center">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={ariaLabel}
          className="
            w-4 h-4 cursor-pointer
            border-2 rounded
            border-gray-300 dark:border-gray-600
            bg-white dark:bg-dark-card
            checked:bg-primary checked:border-primary
            focus:ring-2 focus:ring-primary focus:ring-offset-2
            focus:ring-offset-white dark:focus:ring-offset-dark-bg
            disabled:cursor-not-allowed disabled:opacity-50
            transition-colors duration-150
          "
        />
      </div>
    </Cell>
  );
}
