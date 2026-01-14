/**
 * DatesRoomsStep Component
 *
 * Step 1: Select check-in/out dates and choose rooms with guest counts
 */

import React, { useState } from 'react';
import { Button, Input, Alert } from '@/components/ui';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { HiCalendar, HiUserGroup, HiPlus, HiMinus, HiX } from 'react-icons/hi';
import type { RoomSelection } from '@/types/booking-wizard.types';

interface DatesRoomsStepProps {
  checkIn: Date | null;
  checkOut: Date | null;
  selectedRooms: RoomSelection[];
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  onRoomSelect: (room: RoomSelection) => void;
  onRoomRemove: (roomId: string) => void;
  onRoomUpdate: (roomId: string, updates: Partial<RoomSelection>) => void;
  availableRooms: any[];
  isLoading?: boolean;
  currency: string;
}

export const DatesRoomsStep: React.FC<DatesRoomsStepProps> = ({
  checkIn,
  checkOut,
  selectedRooms,
  onCheckInChange,
  onCheckOutChange,
  onRoomSelect,
  onRoomRemove,
  onRoomUpdate,
  availableRooms,
  isLoading = false,
  currency,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Calculate nights
  const nights =
    checkIn && checkOut
      ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  // Handle date selection from modal
  const handleDateSelect = (selectedCheckIn: Date, selectedCheckOut?: Date) => {
    onCheckInChange(selectedCheckIn);
    if (selectedCheckOut) {
      onCheckOutChange(selectedCheckOut);
    }
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle room selection
  const handleAddRoom = (room: any) => {
    const newRoom: RoomSelection = {
      room_id: room.id,
      room_name: room.name,
      room_code: room.room_code,
      featured_image: room.featured_image,
      adults: 2,
      children: 0,
      children_ages: [],
      unit_price: room.base_price_per_night,
      total_price: room.base_price_per_night * nights,
    };
    onRoomSelect(newRoom);
  };

  // Check if room is already selected
  const isRoomSelected = (roomId: string) => {
    return selectedRooms.some((r) => r.room_id === roomId);
  };

  // Update guest counts
  const updateAdults = (roomId: string, adults: number) => {
    if (adults < 1) return;
    onRoomUpdate(roomId, { adults });
  };

  const updateChildren = (roomId: string, children: number) => {
    if (children < 0) return;
    const ages = children > 0 ? Array(children).fill(0) : [];
    onRoomUpdate(roomId, { children, children_ages: ages });
  };

  const updateChildAge = (roomId: string, childIndex: number, age: number) => {
    const room = selectedRooms.find((r) => r.room_id === roomId);
    if (!room) return;

    const newAges = [...room.children_ages];
    newAges[childIndex] = age;
    onRoomUpdate(roomId, { children_ages: newAges });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select Your Dates & Rooms
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your check-in and check-out dates, then select the rooms you'd like to book.
        </p>
      </div>

      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          When do you want to stay?
        </h3>

        {/* Date Input Button */}
        <button
          onClick={() => setShowDatePicker(true)}
          className="w-full p-4 border-2 border-gray-300 dark:border-dark-border rounded-lg hover:border-primary transition-colors text-left"
        >
          <div className="flex items-center gap-4">
            <HiCalendar className="w-6 h-6 text-gray-400" />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-in</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(checkIn)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-out</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(checkOut)}
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Nights Display */}
        {checkIn && checkOut && nights > 0 && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{nights}</span> {nights === 1 ? 'night' : 'nights'}
          </div>
        )}
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
        title="Select Check-in & Check-out Dates"
        mode="range"
        minDate={new Date()}
        initialCheckIn={checkIn || undefined}
        initialCheckOut={checkOut || undefined}
        confirmText="Confirm Dates"
      />

      {/* Room Selection - Show only if dates are selected */}
      {checkIn && checkOut ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Choose Your Rooms
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading available rooms...</div>
          ) : availableRooms.length === 0 ? (
            <Alert variant="info">
              No rooms available for the selected dates. Please try different dates.
            </Alert>
          ) : (
            <div className="space-y-4">
              {availableRooms.filter(room => room.is_active && !room.is_paused).map((room) => (
                <div
                  key={room.id}
                  className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden hover:border-primary transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                    {/* Room Image */}
                    <div className="aspect-video md:aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {room.featured_image ? (
                        <img
                          src={room.featured_image}
                          alt={room.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Room+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <HiUserGroup className="w-16 h-16" />
                        </div>
                      )}
                    </div>

                    {/* Room Details */}
                    <div className="md:col-span-2 flex flex-col">
                      <div className="flex-1">
                        {/* Room Name & Code */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                              {room.name}
                            </h4>
                            {room.room_code && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Code: {room.room_code}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {currency} {room.base_price_per_night.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">per night</div>
                          </div>
                        </div>

                        {/* Description */}
                        {room.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {room.description}
                          </p>
                        )}

                        {/* Capacity */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <HiUserGroup className="w-4 h-4" />
                          <span>Max {room.max_guests} guests</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-end">
                        {isRoomSelected(room.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRoomRemove(room.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <HiX className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddRoom(room)}
                          >
                            <HiPlus className="w-4 h-4 mr-1" />
                            Add Room
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Alert variant="info">
          Please select your check-in and check-out dates to view available rooms.
        </Alert>
      )}

      {/* Selected Rooms with Guest Counts */}
      {selectedRooms.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Selected Rooms ({selectedRooms.length})
          </h4>
          <div className="space-y-6">
            {selectedRooms.map((room) => (
              <div
                key={room.room_id}
                className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4"
              >
                {/* Room Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">
                      {room.room_name}
                    </h5>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {currency} {room.unit_price.toLocaleString()} × {nights} nights = {currency} {room.total_price.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => onRoomRemove(room.room_id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <HiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Guest Counts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Adults */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Adults <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateAdults(room.room_id, room.adults - 1)}
                        disabled={room.adults <= 1}
                        className="w-8 h-8 rounded-lg border border-gray-300 dark:border-dark-border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HiMinus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={room.adults}
                        onChange={(e) => updateAdults(room.room_id, parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-16 text-center px-2 py-1 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => updateAdults(room.room_id, room.adults + 1)}
                        className="w-8 h-8 rounded-lg border border-gray-300 dark:border-dark-border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-hover"
                      >
                        <HiPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Children
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateChildren(room.room_id, room.children - 1)}
                        disabled={room.children <= 0}
                        className="w-8 h-8 rounded-lg border border-gray-300 dark:border-dark-border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HiMinus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={room.children}
                        onChange={(e) => updateChildren(room.room_id, parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-16 text-center px-2 py-1 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => updateChildren(room.room_id, room.children + 1)}
                        className="w-8 h-8 rounded-lg border border-gray-300 dark:border-dark-border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-hover"
                      >
                        <HiPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Children Ages */}
                {room.children > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Children Ages <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Array.from({ length: room.children }).map((_, index) => (
                        <Input
                          key={index}
                          type="number"
                          placeholder={`Child ${index + 1}`}
                          value={room.children_ages[index] || ''}
                          onChange={(e) => updateChildAge(room.room_id, index, parseInt(e.target.value) || 0)}
                          min={0}
                          max={17}
                          fullWidth
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Please enter the age of each child (0-17 years)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
