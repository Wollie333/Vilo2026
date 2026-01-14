import React, { memo } from 'react';
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { Card, Button, Badge } from '@/components/ui';
import type { MarketingFeatureCardProps } from './MarketingFeatureCard.types';

/**
 * MarketingFeatureCard Component
 *
 * Unified card component for displaying marketing features (seasonal rates, promotions, payment rules)
 * with consistent styling and layout.
 *
 * Wrapped with React.memo for performance optimization.
 */
export const MarketingFeatureCard: React.FC<MarketingFeatureCardProps> = memo(({
  title,
  subtitle,
  isActive = true,
  metadata,
  onEdit,
  onDelete,
  className = '',
}) => {
  return (
    <Card
      variant="bordered"
      className={`p-3 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between">
        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {title}
              {!isActive && (
                <Badge variant="default" size="sm">
                  Inactive
                </Badge>
              )}
            </div>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}

          {/* Metadata */}
          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {metadata.map((item, index) => (
                <span
                  key={index}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            aria-label="Edit"
          >
            <HiOutlinePencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Delete"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
});
