import type { TableToolbarProps } from './Table.types';

/**
 * Contextual toolbar that appears when table rows are selected
 * Displays selection count and bulk action buttons
 */
export function TableToolbar({
  selectedCount,
  onClearSelection,
  actions = [],
  className = '',
}: TableToolbarProps) {
  if (selectedCount === 0) return null;

  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-card dark:text-gray-200 dark:hover:bg-dark-card-hover',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30',
    warning: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30',
  };

  return (
    <div
      className={`
        flex items-center justify-between gap-4 px-4 py-2
        bg-primary/10 dark:bg-primary/20
        border-b border-primary/20 dark:border-primary/30
        ${className}
      `}
    >
      {/* Selection info */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-xs text-primary hover:text-primary-600 dark:hover:text-primary-400 font-medium"
        >
          Clear selection
        </button>
      </div>

      {/* Bulk actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variantStyles[action.variant || 'default']}
              `}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
