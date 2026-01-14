import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for syncing tab/view state with URL hash
 *
 * @param validTabs - Array of valid tab values
 * @param defaultTab - Default tab when hash is empty or invalid
 * @returns [activeTab, setTab] - Current tab and setter function
 *
 * @example
 * const VIEWS = ['overview', 'settings', 'billing'] as const;
 * const [activeView, setActiveView] = useHashTab(VIEWS, 'overview');
 * // URL: /page#settings -> activeView = 'settings'
 */
export function useHashTab<T extends string>(
  validTabs: readonly T[],
  defaultTab: T
): [T, (tab: T) => void] {
  // Get tab from current hash
  const getTabFromHash = useCallback((): T => {
    const hash = window.location.hash.slice(1); // Remove #
    return validTabs.includes(hash as T) ? (hash as T) : defaultTab;
  }, [validTabs, defaultTab]);

  const [activeTab, setActiveTab] = useState<T>(getTabFromHash);

  // Update hash when tab changes
  const setTab = useCallback((tab: T) => {
    setActiveTab(tab);
    // Use replaceState to avoid polluting browser history with every tab change
    const newUrl = `${window.location.pathname}${window.location.search}#${tab}`;
    window.history.replaceState(null, '', newUrl);
  }, []);

  // Listen for hash changes (browser back/forward or manual URL change)
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [getTabFromHash]);

  // Set initial hash if none exists
  useEffect(() => {
    if (!window.location.hash) {
      const newUrl = `${window.location.pathname}${window.location.search}#${defaultTab}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [defaultTab]);

  return [activeTab, setTab];
}
