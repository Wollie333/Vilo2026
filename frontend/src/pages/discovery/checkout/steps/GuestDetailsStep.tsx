/**
 * GuestDetailsStep
 *
 * Checkout step for collecting guest information.
 * Part of the guest booking checkout wizard.
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Alert, Checkbox, Select } from '@/components/ui';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useAuth } from '@/context/AuthContext';

// ============================================================================
// Types
// ============================================================================

export interface GuestDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_code: string;
  special_requests?: string;
  arrival_time?: string;
  // Terms acceptance
  terms_accepted: boolean;
  marketing_consent: boolean;
}

export interface GuestDetailsStepProps {
  initialData?: Partial<GuestDetails>;
  totalGuests: number;
  checkInDate: Date;
  onContinue: (data: GuestDetails) => void;
  onBack: () => void;
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

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================================================
// Constants
// ============================================================================

const ARRIVAL_TIMES = [
  { value: '', label: 'Select time...' },
  { value: '12:00', label: '12:00 PM (Noon)' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: 'late', label: 'Late arrival (after 10 PM)' },
];

// ============================================================================
// Validation
// ============================================================================

interface ValidationErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  terms_accepted?: string;
}

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validateForm = (data: GuestDetails): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.first_name.trim()) {
    errors.first_name = 'First name is required';
  }

  if (!data.last_name.trim()) {
    errors.last_name = 'Last name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required';
  }

  if (!data.terms_accepted) {
    errors.terms_accepted = 'You must accept the terms and conditions';
  }

  return errors;
};

// ============================================================================
// Main Component
// ============================================================================

export const GuestDetailsStep: React.FC<GuestDetailsStepProps> = ({
  initialData,
  totalGuests,
  checkInDate,
  onContinue,
  onBack,
}) => {
  const { user } = useAuth();
  // Split full_name into first and last names
  const nameParts = user?.full_name?.split(' ') || [];
  const userFirstName = nameParts[0] || '';
  const userLastName = nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState<GuestDetails>({
    first_name: initialData?.first_name || userFirstName,
    last_name: initialData?.last_name || userLastName,
    email: initialData?.email || user?.email || '',
    phone: initialData?.phone || user?.phone || '',
    country_code: initialData?.country_code || '+27',
    special_requests: initialData?.special_requests || '',
    arrival_time: initialData?.arrival_time || '',
    terms_accepted: initialData?.terms_accepted || false,
    marketing_consent: initialData?.marketing_consent || false,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Pre-fill from user if logged in
  useEffect(() => {
    if (user && !initialData) {
      const parts = user.full_name?.split(' ') || [];
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      setFormData((prev) => ({
        ...prev,
        first_name: prev.first_name || firstName,
        last_name: prev.last_name || lastName,
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        country_code: prev.country_code || '+27',
      }));
    }
  }, [user, initialData]);

  // Handle field change
  const handleChange = (field: keyof GuestDetails, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is changed
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle phone value change
  const handlePhoneChange = (phone: string) => {
    setFormData((prev) => ({ ...prev, phone }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  // Handle country code change
  const handleCountryChange = (country: { dialCode: string }) => {
    setFormData((prev) => ({ ...prev, country_code: country.dialCode }));
  };

  // Handle blur (mark as touched)
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle form submission
  const handleSubmit = () => {
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    // Mark all fields as touched
    setTouched({
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      terms_accepted: true,
    });

    if (Object.keys(validationErrors).length === 0) {
      onContinue(formData);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <UserIcon />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Guest Details
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tell us who will be staying
          </p>
        </div>
      </div>

      {/* Booking summary */}
      <Card variant="bordered">
        <Card.Body className="py-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Check-in:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {formatDate(checkInDate)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Guests:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {totalGuests}
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Pre-filled notice for logged in users */}
      {user && (
        <Alert variant="info">
          We&apos;ve pre-filled your details from your account. You can update them if booking for someone else.
        </Alert>
      )}

      {/* Main Contact Form */}
      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900 dark:text-white">Main Contact</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This person will receive the booking confirmation and be the primary contact
          </p>
        </Card.Header>
        <Card.Body className="space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              onBlur={() => handleBlur('first_name')}
              error={touched.first_name ? errors.first_name : undefined}
              placeholder="John"
              required
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              onBlur={() => handleBlur('last_name')}
              error={touched.last_name ? errors.last_name : undefined}
              placeholder="Doe"
              required
            />
          </div>

          {/* Contact fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  error={touched.email ? errors.email : undefined}
                  placeholder="john@example.com"
                  className="pl-10"
                  helperText="Confirmation will be sent here"
                />
              </div>
            </div>
            <PhoneInput
              label="Phone Number"
              value={formData.phone}
              defaultCountry="ZA"
              onChange={handlePhoneChange}
              onCountryChange={handleCountryChange}
              onBlur={() => handleBlur('phone')}
              error={touched.phone ? errors.phone : undefined}
              helperText="For urgent communications"
            />
          </div>

          {/* Arrival time */}
          <div>
            <Select
              label="Estimated Arrival Time"
              value={formData.arrival_time}
              onChange={(e) => handleChange('arrival_time', e.target.value)}
              options={ARRIVAL_TIMES}
              helperText="Standard check-in is from 2:00 PM. Let us know if you'll arrive earlier or later."
              leftIcon={<ClockIcon />}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Special Requests */}
      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900 dark:text-white">Special Requests</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Let us know if you have any special requests (optional)
          </p>
        </Card.Header>
        <Card.Body>
          <Textarea
            value={formData.special_requests || ''}
            onChange={(e) => handleChange('special_requests', e.target.value)}
            placeholder="E.g., dietary requirements, accessibility needs, celebration arrangements, etc."
            rows={4}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Special requests are subject to availability and may incur additional charges.
          </p>
        </Card.Body>
      </Card>

      {/* Terms & Conditions */}
      <Card variant="bordered">
        <Card.Body className="space-y-4">
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                id="terms_accepted"
                checked={formData.terms_accepted}
                onChange={(e) => handleChange('terms_accepted', e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
            {touched.terms_accepted && errors.terms_accepted && (
              <p className="mt-1 text-sm text-red-500">{errors.terms_accepted}</p>
            )}
          </div>

          <Checkbox
            id="marketing_consent"
            checked={formData.marketing_consent}
            onChange={(e) => handleChange('marketing_consent', e.target.checked)}
            label="I'd like to receive special offers and updates via email (optional)"
          />
        </Card.Body>
      </Card>

      {/* Footer with navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeftIcon />}>
          Back
        </Button>

        <Button variant="primary" onClick={handleSubmit} rightIcon={<ArrowRightIcon />}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};

export default GuestDetailsStep;
