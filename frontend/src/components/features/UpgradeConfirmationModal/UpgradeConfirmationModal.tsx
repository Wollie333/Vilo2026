/**
 * UpgradeConfirmationModal Component
 *
 * Modal for user to review and confirm an upgrade request from admin
 * Shows plan comparison, pricing, and allows optional response notes
 */

import React, { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import type { UpgradeConfirmationModalProps } from './UpgradeConfirmationModal.types';

export const UpgradeConfirmationModal: React.FC<UpgradeConfirmationModalProps> = ({
  isOpen,
  onClose,
  upgradeRequest,
  onConfirm,
}) => {
  const [userNotes, setUserNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Your next billing cycle';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(upgradeRequest.id, userNotes.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Error confirming upgrade:', error);
      alert('Failed to confirm upgrade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetPrice = upgradeRequest.target_plan.pricing_tiers.monthly?.price_cents || 0;
  const currentPrice = upgradeRequest.current_plan.current_price_cents;
  const priceDifference = targetPrice - currentPrice;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Confirm Plan Upgrade"
    >
      <Modal.Body>
        <div className="space-y-4">
          {/* Admin Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-400">
              <strong>{upgradeRequest.requested_by_admin.full_name}</strong> has recommended this upgrade for you.
            </p>
            {upgradeRequest.admin_notes && (
              <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-700 dark:text-blue-500 mb-1">Message:</p>
                <p className="text-sm text-blue-900 dark:text-blue-300">{upgradeRequest.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Plan Comparison */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Plan Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Current Plan */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Plan</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {upgradeRequest.current_plan.display_name}
                </p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {formatCurrency(currentPrice)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">/mo</span>
                </p>
              </div>

              {/* New Plan */}
              <div className="border-2 border-primary bg-primary/5 dark:bg-primary/10 rounded-lg p-4">
                <p className="text-xs text-primary mb-1">New Plan</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {upgradeRequest.target_plan.display_name}
                </p>
                {upgradeRequest.target_plan.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {upgradeRequest.target_plan.description}
                  </p>
                )}
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(targetPrice)}
                  <span className="text-xs">/mo</span>
                </p>
              </div>
            </div>

            {/* Price Change */}
            {priceDifference > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>Price Increase:</strong> +{formatCurrency(priceDifference)}/month
                </p>
              </div>
            )}
          </div>

          {/* New Plan Features/Limits */}
          {upgradeRequest.target_plan.limits && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                New Plan Includes:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(upgradeRequest.target_plan.limits).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    max_properties: 'Properties',
                    max_rooms: 'Rooms',
                    max_team_members: 'Team Members',
                    max_bookings_per_month: 'Bookings/month',
                  };

                  if (!labels[key]) return null;

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <svg className="w-4 h-4 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{labels[key]}: {value === -1 ? 'Unlimited' : value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Effective Date */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Effective Date</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(upgradeRequest.next_billing_date)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Your current plan will remain active until then. The new plan will take effect automatically.
            </p>
          </div>

          {/* User Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Response (Optional)
            </label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
              rows={3}
              placeholder="Add any comments or questions..."
            />
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Confirm Upgrade
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
