/**
 * PlanCheckoutPage - Individual checkout page for each subscription plan
 * Accessible at /plans/:slug
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { billingService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { Button, Spinner, Alert } from '@/components/ui';
import type { SubscriptionType, BillingInterval } from '@/types/billing.types';

export const PlanCheckoutPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [plan, setPlan] = useState<SubscriptionType | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, [slug]);

  const loadPlan = async () => {
    if (!slug) {
      console.log('❌ [PlanCheckoutPage] No slug provided');
      return;
    }

    console.log('🎯 [PlanCheckoutPage] Loading plan with slug:', slug);

    try {
      setIsLoading(true);
      setError(null);
      const data = await billingService.getSubscriptionTypeBySlug(slug);
      console.log('✅ [PlanCheckoutPage] Plan loaded:', data);
      setPlan(data);
    } catch (err) {
      console.error('❌ [PlanCheckoutPage] Failed to load plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription plan');
    } finally {
      setIsLoading(false);
    }
  };

  const isPlanFree = (p: SubscriptionType): boolean => {
    // Check pricing_tiers for monthly and annual prices
    const monthlyPrice = p.pricing_tiers?.monthly?.price_cents || 0;
    const annualPrice = p.pricing_tiers?.annual?.price_cents || 0;
    const oneOffPrice = p.pricing_tiers?.one_off?.price_cents || 0;
    return monthlyPrice === 0 && annualPrice === 0 && oneOffPrice === 0;
  };

  const getPrice = (interval: BillingInterval): number => {
    if (!plan) return 0;
    return interval === 'monthly'
      ? (plan.pricing_tiers?.monthly?.price_cents || 0)
      : (plan.pricing_tiers?.annual?.price_cents || 0);
  };

  const formatPrice = (cents: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: plan?.currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const calculateSavings = (): number => {
    if (!plan) return 0;
    const monthly = plan.pricing_tiers?.monthly?.price_cents || 0;
    const annual = plan.pricing_tiers?.annual?.price_cents || 0;
    const monthlyTotal = monthly * 12;
    return monthlyTotal - annual;
  };

  const handleGetStarted = () => {
    if (!plan) return;

    const isFree = isPlanFree(plan);

    // Not authenticated - go to signup
    if (!isAuthenticated) {
      navigate(`/signup/${plan.id}?interval=${billingInterval}`);
      return;
    }

    // Authenticated + Free plan - go to onboarding
    if (isFree) {
      navigate('/onboarding');
      return;
    }

    // Authenticated + Paid plan - go to checkout
    navigate(`/checkout?plan=${plan.id}&interval=${billingInterval}`);
  };

  const generateFeaturesFromLimits = (limits: Record<string, number>): string[] => {
    const features: string[] = [];

    const limitLabels: Record<string, string> = {
      max_properties: 'Properties',
      max_rooms: 'Rooms',
      max_team_members: 'Team Members',
      max_bookings_per_month: 'Bookings per Month',
      max_storage_mb: 'Storage',
    };

    Object.entries(limits).forEach(([key, value]) => {
      const label = limitLabels[key] || key;
      if (value === -1) {
        features.push(`Unlimited ${label}`);
      } else if (value > 0) {
        const formattedValue = key === 'max_storage_mb'
          ? `${value}MB`
          : value.toString();
        features.push(`${formattedValue} ${label}`);
      }
    });

    return features;
  };

  // Debug logging
  console.log('🔍 [PlanCheckoutPage] Render state:', { isLoading, error, hasPlan: !!plan });

  // Loading state
  if (isLoading) {
    console.log('⏳ [PlanCheckoutPage] Showing loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !plan) {
    console.log('❌ [PlanCheckoutPage] Showing error:', error || 'Plan not found');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="error" className="mb-4">
            {error || 'Subscription plan not found'}
          </Alert>
          <Button variant="outline" onClick={() => navigate('/pricing')} className="w-full">
            View All Plans
          </Button>
        </div>
      </div>
    );
  }

  console.log('✅ [PlanCheckoutPage] Rendering plan page for:', plan.display_name);

  const isFree = isPlanFree(plan);
  const price = getPrice(billingInterval);
  const features = plan.custom_features && plan.custom_features.length > 0
    ? plan.custom_features
    : generateFeaturesFromLimits(plan.limits || {});
  const savings = calculateSavings();
  const ctaText = plan.custom_cta_text || (isFree ? 'Get Started Free' : 'Get Started');

  return (
    <>
      <Helmet>
        <title>{plan.custom_headline || plan.display_name} - Vilo Pricing</title>
        <meta name="description" content={plan.custom_description || plan.description || ''} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            {plan.checkout_badge && (
              <span
                className="inline-block px-4 py-1.5 text-sm font-medium rounded-full mb-4"
                style={{
                  backgroundColor: plan.checkout_accent_color
                    ? `${plan.checkout_accent_color}15`
                    : 'rgba(4, 120, 87, 0.1)',
                  color: plan.checkout_accent_color || '#047857'
                }}
              >
                {plan.checkout_badge}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {plan.custom_headline || plan.display_name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {plan.custom_description || plan.description}
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden mb-8">
            <div className="p-8">
              {/* Billing Interval Toggle (only for paid plans) */}
              {!isFree && (
                <div className="flex justify-center mb-8">
                  <div className="inline-flex bg-gray-100 dark:bg-dark-bg rounded-lg p-1">
                    <button
                      onClick={() => setBillingInterval('monthly')}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                        billingInterval === 'monthly'
                          ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingInterval('annual')}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                        billingInterval === 'annual'
                          ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Annual
                      {savings > 0 && (
                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                          Save {formatPrice(savings)}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Price Display */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {isFree ? 'Free' : formatPrice(price)}
                  </span>
                  {!isFree && (
                    <span className="text-xl text-gray-500 dark:text-gray-400">
                      /{billingInterval === 'monthly' ? 'month' : 'year'}
                    </span>
                  )}
                </div>
                {(() => {
                  const trialDays = billingInterval === 'monthly'
                    ? plan.pricing_tiers?.monthly?.trial_period_days ?? plan.trial_period_days ?? 0
                    : plan.pricing_tiers?.annual?.trial_period_days ?? plan.trial_period_days ?? 0;

                  return trialDays && trialDays > 0 && !isFree ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {trialDays}-day free trial included
                    </p>
                  ) : null;
                })()}
              </div>

              {/* CTA Button */}
              <div className="text-center mb-8">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGetStarted}
                  className="w-full md:w-auto min-w-[280px]"
                  style={plan.checkout_accent_color ? {
                    backgroundColor: plan.checkout_accent_color,
                    borderColor: plan.checkout_accent_color
                  } : undefined}
                >
                  {ctaText}
                </Button>
              </div>

              {/* Features List */}
              {features.length > 0 && (
                <div className="border-t border-gray-200 dark:border-dark-border pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                    What's included
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              No credit card required for free plans. Cancel anytime.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="text-primary hover:underline mt-2 inline-block"
            >
              View all plans and compare features
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
