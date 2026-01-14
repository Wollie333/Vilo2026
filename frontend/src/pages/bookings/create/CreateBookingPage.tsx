/**
 * CreateBookingPage Component
 *
 * Admin wizard for creating manual bookings.
 * Uses a two-column split layout matching the onboarding design.
 *
 * Steps:
 * 1. Property & Dates
 * 2. Select Rooms
 * 3. Add-ons
 * 4. Guest Info
 * 5. Review & Confirm
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Spinner, Alert } from '@/components/ui';
import { bookingService, propertyService, roomService, addonService } from '@/services';
import { BookingProgressSidebar } from './components/BookingProgressSidebar';
import { CancelModal } from './components/CancelModal';
import { PropertyDatesStep } from './steps/PropertyDatesStep';
import { RoomsStep } from './steps/RoomsStep';
import { AddonsStep } from './steps/AddonsStep';
import { GuestInfoStep } from './steps/GuestInfoStep';
import { ReviewStep } from './steps/ReviewStep';
import type { PropertyWithCompany } from '@/types/property.types';
import type { RoomWithDetails } from '@/types/room.types';
import type { AddOn } from '@/types/addon.types';
import type {
  CreateBookingRequest,
  CreateBookingRoomRequest,
  CreateBookingAddonRequest,
  BookingWithDetails,
} from '@/types/booking.types';
import type { BookingFormData } from './CreateBookingPage.types';
import { initialBookingFormData } from './CreateBookingPage.types';

// ============================================================================
// Component
// ============================================================================

export const CreateBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ============================================================================
  // State
  // ============================================================================

  // Form state
  const [formData, setFormData] = useState<BookingFormData>(initialBookingFormData);
  const [currentStep, setCurrentStep] = useState(0);

  // Data state
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomWithDetails[]>([]);
  const [availableAddons, setAvailableAddons] = useState<AddOn[]>([]);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [currency, setCurrency] = useState('ZAR');

  // UI state
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ============================================================================
  // Initial Data Load
  // ============================================================================

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const response = await propertyService.getMyProperties({ is_active: true });
        setProperties(response.properties);
      } catch (err) {
        setError('Failed to load properties');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  // Pre-fill check-in date from URL parameter
  useEffect(() => {
    const checkInParam = searchParams.get('checkIn');

    if (checkInParam) {
      // Validate format: YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(checkInParam)) {
        const date = new Date(checkInParam);
        if (!isNaN(date.getTime())) {
          setFormData(prev => ({
            ...prev,
            check_in_date: checkInParam,
          }));
        }
      }
    }
  }, [searchParams]);

  // ============================================================================
  // Load Rooms when Property and Dates Selected
  // ============================================================================

  const loadAvailableRooms = useCallback(async () => {
    if (!formData.property_id || !formData.check_in_date || !formData.check_out_date) {
      setAvailableRooms([]);
      return;
    }

    try {
      setRoomsLoading(true);
      const response = await roomService.listPropertyRooms(formData.property_id, {
        is_active: true,
        is_paused: false,
      });

      // Check availability for each room
      const roomsWithAvailability = await Promise.all(
        response.rooms.map(async (room) => {
          try {
            const availabilityCheck = await roomService.checkAvailability({
              room_id: room.id,
              check_in_date: formData.check_in_date!,
              check_out_date: formData.check_out_date!,
              units_requested: 1,
            });

            // Generate helpful unavailable reason
            let unavailableReason: string | undefined;
            if (!availabilityCheck.is_available) {
              if (availabilityCheck.conflicting_bookings.length > 0) {
                const conflict = availabilityCheck.conflicting_bookings[0];
                unavailableReason = `Already booked by ${conflict.guest_name} (${conflict.booking_reference}) from ${conflict.check_in} to ${conflict.check_out}`;
              } else {
                unavailableReason = 'Room is not available for the selected dates';
              }
            }

            console.log(`Room ${room.name} availability:`, {
              is_available: availabilityCheck.is_available,
              available_units: availabilityCheck.available_units,
              total_units: availabilityCheck.total_units,
              conflicting_bookings: availabilityCheck.conflicting_bookings.length,
              reason: unavailableReason,
            });

            return {
              ...room,
              is_available: availabilityCheck.is_available,
              available_units: availabilityCheck.available_units,
              unavailable_reason: unavailableReason,
            };
          } catch (err) {
            console.error(`Failed to check availability for room ${room.id}:`, err);
            // If availability check fails, assume unavailable for safety
            return {
              ...room,
              is_available: false,
              available_units: 0,
              unavailable_reason: 'Unable to verify availability',
            };
          }
        })
      );

      console.log('Rooms with availability:', roomsWithAvailability);
      setAvailableRooms(roomsWithAvailability);

      // Get currency from first room or property default
      if (roomsWithAvailability.length > 0) {
        setCurrency(roomsWithAvailability[0].currency);
      }
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setRoomsLoading(false);
    }
  }, [formData.property_id, formData.check_in_date, formData.check_out_date]);

  useEffect(() => {
    if (currentStep === 1) {
      loadAvailableRooms();
    }
  }, [currentStep, loadAvailableRooms]);

  // ============================================================================
  // Load Addons when Property Selected
  // ============================================================================

  const loadAvailableAddons = useCallback(async () => {
    if (!formData.property_id) {
      setAvailableAddons([]);
      return;
    }

    try {
      setAddonsLoading(true);
      const addons = await addonService.getPropertyAddOns(formData.property_id);
      setAvailableAddons(addons);
    } catch (err) {
      console.error('Failed to load addons:', err);
      // Don't show error - addons are optional
    } finally {
      setAddonsLoading(false);
    }
  }, [formData.property_id]);

  useEffect(() => {
    if (currentStep === 2) {
      loadAvailableAddons();
    }
  }, [currentStep, loadAvailableAddons]);

  // ============================================================================
  // Calculate Estimated Total
  // ============================================================================

  useEffect(() => {
    if (formData.rooms.length === 0 || !formData.check_in_date || !formData.check_out_date) {
      setEstimatedTotal(0);
      return;
    }

    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      setEstimatedTotal(0);
      return;
    }

    let total = 0;
    formData.rooms.forEach((roomSelection) => {
      const room = roomSelection.room;
      const basePrice = room.base_price_per_night * nights;

      switch (room.pricing_mode) {
        case 'per_person':
          total += basePrice * roomSelection.adults;
          if (room.child_price_per_night) {
            total += room.child_price_per_night * roomSelection.children * nights;
          }
          break;
        case 'per_person_sharing':
          total += basePrice;
          if (room.additional_person_rate && roomSelection.adults > 1) {
            total += room.additional_person_rate * (roomSelection.adults - 1) * nights;
          }
          if (room.child_price_per_night) {
            total += room.child_price_per_night * roomSelection.children * nights;
          }
          break;
        case 'per_unit':
        default:
          total += basePrice;
          break;
      }
    });

    setEstimatedTotal(total);
  }, [formData.rooms, formData.check_in_date, formData.check_out_date]);

  // ============================================================================
  // Calculate Total Guests
  // ============================================================================

  const totalGuests =
    formData.rooms.reduce((sum, r) => sum + r.adults + r.children, 0) ||
    formData.adults + formData.children;

  // ============================================================================
  // Calculate Nights
  // ============================================================================

  const nights =
    formData.check_in_date && formData.check_out_date
      ? Math.ceil(
          (new Date(formData.check_out_date).getTime() -
            new Date(formData.check_in_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  // ============================================================================
  // Calculate Addons Total
  // ============================================================================

  const calculateAddonPrice = (
    addon: AddOn,
    quantity: number,
    nightCount: number,
    guestCount: number
  ): number => {
    const basePrice = addon.price * quantity;
    switch (addon.pricing_type) {
      case 'per_booking':
        return basePrice;
      case 'per_night':
        return basePrice * nightCount;
      case 'per_guest':
        return basePrice * guestCount;
      case 'per_guest_per_night':
        return basePrice * guestCount * nightCount;
      default:
        return basePrice;
    }
  };

  const addonsTotal = formData.addons.reduce((sum, selection) => {
    return sum + calculateAddonPrice(selection.addon, selection.quantity, nights, totalGuests);
  }, 0);

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleCancel = () => {
    setShowCancelModal(false);
    navigate('/bookings');
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Calculate total guests
      const totalAdults = formData.rooms.reduce((sum, r) => sum + r.adults, 0);
      const totalChildren = formData.rooms.reduce((sum, r) => sum + r.children, 0);

      // Build request
      const request: CreateBookingRequest = {
        property_id: formData.property_id,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        guest_name: formData.guest_name,
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone || undefined,
        adults: totalAdults,
        children: totalChildren,
        source: formData.source,
        special_requests: formData.special_requests || undefined,
        internal_notes: formData.internal_notes || undefined,
        rooms: formData.rooms.map(
          (r): CreateBookingRoomRequest => ({
            room_id: r.room_id,
            adults: r.adults,
            children: r.children,
            children_ages: r.children_ages.length > 0 ? r.children_ages : undefined,
          })
        ),
        addons:
          formData.addons.length > 0
            ? formData.addons.map(
                (a): CreateBookingAddonRequest => ({
                  addon_id: a.addon_id,
                  quantity: a.quantity,
                })
              )
            : undefined,
        booking_status: 'confirmed',
        payment_status: 'pending',
        payment_method: formData.payment_method || undefined,
      };

      const booking: BookingWithDetails = await bookingService.createBooking(request);
      navigate(`/bookings/${booking.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // Step Navigation
  // ============================================================================

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // ============================================================================
  // Render Step
  // ============================================================================

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PropertyDatesStep
            formData={formData}
            onUpdate={updateFormData}
            properties={properties}
            onContinue={() => goToStep(1)}
            onCancel={() => setShowCancelModal(true)}
          />
        );

      case 1:
        return (
          <RoomsStep
            formData={formData}
            onUpdate={updateFormData}
            availableRooms={availableRooms}
            roomsLoading={roomsLoading}
            estimatedTotal={estimatedTotal}
            currency={currency}
            nights={nights}
            onBack={() => goToStep(0)}
            onContinue={() => goToStep(2)}
            onCancel={() => setShowCancelModal(true)}
          />
        );

      case 2:
        return (
          <AddonsStep
            formData={formData}
            onUpdate={updateFormData}
            availableAddons={availableAddons}
            addonsLoading={addonsLoading}
            nights={nights}
            totalGuests={totalGuests}
            currency={currency}
            onBack={() => goToStep(1)}
            onContinue={() => goToStep(3)}
            onCancel={() => setShowCancelModal(true)}
          />
        );

      case 3:
        return (
          <GuestInfoStep
            formData={formData}
            onUpdate={updateFormData}
            onBack={() => goToStep(2)}
            onContinue={() => goToStep(4)}
            onCancel={() => setShowCancelModal(true)}
          />
        );

      case 4:
        return (
          <ReviewStep
            formData={formData}
            onUpdate={updateFormData}
            properties={properties}
            estimatedTotal={estimatedTotal}
            addonsTotal={addonsTotal}
            currency={currency}
            nights={nights}
            totalGuests={totalGuests}
            onBack={() => goToStep(3)}
            onSubmit={handleSubmit}
            submitting={submitting}
            onCancel={() => setShowCancelModal(true)}
          />
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loading) {
    return (
      <AuthenticatedLayout title="New Booking">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AuthenticatedLayout title="New Booking" subtitle="Create a manual booking" noPadding>
      {/* Split Layout Container */}
      <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-8rem)] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-dark-border">
          {/* Left Panel - Dark Theme with Progress */}
          <BookingProgressSidebar
            currentStep={currentStep}
            onCancelClick={() => setShowCancelModal(true)}
          />

          {/* Right Panel - Form Content */}
          <div className="flex-1 bg-white dark:bg-dark-card p-6 lg:p-8 xl:p-10 flex flex-col overflow-y-auto">
            <div className="max-w-xl w-full mx-auto flex-1 flex flex-col">
              {/* Error Alert */}
              {error && (
                <Alert variant="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Step Content */}
              <div className="flex-1 flex flex-col">{renderStep()}</div>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        <CancelModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancel}
        />
      </div>
    </AuthenticatedLayout>
  );
};

export default CreateBookingPage;
