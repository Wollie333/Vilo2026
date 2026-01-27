/**
 * PlanSignupPage Component
 *
 * Minimal signup page with plan context:
 * - Only collects email + password (lowest friction)
 * - Shows selected plan info
 * - After signup, redirects to:
 *   - Onboarding (for free plans - after activation)
 *   - Checkout (for paid plans)
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/layout';
import { Input, Button, Alert, Spinner, InitializationLoader } from '@/components/ui';
import { useAuth } from '@/hooks';
import { billingService, onboardingService } from '@/services';
import type { SubscriptionType, BillingInterval } from '@/types';

export const PlanSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const billingInterval = (searchParams.get('interval') as BillingInterval) || 'monthly';

  const { signup, isLoading: authLoading, error: authError, isInitializing } = useAuth();

  // Plan state
  const [plan, setPlan] = useState<SubscriptionType | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch plan details
  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        setPlanError('No plan selected');
        setPlanLoading(false);
        return;
      }

      try {
        setPlanLoading(true);
        const plans = await billingService.listSubscriptionTypes({ is_active: true });
        const selectedPlan = plans.find(p => p.id === planId);

        if (!selectedPlan) {
          setPlanError('Plan not found');
        } else {
          setPlan(selectedPlan);
        }
      } catch (err) {
        setPlanError('Failed to load plan details');
      } finally {
        setPlanLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(''); // Clear error on input change
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (!formData.password) {
      return 'Password is required';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(formData.password)) {
      return 'Password must contain an uppercase letter';
    }
    if (!/[a-z]/.test(formData.password)) {
      return 'Password must contain a lowercase letter';
    }
    if (!/[0-9]/.test(formData.password)) {
      return 'Password must contain a number';
    }
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      return 'Password must contain a special character';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const isPlanFree = (): boolean => {
    if (!plan) return false;

    // Check multiple possible free plan indicators
    const monthlyPrice = plan.pricing_tiers?.monthly?.price_cents ?? 0;
    const annualPrice = plan.pricing_tiers?.annual?.price_cents ?? 0;

    // Plan is free if:
    // 1. Both prices are 0
    // 2. Both prices are null/undefined
    // 3. Pricing object doesn't exist
    // 4. Plan name contains "free" (case insensitive)
    const pricesAreFree = monthlyPrice === 0 && annualPrice === 0;
    const noPricing = !plan.pricing || (monthlyPrice === 0 && annualPrice === 0);
    const nameIndicatesFree = plan.name?.toLowerCase().includes('free') ||
                               plan.display_name?.toLowerCase().includes('free');

    return pricesAreFree || noPricing || nameIndicatesFree;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      // Sign up with minimal data (sets isInitializing = true in AuthContext)
      await signup({
        fullName: formData.email.split('@')[0], // Temporary name from email
        email: formData.email,
        password: formData.password,
      });

      // Set the selected plan for the user
      await onboardingService.setSelectedPlan({
        plan_id: planId!,
        billing_interval: billingInterval,
      });

      // Activate free plan if applicable
      if (isPlanFree()) {
        await onboardingService.activateFreePlan(planId!);
      }

      // Navigate immediately to onboarding (no setTimeout)
      // InitializationLoader stays visible because isInitializing is still true
      navigate('/onboarding');

    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create account');
      setIsSubmitting(false);
    }
  };

  const displayError = formError || authError;
  const isLoading = authLoading || isSubmitting;

  // Format price for display
  const formatPrice = (cents: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getDisplayPrice = (): string => {
    if (!plan) return '';
    const price = billingInterval === 'monthly'
      ? plan.pricing_tiers?.monthly?.price_cents || 0
      : plan.pricing_tiers?.annual?.price_cents || 0;
    if (price === 0) return 'Free';
    return `${formatPrice(price, plan.currency)}/${billingInterval === 'monthly' ? 'mo' : 'yr'}`;
  };

  // Show initialization loader during entire signup → onboarding flow
  if (isInitializing) {
    return <InitializationLoader />;
  }

  // Show loading while fetching plan
  if (planLoading || !plan) {
    return (
      <AuthLayout title="Loading..." subtitle="Please wait">
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </AuthLayout>
    );
  }

  // Show error if plan not found
  if (planError) {
    return (
      <AuthLayout title="Plan not found" subtitle="Something went wrong">
        <div className="space-y-6">
          <Alert variant="error">
            {planError || 'The selected plan could not be found.'}
          </Alert>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/pricing')}
          >
            View Pricing Plans
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={`Get started with ${plan.display_name} - ${getDisplayPrice()}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {displayError && (
          <Alert variant="error" dismissible onDismiss={() => setFormError('')}>
            {displayError}
          </Alert>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-10"
              fullWidth
              disabled={isLoading}
              autoFocus
            />
          </div>
        </div>

        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a strong password"
          autoComplete="new-password"
          helperText="Min 8 chars, uppercase, lowercase, number, special char"
          fullWidth
          disabled={isLoading}
        />

        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          autoComplete="new-password"
          fullWidth
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          {isPlanFree() ? 'Create Free Account' : 'Continue to Payment'}
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to={`/login?redirect=/checkout?plan=${planId}&interval=${billingInterval}`}
            className="font-medium text-primary hover:text-primary-600"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link
            to="/pricing"
            className="font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Change plan
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default PlanSignupPage;
