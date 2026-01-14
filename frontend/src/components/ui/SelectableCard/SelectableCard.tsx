/**
 * SelectableCard Component
 *
 * A card component that can be selected/deselected with visual feedback.
 * Used for selecting items like payment rules, add-ons, and promo codes.
 */

import React from 'react';
import { HiOutlineCheck } from 'react-icons/hi';
import { SelectableCardProps } from './SelectableCard.types';

export const SelectableCard: React.FC<SelectableCardProps> = ({
  id,
  selected,
  disabled = false,
  onSelect,
  children,
  className = '',
}) => {
  const handleClick = () => {
    if (!disabled) {
      onSelect(id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      className={`
        relative
        border-2 rounded-lg p-4
        transition-all duration-200
        ${
          selected
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
        }
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:shadow-md'
        }
        ${className}
      `}
    >
      {/* Checkmark indicator when selected */}
      {selected && (
        <div
          className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md"
          aria-label="Selected"
        >
          <HiOutlineCheck className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Custom content */}
      <div className={selected ? 'pr-8' : ''}>{children}</div>
    </div>
  );
};
