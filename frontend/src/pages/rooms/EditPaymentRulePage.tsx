/**
 * EditPaymentRulePage
 *
 * Page for editing an existing payment rule.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { HiOutlineLockClosed } from 'react-icons/hi';
import { AuthenticatedLayout } from '@/components/layout';
import { PaymentRuleForm } from '@/components/features/PaymentRuleForm';
import { Alert, Button } from '@/components/ui';
import { paymentRulesService } from '@/services/payment-rules.service';
import { PaymentRule, PaymentRuleFormData, RuleEditPermission } from '@/types/payment-rules.types';

export const EditPaymentRulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paymentRule, setPaymentRule] = useState<PaymentRule | null>(null);
  const [editPermission, setEditPermission] = useState<RuleEditPermission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch rule details and edit permission in parallel
        const [rule, permission] = await Promise.all([
          paymentRulesService.getPaymentRuleById(id),
          paymentRulesService.checkEditPermission(id),
        ]);

        setPaymentRule(rule);
        setEditPermission(permission);
      } catch (err: any) {
        setError(err.message || 'Failed to load payment rule');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (data: PaymentRuleFormData) => {
    if (!id) return;

    // Clean up data - only send fields relevant to the rule type
    const cleanedData: any = {
      rule_name: data.rule_name,
      description: data.description || undefined,
      rule_type: data.rule_type,
      is_active: data.is_active,
      applies_to_dates: data.applies_to_dates,
      priority: data.priority,
    };

    // Add date range only if applies_to_dates is true
    if (data.applies_to_dates && data.start_date && data.end_date) {
      cleanedData.start_date = data.start_date;
      cleanedData.end_date = data.end_date;
    }

    // Add deposit configuration for deposit rules
    if (data.rule_type === 'deposit') {
      cleanedData.deposit_type = data.deposit_type;
      cleanedData.deposit_amount = data.deposit_amount;
      cleanedData.deposit_due = data.deposit_due;
      cleanedData.balance_due = data.balance_due;

      if (data.deposit_due === 'days_before_checkin' || data.deposit_due === 'days_after_booking') {
        cleanedData.deposit_due_days = data.deposit_due_days;
      }

      if (data.balance_due === 'days_before_checkin' || data.balance_due === 'days_after_booking') {
        cleanedData.balance_due_days = data.balance_due_days;
      }
    }

    // Add schedule configuration for payment_schedule rules
    if (data.rule_type === 'payment_schedule' && data.schedule_config.length > 0) {
      cleanedData.schedule_config = data.schedule_config;
    }

    // Add allowed payment methods if specified
    if (data.allowed_payment_methods && data.allowed_payment_methods.length > 0) {
      cleanedData.allowed_payment_methods = data.allowed_payment_methods;
    }

    await paymentRulesService.updatePaymentRuleGlobal(id, cleanedData);
    navigate('/manage/rooms/payment-rules');
  };

  const handleCancel = () => {
    navigate('/manage/rooms/payment-rules');
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !paymentRule) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400">
              {error || 'Payment rule not found'}
            </p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // If rule is in use, show read-only warning
  if (editPermission && !editPermission.canEdit) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Payment Rule
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This rule cannot be edited while in use
            </p>
          </div>

          {/* Warning Banner */}
          <Alert variant="warning" className="mb-6">
            <div className="flex items-start gap-3">
              <HiOutlineLockClosed className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  This payment rule cannot be edited
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  This rule is currently assigned to {editPermission.assignedRoomCount}{' '}
                  {editPermission.assignedRoomCount === 1 ? 'room' : 'rooms'}:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {editPermission.roomNames.slice(0, 5).map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                  {editPermission.roomNames.length > 5 && (
                    <li className="text-gray-500 dark:text-gray-400">
                      + {editPermission.roomNames.length - 5} more rooms
                    </li>
                  )}
                </ul>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  To edit this rule, first{' '}
                  <Link
                    to={`/rooms/payment-rules/${id}?tab=rooms`}
                    className="text-primary hover:underline font-medium"
                  >
                    unassign it from all rooms
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Alert>

          {/* Read-only view of the rule */}
          <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payment Rule Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name
                </label>
                <p className="text-gray-900 dark:text-white">{paymentRule.rule_name}</p>
              </div>
              {paymentRule.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900 dark:text-white">{paymentRule.description}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Type
                </label>
                <p className="text-gray-900 dark:text-white capitalize">
                  {paymentRule.rule_type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <p className="text-gray-900 dark:text-white">
                  {paymentRule.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Back to Payment Rules
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/manage/rooms/payment-rules/${id}?tab=rooms`)}
            >
              Manage Room Assignments
            </Button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Payment Rule
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update deposit requirements and payment schedules
          </p>
        </div>

        <PaymentRuleForm
          mode="edit"
          paymentRule={paymentRule}
          propertyId={paymentRule.property_id}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AuthenticatedLayout>
  );
};
