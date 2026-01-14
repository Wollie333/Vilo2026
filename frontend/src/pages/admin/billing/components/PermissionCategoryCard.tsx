/**
 * PermissionCategoryCard Component
 *
 * Collapsible card displaying permissions grouped by resource with action checkboxes
 */

import React, { useState, useMemo } from 'react';
import { Card, Badge, Button, InfoTooltip } from '@/components/ui';
import type { PermissionCategory, Permission } from '@/types/billing.types';

interface PermissionCategoryCardProps {
  category: PermissionCategory;
  selectedPermissions: string[];
  onTogglePermission: (permissionId: string, enabled: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

// Group permissions by resource
const groupByResource = (permissions: Permission[]): Record<string, Permission[]> => {
  return permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );
};

// Format resource name for display
const formatResourceName = (resource: string): string => {
  return resource
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Color mapping for categories
const colorStyles: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  blue: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  },
  green: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  },
  purple: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  },
  pink: {
    border: 'border-l-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    text: 'text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
  },
  orange: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  },
  cyan: {
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    badge: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',
  },
  gray: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300',
  },
  yellow: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  },
};

export const PermissionCategoryCard: React.FC<PermissionCategoryCardProps> = ({
  category,
  selectedPermissions,
  onTogglePermission,
  onSelectAll,
  onDeselectAll,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Group permissions by resource
  const permissionsByResource = useMemo(
    () => groupByResource(category.permissions),
    [category.permissions]
  );

  // Count selected permissions in this category
  const selectedCount = category.permissions.filter((p) =>
    selectedPermissions.includes(p.id)
  ).length;
  const totalCount = category.permissions.length;
  const allSelected = selectedCount === totalCount;

  const colors = colorStyles[category.color] || colorStyles.gray;

  // Action order
  const actionOrder = ['create', 'read', 'update', 'delete', 'manage'];

  return (
    <Card variant="bordered" className={`border-l-4 ${colors.border}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Icon placeholder - you can add actual icons here */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
            <span className={`text-lg font-semibold ${colors.text}`}>
              {category.display_name.charAt(0)}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {category.display_name}
              </h3>
              <span className={`px-2 py-0.5 text-xs rounded-full ${colors.badge}`}>
                {selectedCount} / {totalCount}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (allSelected) {
                onDeselectAll();
              } else {
                onSelectAll();
              }
            }}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-dark-border">
          {Object.entries(permissionsByResource).map(([resource, permissions]) => (
            <div key={resource} className="flex items-center gap-4 py-3">
              <div className="w-40 flex-shrink-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatResourceName(resource)}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {actionOrder.map((action) => {
                  const permission = permissions.find((p) => p.action === action);
                  if (!permission) return null;

                  const isChecked = selectedPermissions.includes(permission.id);

                  return (
                    <div key={permission.id} className="flex items-center gap-1.5">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => onTogglePermission(permission.id, e.target.checked)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                          {action}
                        </span>
                      </label>
                      {permission.description && (
                        <InfoTooltip content={permission.description} position="top" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
