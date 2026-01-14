/**
 * AddonCard
 *
 * Displays a single add-on with pricing and type information.
 * Used in the AddonsTab for management.
 */

import React from 'react';
import { Badge } from '@/components/ui';
import type { AddOn } from '@/types/addon.types';
import { ADDON_TYPE_LABELS, ADDON_PRICING_TYPE_LABELS } from '@/types/addon.types';

interface AddonCardProps {
  addon: AddOn;
  onEdit: (addon: AddOn) => void;
  onDelete: (addon: AddOn) => void;
}

// Icons
const ServiceIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ProductIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ExperienceIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'service':
      return <ServiceIcon />;
    case 'product':
      return <ProductIcon />;
    case 'experience':
      return <ExperienceIcon />;
    default:
      return <ServiceIcon />;
  }
};

const getTypeBadgeVariant = (type: string): 'primary' | 'default' | 'success' | 'warning' | 'error' => {
  switch (type) {
    case 'service':
      return 'primary';
    case 'product':
      return 'default';
    case 'experience':
      return 'success';
    default:
      return 'default';
  }
};

export const AddonCard: React.FC<AddonCardProps> = ({ addon, onEdit, onDelete }) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className={`relative p-4 rounded-lg border ${addon.is_active ? 'border-gray-200 dark:border-dark-border' : 'border-gray-200/50 dark:border-dark-border/50 opacity-60'} bg-white dark:bg-dark-card hover:border-gray-300 dark:hover:border-gray-600 transition-colors`}>
      {/* Image thumbnail (if exists) */}
      {addon.image_url && (
        <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-border h-32">
          <img
            src={addon.image_url}
            alt={addon.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {addon.name}
            </h4>
            <Badge variant={getTypeBadgeVariant(addon.type)} size="sm">
              <span className="flex items-center gap-1">
                {getTypeIcon(addon.type)}
                {ADDON_TYPE_LABELS[addon.type]}
              </span>
            </Badge>
            {!addon.is_active && (
              <Badge variant="default" size="sm">Inactive</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {addon.description || 'No description'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            onClick={() => onEdit(addon)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-dark-border transition-colors"
            title="Edit add-on"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => onDelete(addon)}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            title="Delete add-on"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Pricing */}
      <div className="pt-3 border-t border-gray-100 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <CurrencyIcon />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(addon.price, addon.currency)}
              </span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark-border px-2 py-0.5 rounded">
              {ADDON_PRICING_TYPE_LABELS[addon.pricing_type]}
            </span>
          </div>
          {addon.max_quantity > 1 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Max: {addon.max_quantity}
            </span>
          )}
        </div>
      </div>

      {/* Room availability */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {addon.room_ids === null || addon.room_ids.length === 0 ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Available for all rooms
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                {addon.room_ids.length} room{addon.room_ids.length !== 1 ? 's' : ''} only
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
