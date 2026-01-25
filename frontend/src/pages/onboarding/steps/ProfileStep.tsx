/**
 * ProfileStep Component
 *
 * Step 1: Collect user profile information
 * - Full name (required)
 * - Phone (optional) - SA formatted
 * - Bio (optional)
 */

import React, { useState } from 'react';
import { Input, PhoneInput, Textarea, Alert, ImageUpload } from '@/components/ui';
import { OnboardingFooter } from '../components/OnboardingFooter';
import type { OnboardingProfileData } from '@/types/onboarding.types';
import { usersService } from '@/services';
import { useAuth } from '@/hooks';

interface ProfileStepProps {
  onSubmit: (data: OnboardingProfileData) => Promise<void>;
  onSkip: () => Promise<void>;
  isLoading: boolean;
  initialData?: OnboardingProfileData;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
  onSubmit,
  onSkip,
  isLoading,
  initialData,
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<OnboardingProfileData>({
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    bio: initialData?.bio || '',
  });

  // State for avatar upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Update form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        phone: initialData.phone || '',
        bio: initialData.bio || '',
      });
      setAvatarPreview(initialData.avatar_url || null);
    }
  }, [initialData]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: keyof OnboardingProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="text-center">
        <span className="inline-flex w-10 h-10 rounded-full bg-primary text-white text-lg font-bold items-center justify-center mb-3">
          1
        </span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tell us about yourself
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          This helps us personalize your experience
        </p>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto space-y-5">
        {submitError && (
          <Alert variant="error" dismissible onDismiss={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <Input
          label="Full Name"
          name="full_name"
          type="text"
          value={formData.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          placeholder="John Doe"
          autoComplete="name"
          fullWidth
          disabled={isLoading}
          autoFocus
          error={errors.full_name}
        />

        <PhoneInput
          label="Phone Number (optional)"
          name="phone"
          value={formData.phone || ''}
          onChange={(value) => handleChange('phone', value)}
          fullWidth
          disabled={isLoading}
          error={errors.phone}
          helperText="South African mobile number"
        />

        <Textarea
          label="Bio (optional)"
          name="bio"
          value={formData.bio || ''}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder="Tell us a bit about yourself..."
          rows={3}
          fullWidth
          disabled={isLoading}
          helperText="A brief description about you or your business"
        />
      </div>

      {/* Footer */}
      <OnboardingFooter
        onSkip={onSkip}
        onContinue={handleSubmit}
        isLoading={isLoading}
        continueLabel="Save & Continue"
      />
    </div>
  );
};

export default ProfileStep;
