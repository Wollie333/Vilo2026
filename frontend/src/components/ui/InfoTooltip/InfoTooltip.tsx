/**
 * InfoTooltip Component
 *
 * Small info icon that shows a tooltip on hover with explanatory text.
 * Used for providing context and help text without cluttering the UI.
 */

import React, { useState } from 'react';

export interface InfoTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

// Info icon SVG
const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="8"
      cy="8"
      r="7"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M8 7V11M8 5V5.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700',
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Info Icon */}
      <InfoIcon className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help transition-colors" />

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`
            absolute z-50 px-3 py-2 text-xs font-normal text-white
            bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg
            whitespace-normal max-w-xs
            ${positionClasses[position]}
          `}
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-0 h-0
              border-4 border-transparent
              ${arrowClasses[position]}
            `}
          />
        </div>
      )}
    </div>
  );
};
