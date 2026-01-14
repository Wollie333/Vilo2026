import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlineUsers,
  HiOutlineHome,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import type { RoomCardProps, RoomStatusBadgeProps, RoomCompletionBadgeProps, BedConfigDisplayProps, PriceDisplayProps } from './RoomCard.types';
import { BED_TYPE_LABELS, PRICING_MODE_LABELS } from '@/types/room.types';

// ============================================================================
// Helper Components
// ============================================================================

export function RoomStatusBadge({ isActive, isPaused, pausedReason, size = 'md' }: RoomStatusBadgeProps) {
  if (isPaused) {
    return (
      <Badge variant="warning" size={size} title={pausedReason || 'Room is paused'}>
        Paused
      </Badge>
    );
  }

  if (!isActive) {
    return (
      <Badge variant="error" size={size}>
        Inactive
      </Badge>
    );
  }

  return (
    <Badge variant="success" size={size}>
      Active
    </Badge>
  );
}

export function RoomCompletionBadge({ score, size = 'md' }: RoomCompletionBadgeProps) {
  // Don't show the badge if score is undefined, null, or 0 (not calculated)
  // Also hide if room is 100% complete - no need to show
  if (score == null || score === 0 || score >= 100) {
    return null;
  }

  const variant: 'success' | 'warning' | 'error' = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error';

  return (
    <Badge variant={variant} size={size}>
      {score}% Complete
    </Badge>
  );
}

