/**
 * BookingWizardPage
 *
 * Main container for the 4-step booking reservation wizard
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner, Alert, Modal, ModalBody, Button } from '@/components/ui';
import { PropertyBrandingHeader } from './components/PropertyBrandingHeader';
import { WizardFooter } from './components/WizardFooter';
import { PricingSummary } from './components/PricingSummary';
import { DatesRoomsStep } from './steps/DatesRoomsStep';
import { AddOnsStep } from './steps/AddOnsStep';
import { GuestPaymentStep } from './steps/GuestPaymentStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { discoveryService, bookingWizardService, checkoutService, roomService } from '@/services';
import type {
  RoomSelection,
  AddOnSelection,
  GuestDetails,
  PaymentProvider,
  PricingBreakdown,
  BookingWizardStep,
  PropertyBranding,
  AvailablePaymentMethod,
} from '@/types/booking-wizard.types';
import type { PublicPropertyDetail } from '@/types';

export const BookingWizardPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Ref for scrolling to form content (not page top)
  const formContentRef = React.useRef<HTMLDivElement>(null);

  // State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);

  // Room unavailability modal
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [unavailableRoomInfo, setUnavailableRoomInfo] = useState<{
    roomName: string;
  } | null>(null);

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
    specialRequests: '',
    termsAccepted: false,
    platformTermsAccepted: false,
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<AvailablePaymentMethod[]>([]);

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
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

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

  // Load available payment methods when property is loaded
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!property?.id) return;

      try {
        console.log('[BookingWizard] Loading payment methods for property:', property.id);
        const response = await bookingWizardService.getAvailablePaymentMethods(property.id);
        console.log('[BookingWizard] Payment methods loaded:', response.payment_methods);
        setAvailablePaymentMethods(response.payment_methods);
      } catch (err) {
        console.error('[BookingWizard] Failed to load payment methods:', err);
        // Don't show error to user - will fall back to "no methods available" message
        setAvailablePaymentMethods([]);
      }
    };
    loadPaymentMethods();
  }, [property?.id]);

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
      console.log('🔍 [BookingWizard] CANCELLATION POLICY DEBUG:', {
        has_cancellation_policy_field: 'cancellation_policy' in data,
        cancellation_policy_value: data.cancellation_policy,
        has_cancellation_policy_detail_field: 'cancellation_policy_detail' in data,
        cancellation_policy_detail_value: data.cancellation_policy_detail,
        cancellation_policy_detail_type: typeof data.cancellation_policy_detail,
        full_detail_object: JSON.stringify(data.cancellation_policy_detail, null, 2)
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
  const validateStep1 = async (): Promise<boolean> => {
    console.log('[BookingWizard] Validating step 1 with availability check...');
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

    // If basic validation fails, don't check availability
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    // CHECK ROOM AVAILABILITY (CRITICAL FOR PREVENTING DOUBLE BOOKINGS)
    if (checkIn && checkOut && selectedRooms.length > 0) {
      console.log('[BookingWizard] Checking availability for', selectedRooms.length, 'room(s)...');

      try {
        // Format dates as YYYY-MM-DD for API
        const checkInDate = checkIn.toISOString().split('T')[0];
        const checkOutDate = checkOut.toISOString().split('T')[0];

        // Check availability for each room
        for (const room of selectedRooms) {
          console.log('[BookingWizard] Checking room:', room.room_name, '(', checkInDate, '-', checkOutDate, ')');

          const availability = await roomService.checkAvailability({
            room_id: room.room_id,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
          });

          console.log('[BookingWizard] Availability result:', availability);

          if (!availability.is_available) {
            console.error('[BookingWizard] ❌ Room NOT available:', room.room_name);

            // Show modal instead of inline error
            setUnavailableRoomInfo({
              roomName: room.room_name,
            });

            console.log('[BookingWizard] Opening unavailability modal');
            setShowUnavailableModal(true);

            return false; // Stop validation and don't proceed
          }

          console.log('[BookingWizard] ✅ Room available:', room.room_name);
        }
      } catch (error) {
        console.error('[BookingWizard] Failed to check availability:', error);
        newErrors.rooms = 'Failed to verify room availability. Please try again.';
      }
    }

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
    // Email validation - more strict pattern
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const sanitizedEmail = guestDetails.email.trim().replace(/[,.\s]+$/, '');
    if (!sanitizedEmail || !emailPattern.test(sanitizedEmail)) {
      newErrors.email = 'Valid email is required';
    }
    // Phone validation - check if not empty and has at least 7 digits (flexible for international numbers)
    const phoneDigits = guestDetails.phone.replace(/\D/g, ''); // Remove non-digit characters
    if (!guestDetails.phone || phoneDigits.length < 7) {
      newErrors.phone = 'Valid phone number is required';
    }

    // Password validation removed - accounts created automatically with backend-generated password

    if (!guestDetails.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the property terms and cancellation policy';
    }
    if (!guestDetails.platformTermsAccepted) {
      newErrors.platformTermsAccepted = 'You must accept the Vilo Terms of Service and Privacy Policy';
    }
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper: Scroll to top of form content (not page top)
  const scrollToFormTop = () => {
    if (formContentRef.current) {
      formContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Step navigation
  const handleContinue = async () => {
    console.log('🚀 [BookingWizard] handleContinue called, currentStep:', currentStep);

    try {
      if (currentStep === 1) {
        console.log('📝 [BookingWizard] Validating step 1...');
        // Show loading state while checking availability (separate from booking submission)
        setIsCheckingAvailability(true);
        setError(null); // Clear any previous errors

        const isValid = await validateStep1();
        setIsCheckingAvailability(false);

        console.log('✓ [BookingWizard] Step 1 validation result:', isValid);

        if (isValid) {
          console.log('➡️ [BookingWizard] Moving to step 2 (Add-ons)');
          setCurrentStep(2);
          scrollToFormTop();
        } else {
          console.warn('❌ [BookingWizard] Step 1 validation failed');
        }
      } else if (currentStep === 2) {
        console.log('➡️ [BookingWizard] Moving to step 3 (Guest & Payment)');
        // Add-ons are optional, just continue
        setCurrentStep(3);
        scrollToFormTop();
      } else if (currentStep === 3) {
        console.log('📝 [BookingWizard] Validating step 3...');
        if (validateStep3()) {
          console.log('💳 [BookingWizard] Submitting booking...');
          await handleSubmitBooking();
        } else {
          console.warn('❌ [BookingWizard] Step 3 validation failed');
        }
      }
    } catch (err) {
      console.error('❌ [BookingWizard] Error in handleContinue:', err);
      setIsCheckingAvailability(false);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 4) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
      scrollToFormTop();
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
      // Step 1: Sanitize guest email (remove trailing commas, dots, whitespace)
      const sanitizedEmail = guestDetails.email.trim().replace(/[,.\s]+$/, '');

      // Step 2: Check if email already exists
      const emailExists = await bookingWizardService.checkEmail(sanitizedEmail);
      if (emailExists) {
        setError('An account with this email already exists. Please use a different email or log in.');
        setIsSubmitting(false);
        return;
      }

      // Step 3: Create pending booking with sanitized email
      const bookingData = {
        property_id: property.id,
        property_slug: slug!,
        check_in_date: checkIn.toISOString(),
        check_out_date: checkOut.toISOString(),
        nights,
        rooms: selectedRooms,
        addons: selectedAddOns,
        guest: {
          ...guestDetails,
          email: sanitizedEmail, // Use sanitized email
        },
        payment_method: paymentMethod!,
        total_amount: pricing.total_amount,
        currency: property.currency,
      };

      // Step 3: Check if book via chat
      if (paymentMethod === 'book_via_chat') {
        console.log('[BookingWizard] Creating booking via chat');
        const chatBookingResult = await bookingWizardService.createBookingViaChat(bookingData);
        console.log('[BookingWizard] Chat booking created:', chatBookingResult);

        // Store booking result and move to confirmation step (same as other payment methods)
        setBookingReference(chatBookingResult.booking_reference);
        setBookingId(chatBookingResult.booking_id);
        setIsNewUser(chatBookingResult.is_new_user || false);

        // Store chat URL in session for the confirmation step to use
        sessionStorage.setItem('bookingChatUrl', chatBookingResult.chat_url);
        sessionStorage.setItem('bookingIsNewUser', String(chatBookingResult.is_new_user || false));
        sessionStorage.setItem('bookingGuestEmail', guestDetails.email);

        setCurrentStep(4); // Go to thank you page
        return;
      }

      // Step 4: Create pending booking for other payment methods
      const pendingBooking = await bookingWizardService.initiateBooking(bookingData);

      // Step 5: Store booking data in session storage for callback
      sessionStorage.setItem(
        'pendingBooking',
        JSON.stringify({
          booking_id: pendingBooking.booking_id,
          booking_reference: pendingBooking.booking_reference,
          property_id: property.id,
          guest_email: guestDetails.email,
          is_new_user: pendingBooking.is_new_user || false,
          guest_details: {
            email: guestDetails.email,
            full_name: `${guestDetails.firstName} ${guestDetails.lastName}`,
            phone: guestDetails.phone,
            marketing_consent: guestDetails.marketingConsent,
          },
          total_amount: pricing.total_amount,
          currency: property.currency,
        })
      );

      // Step 6: Initialize payment with Paystack
      if (paymentMethod === 'paystack') {
        const paymentInit = await bookingWizardService.initializePayment({
          booking_id: pendingBooking.booking_id,
          property_id: property.id,
          guest_email: guestDetails.email,
          amount: pricing.total_amount,
          currency: property.currency,
        });

        // Redirect to Paystack payment page
        window.location.href = paymentInit.authorization_url;
      } else {
        // For other payment methods (PayPal, EFT), show error for now
        throw new Error(
          'This payment method is not yet supported. Please select Paystack or Book via Chat.'
        );
      }
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
    // Note: Email sanitization (trim, remove trailing commas/dots) happens during validation/submission
    // NOT during typing to allow users to type periods and other characters normally

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
    console.error('❌ [BookingWizard] Property data is null');
    return null;
  }

  // Safety check: Ensure property has required fields
  if (!property.id || !property.name || !property.currency) {
    console.error('❌ [BookingWizard] Property is missing required fields:', {
      has_id: !!property.id,
      has_name: !!property.name,
      has_currency: !!property.currency,
      property
    });
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Property Data Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This property is missing required information. Please contact support.
          </p>
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

  // Property branding data
  const propertyBranding: PropertyBranding = {
    id: property.id,
    name: property.name,
    listing_title: property.listing_title || property.name, // Fallback to name if listing_title is null
    featured_image_url: property.featured_image_url || undefined,
    property_type: property.property_type || 'Property',
    city_name: property.city_name || undefined,
    province_name: property.province_name || undefined,
    country_name: property.country_name || undefined,
    overall_rating: property.overall_rating,
    review_count: property.review_count,
    currency: property.currency,
  };

  // Debug: Log property branding to verify data
  console.log('🏨 [BookingWizard] Property Branding:', {
    name: propertyBranding.name,
    listing_title: propertyBranding.listing_title,
    featured_image_url: propertyBranding.featured_image_url,
    has_featured_image: !!propertyBranding.featured_image_url,
  });

  // Debug: Log cancellation policy data
  console.log('📋 [BookingWizard] Cancellation Policy Data:', {
    has_cancellation_policy_detail: !!property.cancellation_policy_detail,
    cancellation_policy_detail: property.cancellation_policy_detail,
    policy_id: property.cancellation_policy_detail?.id,
    policy_name: property.cancellation_policy_detail?.name,
    has_tiers: !!property.cancellation_policy_detail?.tiers,
    tiers_count: property.cancellation_policy_detail?.tiers?.length || 0,
  });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-dark-bg">
      {/* Left Panel - Property Branding + Progress (Desktop Only) - Fixed Position */}
      <div className="lg:w-[400px] xl:w-[480px] bg-gray-950 text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <PropertyBrandingHeader property={propertyBranding} steps={steps} />
      </div>

      {/* Right Panel - Form Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Content Area - Scrollable */}
        <div ref={formContentRef} className="flex-1 lg:max-w-3xl mx-auto w-full px-6 py-8">
          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex items-center justify-between mb-6">
              {/* Back to Property Button */}
              <button
                onClick={() => navigate(`/accommodation/${slug}`)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to {property.name}</span>
              </button>

              {/* Request Quote Button */}
              <button
                onClick={() => navigate(`/accommodation/${slug}#quote`)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                title="Request a custom quote instead"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Request Quote</span>
              </button>
            </div>
          )}

          {/* Error Alert */}
          {error && currentStep !== 4 && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Step Content */}
          {currentStep === 1 && property.rooms && (
            <DatesRoomsStep
              checkIn={checkIn}
              checkOut={checkOut}
              selectedRooms={selectedRooms}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              onRoomSelect={handleRoomSelect}
              onRoomRemove={handleRoomRemove}
              onRoomUpdate={handleRoomUpdate}
              availableRooms={property.rooms || []}
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

            try {
              return (
                <AddOnsStep
                  selectedAddOns={selectedAddOns || []}
                  availableAddOns={property.addons || []}
                  onAddOnSelect={handleAddOnSelect}
                  onAddOnRemove={handleAddOnRemove}
                  onQuantityChange={handleQuantityChange}
                  currency={property.currency || 'ZAR'}
                  nights={nights || 1}
                  totalGuests={selectedRooms.reduce((sum, room) => sum + room.adults + room.children, 0)}
                  roomCount={selectedRooms.length}
                  isLoading={false}
                />
              );
            } catch (err) {
              console.error('❌ [BookingWizard] Error rendering AddOnsStep:', err);
              return (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">Error loading add-ons step</p>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Skip to Next Step
                  </button>
                </div>
              );
            }
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
              propertyTerms={property?.terms_and_conditions}
              propertyCancellationPolicy={property?.cancellation_policy_detail}
              propertyName={property?.listing_title || property?.name}
              propertyId={property?.id}
              availablePaymentMethods={availablePaymentMethods}
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
              isNewUser={isNewUser}
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
              isLoading={currentStep === 1 ? isCheckingAvailability : isSubmitting}
              showBack={currentStep > 1}
              continueDisabled={
                currentStep === 1
                  ? !checkIn || !checkOut || selectedRooms.length === 0
                  : currentStep === 3
                  ? !guestDetails.firstName ||
                    !guestDetails.lastName ||
                    !guestDetails.email ||
                    !guestDetails.phone ||
                    !guestDetails.termsAccepted ||
                    !guestDetails.platformTermsAccepted ||
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
              key={`pricing-${selectedRooms.length}-${selectedAddOns.length}-${selectedRooms.map(r => `${r.adults}-${r.children}`).join('-')}`}
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

      {/* Room Unavailable Modal */}
      <Modal
        isOpen={showUnavailableModal}
        onClose={() => {
          console.log('[BookingWizard] Closing unavailable modal');
          setShowUnavailableModal(false);
        }}
        size="md"
      >
        <ModalBody>
          <div className="p-6">
            {/* Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
              Room Not Available
            </h3>

            {/* Message */}
            <div className="text-center mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{unavailableRoomInfo?.roomName}</span> is already booked for the dates you selected.
              </p>
            </div>

            {/* Options */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                What would you like to do?
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1.5 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Select a different room from the available options</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Change your check-in or check-out dates</span>
                </li>
              </ul>
            </div>

            {/* Close Button */}
            <Button
              variant="primary"
              onClick={() => setShowUnavailableModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Availability Check Modal - Shows during room availability validation */}
      <Modal isOpen={isCheckingAvailability} onClose={() => {}} size="md">
        <ModalBody>
          <div className="flex flex-col items-center justify-center py-12 px-6">
            {/* Animated Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
              </div>
              <div className="relative">
                <Spinner size="lg" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
              Checking Availability...
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
              We're verifying that your selected rooms are available for the dates you chose. This will only take a moment.
            </p>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 w-full max-w-md">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This ensures you won't experience any booking conflicts.
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* Booking Submission Modal - Shows during booking creation */}
      <Modal isOpen={isSubmitting} onClose={() => {}} size="md">
        <ModalBody>
          <div className="flex flex-col items-center justify-center py-12 px-6">
            {/* Animated Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-green-200 dark:border-green-800 rounded-full animate-pulse"></div>
              </div>
              <div className="relative">
                <Spinner size="lg" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
              Creating Your Booking...
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
              We're processing your reservation and preparing your booking confirmation. This may take a few moments.
            </p>

            {/* Progress Steps */}
            <div className="w-full max-w-md space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Validating booking details</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Creating reservation</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"></div>
                <span className="text-gray-500 dark:text-gray-500">Preparing confirmation</span>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 w-full max-w-md">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Please do not close this window
                </span>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};
