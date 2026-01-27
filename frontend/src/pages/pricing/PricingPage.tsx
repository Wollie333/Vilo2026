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
import { PublicLayout } from '@/components/layout';
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

  // Special formatting for storage
  if (key === 'max_storage_mb') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}GB Storage`;
    }
    return `${value}MB Storage`;
  }

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
  // Use pricing_tiers (new structure) with fallback to pricing (legacy)
  const monthlyPrice = plan.pricing_tiers?.monthly?.price_cents ?? plan.pricing?.monthly ?? 0;
  const annualPrice = plan.pricing_tiers?.annual?.price_cents ?? plan.pricing?.annual ?? 0;
  const displayPrice = billingInterval === 'monthly' ? monthlyPrice : annualPrice;
  const isFree = displayPrice === 0 && monthlyPrice === 0 && annualPrice === 0;

  // Calculate savings for annual
  const monthlyAnnualized = monthlyPrice * 12;
  const annualSavings = monthlyAnnualized - annualPrice;
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
            Best Value
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
    // Navigate directly to checkout with selected plan and billing interval
    navigate(`/checkout?plan=${plan.slug}&interval=${billingInterval}`);
  };

  // Sort plans: Free plan first, then by monthly price ascending
  const sortedPlans = [...plans].sort((a, b) => {
    const aPrice = a.pricing_tiers?.monthly?.price_cents ?? 0;
    const bPrice = b.pricing_tiers?.monthly?.price_cents ?? 0;
    const aIsFree = (aPrice === 0 && (a.pricing_tiers?.annual?.price_cents ?? 0) === 0) ||
                     a.name?.toLowerCase().includes('free') ||
                     a.display_name?.toLowerCase().includes('free');
    const bIsFree = (bPrice === 0 && (b.pricing_tiers?.annual?.price_cents ?? 0) === 0) ||
                     b.name?.toLowerCase().includes('free') ||
                     b.display_name?.toLowerCase().includes('free');

    // Free plan always first
    if (aIsFree && !bIsFree) return -1;
    if (!aIsFree && bIsFree) return 1;

    // Then sort by price ascending
    return aPrice - bPrice;
  });

  // Find the "popular" plan - Vilo Lite
  const getPopularPlanId = (): string | null => {
    // First, try to find "Vilo Lite" by slug or display_name
    const litePlan = sortedPlans.find(p =>
      p.slug?.toLowerCase() === 'lite' ||
      p.display_name?.toLowerCase().includes('lite')
    );

    if (litePlan) return litePlan.id;

    // Fallback: find the first paid plan (lowest price)
    const paidPlans = sortedPlans.filter(p => {
      const price = p.pricing_tiers?.monthly?.price_cents || 0;
      const annualPrice = p.pricing_tiers?.annual?.price_cents || 0;
      return price > 0 || annualPrice > 0;
    });

    return paidPlans.length > 0 ? paidPlans[0].id : null;
  };

  const popularPlanId = getPopularPlanId();

  if (loading) {
    return (
      <PublicLayout transparentHeader>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="xl" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout transparentHeader>
      {/* Hero & Pricing Section - All in one with dark gradient background */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 dark:from-black dark:to-gray-900 pt-24 pb-12">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-primary/20 dark:bg-primary/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-teal-500/15 dark:bg-teal-500/25 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Hero Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white dark:text-gray-50 mb-3 leading-tight">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-lg text-white/80 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Choose the plan that's right for your business. All plans include our core features.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="error" className="max-w-xl mx-auto mb-6">
              {error}
            </Alert>
          )}

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center p-1 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg border border-white/20">
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={`
                  px-6 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${billingInterval === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-white/80 hover:text-white'
                  }
                `}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('annual')}
                className={`
                  px-6 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${billingInterval === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-white/80 hover:text-white'
                  }
                `}
              >
                Annual
                <span className={`ml-1.5 text-xs font-semibold ${billingInterval === 'annual' ? 'text-primary' : 'text-emerald-400'}`}>
                  Save up to 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          {sortedPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">
                No pricing plans available at the moment.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 items-start">
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

          {/* FAQ Info */}
          <div className="mt-8 text-center">
            <p className="text-base font-medium text-white/90">
              Zero transaction fees. No hidden costs. Just reliable software.
            </p>
            <p className="mt-1 text-sm text-white/60">
              Keep 100% of your booking revenue. Cancel anytime.
            </p>
            <p className="mt-3 text-sm text-white/60">
              Questions?{' '}
              <a href="mailto:support@vilo.com" className="text-emerald-400 hover:text-emerald-300 hover:underline">
                Contact our sales team
              </a>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PricingPage;
