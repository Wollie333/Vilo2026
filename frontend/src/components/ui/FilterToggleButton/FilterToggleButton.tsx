import React from 'react';
import { HiOutlineAdjustments } from 'react-icons/hi';
import { Button } from '../Button';
import { Badge } from '../Badge';
import type { FilterToggleButtonProps } from './FilterToggleButton.types';

/**
 * FilterToggleButton Component
 *
 * A button that toggles the visibility of a filter panel.
 * Shows an active filter count badge when filters are applied.
 */
export const FilterToggleButton: React.FC<FilterToggleButtonProps> = ({
  isOpen,
  onToggle,
  activeFilterCount = 0,
  className = '',
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={`
        relative flex items-center gap-1.5
        ${isOpen ? 'bg-primary/10 border-primary text-primary' : ''}
        ${className}
      `}
    >
      <HiOutlineAdjustments className="w-4 h-4" />
      <span className="hidden sm:inline">Filters</span>
      {activeFilterCount > 0 && (
        <Badge
          variant="primary"
          size="sm"
          className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs"
        >
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );
};
