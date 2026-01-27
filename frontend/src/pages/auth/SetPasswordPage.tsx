/**
 * SetPasswordPage Component
 *
 * Allows new guests to set their password after booking
 * Uses Supabase recovery link flow
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout';
import { Input, Button, Alert } from '@/components/ui';
import { supabase } from '@/config/supabase';

export const SetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingRef = searchParams.get('booking');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Check if user is in recovery mode (clicked email link)
  useEffect(() => {
    const checkRecoveryMode = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsRecoveryMode(true);
      }
    };
    checkRecoveryMode();
  }, []);

  const validatePassword = (): string | null => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain an uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain a lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain a number';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Use Supabase's updateUser to set the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        if (email) {
          navigate(`/login?email=${encodeURIComponent(email)}`);
        } else {
          navigate('/login');
        }
      }, 2000);
    } catch (err) {
      console.error('Password set error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecoveryMode && !searchParams.get('access_token')) {
    return (
      <AuthLayout
        title="Invalid Link"
        subtitle="This password setup link is invalid or has expired"
      >
        <div className="space-y-6">
          <Alert variant="error">
            The password setup link is invalid or has expired. Please check your email for the latest link.
          </Alert>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary-600"
            >
              Go to login
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Password Set Successfully"
        subtitle="You can now access your booking portal"
      >
        <div className="space-y-6">
          <Alert variant="success">
            Your password has been set successfully! Redirecting to login...
          </Alert>
          {bookingRef && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Booking Reference
              </div>
              <div className="text-lg font-bold text-primary">
                {bookingRef}
              </div>
            </div>
          )}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set Your Password"
      subtitle={bookingRef ? `Booking ${bookingRef}` : 'Welcome to Vilo!'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {bookingRef && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Your booking has been confirmed! Set your password below to access your booking portal
              and manage your reservation.
            </p>
          </div>
        )}

        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a strong password"
          autoComplete="new-password"
          helperText="Min 8 chars, uppercase, lowercase, number"
          fullWidth
          disabled={isLoading}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          autoComplete="new-password"
          fullWidth
          disabled={isLoading}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
          disabled={!password || !confirmPassword}
        >
          Set Password & Continue
        </Button>

        {email && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Setting password for: <strong>{email}</strong>
          </p>
        )}
      </form>
    </AuthLayout>
  );
};
