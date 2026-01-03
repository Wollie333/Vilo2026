import { useState, useEffect, useCallback } from 'react';
import type {
  FilterCardProps,
  FilterCardSearchProps,
  FilterCardFieldProps,
  FilterCardActionsProps,
} from './FilterCard.types';

// Search icon component
const SearchIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

/**
 * FilterCard - Container for filter controls
 * Provides consistent styling and responsive layout for filter UIs
 */
function FilterCardRoot({
  children,
  className = '',
  layout,
}: FilterCardProps) {
  const layoutClasses = layout === 'stacked'
    ? 'flex-col'
    : layout === 'inline'
      ? 'flex-row'
      : 'flex-col lg:flex-row'; // responsive default

  return (
    <div
      className={`
        bg-white dark:bg-dark-card
        rounded-lg shadow-sm
        border border-gray-200 dark:border-dark-border
        p-4
        ${className}
      `}
    >
      <div className={`flex ${layoutClasses} gap-4 items-end`}>
        {children}
      </div>
    </div>
  );
}

/**
 * FilterCard.Search - Debounced search input
 * Automatically triggers onChange after debounce delay
 */
function FilterCardSearch({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
}: FilterCardSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  // Handle Enter key for immediate search
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onChange(localValue);
    }
  }, [localValue, onChange]);

  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-3 py-2
            text-sm
            bg-white dark:bg-dark-bg
            border border-gray-300 dark:border-dark-border
            rounded-md
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:ring-2 focus:ring-primary focus:border-primary
            transition-colors
          "
        />
      </div>
    </div>
  );
}

/**
 * FilterCard.Field - Wrapper for filter dropdowns
 * Provides consistent sizing and optional label
 */
function FilterCardField({
  children,
  label,
  className = '',
}: FilterCardFieldProps) {
  return (
    <div className={`min-w-[160px] ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

/**
 * FilterCard.Actions - Container for action buttons
 * Typically used for Reset button
 */
function FilterCardActions({
  children,
  className = '',
}: FilterCardActionsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {children}
    </div>
  );
}

// Compound component export
export const FilterCard = Object.assign(FilterCardRoot, {
  Search: FilterCardSearch,
  Field: FilterCardField,
  Actions: FilterCardActions,
});
