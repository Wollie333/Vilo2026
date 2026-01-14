/**
 * CheckoutCallbackPage Component
 *
 * Handles the callback from payment providers (Paystack, PayPal)
 * and verifies the payment. Shows success/failure and redirects to onboarding.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spinner, Button } from '@/components/ui';
import { checkoutService } from '@/services';
import type { PaymentProvider } from '@/types/checkout.types';

const CheckIcon = () => (
  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

type CallbackStatus = 'verifying' | 'success' | 'error';

const REDIRECT_DELAY = 5; // seconds

export const CheckoutCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const provider = searchParams.get('provider') as PaymentProvider | null;
  const reference = searchParams.get('reference') || searchParams.get('trxref'); // Paystack
  const token = searchParams.get('token'); // PayPal
  const payerId = searchParams.get('PayerID'); // PayPal

  const [status, setStatus] = useState<CallbackStatus>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(REDIRECT_DELAY);

  // Get plan name from session storage
  useEffect(() => {
    const storedPlanName = sessionStorage.getItem('checkout_plan_name');
    if (storedPlanName) {
      setPlanName(storedPlanName);
    }
  }, []);

  // Verify payment
  useEffect(() => {
    const verifyPayment = async () => {
      if (!provider) {
        setError('Invalid callback - no provider specified');
        setStatus('error');
        return;
      }

      // Get checkout ID from session storage (set before redirect)
      const checkoutId = sessionStorage.getItem('checkout_id');
      if (!checkoutId) {
        setError('Invalid callback - no checkout session found');
        setStatus('error');
        return;
      }

      try {
        const result = await checkoutService.verifyPayment({
          checkout_id: checkoutId,
          provider,
          paystack_reference: reference || undefined,
          paypal_order_id: token || undefined,
        });

        if (result.success) {
          // Clear session storage
          sessionStorage.removeItem('checkout_id');
          sessionStorage.removeItem('checkout_plan_name');
          setStatus('success');
        } else {
          setError(result.error || 'Payment verification failed');
          setStatus('error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment verification failed');
        setStatus('error');
      }
    };

    verifyPayment();
  }, [provider, reference, token, payerId]);

  // Auto-redirect countdown on success
  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/onboarding');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <Card.Body className="text-center py-12">
          {status === 'verifying' && (
            <>
              <Spinner size="xl" className="mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verifying Payment
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Please wait while we confirm your payment...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Payment Successful!
              </h2>
              {planName && (
                <p className="text-lg text-primary font-medium mb-2">
                  {planName}
                </p>
              )}
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                Thank you for your purchase! Your subscription has been activated.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                Redirecting to setup in {countdown} seconds...
              </p>
              <Button onClick={() => navigate('/onboarding')}>
                Continue to Setup
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ErrorIcon />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Payment Failed
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {error || 'Something went wrong with your payment'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/pricing')}>
                  Back to Pricing
                </Button>
                <Button onClick={() => navigate('/checkout')}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CheckoutCallbackPage;
