/**
 * RoomsStep Component
 *
 * Step 2 of the booking wizard: Select rooms and guest counts.
 */

import React from 'react';
import { Spinner } from '@/components/ui';
import { BookingFooter } from '../components/BookingFooter';
import type { RoomsStepProps, BookingRoomSelection } from '../CreateBookingPage.types';
import type { RoomWithDetails } from '@/types/room.types';
import { BED_TYPE_LABELS } from '@/types/room.types';
import { formatCurrency } from '@/types/booking.types';

// ============================================================================
// Icons
// ============================================================================

const BedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// ============================================================================
// Room Selection Card Component
// ============================================================================

interface RoomSelectionCardProps {
  room: RoomWithDetails & {
    is_available?: boolean;
    available_units?: number;
    unavailable_reason?: string;
  };
  isSelected: boolean;
  adults: number;
  children: number;
  currency: string;
  nights: number;
  onSelect: () => void;
  onAdultsChange: (adults: number) => void;
  onChildrenChange: (children: number) => void;
}

const RoomSelectionCard: React.FC<RoomSelectionCardProps> = ({
  room,
  isSelected,
  adults,
  children,
  currency,
  nights,
  onSelect,
  onAdultsChange,
  onChildrenChange,
}) => {
  // Get bed summary
  const getBedSummary = () => {
    if (!room.beds || room.beds.length === 0) return 'No beds configured';
    return room.beds.map((bed) => `${bed.quantity}× ${BED_TYPE_LABELS[bed.bed_type]}`).join(', ');
  };

  // Get price label
  const getPriceLabel = () => {
    switch (room.pricing_mode) {
      case 'per_person':
        return '/person/night';
      case 'per_person_sharing':
        return '/night (base)';
      default:
        return '/night';
    }
  };

  // Calculate room price for current selection
  const calculateRoomPrice = () => {
    const basePrice = room.base_price_per_night * nights;
    switch (room.pricing_mode) {
      case 'per_person':
        let total = basePrice * adults;
        if (room.child_price_per_night) {
          total += room.child_price_per_night * children * nights;
        }
        return total;
      case 'per_person_sharing':
        let sharingTotal = basePrice;
        if (room.additional_person_rate && adults > 1) {
          sharingTotal += room.additional_person_rate * (adults - 1) * nights;
        }
        if (room.child_price_per_night) {
          sharingTotal += room.child_price_per_night * children * nights;
        }
        return sharingTotal;
      default:
        return basePrice;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Prevent selection if room is unavailable (must be explicitly true to allow)
    if (room.is_available !== true) {
      console.log(`❌ Blocked selection of unavailable room: ${room.name}`, {
        is_available: room.is_available,
        reason: room.unavailable_reason,
      });
      return;
    }
    console.log(`✅ Selected room: ${room.name}`);
    onSelect();
  };

  const handleAdultIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const maxAdults = room.max_adults || room.max_guests;
    if (adults < maxAdults) {
      onAdultsChange(adults + 1);
    }
  };

  const handleAdultDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adults > 1) {
      onAdultsChange(adults - 1);
    }
  };

  const handleChildIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const maxChildren = room.max_children || 0;
    if (children < maxChildren) {
      onChildrenChange(children + 1);
    }
  };

  const handleChildDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (children > 0) {
      onChildrenChange(children - 1);
    }
  };

  // Room is unavailable if is_available is not explicitly true
  const isUnavailable = room.is_available !== true;

  return (
    <div
      onClick={handleCardClick}
      className={`
        p-4 rounded-lg border-2 transition-all duration-200
        ${isUnavailable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        ${
          isUnavailable
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
            : isSelected
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Image */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {room.featured_image ? (
            <img
              src={room.featured_image}
              alt={room.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <BedIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">{room.name}</h4>
                {isUnavailable && (
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                    Not Available
                  </span>
                )}
                {!isUnavailable && isSelected && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <UsersIcon className="w-3 h-3 mr-1" />
                  {room.max_guests} guests
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{getBedSummary()}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(room.base_price_per_night, currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getPriceLabel()}
              </p>
            </div>
          </div>

          {room.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {room.description}
            </p>
          )}

          {/* Unavailability Reason */}
          {isUnavailable && room.unavailable_reason && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-xs text-red-700 dark:text-red-400">
                <span className="font-semibold">Reason: </span>
                {room.unavailable_reason}
              </p>
            </div>
          )}

          {/* Guest Count Controls - Only show when selected */}
          {isSelected && !isUnavailable && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4">
                {/* Adults */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Adults</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAdultDecrement}
                      disabled={adults <= 1}
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center transition-colors
                        ${
                          adults <= 1
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-medium text-gray-900 dark:text-white text-sm">
                      {adults}
                    </span>
                    <button
                      type="button"
                      onClick={handleAdultIncrement}
                      disabled={adults >= (room.max_adults || room.max_guests)}
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center transition-colors
                        ${
                          adults >= (room.max_adults || room.max_guests)
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary/90'
                        }
                      `}
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Children - Only show if room allows children */}
                {(room.max_children || 0) > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Children</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleChildDecrement}
                        disabled={children <= 0}
                        className={`
                          w-7 h-7 rounded-full flex items-center justify-center transition-colors
                          ${
                            children <= 0
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }
                        `}
                      >
                        <MinusIcon className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-medium text-gray-900 dark:text-white text-sm">
                        {children}
                      </span>
                      <button
                        type="button"
                        onClick={handleChildIncrement}
                        disabled={children >= (room.max_children || 0)}
                        className={`
                          w-7 h-7 rounded-full flex items-center justify-center transition-colors
                          ${
                            children >= (room.max_children || 0)
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }
                        `}
                      >
                        <PlusIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Room Total */}
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Room total</p>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(calculateRoomPrice(), currency)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