export function BedConfigDisplay({ beds, compact = false }: BedConfigDisplayProps) {
  if (!beds || beds.length === 0) {
    return (
      <span className="text-gray-400 dark:text-gray-500 text-sm">
        No beds configured
      </span>
    );
  }

  const totalBeds = beds.reduce((sum, bed) => sum + bed.quantity, 0);

  if (compact) {
    return (
      <span className="text-gray-600 dark:text-gray-300 text-sm">
        {totalBeds} bed{totalBeds !== 1 ? 's' : ''}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {beds.map((bed) => (
        <span
          key={bed.id}
          className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-dark-sidebar text-gray-700 dark:text-gray-300 rounded"
        >
          {bed.quantity}x {BED_TYPE_LABELS[bed.bed_type]}
        </span>
      ))}
    </div>
  );
}

export function PriceDisplay({ price, currency, pricingMode, compact = false }: PriceDisplayProps) {
  // Hide if price is 0 or not set
  if (!price || price === 0) {
    return null;
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const modeLabel = pricingMode === 'per_unit'
    ? '/night'
    : pricingMode === 'per_person'
      ? '/person/night'
      : '/night (base)';

  if (compact) {
    return (
      <span className="text-primary font-semibold">
        {formatPrice(price)}
        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-0.5">
          {modeLabel}
        </span>
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold text-primary">
        {formatPrice(price)}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {PRICING_MODE_LABELS[pricingMode]}
      </span>
    </div>
  );
}

export function PromoCodeDisplay({ promotions }: { promotions?: Array<{ id: string; code: string; name: string; discount_type: string; discount_value: number; valid_from?: string | null; valid_until?: string | null; is_active: boolean }> }) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Only show active promotions
  const activePromos = promotions?.filter(p => p.is_active) || [];

  if (!activePromos || activePromos.length === 0) {
    return null;
  }

  const getDiscountLabel = (type: string, value: number) => {
    switch (type) {
      case 'percentage':
        return `${value}% off`;
      case 'fixed_amount':
        return `R${value} off`;
      case 'free_nights':
        return `${value} free night${value !== 1 ? 's' : ''}`;
      default:
        return 'Discount';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="mb-3 space-y-2">
      {activePromos.map((promo) => (
        <div key={promo.id} className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(promo.id)}
            onMouseLeave={() => setShowTooltip(null)}
            className="w-full flex items-center justify-between px-3 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors cursor-help"
          >
            <div className="flex items-center gap-2 min-w-0">
              <code className="text-xs font-semibold text-primary font-mono">
                {promo.code}
              </code>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {getDiscountLabel(promo.discount_type, promo.discount_value)}
              </span>
            </div>
          </button>

          {/* Tooltip */}
          {showTooltip === promo.id && (
            <div className="absolute z-50 left-0 right-0 top-full mt-2 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-xl pointer-events-none">
              <div className="space-y-1.5">
                <div>
                  <span className="font-semibold">{promo.name}</span>
                </div>
                <div className="text-white/90 dark:text-gray-700">
                  <span className="font-medium">Discount:</span> {getDiscountLabel(promo.discount_type, promo.discount_value)}
                </div>
                {(promo.valid_from || promo.valid_until) && (
                  <div className="text-white/90 dark:text-gray-700">
                    <span className="font-medium">Valid:</span>{' '}
                    {promo.valid_from ? formatDate(promo.valid_from) : 'Now'} - {promo.valid_until ? formatDate(promo.valid_until) : 'No expiry'}
                  </div>
                )}
              </div>
              {/* Arrow */}
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-100 transform rotate-45"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// RoomCard Component
// ============================================================================

export function RoomCard({
  room,
  interactive = true,
  selected = false,
  onClick,
  onEdit,
  onDelete,
  onTogglePause,
  showActions = true,
  compact = false,
  className = '',
}: RoomCardProps) {
  const handleCardClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Compact card rendering
  if (compact) {
    return (
      <Card
        variant="bordered"
        interactive={interactive}
        selected={selected}
        className={`${className}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail */}
          <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-dark-sidebar">
            {room.featured_image ? (
              <img
                src={room.featured_image}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <HiOutlineHome className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {room.name}
              </h4>
              <RoomStatusBadge
                isActive={room.is_active}
                isPaused={room.is_paused}
                pausedReason={room.paused_reason}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <HiOutlineUsers className="w-4 h-4" />
                {room.max_guests} guests
              </span>
              <BedConfigDisplay beds={room.beds} compact />
            </div>
          </div>

          {/* Price */}
          <div className="flex-shrink-0 text-right">
            <PriceDisplay
              price={room.base_price_per_night}
              currency={room.currency}
              pricingMode={room.pricing_mode}
              compact
            />
          </div>
        </div>
      </Card>
    );
  }

  // Full card rendering
  return (
    <Card
      variant="bordered"
      interactive={interactive}
      selected={selected}
      className={`overflow-hidden ${className}`}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-gray-100 dark:bg-dark-sidebar">
        {room.featured_image ? (
          <img
            src={room.featured_image}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <HiOutlinePhotograph className="w-12 h-12" />
            <span className="text-sm mt-1">No image</span>
          </div>
        )}

        {/* Status badges overlay */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          <RoomStatusBadge
            isActive={room.is_active}
            isPaused={room.is_paused}
            pausedReason={room.paused_reason}
          />
          <RoomCompletionBadge score={room.completeness_score} />
        </div>

        {/* Room code */}
        <div className="absolute bottom-2 right-2">
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono bg-black/60 text-white rounded">
            {room.room_code}
          </span>
        </div>
      </div>

      {/* Content */}
      <Card.Body>
        {/* Title and property */}
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {room.name}
          </h3>
          {room.property_name && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {room.property_name}
            </p>
          )}
        </div>

        {/* Description */}
        {room.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
            {room.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <HiOutlineUsers className="w-4 h-4" />
            {room.max_guests} guests
          </span>
          {room.inventory_mode === 'room_type' && (
            <span className="flex items-center gap-1">
              <HiOutlineHome className="w-4 h-4" />
              {room.total_units} units
            </span>
          )}
          {room.room_size_sqm && (
            <span>{room.room_size_sqm} m²</span>
          )}
        </div>

        {/* Beds */}
        <div className="mb-3">
          <BedConfigDisplay beds={room.beds} />
        </div>

        {/* Amenities preview */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {room.amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 dark:bg-dark-sidebar text-gray-600 dark:text-gray-400 rounded"
              >
                {amenity}
              </span>
            ))}
            {room.amenities.length > 4 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                +{room.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Promo Codes */}
        <PromoCodeDisplay promotions={room.promotions} />

        {/* Price and booking rules */}
        <div className="flex items-end justify-between pt-2 border-t border-gray-100 dark:border-dark-border">
          <PriceDisplay
            price={room.base_price_per_night}
            currency={room.currency}
            pricingMode={room.pricing_mode}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
            <div>Min {room.min_nights} night{room.min_nights !== 1 ? 's' : ''}</div>
            {room.max_nights && (
              <div>Max {room.max_nights} nights</div>
            )}
          </div>
        </div>
      </Card.Body>

      {/* Actions footer */}
      {showActions && (onEdit || onDelete || onTogglePause) && (
        <Card.Footer className="flex items-center justify-end gap-2">
          {onTogglePause && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleActionClick(e, onTogglePause)}
              title={room.is_paused ? 'Unpause room' : 'Pause room'}
            >
              {room.is_paused ? (
                <HiOutlinePlay className="w-4 h-4" />
              ) : (
                <HiOutlinePause className="w-4 h-4" />
              )}
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleActionClick(e, onEdit)}
              title="Edit room"
            >
              <HiOutlinePencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleActionClick(e, onDelete)}
              title="Delete room"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <HiOutlineTrash className="w-4 h-4" />
            </Button>
          )}
        </Card.Footer>
      )}
    </Card>
  );
}
