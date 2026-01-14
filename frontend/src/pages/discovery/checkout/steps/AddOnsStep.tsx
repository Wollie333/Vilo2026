/**
 * AddOnsStep
 *
 * Checkout step for selecting optional add-ons.
 * Part of the booking checkout wizard.
 */

import React from 'react';
import { Card, Button } from '@/components/ui';
import { AddOnSelector } from '@/components/features/Checkout';
import { formatAddonPrice } from '@/utils/addon-pricing';

export interface AddOnsStepProps {
  propertyId: string;
  roomId?: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  selectedAddOns: Map<string, number>;
  onSelectionChange: (selections: Map<string, number>) => void;
  onContinue: () => void;
  onBack: () => void;
  addOnsTotal: number;
}

// Icons
const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const GiftIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

export const AddOnsStep: React.FC<AddOnsStepProps> = ({
  propertyId,
  roomId,
  checkIn,
  checkOut,
  adults,
  children,
  selectedAddOns,
  onSelectionChange,
  onContinue,
  onBack,
  addOnsTotal,
}) => {
  // Calculate number of nights
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Total guests
  const guests = adults + children;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <GiftIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Enhance Your Stay
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select optional extras to make your stay even better
          </p>
        </div>
      </div>

      {/* Booking summary */}
      <Card variant="bordered">
        <Card.Body className="py-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Nights:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">{nights}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Guests:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">{guests}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Check-in:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {checkIn.toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Check-out:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {checkOut.toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Add-on selector */}
      <AddOnSelector
        propertyId={propertyId}
        roomId={roomId}
        nights={nights}
        guests={guests}
        selections={selectedAddOns}
        onSelectionsChange={onSelectionChange}
      />

      {/* Footer with navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeftIcon />}>
          Back
        </Button>

        <div className="flex items-center gap-4">
          {addOnsTotal > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Add-ons total</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatAddonPrice(addOnsTotal, 'ZAR')}
              </div>
            </div>
          )}

          <Button variant="primary" onClick={onContinue} rightIcon={<ArrowRightIcon />}>
            {selectedAddOns.size > 0 ? 'Continue with Add-ons' : 'Skip Add-ons'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddOnsStep;
