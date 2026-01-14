import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout';
import { Input, Button, Alert, PhoneInput } from '@/components/ui';
import { useAuth } from '@/hooks';

export const SignupPage: React.FC = () => {
  const { signup, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) {
      return 'Full name is required';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });
      setSuccess(true);
    } catch (err) {
      // Error is already handled in context
    }
  };

  const displayError = formError || error;

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent you a verification link"
      >
        <div className="space-y-6">
          <Alert variant="success">
            Your account has been created! Please check your email to verify
            your account. Once verified, an admin will review and approve your
            account.
          </Alert>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already verified?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join Vilo to manage your vacation rentals"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {displayError && (
          <Alert variant="error" dismissible onDismiss={() => setFormError('')}>
            {displayError}
          </Alert>
        )}

        <Input
          label="Full name"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="John Doe"
          autoComplete="name"
          fullWidth
          disabled={isLoading}
        />

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
            />
          </div>
        </div>

        <PhoneInput
          label="Phone (optional)"
          value={formData.phone}
          onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
          placeholder="+27 21 123 4567"
          defaultCountry="ZA"
          disabled={isLoading}
        />

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
          Create account
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary-600"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
