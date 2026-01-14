/**
 * DatesAndRoomsStep
 *
 * Checkout step for selecting check-in/out dates and rooms.
 * Part of the guest booking checkout wizard.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Spinner, Alert, Badge, DateRangePicker } from '@/components/ui';
import type { DateRange } from '@/components/ui';
import { roomService } from '@/services/room.service';
import type { RoomWithDetails, PriceCalculationResponse } from '@/types/room.types';
import { BED_TYPE_LABELS } from '@/types/room.types';

// ============================================================================
// Types
// ============================================================================

export interface RoomSelection {
  room_id: string;
  room: RoomWithDetails;
  quantity: number;
  adults: number;
  children: number;
  pricing?: PriceCalculationResponse;
}

export interface DatesAndRoomsStepProps {
  propertyId: string;
  propertyName: string;
  initialDates?: DateRange;
  initialRoomSelections?: RoomSelection[];
  onContinue: (data: {
    checkIn: Date;
    checkOut: Date;
    roomSelections: RoomSelection[];
    totalRoomsCost: number;
  }) => void;
  onBack?: () => void;
}

// ============================================================================
// Icons
// ============================================================================

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BedIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

const formatCurrency = (amount: number, currency: string = 'ZAR'): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const getBedsSummary = (beds: RoomWithDetails['beds']): string => {
  if (!beds || beds.length === 0) return 'Not specified';
  return beds
    .map((bed) => `${bed.quantity} ${BED_TYPE_LABELS[bed.bed_type]}`)
    .join(', ');
};

// ============================================================================
// Room Card Component
// ============================================================================

interface RoomCardProps {
  room: RoomWithDetails;
  isSelected: boolean;
  selection?: RoomSelection;
  nights: number;
  onSelect: () => void;
  onUpdateGuests: (adults: number, children: number) => void;
  onUpdateQuantity: (quantity: number) => void;
  disabled?: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected,
  selection,
  nights,
  onSelect,
  onUpdateGuests,
  onUpdateQuantity,
  disabled = false,
}) => {
  const estimatedPrice = room.base_price_per_night * nights;
  const maxUnits = room.inventory_mode === 'room_type' ? room.total_units : 1;
  const currentQuantity = selection?.quantity || 1;
  const currentAdults = selection?.adults || 1;
  const currentChildren = selection?.children || 0;

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all
        ${isSelected
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={() => !disabled && !isSelected && onSelect()}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
          <CheckIcon />
        </div>
      )}

      {/* Room image */}
      {room.featured_image && (
        <div className="mb-3 rounded-lg overflow-hidden h-32 bg-gray-100 dark:bg-dark-border">
          <img
            src={room.featured_image}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Room info */}
      <div className={isSelected ? 'pr-8' : ''}>
        <h4 className="font-semibold text-gray-900 dark:text-white">{room.name}</h4>
        {room.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {room.description}
          </p>
        )}
      </div>

      {/* Capacity & beds */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="default">
          <UsersIcon />
          <span className="ml-1">Up to {room.max_guests} guests</span>
        </Badge>
        <Badge variant="default">{getBedsSummary(room.beds)}</Badge>
      </div>

      {/* Amenities preview */}
      {room.amenities && room.amenities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {room.amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-border px-2 py-0.5 rounded"
            >
              {amenity}
            </span>
          ))}
          {room.amenities.length > 4 && (
            <span className="text-xs text-gray-400">+{room.amenities.length - 4} more</span>
          )}
        </div>
      )}

      {/* Pricing */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(room.base_price_per_night, room.currency)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400"> / night</span>
          {nights > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Est. {formatCurrency(estimatedPrice, room.currency)} for {nights} night{nights !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {!isSelected && !disabled && (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            Select
          </Button>
        )}
      </div>

      {/* Guest count & quantity selector (when selected) */}
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border space-y-4">
          {/* Unit quantity for room types */}
          {room.inventory_mode === 'room_type' && maxUnits > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of rooms
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentQuantity > 1) onUpdateQuantity(currentQuantity - 1);
                  }}
                  disabled={currentQuantity <= 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MinusIcon />
                </button>
                <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                  {currentQuantity}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentQuantity < maxUnits) onUpdateQuantity(currentQuantity + 1);
                  }}
                  disabled={currentQuantity >= maxUnits}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon />
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({maxUnits} available)
                </span>
              </div>
            </div>
          )}

          {/* Guest count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adults
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentAdults > 1) onUpdateGuests(currentAdults - 1, currentChildren);
                  }}
                  disabled={currentAdults <= 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MinusIcon />
                </button>
                <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                  {currentAdults}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const maxAdults = room.max_adults || room.max_guests;
                    if (currentAdults < maxAdults && currentAdults + currentChildren < room.max_guests) {
                      onUpdateGuests(currentAdults + 1, currentChildren);
                    }
                  }}
                  disabled={currentAdults >= (room.max_adults || room.max_guests) || currentAdults + currentChildren >= room.max_guests}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Children
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentChildren > 0) onUpdateGuests(currentAdults, currentChildren - 1);
                  }}
                  disabled={currentChildren <= 0}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MinusIcon />
                </button>
                <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                  {currentChildren}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const maxChildren = room.max_children || room.max_guests;
                    if (currentChildren < maxChildren && currentAdults + currentChildren < room.max_guests) {
                      onUpdateGuests(currentAdults, currentChildren + 1);
                    }
                  }}
                  disabled={currentChildren >= (room.max_children || room.max_guests) || currentAdults + currentChildren >= room.max_guests}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Calculated price */}
          {selection?.pricing && (
            <div className="p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Room total</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(selection.pricing.total * currentQuantity, selection.pricing.currency)}
                </span>
              </div>
            </div>
          )}

          {/* Remove button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateQuantity(0);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Remove room
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const DatesAndRoomsStep: React.FC<DatesAndRoomsStepProps> = ({
  propertyId,
  propertyName,
  initialDates,
  initialRoomSelections,
  onContinue,
  onBack,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialDates || { startDate: null, endDate: null }
  );
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomSelections, setRoomSelections] = useState<Map<string, RoomSelection>>(
    new Map(initialRoomSelections?.map((s) => [s.room_id, s]) || [])
  );
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate nights
  const nights = useMemo(() => {
    if (dateRange.startDate && dateRange.endDate) {
      return calculateNights(dateRange.startDate, dateRange.endDate);
    }
    return 0;
  }, [dateRange]);

  // Get today's date for min date
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Load rooms when dates are selected
  useEffect(() => {
    const loadRooms = async () => {
      if (!dateRange.startDate || !dateRange.endDate) {
        setRooms([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await roomService.listPropertyRooms(propertyId, {
          is_active: true,
          is_paused: false,
          limit: 50,
        });
        setRooms(response.rooms);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rooms');
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, [propertyId, dateRange.startDate, dateRange.endDate]);

  // Calculate prices when selections change
  useEffect(() => {
    const calculatePrices = async () => {
      if (!dateRange.startDate || !dateRange.endDate || roomSelections.size === 0) {
        return;
      }

      setIsCalculating(true);

      const newSelections = new Map(roomSelections);

      for (const [roomId, selection] of newSelections) {
        try {
          const pricing = await roomService.calculatePrice({
            room_id: roomId,
            check_in_date: dateRange.startDate,
            check_out_date: dateRange.endDate,
            adults: selection.adults,
            children: selection.children,
          });
          newSelections.set(roomId, { ...selection, pricing });
        } catch (err) {
          console.error(`Failed to calculate price for room ${roomId}:`, err);
        }
      }

      setRoomSelections(newSelections);
      setIsCalculating(false);
    };

    calculatePrices();
  }, [dateRange.startDate, dateRange.endDate, roomSelections.size]);

  // Handle room selection
  const handleSelectRoom = (room: RoomWithDetails) => {
    const newSelections = new Map(roomSelections);
    newSelections.set(room.id, {
      room_id: room.id,
      room,
      quantity: 1,
      adults: 1,
      children: 0,
    });
    setRoomSelections(newSelections);
  };

  // Handle guest count update
  const handleUpdateGuests = (roomId: string, adults: number, children: number) => {
    const newSelections = new Map(roomSelections);
    const selection = newSelections.get(roomId);
    if (selection) {
      newSelections.set(roomId, { ...selection, adults, children, pricing: undefined });
      setRoomSelections(newSelections);
    }
  };

  // Handle quantity update
  const handleUpdateQuantity = (roomId: string, quantity: number) => {
    const newSelections = new Map(roomSelections);
    if (quantity <= 0) {
      newSelections.delete(roomId);
    } else {
      const selection = newSelections.get(roomId);
      if (selection) {
        newSelections.set(roomId, { ...selection, quantity });
      }
    }
    setRoomSelections(newSelections);
  };

  // Calculate total
  const totalRoomsCost = useMemo(() => {
    let total = 0;
    for (const selection of roomSelections.values()) {
      if (selection.pricing) {
        total += selection.pricing.total * selection.quantity;
      }
    }
    return total;
  }, [roomSelections]);

  // Handle continue
  const handleContinue = () => {
    if (!dateRange.startDate || !dateRange.endDate || roomSelections.size === 0) {
      return;
    }

    onContinue({
      checkIn: new Date(dateRange.startDate),
      checkOut: new Date(dateRange.endDate),
      roomSelections: Array.from(roomSelections.values()),
      totalRoomsCost,
    });
  };

  const canContinue = dateRange.startDate && dateRange.endDate && roomSelections.size > 0 && !isCalculating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <CalendarIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select Your Dates & Rooms
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose when you&apos;d like to stay at {propertyName}
          </p>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card variant="bordered">
        <Card.Body>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            label="Stay Dates"
            startLabel="Check-in"
            endLabel="Check-out"
            minDate={today}
          />
          {nights > 0 && (
            <div className="mt-3 text-sm text-primary font-medium">
              {nights} night{nights !== 1 ? 's' : ''} selected
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Room Selection */}
      {dateRange.startDate && dateRange.endDate && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BedIcon />
            Available Rooms
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <Alert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No rooms available for the selected dates.</p>
              <p className="text-sm mt-1">Try different dates or contact the property.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => {
                const isSelected = roomSelections.has(room.id);
                const selection = roomSelections.get(room.id);

                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isSelected={isSelected}
                    selection={selection}
                    nights={nights}
                    onSelect={() => handleSelectRoom(room)}
                    onUpdateGuests={(adults, children) => handleUpdateGuests(room.id, adults, children)}
                    onUpdateQuantity={(quantity) => handleUpdateQuantity(room.id, quantity)}
                    disabled={!room.is_active || room.is_paused}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer with summary and navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
        {onBack && (
          <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeftIcon />}>
            Back
          </Button>
        )}

        <div className="flex items-center gap-4 ml-auto">
          {roomSelections.size > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {roomSelections.size} room{roomSelections.size !== 1 ? 's' : ''} selected
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {isCalculating ? (
                  <Spinner size="sm" />
                ) : (
                  formatCurrency(totalRoomsCost, 'ZAR')
                )}
              </div>
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={!canContinue}
            rightIcon={<ArrowRightIcon />}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatesAndRoomsStep;
