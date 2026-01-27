/**
 * CheckoutPage Component
 *
 * Checkout flow with:
 * - Order summary
 * - Payment method selection
 * - Payment processing
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spinner, Alert, Badge, CTAButton, CyclingText } from '@/components/ui';
import { LogoIcon } from '@/components/ui/Logo';
import { billingService, checkoutService } from '@/services';
import type { SubscriptionType, BillingInterval } from '@/types/billing.types';
import type {
  PaymentProvider,
  AvailablePaymentMethod,
  InitializeCheckoutResponse,
  EFTInitData,
} from '@/types/checkout.types';

// Better Payment Icons
const CardPaymentIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 10H22" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 15H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 15H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="18" cy="15" r="1" fill="currentColor"/>
  </svg>
);

const PayPalIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.544h6.964c2.075 0 3.548.476 4.377 1.416.782.888 1.062 2.191.833 3.878-.266 1.956-1.127 3.496-2.561 4.578-1.389 1.048-3.185 1.579-5.339 1.579H7.476l-1.045 6.71a.641.641 0 0 1-.633.544H7.076z"/>
  </svg>
);

const BankTransferIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 3L3 10H21L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M5 10V21" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 10V21" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 10V21" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M19 10V21" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="7" r="1" fill="currentColor"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const PropertyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Payment method config
const PAYMENT_METHOD_CONFIG: Record<PaymentProvider, { icon: React.ReactNode; label: string; description: string }> = {
  paystack: {
    icon: <CardPaymentIcon />,
    label: 'Card Payment',
    description: 'Paystack secure payment',
  },
  paypal: {
    icon: <PayPalIcon />,
    label: 'PayPal',
    description: 'Pay with your PayPal account',
  },
  eft: {
    icon: <BankTransferIcon />,
    label: 'Bank Transfer',
    description: 'Pay with EFT',
  },
};

// Format price from cents
function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Feature Card Component - Dark Theme
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-5 border border-primary/20 min-w-[280px] w-[280px] flex-shrink-0">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white text-sm">{title}</h4>
      </div>
    </div>
    <p className="text-sm text-gray-400 line-clamp-2">{description}</p>
  </div>
);

// Testimonial Card Component
const TestimonialCard: React.FC<{
  name: string;
  amount: string;
  month: string;
  avatar?: string;
}> = ({ name, amount, month, avatar }) => (
  <div className="bg-gradient-to-br from-primary/20 to-emerald-900/30 backdrop-blur-sm rounded-xl p-5 border border-primary/30 min-w-[280px] w-[280px] flex-shrink-0">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white text-sm">{name}</h4>
        <p className="text-xs text-primary">Verified Host</p>
      </div>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    </div>
    <p className="text-sm text-gray-300">
      Saved <span className="text-primary font-bold">{amount}</span> on booking fees in {month}
    </p>
  </div>
);

// Get previous month name
const getPreviousMonth = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toLocaleString('en-US', { month: 'long' });
};

// Random name generator for testimonials (temporary until real data)
const FIRST_NAMES = [
  'Susan', 'David', 'Maria', 'John', 'Sarah', 'Michael', 'Emma', 'James',
  'Linda', 'Robert', 'Patricia', 'William', 'Jennifer', 'Richard', 'Lisa',
  'Thomas', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony',
  'Margaret', 'Mark', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Dorothy', 'Andrew',
  'Thabo', 'Naledi', 'Sipho', 'Lerato', 'Pieter', 'Annemarie', 'Johan', 'Chantal',
];

const LAST_INITIALS = ['M', 'K', 'V', 'S', 'J', 'P', 'R', 'L', 'B', 'T', 'N', 'D', 'W', 'G', 'H'];

// Generate random amount between R2,000 and R15,000 (no cents)
const generateRandomAmount = (): string => {
  const amount = Math.floor(Math.random() * (15000 - 2000 + 1)) + 2000;
  return `R${amount.toLocaleString('en-ZA')}`;
};

// Generate random name
const generateRandomName = (): string => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastInitial = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
  return `${firstName} ${lastInitial}.`;
};

// Generate testimonials (randomized on each page load)
const generateTestimonials = () => [
  { name: generateRandomName(), amount: generateRandomAmount() },
  { name: generateRandomName(), amount: generateRandomAmount() },
  { name: generateRandomName(), amount: generateRandomAmount() },
];

// Testimonials data (regenerated on page load)
const TESTIMONIALS = generateTestimonials();

// Features data for the carousel
const FEATURES = [
  {
    icon: <PropertyIcon />,
    title: 'Property Management',
    description: 'Manage all your vacation rental properties in one place with ease.',
  },
  {
    icon: <CalendarIcon />,
    title: 'Booking Calendar',
    description: 'Handle reservations, availability calendars, and scheduling.',
  },
  {
    icon: <UsersIcon />,
    title: 'Guest Management',
    description: 'Keep track of guest information, preferences, and communication history.',
  },
  {
    icon: <ChartIcon />,
    title: 'Analytics & Reports',
    description: 'Get insights into occupancy rates, revenue, and performance metrics.',
  },
  {
    icon: <CreditCardIcon />,
    title: 'Payment Processing',
    description: 'Accept payments securely with multiple payment gateway options.',
  },
  {
    icon: <BellIcon />,
    title: 'Notifications',
    description: 'Automated alerts for bookings, check-ins, and important updates.',
  },
  {
    icon: <GlobeIcon />,
    title: 'Channel Manager',
    description: 'Sync listings across Airbnb, Booking.com, and other platforms.',
  },
  {
    icon: <ClipboardIcon />,
    title: 'Task Management',
    description: 'Coordinate housekeeping, maintenance, and staff assignments.',
  },
  {
    icon: <StarIcon />,
    title: 'Reviews & Ratings',
    description: 'Collect and manage guest reviews to build your reputation.',
  },
];

// Build carousel items with testimonials interspersed
const buildCarouselItems = () => {
  const previousMonth = getPreviousMonth();
  const items: Array<{ type: 'feature' | 'testimonial'; data: any }> = [];

  let testimonialIndex = 0;
  FEATURES.forEach((feature, index) => {
    items.push({ type: 'feature', data: feature });

    // Insert testimonial after positions 2, 5, and 8 (every 3rd feature)
    if ((index + 1) % 3 === 0 && testimonialIndex < TESTIMONIALS.length) {
      items.push({
        type: 'testimonial',
        data: { ...TESTIMONIALS[testimonialIndex], month: previousMonth },
      });
      testimonialIndex++;
    }
  });

  return items;
};

// Scrolling Feature Carousel Component
const FeatureCarousel: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const carouselItems = buildCarouselItems();

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div
        className={`flex gap-4 ${isPaused ? '[animation-play-state:paused]' : ''}`}
        style={{
          animation: 'scroll 90s linear infinite',
          width: 'max-content',
        }}
      >
        {/* First set of cards */}
        {carouselItems.map((item, index) =>
          item.type === 'feature' ? (
            <FeatureCard
              key={`first-feature-${index}`}
              icon={item.data.icon}
              title={item.data.title}
              description={item.data.description}
            />
          ) : (
            <TestimonialCard
              key={`first-testimonial-${index}`}
              name={item.data.name}
              amount={item.data.amount}
              month={item.data.month}
            />
          )
        )}
        {/* Duplicate set for seamless loop */}
        {carouselItems.map((item, index) =>
          item.type === 'feature' ? (
            <FeatureCard
              key={`second-feature-${index}`}
              icon={item.data.icon}
              title={item.data.title}
              description={item.data.description}
            />
          ) : (
            <TestimonialCard
              key={`second-testimonial-${index}`}
              name={item.data.name}
              amount={item.data.amount}
              month={item.data.month}
            />
          )
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

// EFT Instructions component
const EFTInstructions: React.FC<{ data: EFTInitData; onComplete: () => void; onBack: () => void }> = ({ data, onComplete, onBack }) => (
  <div className="space-y-6">
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
        Bank Transfer Instructions
      </h4>
      <p className="text-sm text-amber-700 dark:text-amber-300">
        {data.instructions}
      </p>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bank Name</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{data.bank_name}</p>
      </div>
      <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Name</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{data.account_name}</p>
      </div>
      <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Number</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono mt-1">{data.account_number}</p>
      </div>
      <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Branch Code</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono mt-1">{data.branch_code}</p>
      </div>
    </div>

    <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Payment Reference (Required)</p>
      <p className="text-lg font-bold text-primary font-mono">{data.reference}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Please use this exact reference when making your payment
      </p>
    </div>

    <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Amount to Pay</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.amount}</p>
    </div>

    <div className="flex gap-3 pt-2">
      <button
        onClick={onBack}
        className="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
      >
        Back
      </button>
      <Button variant="primary" className="flex-1 !rounded-xl" onClick={onComplete}>
        I've Made the Payment
      </Button>
    </div>

    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
      Once we verify your payment, your subscription will be activated. This typically takes 1-2 business days.
    </p>
  </div>
);

type CheckoutStep = 'loading' | 'select-method' | 'processing' | 'eft-instructions' | 'success' | 'error';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const planId = searchParams.get('plan');
  const initialInterval = (searchParams.get('interval') as BillingInterval) || 'monthly';

  const [step, setStep] = useState<CheckoutStep>('loading');
  const [plan, setPlan] = useState<SubscriptionType | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<AvailablePaymentMethod[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [checkout, setCheckout] = useState<InitializeCheckoutResponse | null>(null);
  const [eftData, setEftData] = useState<EFTInitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>(initialInterval);

  // Load plan and payment methods
  useEffect(() => {
    const loadData = async () => {
      if (!planId) {
        setError('No plan selected');
        setStep('error');
        return;
      }

      try {
        // Load plan details and payment methods in parallel
        // Use getSubscriptionTypeBySlug since planId is a slug (e.g., "plus") not a UUID
        const [planData, methodsData] = await Promise.all([
          billingService.getSubscriptionTypeBySlug(planId),
          checkoutService.getPaymentMethods(),
        ]);

        setPlan(planData);
        const enabledMethods = methodsData.methods.filter(m => m.is_enabled);
        setPaymentMethods(enabledMethods);

        // Auto-select first payment method
        if (enabledMethods.length > 0) {
          setSelectedProvider(enabledMethods[0].provider);
        }

        // Initialize checkout
        const checkoutData = await checkoutService.initializeCheckout({
          subscription_type_id: planData.id, // Use UUID from fetched plan, not slug from URL
          billing_interval: initialInterval,
        });

        setCheckout(checkoutData);
        setStep('select-method');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load checkout');
        setStep('error');
      }
    };

    loadData();
  }, [planId, initialInterval]);

  // Reinitialize checkout when interval changes
  useEffect(() => {
    const reinitialize = async () => {
      if (!planId || !plan || step === 'loading' || step === 'error') return;

      try {
        const checkoutData = await checkoutService.initializeCheckout({
          subscription_type_id: plan.id, // Use UUID from plan object
          billing_interval: selectedInterval,
        });
        setCheckout(checkoutData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update checkout');
      }
    };

    if (selectedInterval !== initialInterval) {
      reinitialize();
    }
  }, [selectedInterval, planId, plan, step, initialInterval]);

  // Handle Continue button - process payment
  const handleContinue = async () => {
    if (!checkout || !selectedProvider) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await checkoutService.selectProvider({
        checkout_id: checkout.checkout_id,
        provider: selectedProvider,
      });

      if (selectedProvider === 'eft' && response.eft_data) {
        setEftData(response.eft_data);
        setStep('eft-instructions');
      } else if (selectedProvider === 'paystack' && response.paystack_data) {
        // Store checkout_id and plan info for callback page
        sessionStorage.setItem('checkout_id', checkout.checkout_id);
        sessionStorage.setItem('checkout_plan_name', plan?.display_name || '');
        // Redirect to Paystack
        window.location.href = response.paystack_data.authorization_url;
      } else if (selectedProvider === 'paypal' && response.paypal_data) {
        // Store checkout_id and plan info for callback page
        sessionStorage.setItem('checkout_id', checkout.checkout_id);
        sessionStorage.setItem('checkout_plan_name', plan?.display_name || '');
        // Redirect to PayPal
        window.location.href = response.paypal_data.approval_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEFTComplete = () => {
    setStep('success');
  };

  const handleBack = () => {
    if (step === 'eft-instructions') {
      setStep('select-method');
      setEftData(null);
    } else {
      navigate('/pricing');
    }
  };

  // Get the display price from pricing_tiers
  const monthlyPrice = plan?.pricing_tiers?.monthly?.price_cents || 0;
  const annualPrice = plan?.pricing_tiers?.annual?.price_cents || 0;
  const displayPrice = selectedInterval === 'monthly' ? monthlyPrice : annualPrice;

  // Calculate savings percentage for annual
  const annualMonthlyEquivalent = annualPrice / 12;
  const savingsPercent = monthlyPrice > 0
    ? Math.round(((monthlyPrice - annualMonthlyEquivalent) / monthlyPrice) * 100)
    : 0;

  // Loading state
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-400">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Checkout Error
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {error || 'Something went wrong'}
          </p>
          <Button onClick={() => navigate('/pricing')} className="!rounded-xl">
            Back to Pricing
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (step === 'success') {
    const isEft = selectedProvider === 'eft';

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className={`w-16 h-16 ${isEft ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'} rounded-full flex items-center justify-center mx-auto mb-4 ${isEft ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
            {isEft ? <ClockIcon /> : <CheckIcon />}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {isEft ? 'Payment Pending' : 'Thank You!'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {isEft
              ? 'We\'ve received your payment notification. Your subscription will be activated once we confirm the payment. In the meantime, let\'s set up your profile.'
              : 'Your subscription has been activated. You can now access all features!'}
          </p>
          <Button onClick={() => navigate(isEft ? '/onboarding' : '/dashboard')} className="!rounded-xl">
            {isEft ? 'Continue Setup' : 'Go to Dashboard'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Dark Theme with Green Accents */}
      <div className="lg:w-1/2 bg-gray-950 p-6 lg:p-12 flex flex-col relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header with Logo */}
          <div className="flex items-center gap-3 mb-12">
            <LogoIcon size="lg" variant="glossy-slow" />
            <span className="text-2xl font-bold text-white">Vilo</span>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Headline */}
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
              Get started with {plan?.display_name || 'your plan'} to manage your{' '}
              <CyclingText
                words={[
                  'Rentals',
                  'Guest House',
                  'Bed & Breakfast',
                  'Lodge',
                  'Holiday Home',
                  'Vacation Rental',
                  'Boutique Hotel',
                  'Airbnb',
                ]}
                interval={2500}
                className="text-primary"
              />
            </h1>
            <p className="text-gray-400 mb-8">
              The booking platform you can rely on. Simplified management, exceptional results.
            </p>

            {/* Feature Cards Carousel */}
            <div className="-mx-6 lg:-mx-12 mb-8">
              <FeatureCarousel />
            </div>

            {/* How it works */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold text-white mb-4">How it works?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <span className="text-sm text-gray-300">
                    Select your billing cycle - monthly or annual with savings.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <span className="text-sm text-gray-300">
                    Choose your preferred payment method to complete checkout.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <span className="text-sm text-gray-300">
                    Start managing your properties without paying extra success fees.
                  </span>
                </li>
              </ul>
            </div>

          </div>

          {/* Back Button - Pushed to bottom */}
          <div className="mt-auto pt-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <BackIcon />
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Selection & Payment */}
      <div className="lg:w-1/2 bg-white dark:bg-dark-card p-6 lg:p-12 flex flex-col">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
          {step === 'eft-instructions' && eftData ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Bank Transfer Details
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Complete your payment using the bank details below.
              </p>
              <EFTInstructions data={eftData} onComplete={handleEFTComplete} onBack={handleBack} />
            </>
          ) : (
            <>
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Choose your billing cycle
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                {plan?.description || 'Select how you\'d like to be billed. Annual billing saves you money!'}
              </p>

              {error && (
                <Alert variant="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Billing Interval Selection */}
              <div className="space-y-3 mb-8">
                {/* Monthly Option */}
                <button
                  onClick={() => setSelectedInterval('monthly')}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                    ${selectedInterval === 'monthly'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${selectedInterval === 'monthly' ? 'border-primary' : 'border-gray-300 dark:border-gray-600'}
                  `}>
                    {selectedInterval === 'monthly' && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Monthly billing</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Billed every month</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatPrice(monthlyPrice, plan?.currency || 'ZAR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">per month</p>
                  </div>
                </button>

                {/* Annual Option */}
                <button
                  onClick={() => setSelectedInterval('annual')}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left relative
                    ${selectedInterval === 'annual'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${selectedInterval === 'annual' ? 'border-primary' : 'border-gray-300 dark:border-gray-600'}
                  `}>
                    {selectedInterval === 'annual' && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">Annual billing</p>
                      <Badge variant="success" className="!text-xs">Popular</Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Billed once a year</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatPrice(annualPrice, plan?.currency || 'ZAR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">per year</p>
                    {savingsPercent > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                        Save {savingsPercent}%
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Payment Method Selection */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Select payment method
              </h3>
              <div className="space-y-3 mb-8">
                {paymentMethods.map((method) => {
                  const config = PAYMENT_METHOD_CONFIG[method.provider];
                  return (
                    <button
                      key={method.provider}
                      onClick={() => setSelectedProvider(method.provider)}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                        ${selectedProvider === method.provider
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${selectedProvider === method.provider ? 'border-primary' : 'border-gray-300 dark:border-gray-600'}
                      `}>
                        {selectedProvider === method.provider && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-dark-bg rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400">
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {config.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          {method.provider === 'paystack' && <ShieldCheckIcon />}
                          {config.description}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {paymentMethods.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 dark:bg-dark-bg rounded-xl">
                    <p className="text-gray-500 dark:text-gray-400">
                      No payment methods available at the moment.
                    </p>
                  </div>
                )}
              </div>

              {/* Total Section */}
              <div className="mt-auto">
                <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-dark-border">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Total</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {plan?.currency || 'ZAR'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      Total {formatPrice(displayPrice, plan?.currency || 'ZAR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedInterval === 'monthly' ? 'per month' : 'per year'}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <CTAButton
                    id="checkout-continue-payment-btn"
                    onClick={handleContinue}
                    disabled={!selectedProvider}
                    loading={isProcessing}
                    loadingText="Processing..."
                    icon={<ArrowRightIcon />}
                    iconPosition="right"
                    size="large"
                    dataAttributes={{
                      'tracking-id': 'checkout_continue_payment',
                      'tracking-category': 'checkout',
                      'tracking-action': 'click',
                      'plan-id': planId || '',
                      'billing-interval': selectedInterval,
                      'payment-provider': selectedProvider || '',
                    }}
                  >
                    Continue to Payment
                  </CTAButton>
                </div>

                {/* Trial Info */}
                {plan?.trial_period_days && plan.trial_period_days > 0 ? (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Includes a {plan.trial_period_days}-day free trial
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
