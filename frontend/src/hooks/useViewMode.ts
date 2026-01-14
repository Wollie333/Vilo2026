/**
 * useViewMode Hook
 *
 * Custom hook for managing view mode preferences with localStorage persistence.
 * Provides a simple API for handling view mode state (table/grid/list) that
 * automatically persists to localStorage and restores on mount.
 *
 * @example
 * ```tsx
 * const { viewMode, setViewMode } = useViewMode('bookings-list-view', 'table');
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { ViewMode } from '@/components/ui';

export interface UseViewModeReturn {
  /** Current view mode */
  viewMode: ViewMode;
  /** Function to update view mode */
  setViewMode: (mode: ViewMode) => void;
}

/**
 * Hook for managing view mode with localStorage persistence
 *
 * @param storageKey - The localStorage key to use for persistence (e.g., 'bookings-list-view')
 * @param initialDefault - The default view mode to use if no saved preference exists (default: 'table')
 * @returns Object containing current viewMode and setViewMode function
 */
export function useViewMode(
  storageKey: string,
  initialDefault: ViewMode = 'table'
): UseViewModeReturn {
  // Initialize state from localStorage or use default
  // Using lazy initialization to only run once on mount
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(storageKey);
    // Validate that saved value is a valid ViewMode
    if (saved && (saved === 'table' || saved === 'grid' || saved === 'list')) {
      return saved as ViewMode;
    }
    return initialDefault;
  });

  // Persist to localStorage whenever viewMode changes
  useEffect(() => {
    localStorage.setItem(storageKey, viewMode);
  }, [viewMode, storageKey]);

  // Memoized setter to prevent unnecessary re-renders
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  return { viewMode, setViewMode };
}
