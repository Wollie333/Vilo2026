/**
 * PricingPage Component
 *
 * Public pricing page displaying subscription plans with:
 * - Monthly/Annual billing toggle
 * - Plan cards with features and pricing
 * - CTA buttons linking to checkout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert } from '@/components/ui';
import { billingService } from '@/services';
import { useAuth } from '@/hooks';
import type { SubscriptionType, BillingInterval } from '@/types/billing.types';
import { LIMIT_KEY_LABELS } from '@/types/billing.types';

// Icons
const CheckIcon = () => (
  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Format price from cents
function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Get feature label from limit key
function getFeatureLabel(key: string, value: number): string {
  const label = LIMIT_KEY_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  if (value === -1) return `Unlimited ${label}`;
  return `${value} ${label}`;
}

interface PricingCardProps {
  plan: SubscriptionType;
  billingInterval: BillingInterval;
  isPopular?: boolean;
  onSelectPlan: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  billingInterval,
  isPopular = false,
  onSelectPlan,
}) => {
  const pricing = plan.pricing || { monthly: 0, annual: 0 };
  const displayPrice = billingInterval === 'monthly' ? pricing.monthly : pricing.annual;
  const isFree = displayPrice === 0 && pricing.monthly === 0 && pricing.annual === 0;

  // Calculate savings for annual
  const monthlyAnnualized = pricing.monthly * 12;
  const annualSavings = monthlyAnnualized - pricing.annual;
  const savingsPercent = monthlyAnnualized > 0 ? Math.round((annualSavings / monthlyAnnualized) * 100) : 0;

  // Get features from limits
  const features = Object.entries(plan.limits || {})
    .filter(([_, value]) => value !== 0)
    .map(([key, value]) => getFeatureLabel(key, value));

  return (
    <div
      className={`
        relative flex flex-col p-6 bg-white dark:bg-dark-card rounded-2xl
        border-2 transition-all duration-200
        ${isPopular
          ? 'border-primary shadow-xl scale-105 z-10'
          : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
        }
      `}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-full">
            <StarIcon />
            Most Popular
          </span>
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
        {plan.display_name}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 min-h-[40px]">
        {plan.description || 'No description available'}
      </p>

      {/* Price */}
      <div className="mt-6">
        {isFree ? (
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">Free</span>
          </div>
        ) : (
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {formatPrice(displayPrice, plan.currency)}
            </span>
            <span className="ml-2 text-gray-500 dark:text-gray-400">
              /{billingInterval === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
        )}

        {/* Savings Badge */}
        {billingInterval === 'annual' && savingsPercent > 0 && (
          <p className="mt-1 text-sm text-primary font-medium">
            Save {savingsPercent}% compared to monthly
          </p>
        )}

        {/* Trial Badge */}
        {plan.trial_period_days && plan.trial_period_days > 0 && (
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400 font-medium">
            {plan.trial_period_days}-day free trial
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Button
        variant={isPopular ? 'primary' : 'outline'}
        className="mt-6 w-full"
        onClick={onSelectPlan}
      >
        {isFree ? 'Get Started' : 'Subscribe Now'}
      </Button>

      {/* Features */}
      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white">What's included:</p>
        {features.length > 0 ? (
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckIcon />
                <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No specific limits - enjoy the basics!
          </p>
        )}
      </div>
    </div>
  );
};

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const subscriptionTypes = await billingService.listSubscriptionTypes({ is_active: true });
        setPlans(subscriptionTypes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pricing plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: SubscriptionType) => {
    // If user is not logged in, go to plan signup page
    if (!user) {
      navigate(`/signup/${plan.id}?interval=${billingInterval}`);
      return;
    }

    // User is logged in - check if plan is free
    // More robust check that handles null/undefined and name-based detection
    const monthlyPrice = plan.pricing?.monthly ?? 0;
    const annualPrice = plan.pricing?.annual ?? 0;
    const nameIndicatesFree = plan.name?.toLowerCase().includes('free') ||
                               plan.display_name?.toLowerCase().includes('free');
    const isFree = (monthlyPrice === 0 && annualPrice === 0) || nameIndicatesFree;

    console.log('PricingPage - Plan selected:', plan.display_name, 'isFree:', isFree);

    if (isFree) {
      // Free plan: go to onboarding
      navigate('/onboarding');
    } else {
      // Paid plan: go to checkout
      navigate(`/checkout?plan=${plan.id}&interval=${billingInterval}`);
    }
  };

  // Sort plans: Free plan first, then by monthly price ascending
  const sortedPlans = [...plans].sort((a, b) => {
    const aPrice = a.pricing?.monthly ?? 0;
    const bPrice = b.pricing?.monthly ?? 0;
    const aIsFree = (aPrice === 0 && (a.pricing?.annual ?? 0) === 0) ||
                     a.name?.toLowerCase().includes('free') ||
                     a.display_name?.toLowerCase().includes('free');
    const bIsFree = (bPrice === 0 && (b.pricing?.annual ?? 0) === 0) ||
                     b.name?.toLowerCase().includes('free') ||
                     b.display_name?.toLowerCase().includes('free');

    // Free plan always first
    if (aIsFree && !bIsFree) return -1;
    if (!aIsFree && bIsFree) return 1;

    // Then sort by price ascending
    return aPrice - bPrice;
  });

  // Find the "popular" plan - the middle paid plan (excluding free)
  const getPopularPlanId = (): string | null => {
    const paidPlans = sortedPlans.filter(p => {
      const price = p.pricing?.monthly || 0;
      const annualPrice = p.pricing?.annual || 0;
      return price > 0 || annualPrice > 0;
    });

    if (paidPlans.length === 0) return null;
    if (paidPlans.length === 1) return paidPlans[0].id;

    // Get the middle paid plan
    const middleIndex = Math.floor(paidPlans.length / 2);
    return paidPlans[middleIndex].id;
  };

  const popularPlanId = getPopularPlanId();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Header */}
      <div className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo / Brand */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the plan that's right for your business. All plans include our core features.
            </p>
          </div>

          {error && (
            <Alert variant="error" className="max-w-xl mx-auto mb-8">
              {error}
            </Alert>
          )}

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-dark-border rounded-lg">
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={`
                  px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                  ${billingInterval === 'monthly'
                    ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('annual')}
                className={`
                  px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                  ${billingInterval === 'annual'
                    ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                Annual
                <span className="ml-1.5 text-xs text-primary font-semibold">Save up to 20%</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          {sortedPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No pricing plans available at the moment.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-8 items-start max-w-7xl mx-auto">
              {sortedPlans.map((plan) => (
                <div key={plan.id} className="w-full sm:w-80">
                  <PricingCard
                    plan={plan}
                    billingInterval={billingInterval}
                    isPopular={plan.id === popularPlanId}
                    onSelectPlan={() => handleSelectPlan(plan)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* FAQ or Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Zero transaction fees. No hidden costs. Just reliable software.
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Keep 100% of your booking revenue. Cancel anytime.
            </p>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Questions?{' '}
              <a href="mailto:support@vilo.com" className="text-primary hover:underline">
                Contact our sales team
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
