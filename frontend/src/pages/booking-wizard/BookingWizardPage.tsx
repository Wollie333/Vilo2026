/**
 * BookingWizardPage
 *
 * Main container for the 4-step booking reservation wizard
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner, Alert } from '@/components/ui';
import { PropertyBrandingHeader } from './components/PropertyBrandingHeader';
import { WizardFooter } from './components/WizardFooter';
import { PricingSummary } from './components/PricingSummary';
import { DatesRoomsStep } from './steps/DatesRoomsStep';
import { AddOnsStep } from './steps/AddOnsStep';
import { GuestPaymentStep } from './steps/GuestPaymentStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { discoveryService, bookingWizardService } from '@/services';
import type {
  RoomSelection,
  AddOnSelection,
  GuestDetails,
  PaymentProvider,
  PricingBreakdown,
  BookingWizardStep,
  PropertyBranding,
} from '@/types/booking-wizard.types';
import type { PublicPropertyDetail } from '@/types';

export const BookingWizardPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);

  // Step 1 Data
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<RoomSelection[]>([]);

  // Step 2 Data
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnSelection[]>([]);

  // Step 3 Data
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    specialRequests: '',
    termsAccepted: false,
    marketingConsent: false,
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Promo Code
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<{
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
  } | null>(null);
  const [promoCodeStatus, setPromoCodeStatus] = useState<{
    type: 'success' | 'error' | 'applying';
    message: string;
  } | null>(null);

  // Step 4 Data (after completion)
  const [bookingReference, setBookingReference] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');

  // Load property data on mount
  useEffect(() => {
    if (slug) {
      loadProperty();
    }
  }, [slug]);

  // Pre-fill from URL params
  useEffect(() => {
    const roomId = searchParams.get('room');
    const checkInStr = searchParams.get('checkIn');
    const checkOutStr = searchParams.get('checkOut');

    if (checkInStr) {
      setCheckIn(new Date(checkInStr));
    }
    if (checkOutStr) {
      setCheckOut(new Date(checkOutStr));
    }

    // Room pre-selection will be handled after property loads
  }, [searchParams]);

  const loadProperty = async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);
    try {
      console.log('🏨 [BookingWizard] Loading property:', slug);
      const data = await discoveryService.getPublicPropertyDetail(slug);
      if (!data) {
        console.error('❌ [BookingWizard] Property not found:', slug);
        setError('Property not found');
        return;
      }
      console.log('✅ [BookingWizard] Property loaded:', {
        id: data.id,
        name: data.name,
        roomsCount: data.rooms?.length || 0,
        addonsCount: data.addons?.length || 0,
        addons: data.addons
      });
      setProperty(data);
    } catch (err) {
      console.error('❌ [BookingWizard] Error loading property:', err);
      const message = err instanceof Error ? err.message : 'Failed to load property';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  // Calculate pricing breakdown
  const pricing = useMemo<PricingBreakdown | null>(() => {
    if (!property || selectedRooms.length === 0) return null;

    const roomsDetail = selectedRooms.map((room) => ({
      room_name: room.room_name,
      nights,
      price_per_night: room.unit_price,
      total: room.total_price,
    }));

    const addonsDetail = selectedAddOns.map((addon) => ({
      addon_name: addon.addon_name,
      quantity: addon.quantity,
      unit_price: addon.unit_price,
      total: addon.total_price,
    }));

    const room_total = selectedRooms.reduce((sum, room) => sum + room.total_price, 0);
    const addons_total = selectedAddOns.reduce((sum, addon) => sum + addon.total_price, 0);
    const subtotal = room_total + addons_total;
    const tax_amount = 0; // TODO: Calculate taxes

    // Calculate promo code discount
    let discount_amount = 0;
    if (appliedPromoCode) {
      if (appliedPromoCode.discount_type === 'percentage') {
        discount_amount = (subtotal * appliedPromoCode.discount_value) / 100;
      } else if (appliedPromoCode.discount_type === 'fixed_amount') {
        discount_amount = appliedPromoCode.discount_value;
      }
      // Ensure discount doesn't exceed subtotal
      discount_amount = Math.min(discount_amount, subtotal);
    }

    const total_amount = subtotal + tax_amount - discount_amount;

    return {
      room_total,
      addons_total,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      currency: property.currency,
      rooms_detail: roomsDetail,
      addons_detail: addonsDetail,
    };
  }, [property, selectedRooms, selectedAddOns, nights, appliedPromoCode]);

  // Define wizard steps
  const steps: BookingWizardStep[] = [
    {
      number: 1,
      title: 'Dates & Rooms',
      description: 'Choose your dates and select rooms',
      isComplete: currentStep > 1,
      isActive: currentStep === 1,
    },
    {
      number: 2,
      title: 'Add-ons',
      description: 'Select optional extras',
      isComplete: currentStep > 2,
      isActive: currentStep === 2,
    },
    {
      number: 3,
      title: 'Guest & Payment',
      description: 'Enter details and complete booking',
      isComplete: currentStep > 3,
      isActive: currentStep === 3,
    },
    {
      number: 4,
      title: 'Confirmation',
      description: 'Booking complete!',
      isComplete: currentStep === 4,
      isActive: currentStep === 4,
    },
  ];

  // Validation functions
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!checkIn) newErrors.checkIn = 'Check-in date is required';
    if (!checkOut) newErrors.checkOut = 'Check-out date is required';
    if (checkOut && checkIn && checkOut <= checkIn) {
      newErrors.checkOut = 'Check-out must be after check-in';
    }
    if (selectedRooms.length === 0) {
      newErrors.rooms = 'Please select at least one room';
    }

    // Validate guest counts and children ages
    selectedRooms.forEach((room) => {
      if (room.adults < 1) {
        newErrors[`room_${room.room_id}_adults`] = 'At least 1 adult is required';
      }
      if (room.children > 0 && room.children_ages.length !== room.children) {
        newErrors[`room_${room.room_id}_ages`] = 'Please enter ages for all children';
      }
      if (room.children > 0 && room.children_ages.some(age => age === 0 || !age)) {
        newErrors[`room_${room.room_id}_ages`] = 'Please enter valid ages for all children';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!guestDetails.firstName || guestDetails.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (!guestDetails.lastName || guestDetails.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    if (!guestDetails.email || !/\S+@\S+\.\S+/.test(guestDetails.email)) {
      newErrors.email = 'Valid email is required';
    }
    // Phone validation - check if not empty and has at least 7 digits (flexible for international numbers)
    const phoneDigits = guestDetails.phone.replace(/\D/g, ''); // Remove non-digit characters
    if (!guestDetails.phone || phoneDigits.length < 7) {
      newErrors.phone = 'Valid phone number is required';
    }

    // Password validation - check all requirements
    if (!guestDetails.password) {
      newErrors.password = 'Password is required';
    } else {
      if (guestDetails.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(guestDetails.password)) {
        newErrors.password = 'Password must include an uppercase letter';
      } else if (!/[a-z]/.test(guestDetails.password)) {
        newErrors.password = 'Password must include a lowercase letter';
      } else if (!/[0-9]/.test(guestDetails.password)) {
        newErrors.password = 'Password must include a number';
      }
    }

    if (!guestDetails.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation
  const handleContinue = async () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo(0, 0);
      }
    } else if (currentStep === 2) {
      // Add-ons are optional, just continue
      setCurrentStep(3);
      window.scrollTo(0, 0);
    } else if (currentStep === 3) {
      if (validateStep3()) {
        await handleSubmitBooking();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 4) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
      window.scrollTo(0, 0);
    }
  };

  // Submit booking
  const handleSubmitBooking = async () => {
    if (!property || !checkIn || !checkOut || !pricing) {
      setError('Missing required booking information');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Check if email already exists
      const emailExists = await bookingWizardService.checkEmail(guestDetails.email);
      if (emailExists) {
        setError('An account with this email already exists. Please use a different email or log in.');
        setIsSubmitting(false);
        return;
      }

      // Step 2: Create pending booking
      const bookingData = {
        property_id: property.id,
        property_slug: slug!,
        check_in_date: checkIn.toISOString(),
        check_out_date: checkOut.toISOString(),
        nights,
        rooms: selectedRooms,
        addons: selectedAddOns,
        guest: guestDetails,
        payment_method: paymentMethod!,
        total_amount: pricing.total_amount,
        currency: property.currency,
      };

      const pendingBooking = await bookingWizardService.initiateBooking(bookingData);

      // Step 3: Process payment
      // TODO: Integrate real payment gateway (Paystack/PayPal/EFT)
      // For now, we'll simulate payment success
      const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Mock payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 4: Create guest account
      const guestAccount = await bookingWizardService.registerGuest({
        email: guestDetails.email,
        password: guestDetails.password,
        full_name: `${guestDetails.firstName} ${guestDetails.lastName}`,
        phone: guestDetails.phone,
        marketing_consent: guestDetails.marketingConsent,
      });

      // Step 5: Confirm booking after payment success
      const confirmedBooking = await bookingWizardService.confirmBooking({
        booking_id: pendingBooking.booking_id,
        user_id: guestAccount.user.id,
        payment_reference: paymentReference,
      });

      // Step 6: Auto-login (store tokens from guest registration)
      localStorage.setItem('accessToken', guestAccount.accessToken);
      localStorage.setItem('refreshToken', guestAccount.refreshToken);
      localStorage.setItem('user', JSON.stringify(guestAccount.user));

      // Update state with confirmed booking details
      setBookingReference(confirmedBooking.booking_reference);
      setBookingId(confirmedBooking.booking_id);
      setCurrentStep(4);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Booking error:', err);
      const message = err instanceof Error ? err.message : 'Failed to complete booking';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Room handlers
  const handleRoomSelect = (room: RoomSelection) => {
    setSelectedRooms((prev) => [...prev, room]);
  };

  const handleRoomRemove = (roomId: string) => {
    setSelectedRooms((prev) => prev.filter((r) => r.room_id !== roomId));
  };

  const handleRoomUpdate = (roomId: string, updates: Partial<RoomSelection>) => {
    setSelectedRooms((prev) =>
      prev.map((r) => {
        if (r.room_id === roomId) {
          const updated = { ...r, ...updates };
          // Recalculate total price if nights is available
          if (nights > 0) {
            updated.total_price = updated.unit_price * nights;
          }
          return updated;
        }
        return r;
      })
    );
  };

  // Add-on handlers
  const handleAddOnSelect = (addon: AddOnSelection) => {
    setSelectedAddOns((prev) => [...prev, addon]);
  };

  const handleAddOnRemove = (addonId: string) => {
    setSelectedAddOns((prev) => prev.filter((a) => a.addon_id !== addonId));
  };

  const handleQuantityChange = (addonId: string, quantity: number) => {
    setSelectedAddOns((prev) =>
      prev.map((a) => {
        if (a.addon_id === addonId) {
          return { ...a, quantity };
        }
        return a;
      })
    );
  };

  // Guest details handler
  const handleGuestDetailsChange = (field: keyof GuestDetails, value: any) => {
    setGuestDetails((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Promo code handlers
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim() || !property) return;

    setPromoCodeStatus({ type: 'applying', message: 'Validating promo code...' });

    try {
      // Get all room IDs from selected rooms
      const roomIds = selectedRooms.map((r) => r.room_id);

      // Call API to validate promo code
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/promotions/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: promoCode,
            property_id: property.id,
            room_ids: roomIds,
            booking_amount: pricing?.subtotal || 0,
            nights,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedPromoCode({
          code: promoCode,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
        });
        const discountText =
          data.discount_type === 'percentage'
            ? `${data.discount_value}% discount applied!`
            : `${property.currency} ${data.discount_value} discount applied!`;
        setPromoCodeStatus({
          type: 'success',
          message: `✓ ${discountText}`,
        });
      } else {
        setPromoCodeStatus({
          type: 'error',
          message: data.message || 'Invalid or expired promo code',
        });
      }
    } catch (err) {
      console.error('Promo code validation error:', err);
      setPromoCodeStatus({
        type: 'error',
        message: 'Failed to validate promo code',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error && !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Error Loading Booking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  // Property branding data
  const propertyBranding: PropertyBranding = {
    id: property.id,
    name: property.name,
    listing_title: property.listing_title ?? undefined,
    featured_image_url: property.featured_image_url ?? undefined,
    property_type: property.property_type ?? '',
    city_name: property.city_name ?? undefined,
    province_name: property.province_name ?? undefined,
    country_name: property.country_name ?? undefined,
    overall_rating: property.overall_rating,
    review_count: property.review_count,
    currency: property.currency,
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-dark-bg">
      {/* Left Panel - Property Branding + Progress (Desktop Only) */}
      <div className="lg:w-[400px] xl:w-[480px] bg-gray-950 text-white lg:min-h-screen">
        <PropertyBrandingHeader property={propertyBranding} steps={steps} />
      </div>

      {/* Right Panel - Form Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Content Area */}
        <div className="flex-1 lg:max-w-3xl mx-auto w-full px-6 py-8">
          {/* Back to Property Button */}
          {currentStep < 4 && (
            <button
              onClick={() => navigate(`/accommodation/${slug}`)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to {property.name}</span>
            </button>
          )}

          {/* Error Alert */}
          {error && currentStep !== 4 && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Step Content */}
          {currentStep === 1 && (
            <DatesRoomsStep
              checkIn={checkIn}
              checkOut={checkOut}
              selectedRooms={selectedRooms}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              onRoomSelect={handleRoomSelect}
              onRoomRemove={handleRoomRemove}
              onRoomUpdate={handleRoomUpdate}
              availableRooms={property.rooms}
              currency={property.currency}
              isLoading={false}
            />
          )}

          {currentStep === 2 && (() => {
            console.log('📋 [BookingWizard] Rendering Step 2 with:', {
              propertyAddons: property.addons,
              propertyAddonsCount: property.addons?.length || 0,
              propertyHasAddonsField: 'addons' in property,
              propertyKeys: Object.keys(property)
            });
            return (
              <AddOnsStep
                selectedAddOns={selectedAddOns}
                availableAddOns={property.addons || []}
                onAddOnSelect={handleAddOnSelect}
                onAddOnRemove={handleAddOnRemove}
                onQuantityChange={handleQuantityChange}
                currency={property.currency}
                nights={nights}
                totalGuests={selectedRooms.reduce((sum, room) => sum + room.adults + room.children, 0)}
                roomCount={selectedRooms.length}
                isLoading={false}
              />
            );
          })()}

          {currentStep === 3 && (
            <GuestPaymentStep
              guestDetails={guestDetails}
              paymentMethod={paymentMethod}
              onGuestDetailsChange={handleGuestDetailsChange}
              onPaymentMethodChange={setPaymentMethod}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              onApplyPromoCode={handleApplyPromoCode}
              promoCodeStatus={promoCodeStatus}
              errors={errors}
            />
          )}

          {currentStep === 4 && checkIn && checkOut && (
            <ConfirmationStep
              bookingReference={bookingReference}
              bookingId={bookingId}
              propertyName={property.listing_title || property.name}
              propertyImage={property.featured_image_url ?? undefined}
              checkIn={checkIn}
              checkOut={checkOut}
              guestName={`${guestDetails.firstName} ${guestDetails.lastName}`}
              guestEmail={guestDetails.email}
              totalAmount={pricing?.total_amount || 0}
              currency={property.currency}
              propertySlug={slug || ''}
            />
          )}

          {/* Footer Navigation */}
          {currentStep < 4 && (
            <WizardFooter
              onBack={handleBack}
              onContinue={handleContinue}
              continueLabel={
                currentStep === 1
                  ? 'Continue to Add-ons'
                  : currentStep === 2
                  ? 'Continue to Guest Details'
                  : 'Complete Booking & Pay'
              }
              isLoading={isSubmitting}
              showBack={currentStep > 1}
              continueDisabled={
                currentStep === 1
                  ? !checkIn || !checkOut || selectedRooms.length === 0
                  : currentStep === 3
                  ? !guestDetails.firstName ||
                    !guestDetails.lastName ||
                    !guestDetails.email ||
                    !guestDetails.phone ||
                    !guestDetails.password ||
                    !guestDetails.termsAccepted ||
                    !paymentMethod
                  : false
              }
            />
          )}
        </div>

        {/* Sticky Pricing Summary (Right side) */}
        {currentStep < 4 && (
          <div className="lg:w-[380px] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto p-6">
            <PricingSummary
              pricing={pricing}
              checkIn={checkIn}
              checkOut={checkOut}
              nights={nights}
              propertyName={property.listing_title || property.name}
              propertyImage={property.featured_image_url ?? undefined}
              selectedRooms={selectedRooms}
              selectedAddOns={selectedAddOns}
              availableAddOns={property.addons || []}
            />
          </div>
        )}
      </div>
    </div>
  );
};
