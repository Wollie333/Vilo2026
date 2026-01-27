/**
 * ClaimPromoModal Component
 *
 * Modal form for guests to claim a promotion by providing their contact details
 */

import React, { useState } from 'react';
import { Modal, Button, Input, PhoneInput } from '@/components/ui';
import { chatService } from '@/services/chat.service';
import type { ClaimPromoModalProps } from './ClaimPromoModal.types';

export const ClaimPromoModal: React.FC<ClaimPromoModalProps> = ({
  promotion,
  propertyId,
  propertyName,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await chatService.claimPromotion({
        promotion_id: promotion.id,
        property_id: propertyId,
        guest_name: formData.name.trim(),
        guest_email: formData.email.trim().toLowerCase(),
        guest_phone: formData.phone.trim(),
      });

      setIsSuccess(true);
      // Don't call onSuccess() here - let user see the success message first
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to claim promo' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSuccess) {
      onSuccess(); // Call onSuccess when closing after successful claim
    }
    onClose();
  };

  return (
    <Modal isOpen onClose={handleClose} title={isSuccess ? "Success!" : "Claim Your Promo"}>
      <div className="space-y-4">
        {isSuccess ? (
          /* Success Message */
          <>
            <div className="text-center py-6">
              {/* Success Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Success Heading */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Promo Claimed Successfully!
              </h3>

              {/* Instructions */}
              <div className="space-y-3 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Thank you for claiming the <span className="font-semibold text-gray-900 dark:text-white">{promotion.name}</span> promotion!
                </p>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Check Your Email
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        We've sent a verification email to <span className="font-medium">{formData.email}</span>. Please verify your email to access your account and view the promo code.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    What happens next?
                  </h4>
                  <ol className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">1</span>
                      <span>Verify your email address using the link we sent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">2</span>
                      <span>Set up your password to access your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">3</span>
                      <span>Check your messages for the promo code from the property owner</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-dark-border">
              <Button variant="primary" onClick={handleClose} className="min-w-[120px]">
                Close
              </Button>
            </div>
          </>
        ) : (
          /* Claim Form */
          <>
            {/* Promo Details */}
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/30">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {promotion.name}
              </h3>
              {promotion.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {promotion.description}
                </p>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                {promotion.discount_type === 'percentage'
                  ? `${promotion.discount_value}% OFF`
                  : promotion.discount_type === 'fixed_amount'
                  ? `$${promotion.discount_value} OFF`
                  : `${promotion.discount_value} Free Nights`
                }
              </span>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter your details to claim this exclusive offer. We'll send you the promo code and booking instructions.
              </p>

              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={errors.name}
                required
                placeholder="John Doe"
                fullWidth
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                error={errors.email}
                required
                placeholder="john@example.com"
                fullWidth
              />

              <PhoneInput
                label="Phone Number"
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                error={errors.phone}
                fullWidth
              />
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                Claim Promo
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
