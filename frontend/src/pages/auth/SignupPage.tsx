import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { AuthLayout } from '@/components/layout';
import { Input, Button, Alert, PhoneInput } from '@/components/ui';
import { useAuth } from '@/hooks';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuth();
  const location = useLocation();

  // Check if user was redirected from checkout
  const isFromCheckout = location.state?.from?.pathname?.startsWith('/checkout');

  const from = location.state?.from;
  const fromPath = from?.pathname || '/dashboard';
  const fromSearch = from?.search || '';
  const fullPath = fromPath + fromSearch;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');

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

      // After successful signup, user is authenticated
      // Redirect to the original destination (e.g., checkout) or dashboard
      navigate(fullPath, { replace: true });
    } catch (err) {
      // Error is already handled in context
    }
  };

  const displayError = formError || error;

  return (
    <AuthLayout
      title="Create an account"
      subtitle={
        isFromCheckout
          ? "Create your account to complete your subscription"
          : "Join Vilo to manage your vacation rentals"
      }
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

        <Input
          label="Email address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail className="w-5 h-5" />}
          fullWidth
          disabled={isLoading}
        />

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
