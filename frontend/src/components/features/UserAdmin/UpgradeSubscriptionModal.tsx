/**
 * UpgradeSubscriptionModal Component
 *
 * Modal for admin to select an upgrade plan for a user
 * Shows available higher-tier plans with comparison
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Badge } from '@/components/ui';
import { adminSubscriptionService } from '@/services';

interface UpgradeSubscriptionModalProps {
  userId: string;
  userName: string;
  currentPlan: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface UpgradePlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  currency: string;
  pricing_tiers: {
    monthly?: { price_cents: number };
    annual?: { price_cents: number };
  };
  limits: Record<string, any>;
}

export const UpgradeSubscriptionModal: React.FC<UpgradeSubscriptionModalProps> = ({
  userId,
  userName,
  currentPlan,
  onClose,
  onSuccess,
}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<UpgradePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch available upgrade plans
  useEffect(() => {
    fetchUpgradePlans();
  }, [userId]);

  const fetchUpgradePlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminSubscriptionService.getAvailableUpgradePlans(userId);
      setAvailablePlans(response.available_upgrades || []);

      if (response.available_upgrades?.length > 0) {
        setSelectedPlanId(response.available_upgrades[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching upgrade plans:', err);
      setError(err.response?.data?.error || 'Failed to load available plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      alert('Please select a plan');
      return;
    }

    try {
      setSubmitting(true);

      await adminSubscriptionService.requestUpgrade(userId, {
        target_plan_id: selectedPlanId,
        admin_notes: adminNotes.trim() || undefined,
      });

      alert(`Upgrade request sent successfully! ${userName} will receive a notification to confirm.`);
      onSuccess();
    } catch (err: any) {
      console.error('Error requesting upgrade:', err);
      alert(err.response?.data?.error || 'Failed to request upgrade');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (cents: number, currency: string = 'USD'): string => {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  };

  const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);

  return (
    <Modal isOpen={true} onClose={onClose} size="lg" title="Upgrade Subscription">
      <Modal.Body>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <Alert variant="error">{error}</Alert>
        ) : availablePlans.length === 0 ? (
          <Alert variant="warning">
            No upgrade plans available. User is already on the highest tier.
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Current Plan Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Plan</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentPlan}
              </p>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Upgrade Plan
              </label>
              <div className="space-y-2">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPlanId === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                            {plan.display_name}
                          </h4>
                          {selectedPlanId === plan.id && (
                            <Badge variant="success" size="sm">
                              Selected
                            </Badge>
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {plan.description}
                          </p>
                        )}

                        {/* Pricing */}
                        <div className="mt-2 flex items-baseline gap-3">
                          {plan.pricing_tiers?.monthly && (
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(plan.pricing_tiers.monthly.price_cents, plan.currency)}
                              <span className="text-xs text-gray-500">/mo</span>
                            </span>
                          )}
                          {plan.pricing_tiers?.annual && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {formatCurrency(plan.pricing_tiers.annual.price_cents, plan.currency)}
                              <span className="text-xs">/yr</span>
                            </span>
                          )}
                        </div>

                        {/* Key Limits */}
                        {plan.limits && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(plan.limits).map(([key, value]) => {
                              const labels: Record<string, string> = {
                                max_properties: 'Properties',
                                max_rooms: 'Rooms',
                                max_team_members: 'Team',
                                max_bookings_per_month: 'Bookings/mo',
                              };

                              if (!labels[key]) return null;

                              return (
                                <span
                                  key={key}
                                  className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                                >
                                  {labels[key]}: {value === -1 ? '∞' : value}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Radio Button */}
                      <div className="ml-4">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPlanId === plan.id
                              ? 'border-primary bg-primary'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {selectedPlanId === plan.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes for {userName} (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                rows={3}
                placeholder="Explain why you're recommending this upgrade..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This message will be sent to the user along with the upgrade request.
              </p>
            </div>

            {/* Preview */}
            {selectedPlan && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  What happens next:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>{userName} will receive email, in-app, and chat notifications</li>
                  <li>They have 7 days to accept or decline the upgrade</li>
                  <li>If accepted, the upgrade will take effect on their next billing cycle</li>
                  <li>Current subscription remains active until then</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      {!loading && !error && availablePlans.length > 0 && (
        <Modal.Footer>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedPlanId || submitting}
            isLoading={submitting}
          >
            Send Upgrade Request
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};
