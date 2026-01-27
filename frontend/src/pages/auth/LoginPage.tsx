import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { AuthLayout } from '@/components/layout';
import { Input, Button, Alert } from '@/components/ui';
import { useAuth } from '@/hooks';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Redirect to previous page if user was redirected to login (e.g., from checkout)
  // Otherwise, default to dashboard
  const from = location.state?.from;
  const fromPath = from?.pathname || '/dashboard';
  const fromSearch = from?.search || '';
  const fullPath = fromPath + fromSearch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    try {
      await login({ email, password });
      // Redirect to where user came from, or dashboard if they navigated directly to login
      navigate(fullPath, { replace: true });
    } catch (err) {
      // Error is already handled in context
    }
  };

  const displayError = formError || error;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {displayError && (
          <Alert variant="error" dismissible onDismiss={() => setFormError('')}>
            {displayError}
          </Alert>
        )}

        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail className="w-5 h-5" />}
          fullWidth
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          fullWidth
          disabled={isLoading}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Remember me
            </span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary-600"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          Sign in
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-primary hover:text-primary-600"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
