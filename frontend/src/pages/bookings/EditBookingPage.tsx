/**
 * EditBookingPage Component
 *
 * Allows editing of booking dates, rooms, and add-ons with automatic price recalculation.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Button, Spinner, Alert, Card, Input } from '@/components/ui';
import { bookingService, roomService } from '@/services';
import type {
  BookingWithDetails,
  CreateBookingRoomRequest,
  CreateBookingAddonRequest,
} from '@/types/booking.types';
import type { RoomWithDetails } from '@/types/room.types';
import type { AddOn } from '@/types/addon.types';
import { formatCurrency } from '@/types/booking.types';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash, HiOutlineSave, HiOutlineLockClosed } from 'react-icons/hi';

// ============================================================================
// Component
// ============================================================================

export const EditBookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data state
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [originalBooking, setOriginalBooking] = useState<BookingWithDetails | null>(null); // Store original for comparison
  const [availableRooms, setAvailableRooms] = useState<RoomWithDetails[]>([]);
  const [availableAddons, setAvailableAddons] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<
    Array<{
      room_id: string;
      room_name: string;
      adults: number;
      children: number;
      base_price: number;
      max_guests: number;
      beds: Array<{ bed_type: string; quantity: number; sleeps: number }>;
    }>
  >([]);
  const [selectedAddons, setSelectedAddons] = useState<
    Array<{
      addon_id: string;
      addon_name: string;
      quantity: number;
      unit_price: number;
    }>
  >([]);

  // Fetch booking and initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const bookingData = await bookingService.getBooking(id);
        setBooking(bookingData);
        setOriginalBooking(bookingData); // Store original for comparison

        // Set form values from existing booking
        setCheckInDate(bookingData.check_in_date.split('T')[0]);
        setCheckOutDate(bookingData.check_out_date.split('T')[0]);

        // Fetch available rooms and addons for the property first
        let roomsData: RoomWithDetails[] = [];
        let addonsData: AddOn[] = [];

        if (bookingData.property_id) {
          const [roomsResponse, addonsResponse] = await Promise.all([
            roomService.listRooms({ property_id: bookingData.property_id }),
            roomService.listPropertyAddOns(bookingData.property_id),
          ]);
          roomsData = roomsResponse.rooms;
          addonsData = addonsResponse;
          setAvailableRooms(roomsData);
          setAvailableAddons(addonsData);
        }

        // Set existing rooms with bed configuration from available rooms
        const rooms = bookingData.rooms.map((r) => {
          const roomDetails = roomsData.find((room) => room.id === r.room_id);
          const beds = roomDetails?.beds || [];
          const maxGuests = roomDetails?.max_guests || r.adults + r.children;

          return {
            room_id: r.room_id,
            room_name: r.room_name,
            adults: r.adults,
            children: r.children,
            base_price: r.room_subtotal / bookingData.total_nights,
            max_guests: maxGuests,
            beds: beds.map((b) => ({
              bed_type: b.bed_type,
              quantity: b.quantity,
              sleeps: b.sleeps,
            })),
          };
        });
        setSelectedRooms(rooms);

        // Set existing addons
        const addons = bookingData.addons.map((a) => ({
          addon_id: a.addon_id,
          addon_name: a.addon_name,
          quantity: a.quantity,
          unit_price: a.unit_price,
        }));
        setSelectedAddons(addons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Calculate total nights
  const totalNights = React.useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }, [checkInDate, checkOutDate]);

  // Calculate total price
  const totals = React.useMemo(() => {
    const roomTotal = selectedRooms.reduce((sum, r) => sum + r.base_price * totalNights, 0);
    const addonTotal = selectedAddons.reduce((sum, a) => sum + a.unit_price * a.quantity, 0);
    return {
      roomTotal,
      addonTotal,
      total: roomTotal + addonTotal,
    };
  }, [selectedRooms, selectedAddons, totalNights]);

  const handleAddRoom = () => {
    if (availableRooms.length === 0) return;
    const room = availableRooms[0];
    setSelectedRooms([
      ...selectedRooms,
      {
        room_id: room.id,
        room_name: room.name,
        adults: 1,
        children: 0,
        base_price: room.base_price_per_night,
        max_guests: room.max_guests,
        beds: room.beds.map((b) => ({
          bed_type: b.bed_type,
          quantity: b.quantity,
          sleeps: b.sleeps,
        })),
      },
    ]);
  };

  const handleRemoveRoom = (index: number) => {
    setSelectedRooms(selectedRooms.filter((_, i) => i !== index));
  };

  const handleRoomChange = (index: number, field: string, value: any) => {
    const updated = [...selectedRooms];
    if (field === 'room_id') {
      const room = availableRooms.find((r) => r.id === value);
      if (room) {
        updated[index] = {
          ...updated[index],
          room_id: value,
          room_name: room.name,
          base_price: room.base_price_per_night,
          max_guests: room.max_guests,
          beds: room.beds.map((b) => ({
            bed_type: b.bed_type,
            quantity: b.quantity,
            sleeps: b.sleeps,
          })),
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSelectedRooms(updated);
  };

  // Helper to format bed configuration
  const formatBedConfig = (beds: Array<{ bed_type: string; quantity: number; sleeps: number }>) => {
    if (!beds || beds.length === 0) return 'No beds configured';
    return beds
      .map((b) => `${b.quantity}x ${b.bed_type.replace('_', ' ')} (${b.sleeps * b.quantity} guests)`)
      .join(', ');
  };

  // Helper to calculate total sleep capacity
  const calculateSleepCapacity = (beds: Array<{ bed_type: string; quantity: number; sleeps: number }>) => {
    return beds.reduce((total, bed) => total + bed.sleeps * bed.quantity, 0);
  };

  const handleAddAddon = () => {
    if (availableAddons.length === 0) return;
    const addon = availableAddons[0];
    setSelectedAddons([
      ...selectedAddons,
      {
        addon_id: addon.id,
        addon_name: addon.name,
        quantity: 1,
        unit_price: addon.price,
      },
    ]);
  };

  const handleRemoveAddon = (index: number) => {
    setSelectedAddons(selectedAddons.filter((_, i) => i !== index));
  };

  const handleAddonChange = (index: number, field: string, value: any) => {
    const updated = [...selectedAddons];
    if (field === 'addon_id') {
      const addon = availableAddons.find((a) => a.id === value);
      if (addon) {
        updated[index] = {
          ...updated[index],
          addon_id: value,
          addon_name: addon.name,
          unit_price: addon.price,
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSelectedAddons(updated);
  };

  const handleSave = async () => {
    if (!booking || !originalBooking || !id) return;

    try {
      setSaving(true);
      setError(null);

      let updatedBooking = booking;

      // Step 1: Update dates if changed
      const originalCheckIn = originalBooking.check_in_date.split('T')[0];
      const originalCheckOut = originalBooking.check_out_date.split('T')[0];
      if (checkInDate !== originalCheckIn || checkOutDate !== originalCheckOut) {
        updatedBooking = await bookingService.updateBookingDates(id, checkInDate, checkOutDate);
        setBooking(updatedBooking);
      }

      // Step 2: Handle room changes
      // Find rooms to remove (in original but not in current)
      const originalRoomIds = originalBooking.rooms.map((r) => r.room_id);
      const currentRoomIds = selectedRooms.map((r) => r.room_id);

      for (const originalRoom of originalBooking.rooms) {
        if (!currentRoomIds.includes(originalRoom.room_id)) {
          // Room was removed
          updatedBooking = await bookingService.removeBookingRoom(id, originalRoom.id);
          setBooking(updatedBooking);
        }
      }

      // Find rooms to add or update
      for (const currentRoom of selectedRooms) {
        const originalRoom = originalBooking.rooms.find((r) => r.room_id === currentRoom.room_id);

        if (!originalRoom) {
          // New room - add it
          updatedBooking = await bookingService.addBookingRoom(id, {
            room_id: currentRoom.room_id,
            adults: currentRoom.adults,
            children: currentRoom.children,
            children_ages: [],
          });
          setBooking(updatedBooking);
        } else if (
          originalRoom.adults !== currentRoom.adults ||
          originalRoom.children !== currentRoom.children
        ) {
          // Existing room with changed guest counts - update it
          updatedBooking = await bookingService.updateBookingRoom(id, originalRoom.id, {
            adults: currentRoom.adults,
            children: currentRoom.children,
            children_ages: [],
          });
          setBooking(updatedBooking);
        }
      }

      // Step 3: Handle addon changes
      // Find addons to remove (in original but not in current)
      const originalAddonIds = originalBooking.addons.map((a) => a.addon_id);
      const currentAddonIds = selectedAddons.map((a) => a.addon_id);

      for (const originalAddon of originalBooking.addons) {
        if (!currentAddonIds.includes(originalAddon.addon_id)) {
          // Addon was removed
          updatedBooking = await bookingService.removeBookingAddon(id, originalAddon.id);
          setBooking(updatedBooking);
        }
      }

      // Find addons to add or update
      for (const currentAddon of selectedAddons) {
        const originalAddon = originalBooking.addons.find((a) => a.addon_id === currentAddon.addon_id);

        if (!originalAddon) {
          // New addon - add it
          updatedBooking = await bookingService.addBookingAddon(id, {
            addon_id: currentAddon.addon_id,
            quantity: currentAddon.quantity,
          });
          setBooking(updatedBooking);
        } else if (originalAddon.quantity !== currentAddon.quantity) {
          // Existing addon with changed quantity - update it
          updatedBooking = await bookingService.updateBookingAddon(id, originalAddon.id, {
            quantity: currentAddon.quantity,
          });
          setBooking(updatedBooking);
        }
      }

      // Success! Show message and navigate back
      setSuccess('Booking updated successfully');
      setTimeout(() => {
        navigate(`/bookings/${id}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!booking) {
    return (
      <AuthenticatedLayout>
        <Alert variant="error">Booking not found</Alert>
      </AuthenticatedLayout>
    );
  }

  // Financial integrity guard - lock edits if payment received
  const isFinanciallyLocked = booking && ['partial', 'paid'].includes(booking.payment_status);

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`/bookings/${id}`)}
              className="mb-2"
            >
              <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
              Back to Booking
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Booking
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {booking.booking_reference} • {booking.guest_name}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Payment Lock Warning Banner */}
        {isFinanciallyLocked && (
          <Alert variant="warning" className="border-l-4 border-amber-500">
            <div className="flex items-start gap-3">
              <HiOutlineLockClosed className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Financial Edits Locked
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Payment has been received for this booking. You cannot modify dates, rooms, add-ons, or pricing.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can still update guest contact details and internal notes. To make financial changes,
                  please <span className="font-medium">cancel this booking and create a new one</span>.
                </p>
              </div>
            </div>
          </Alert>
        )}

        {/* Dates */}
        <Card>
          <Card.Header>Stay Dates</Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Check-In Date
                </label>
                <Input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  disabled={isFinanciallyLocked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Check-Out Date
                </label>
                <Input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate}
                  disabled={isFinanciallyLocked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Nights
                </label>
                <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {totalNights} {totalNights === 1 ? 'night' : 'nights'}
                  </span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Rooms */}
        <Card>
          <Card.Header className="flex items-center justify-between">
            <span>Rooms</span>
            <Button
              size="sm"
              onClick={handleAddRoom}
              disabled={isFinanciallyLocked}
            >
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </Card.Header>
          <Card.Body>
            {selectedRooms.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No rooms added. Click "Add Room" to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedRooms.map((room, index) => {
                  const totalGuests = room.adults + room.children;
                  const sleepCapacity = calculateSleepCapacity(room.beds);
                  const exceedsCapacity = totalGuests > room.max_guests;

                  return (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Room Selection */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Room
                              </label>
                              <select
                                value={room.room_id}
                                onChange={(e) => handleRoomChange(index, 'room_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isFinanciallyLocked}
                              >
                                {availableRooms.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Adults
                              </label>
                              <Input
                                type="number"
                                min="1"
                                max={room.max_guests}
                                value={room.adults}
                                onChange={(e) =>
                                  handleRoomChange(index, 'adults', parseInt(e.target.value) || 1)
                                }
                                className={exceedsCapacity ? 'border-red-500 focus:border-red-500' : ''}
                                disabled={isFinanciallyLocked}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Children
                              </label>
                              <Input
                                type="number"
                                min="0"
                                max={room.max_guests}
                                value={room.children}
                                onChange={(e) =>
                                  handleRoomChange(index, 'children', parseInt(e.target.value) || 0)
                                }
                                className={exceedsCapacity ? 'border-red-500 focus:border-red-500' : ''}
                                disabled={isFinanciallyLocked}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Subtotal
                              </label>
                              <div className="h-10 flex items-center px-3 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {formatCurrency(room.base_price * totalNights, booking.currency)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bed Configuration & Capacity Info */}
                          <div className="flex items-start justify-between gap-4 p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Bed Configuration:
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                                {formatBedConfig(room.beds)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Capacity
                              </p>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${exceedsCapacity ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {totalGuests} / {room.max_guests}
                                </span>
                                {exceedsCapacity && (
                                  <span className="text-xs text-red-600 dark:text-red-400">
                                    Exceeds capacity!
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Sleeps up to {sleepCapacity}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRoom(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 mt-6"
                          disabled={isFinanciallyLocked}
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Add-ons */}
        <Card>
          <Card.Header className="flex items-center justify-between">
            <span>Add-ons</span>
            <Button size="sm" variant="outline" onClick={handleAddAddon} disabled={isFinanciallyLocked}>
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              Add Extra
            </Button>
          </Card.Header>
          <Card.Body>
            {selectedAddons.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No add-ons selected
              </p>
            ) : (
              <div className="space-y-3">
                {selectedAddons.map((addon, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Add-on
                        </label>
                        <select
                          value={addon.addon_id}
                          onChange={(e) => handleAddonChange(index, 'addon_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isFinanciallyLocked}
                        >
                          {availableAddons.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} - {formatCurrency(a.price, booking.currency)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={addon.quantity}
                          onChange={(e) =>
                            handleAddonChange(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                          disabled={isFinanciallyLocked}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Total
                        </label>
                        <div className="h-10 flex items-center px-3 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(addon.unit_price * addon.quantity, booking.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAddon(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      disabled={isFinanciallyLocked}
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Pricing Summary */}
        <Card>
          <Card.Header>Pricing Summary</Card.Header>
          <Card.Body>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Rooms Total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(totals.roomTotal, booking.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Add-ons Total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(totals.addonTotal, booking.currency)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totals.total, booking.currency)}
                  </span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Button variant="outline" onClick={() => navigate(`/bookings/${id}`)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving} disabled={isFinanciallyLocked}>
            <HiOutlineSave className="w-5 h-5 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};
