import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { MultiSelectProps, MultiSelectOption } from './MultiSelect.types';

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  disabled = false,
  error,
  helperText,
  maxHeight = 300,
  groupBy = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        opt.description?.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  // Group options by group property
  const groupedOptions = useMemo(() => {
    if (!groupBy) return { '': filteredOptions };

    return filteredOptions.reduce((acc, option) => {
      const group = option.group || '';
      if (!acc[group]) acc[group] = [];
      acc[group].push(option);
      return acc;
    }, {} as Record<string, MultiSelectOption[]>);
  }, [filteredOptions, groupBy]);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectAll = () => {
    const allValues = filteredOptions.map((opt) => opt.value);
    const newValues = [...new Set([...value, ...allValues])];
    onChange(newValues);
  };

  const clearAll = () => {
    const filteredValues = filteredOptions.map((opt) => opt.value);
    onChange(value.filter((v) => !filteredValues.includes(v)));
  };

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between gap-2 px-3 py-2
            border rounded-md bg-white dark:bg-dark-bg
            text-left text-sm
            ${error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'
            }
            ${disabled
              ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
              : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
            }
            focus:outline-none focus:ring-2
          `}
        >
          <span className={`flex-1 truncate ${!selectedLabels.length ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            {selectedLabels.length > 0
              ? selectedLabels.length === 1
                ? selectedLabels[0]
                : `${selectedLabels.length} selected`
              : placeholder}
          </span>
          <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDownIcon />
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-md shadow-lg">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200 dark:border-dark-border">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 px-2 py-1.5 border-b border-gray-200 dark:border-dark-border">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Select all
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
              >
                Clear
              </button>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto" style={{ maxHeight }}>
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group}>
                  {group && groupBy && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-dark-bg">
                      {group}
                    </div>
                  )}
                  {groupOptions.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleOption(option.value)}
                        className={`
                          w-full flex items-start gap-3 px-3 py-2 text-left text-sm
                          transition-colors
                          ${isSelected
                            ? 'bg-primary/10 dark:bg-primary/20'
                            : 'hover:bg-gray-50 dark:hover:bg-dark-cardHover'
                          }
                        `}
                      >
                        <span
                          className={`
                            flex-shrink-0 mt-0.5 w-4 h-4 border rounded flex items-center justify-center
                            ${isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'border-gray-300 dark:border-gray-600'
                            }
                          `}
                        >
                          {isSelected && <CheckIcon />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}

              {filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helper text / Error */}
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};
