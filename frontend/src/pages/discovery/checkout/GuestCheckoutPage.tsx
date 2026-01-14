/**
 * GuestCheckoutPage
 *
 * Multi-step checkout wizard for guests booking rooms at a property.
 * Routes: /discovery/:slug/checkout
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spinner, Alert, ProgressSteps, Button } from '@/components/ui';
import type { ProgressStep } from '@/components/ui';
import { propertyService } from '@/services/property.service';
import {
  DatesAndRoomsStep,
  AddOnsStep,
  GuestDetailsStep,
  PaymentStep,
} from './steps';
import type { RoomSelection, GuestDetails } from './steps';

// ============================================================================
// Types
// ============================================================================

interface Property {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  featured_image?: string;
}

interface CheckoutState {
  checkIn: Date | null;
  checkOut: Date | null;
  roomSelections: RoomSelection[];
  totalRoomsCost: number;
  selectedAddOns: Map<string, number>;
  addOnsTotal: number;
  guestDetails: GuestDetails | null;
}

// ============================================================================
// Icons
// ============================================================================

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const LogoIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 2L4 8v16l12 6 12-6V8L16 2zm0 2.236l9.6 4.8L16 13.836l-9.6-4.8L16 4.236zM6 10.618l9 4.5V26.382l-9-4.5V10.618zm20 0v11.264l-9 4.5V15.118l9-4.5z" />
  </svg>
);

// ============================================================================
// Constants
// ============================================================================

const CHECKOUT_STEPS: ProgressStep[] = [
  { id: 'dates', label: 'Dates & Rooms' },
  { id: 'addons', label: 'Add-ons' },
  { id: 'guest', label: 'Guest Details' },
  { id: 'payment', label: 'Payment' },
];

// ============================================================================
// Main Component
// ============================================================================

export const GuestCheckoutPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Property state
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checkout state
  const [currentStep, setCurrentStep] = useState(0);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    checkIn: null,
    checkOut: null,
    roomSelections: [],
    totalRoomsCost: 0,
    selectedAddOns: new Map(),
    addOnsTotal: 0,
    guestDetails: null,
  });

  // Parse initial dates from query params
  useEffect(() => {
    const checkInParam = searchParams.get('checkIn');
    const checkOutParam = searchParams.get('checkOut');

    if (checkInParam && checkOutParam) {
      setCheckoutState((prev) => ({
        ...prev,
        checkIn: new Date(checkInParam),
        checkOut: new Date(checkOutParam),
      }));
    }
  }, [searchParams]);

  // Load property data
  useEffect(() => {
    const loadProperty = async () => {
      if (!slug) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load property by slug
        const response = await propertyService.getPropertyBySlug(slug);
        setProperty({
          id: response.id,
          name: response.name,
          slug: response.slug,
          address: response.address_street || '',
          city: response.address_city || '',
          featured_image: response.featured_image_url || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setIsLoading(false);
      }
    };

    loadProperty();
  }, [slug]);

  // Calculate step statuses
  const stepsWithStatus = useMemo(() => {
    return CHECKOUT_STEPS.map((step, index) => ({
      ...step,
      status: (
        index < currentStep
          ? 'completed'
          : index === currentStep
            ? 'current'
            : 'upcoming'
      ) as 'completed' | 'current' | 'upcoming',
    }));
  }, [currentStep]);

  // Get total guests
  const totalGuests = useMemo(() => {
    let total = 0;
    for (const selection of checkoutState.roomSelections) {
      total += (selection.adults + selection.children) * selection.quantity;
    }
    return total;
  }, [checkoutState.roomSelections]);

  // Handle step 1: Dates & Rooms
  const handleDatesRoomsContinue = (data: {
    checkIn: Date;
    checkOut: Date;
    roomSelections: RoomSelection[];
    totalRoomsCost: number;
  }) => {
    setCheckoutState((prev) => ({
      ...prev,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      roomSelections: data.roomSelections,
      totalRoomsCost: data.totalRoomsCost,
    }));
    setCurrentStep(1);
  };

  // Handle step 2: Add-ons
  const handleAddOnsContinue = () => {
    setCurrentStep(2);
  };

  // Handle step 3: Guest Details
  const handleGuestDetailsContinue = (data: GuestDetails) => {
    setCheckoutState((prev) => ({
      ...prev,
      guestDetails: data,
    }));
    setCurrentStep(3);
  };

  // Handle step 4: Payment complete
  const handlePaymentComplete = (bookingId: string, bookingReference: string) => {
    // Navigate to confirmation page
    navigate(`/discovery/confirmation/${bookingId}?ref=${bookingReference}`);
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      // Navigate back to property page
      navigate(`/discovery/${slug}`);
    }
  };

  // Handle add-on selection change
  const handleAddOnSelectionChange = (selections: Map<string, number>) => {
    // Calculate total (simplified - actual implementation would need pricing data)
    let total = 0;
    // This would be calculated based on actual add-on prices
    setCheckoutState((prev) => ({
      ...prev,
      selectedAddOns: selections,
      addOnsTotal: total,
    }));
  };

  // Calculate add-ons total
  const calculateAddOnsTotal = (): number => {
    // This would calculate based on actual add-on prices
    // For now return the stored total
    return checkoutState.addOnsTotal;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Render error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <Card.Body className="text-center py-12">
            <Alert variant="error" className="mb-4">
              {error || 'Property not found'}
            </Alert>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Header */}
      <header className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and back */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                leftIcon={<ArrowLeftIcon />}
              >
                Back
              </Button>
              <div className="h-6 w-px bg-gray-200 dark:bg-dark-border" />
              <div className="flex items-center gap-2 text-primary">
                <LogoIcon />
                <span className="font-semibold">Vilo</span>
              </div>
            </div>

            {/* Property name */}
            <div className="text-right hidden sm:block">
              <div className="text-sm text-gray-500 dark:text-gray-400">Booking at</div>
              <div className="font-medium text-gray-900 dark:text-white">{property.name}</div>
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <ProgressSteps steps={stepsWithStatus} currentStep={currentStep} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Step 1: Dates & Rooms */}
        {currentStep === 0 && (
          <DatesAndRoomsStep
            propertyId={property.id}
            propertyName={property.name}
            initialDates={
              checkoutState.checkIn && checkoutState.checkOut
                ? {
                    startDate: checkoutState.checkIn.toISOString().split('T')[0],
                    endDate: checkoutState.checkOut.toISOString().split('T')[0],
                  }
                : undefined
            }
            initialRoomSelections={checkoutState.roomSelections}
            onContinue={handleDatesRoomsContinue}
          />
        )}

        {/* Step 2: Add-ons */}
        {currentStep === 1 && checkoutState.checkIn && checkoutState.checkOut && (
          <AddOnsStep
            propertyId={property.id}
            checkIn={checkoutState.checkIn}
            checkOut={checkoutState.checkOut}
            adults={totalGuests}
            children={0}
            selectedAddOns={checkoutState.selectedAddOns}
            onSelectionChange={handleAddOnSelectionChange}
            onContinue={handleAddOnsContinue}
            onBack={() => setCurrentStep(0)}
            addOnsTotal={calculateAddOnsTotal()}
          />
        )}

        {/* Step 3: Guest Details */}
        {currentStep === 2 && checkoutState.checkIn && (
          <GuestDetailsStep
            initialData={checkoutState.guestDetails || undefined}
            totalGuests={totalGuests}
            checkInDate={checkoutState.checkIn}
            onContinue={handleGuestDetailsContinue}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {/* Step 4: Payment */}
        {currentStep === 3 &&
          checkoutState.checkIn &&
          checkoutState.checkOut &&
          checkoutState.guestDetails && (
            <PaymentStep
              propertyId={property.id}
              propertyName={property.name}
              checkIn={checkoutState.checkIn}
              checkOut={checkoutState.checkOut}
              roomSelections={checkoutState.roomSelections}
              totalRoomsCost={checkoutState.totalRoomsCost}
              selectedAddOns={checkoutState.selectedAddOns}
              addOnsTotal={checkoutState.addOnsTotal}
              guestDetails={checkoutState.guestDetails}
              onBack={() => setCurrentStep(2)}
              onComplete={handlePaymentComplete}
            />
          )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-dark-border py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div>Powered by Vilo</div>
            <div className="flex gap-4">
              <a href="/terms" className="hover:text-gray-700 dark:hover:text-gray-200">
                Terms
              </a>
              <a href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-200">
                Privacy
              </a>
              <a href="/help" className="hover:text-gray-700 dark:hover:text-gray-200">
                Help
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GuestCheckoutPage;
