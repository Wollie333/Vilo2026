/**
 * GuestPaymentStep Component
 *
 * Step 3: Collect guest information, create account, and process payment
 */

import React from 'react';
import { Input, Button, PasswordStrengthIndicator } from '@/components/ui';
import { PhoneInput } from '@/components/ui/PhoneInput';
import type { GuestDetails, PaymentProvider } from '@/types/booking-wizard.types';

interface GuestPaymentStepProps {
  guestDetails: GuestDetails;
  paymentMethod: PaymentProvider | null;
  onGuestDetailsChange: (field: keyof GuestDetails, value: any) => void;
  onPaymentMethodChange: (method: PaymentProvider) => void;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onApplyPromoCode: () => void;
  promoCodeStatus?: { type: 'success' | 'error' | 'applying'; message: string } | null;
  errors?: Record<string, string>;
}

export const GuestPaymentStep: React.FC<GuestPaymentStepProps> = ({
  guestDetails,
  paymentMethod,
  onGuestDetailsChange,
  onPaymentMethodChange,
  promoCode,
  onPromoCodeChange,
  onApplyPromoCode,
  promoCodeStatus,
  errors = {},
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Guest Details & Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We'll create your account so you can access your booking portal after payment.
        </p>
      </div>

      {/* Guest Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={guestDetails.firstName}
            onChange={(e) => onGuestDetailsChange('firstName', e.target.value)}
            error={errors.firstName}
            required
            fullWidth
          />
          <Input
            label="Last Name"
            value={guestDetails.lastName}
            onChange={(e) => onGuestDetailsChange('lastName', e.target.value)}
            error={errors.lastName}
            required
            fullWidth
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Email"
            type="email"
            value={guestDetails.email}
            onChange={(e) => onGuestDetailsChange('email', e.target.value)}
            error={errors.email}
            required
            fullWidth
          />
          <PhoneInput
            label="Phone Number"
            value={guestDetails.phone}
            onChange={(value) => onGuestDetailsChange('phone', value)}
            error={errors.phone}
            required
          />
        </div>

        <div className="mt-4">
          <Input
            label="Password"
            type="password"
            value={guestDetails.password}
            onChange={(e) => onGuestDetailsChange('password', e.target.value)}
            error={errors.password}
            required
            fullWidth
          />
          {guestDetails.password && (
            <div className="mt-2">
              <PasswordStrengthIndicator password={guestDetails.password} />
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Special Requests (Optional)
          </label>
          <textarea
            value={guestDetails.specialRequests || ''}
            onChange={(e) => onGuestDetailsChange('specialRequests', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-card text-gray-900 dark:text-white"
            placeholder="Any special requests or requirements..."
          />
        </div>
      </div>

      {/* Account Terms */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={guestDetails.termsAccepted}
            onChange={(e) => onGuestDetailsChange('termsAccepted', e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
            I agree to the{' '}
            <a href="/terms" className="text-primary hover:underline" target="_blank">
              Terms & Conditions
            </a>{' '}
            and understand that an account will be created for me to access my booking portal.{' '}
            <span className="text-red-500">*</span>
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-sm text-red-600 mt-2">{errors.termsAccepted}</p>
        )}

        <div className="flex items-start gap-2 mt-3">
          <input
            type="checkbox"
            id="marketing"
            checked={guestDetails.marketingConsent}
            onChange={(e) => onGuestDetailsChange('marketingConsent', e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="marketing" className="text-sm text-gray-700 dark:text-gray-300">
            I'd like to receive updates, offers, and travel inspiration via email
          </label>
        </div>
      </div>

      {/* Promo Code */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Promo Code (Optional)
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
              fullWidth
              disabled={promoCodeStatus?.type === 'success'}
            />
          </div>
          <Button
            onClick={onApplyPromoCode}
            variant="outline"
            disabled={!promoCode.trim() || promoCodeStatus?.type === 'success' || promoCodeStatus?.type === 'applying'}
            isLoading={promoCodeStatus?.type === 'applying'}
          >
            Apply
          </Button>
        </div>
        {promoCodeStatus && (
          <div className={`mt-2 text-sm ${
            promoCodeStatus.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : promoCodeStatus.type === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {promoCodeStatus.message}
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Method
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Paystack */}
          <button
            onClick={() => onPaymentMethodChange('paystack')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'paystack'
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 dark:border-dark-border hover:border-gray-400'
            }`}
          >
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">Paystack</div>
              <div className="text-xs text-gray-500 mt-1">Card Payment</div>
            </div>
          </button>

          {/* PayPal */}
          <button
            onClick={() => onPaymentMethodChange('paypal')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'paypal'
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 dark:border-dark-border hover:border-gray-400'
            }`}
          >
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">PayPal</div>
              <div className="text-xs text-gray-500 mt-1">PayPal Account</div>
            </div>
          </button>

          {/* EFT */}
          <button
            onClick={() => onPaymentMethodChange('eft')}
            className={`p-4 border-2 rounded-lg transition-all ${
              paymentMethod === 'eft'
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 dark:border-dark-border hover:border-gray-400'
            }`}
          >
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">EFT</div>
              <div className="text-xs text-gray-500 mt-1">Bank Transfer</div>
            </div>
          </button>
        </div>
        {errors.paymentMethod && (
          <p className="text-sm text-red-600 mt-2">{errors.paymentMethod}</p>
        )}
      </div>
    </div>
  );
};
