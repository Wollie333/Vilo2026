/**
 * FilterSidebar Component Types
 */

import type { PropertySearchFilters } from '@/types';

export interface FilterSidebarProps {
  filters: PropertySearchFilters;
  onFilterChange: (filters: PropertySearchFilters) => void;
  onClearFilters?: () => void;
  className?: string;
}

export interface FilterState extends PropertySearchFilters {
  // Additional UI state if needed
}
