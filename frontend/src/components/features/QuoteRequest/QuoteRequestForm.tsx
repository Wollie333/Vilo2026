/**
 * Quote Request Form Component
 *
 * Single-page form for submitting custom quote requests
 * All fields visible at once for easy completion
 */

import React, { useState } from 'react';
import { HiCheckCircle } from 'react-icons/hi';
import { Button, Input, Alert } from '@/components/ui';
import { quoteRequestService } from '@/services';
import type { QuoteRequestFormProps } from './QuoteRequestForm.types';
import type {
  QuoteRequestFormState,
  QuoteRequestFormErrors,
  QuoteDateFlexibility,
  QuoteGroupType,
  DATE_FLEXIBILITY_OPTIONS,
  GROUP_TYPE_OPTIONS,
} from '@/types/quote-request.types';

const DATE_FLEXIBILITY_OPTIONS_DATA = [
  { value: 'exact', label: 'Exact Dates', description: 'I have specific dates in mind' },
  { value: 'flexible', label: 'Flexible', description: 'I have a date range' },
  { value: 'very_flexible', label: 'Very Flexible', description: 'I\'m open to suggestions' },
];

const GROUP_TYPE_OPTIONS_DATA = [
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'friends', label: 'Friends', icon: '👥' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'wedding', label: 'Wedding', icon: '💍' },
  { value: 'corporate_event', label: 'Corporate Event', icon: '🏢' },
  { value: 'retreat', label: 'Retreat', icon: '🧘' },
  { value: 'conference', label: 'Conference', icon: '📊' },
  { value: 'celebration', label: 'Celebration', icon: '🎉' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export const QuoteRequestForm: React.FC<QuoteRequestFormProps> = ({
  propertyId,
  propertyName,
  propertyCurrency,
  propertyImage,
  onSuccess,
  onCancel,
}) => {
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<QuoteRequestFormState>({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    date_flexibility: 'exact' as QuoteDateFlexibility,
    preferred_check_in: '',
    preferred_check_out: '',
    flexible_date_start: '',
    flexible_date_end: '',
    nights_count: 7,
    adults_count: 2,
    children_count: 0,
    group_type: 'family' as QuoteGroupType,
    budget_min: '',
    budget_max: '',
    event_type: '',
    event_description: '',
    special_requirements: '',
  });

  const [errors, setErrors] = useState<QuoteRequestFormErrors>({});

  // Handlers
  const handleInputChange = (field: keyof QuoteRequestFormState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Form validation - validates all fields at once
  const validateForm = (): boolean => {
    const newErrors: QuoteRequestFormErrors = {};

    // Guest Info
    if (!formData.guest_name.trim()) {
      newErrors.guest_name = 'Name is required';
    } else if (formData.guest_name.trim().length < 2) {
      newErrors.guest_name = 'Name must be at least 2 characters';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.guest_email.trim()) {
      newErrors.guest_email = 'Email is required';
    } else if (!emailPattern.test(formData.guest_email)) {
      newErrors.guest_email = 'Invalid email address';
    }

    // Date Requirements
    if (formData.date_flexibility === 'exact') {
      if (!formData.preferred_check_in) {
        newErrors.preferred_check_in = 'Check-in date is required';
      }
      if (!formData.preferred_check_out) {
        newErrors.preferred_check_out = 'Check-out date is required';
      }
      if (formData.preferred_check_in && formData.preferred_check_out) {
        if (new Date(formData.preferred_check_out) <= new Date(formData.preferred_check_in)) {
          newErrors.preferred_check_out = 'Check-out must be after check-in';
        }
      }
    }

    if (formData.date_flexibility === 'flexible') {
      if (!formData.flexible_date_start) {
        newErrors.flexible_date_start = 'Start date is required';
      }
      if (!formData.flexible_date_end) {
        newErrors.flexible_date_end = 'End date is required';
      }
      if (formData.flexible_date_start && formData.flexible_date_end) {
        if (new Date(formData.flexible_date_end) <= new Date(formData.flexible_date_start)) {
          newErrors.flexible_date_end = 'End date must be after start date';
        }
      }
    }

    // Guest Requirements
    if (formData.adults_count < 1) {
      newErrors.adults_count = 'At least 1 adult is required';
    }

    if (formData.budget_min && formData.budget_max) {
      const min = parseFloat(formData.budget_min);
      const max = parseFloat(formData.budget_max);
      if (max < min) {
        newErrors.budget_max = 'Maximum budget must be greater than minimum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        property_id: propertyId,
        guest_name: formData.guest_name.trim(),
        guest_email: formData.guest_email.trim().toLowerCase(),
        guest_phone: formData.guest_phone.trim() || undefined,
        date_flexibility: formData.date_flexibility,
        preferred_check_in: formData.date_flexibility === 'exact' ? formData.preferred_check_in : undefined,
        preferred_check_out: formData.date_flexibility === 'exact' ? formData.preferred_check_out : undefined,
        flexible_date_start: formData.date_flexibility === 'flexible' ? formData.flexible_date_start : undefined,
        flexible_date_end: formData.date_flexibility === 'flexible' ? formData.flexible_date_end : undefined,
        nights_count: formData.date_flexibility === 'very_flexible' ? formData.nights_count : undefined,
        adults_count: formData.adults_count,
        children_count: formData.children_count || undefined,
        group_type: formData.group_type,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        special_requirements: formData.special_requirements.trim() || undefined,
        event_type: formData.event_type.trim() || undefined,
        event_description: formData.event_description.trim() || undefined,
      };

      const quote = await quoteRequestService.create(payload);

      setIsSuccess(true);

      if (onSuccess) {
        setTimeout(() => onSuccess(quote), 1500);
      }
    } catch (error: any) {
      console.error('Failed to submit quote:', error);
      setSubmitError(error.response?.data?.error?.message || 'Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <HiCheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Quote Request Submitted!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Thank you! The property owner has been notified and will respond soon.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-dark-card rounded-lg p-6 text-left space-y-3">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Property:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{propertyName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">We'll send updates to:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{formData.guest_email}</p>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>You'll receive an email confirmation shortly.</p>
            <p className="mt-2">The property owner typically responds within 24 hours.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Request a Custom Quote
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us about your needs and we'll provide a personalized quote for your stay at {propertyName}
        </p>
      </div>

      {/* Error Alert */}
      {submitError && (
        <Alert variant="error" className="mb-6">
          {submitError}
        </Alert>
      )}

      {/* Form - All Sections Visible */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg p-6 md:p-8 mb-6 space-y-12">
        {/* Section 1: Guest Information */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your Contact Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We'll use this to send you the quote and updates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              value={formData.guest_name}
              onChange={(e) => handleInputChange('guest_name', e.target.value)}
              error={errors.guest_name}
              required
              placeholder="John Doe"
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.guest_email}
              onChange={(e) => handleInputChange('guest_email', e.target.value)}
              error={errors.guest_email}
              required
              placeholder="john@example.com"
            />
          </div>

          <Input
            label="Phone Number (Optional)"
            type="tel"
            value={formData.guest_phone}
            onChange={(e) => handleInputChange('guest_phone', e.target.value)}
            error={errors.guest_phone}
            placeholder="+27 123 456 789"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Section 2: Date Requirements */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              When Do You Want to Stay?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tell us about your preferred dates
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Date Flexibility
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DATE_FLEXIBILITY_OPTIONS_DATA.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('date_flexibility', option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.date_flexibility === option.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {formData.date_flexibility === 'exact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Check-in Date"
                type="date"
                value={formData.preferred_check_in}
                onChange={(e) => handleInputChange('preferred_check_in', e.target.value)}
                error={errors.preferred_check_in}
                required
                min={new Date().toISOString().split('T')[0]}
              />

              <Input
                label="Check-out Date"
                type="date"
                value={formData.preferred_check_out}
                onChange={(e) => handleInputChange('preferred_check_out', e.target.value)}
                error={errors.preferred_check_out}
                required
                min={formData.preferred_check_in || new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {formData.date_flexibility === 'flexible' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Earliest Date"
                  type="date"
                  value={formData.flexible_date_start}
                  onChange={(e) => handleInputChange('flexible_date_start', e.target.value)}
                  error={errors.flexible_date_start}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />

                <Input
                  label="Latest Date"
                  type="date"
                  value={formData.flexible_date_end}
                  onChange={(e) => handleInputChange('flexible_date_end', e.target.value)}
                  error={errors.flexible_date_end}
                  required
                  min={formData.flexible_date_start || new Date().toISOString().split('T')[0]}
                />
              </div>

              <Input
                label="Approximate Number of Nights"
                type="number"
                value={formData.nights_count}
                onChange={(e) => handleInputChange('nights_count', parseInt(e.target.value))}
                min={1}
                max={365}
              />
            </div>
          )}

          {formData.date_flexibility === 'very_flexible' && (
            <Input
              label="How Many Nights Do You Need?"
              type="number"
              value={formData.nights_count}
              onChange={(e) => handleInputChange('nights_count', parseInt(e.target.value))}
              min={1}
              max={365}
              required
            />
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Section 3: Guest Requirements */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Tell Us About Your Group
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This helps us provide the best quote for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Number of Adults"
              type="number"
              value={formData.adults_count}
              onChange={(e) => handleInputChange('adults_count', parseInt(e.target.value))}
              error={errors.adults_count}
              min={1}
              max={100}
              required
            />

            <Input
              label="Number of Children (Optional)"
              type="number"
              value={formData.children_count}
              onChange={(e) => handleInputChange('children_count', parseInt(e.target.value))}
              min={0}
              max={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Group Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GROUP_TYPE_OPTIONS_DATA.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('group_type', option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.group_type === option.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {(formData.group_type === 'wedding' || formData.group_type === 'corporate_event' || formData.group_type === 'conference') && (
            <div className="space-y-4">
              <Input
                label="Event Type"
                value={formData.event_type}
                onChange={(e) => handleInputChange('event_type', e.target.value)}
                placeholder="e.g., Wedding reception, Team building retreat"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Description
                </label>
                <textarea
                  value={formData.event_description}
                  onChange={(e) => handleInputChange('event_description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                  placeholder="Tell us about your event..."
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={`Minimum Budget (${propertyCurrency})`}
              type="number"
              value={formData.budget_min}
              onChange={(e) => handleInputChange('budget_min', e.target.value)}
              error={errors.budget_min}
              min={0}
              placeholder="Optional"
            />

            <Input
              label={`Maximum Budget (${propertyCurrency})`}
              type="number"
              value={formData.budget_max}
              onChange={(e) => handleInputChange('budget_max', e.target.value)}
              error={errors.budget_max}
              min={0}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Special Requirements (Optional)
            </label>
            <textarea
              value={formData.special_requirements}
              onChange={(e) => handleInputChange('special_requirements', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
              placeholder="Any special requests or requirements? (e.g., accessibility needs, dietary restrictions, pet accommodations)"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>What happens next?</strong> The property owner will review your request and respond with a personalized quote typically within 24 hours. You'll receive an email notification when they respond.
          </p>
        </div>
      </div>

      {/* Submit Footer */}
      <div className="flex items-center justify-center pt-6">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          isLoading={isSubmitting}
          className="px-12 py-3 text-lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
        </Button>
      </div>

      {/* Cancel button */}
      {onCancel && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
