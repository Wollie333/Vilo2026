import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/layout';
import { Button, Alert, Spinner } from '@/components/ui';
import { authService } from '@/services';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid or missing verification token');
        setIsVerifying(false);
        return;
      }

      try {
        await authService.verifyEmail(token);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify email');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  if (isVerifying) {
    return (
      <AuthLayout
        title="Verifying email"
        subtitle="Please wait while we verify your email address"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Verifying your email address...
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout
        title="Verification Failed"
        subtitle="We couldn't verify your email address"
      >
        <div className="space-y-6">
          <Alert variant="error">{error}</Alert>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            The verification link may have expired or already been used.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/login">
              <Button variant="primary" size="lg" className="w-full">
                Go to login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Email Verified"
        subtitle="Your email has been successfully verified"
      >
        <div className="space-y-6">
          <Alert variant="success">
            Your email address has been verified successfully!
          </Alert>
          <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              What happens next?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your account is now awaiting admin approval. You will receive an email
              notification once your account has been approved.
            </p>
          </div>
          <Link to="/login">
            <Button variant="primary" size="lg" className="w-full">
              Go to login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return null;
};
