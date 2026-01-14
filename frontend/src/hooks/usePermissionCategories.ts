import { useState, useEffect, useCallback } from 'react';
import { billingService } from '@/services';
import type { PermissionCategory } from '@/types/billing.types';

/**
 * Hook to fetch permission categories for subscription plan editor
 * Permissions are grouped into 8 categories for better UX
 */
export const usePermissionCategories = () => {
  const [data, setData] = useState<PermissionCategory[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const categories = await billingService.getPermissionsByCategory();
      setData(categories);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch permission categories'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCategories,
  };
};