export const RoomsStep: React.FC<RoomsStepProps> = ({
  formData,
  onUpdate,
  availableRooms,
  roomsLoading,
  estimatedTotal,
  currency,
  nights,
  onBack,
  onContinue,
  onCancel,
  isLoading,
}) => {
  // Handle room selection toggle
  const handleRoomSelect = (room: RoomWithDetails) => {
    const isSelected = formData.rooms.some((r) => r.room_id === room.id);

    if (isSelected) {
      onUpdate({
        rooms: formData.rooms.filter((r) => r.room_id !== room.id),
      });
    } else {
      const newRoom: BookingRoomSelection = {
        room_id: room.id,
        room,
        adults: 1,
        children: 0,
        children_ages: [],
      };
      onUpdate({
        rooms: [...formData.rooms, newRoom],
      });
    }
  };

  // Handle adult count change
  const handleAdultsChange = (roomId: string, adults: number) => {
    onUpdate({
      rooms: formData.rooms.map((r) => (r.room_id === roomId ? { ...r, adults } : r)),
    });
  };

  // Handle children count change
  const handleChildrenChange = (roomId: string, children: number) => {
    onUpdate({
      rooms: formData.rooms.map((r) => (r.room_id === roomId ? { ...r, children } : r)),
    });
  };

  // Can proceed
  const canProceed = formData.rooms.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 text-primary items-center justify-center mb-4">
          <BedIcon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Rooms</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Choose rooms and specify guest counts
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {roomsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading available rooms...</p>
          </div>
        ) : availableRooms.length === 0 ? (
          <div className="text-center py-12">
            <BedIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No rooms available for the selected dates.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Try selecting different dates or a different property.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableRooms.map((room) => {
              const selectedRoom = formData.rooms.find((r) => r.room_id === room.id);
              const isSelected = !!selectedRoom;

              return (
                <RoomSelectionCard
                  key={room.id}
                  room={room}
                  isSelected={isSelected}
                  adults={selectedRoom?.adults || 1}
                  children={selectedRoom?.children || 0}
                  currency={currency}
                  nights={nights}
                  onSelect={() => handleRoomSelect(room)}
                  onAdultsChange={(adults) => handleAdultsChange(room.id, adults)}
                  onChildrenChange={(children) => handleChildrenChange(room.id, children)}
                />
              );
            })}
          </div>
        )}

        {/* Price Summary */}
        {formData.rooms.length > 0 && (
          <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {formData.rooms.length} room{formData.rooms.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {nights} night{nights !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Estimated Total</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(estimatedTotal, currency)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <BookingFooter
        onCancel={onCancel}
        onContinue={onContinue}
        onBack={onBack}
        showBack
        continueLabel="Continue to Add-ons"
        continueDisabled={!canProceed}
        isLoading={isLoading}
      />
    </div>
  );
};

export default RoomsStep;
