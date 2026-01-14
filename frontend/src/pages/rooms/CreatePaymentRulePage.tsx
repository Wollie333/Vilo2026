/**
 * CreatePaymentRulePage
 *
 * Page for creating a new payment rule at property level.
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { PaymentRuleForm } from '@/components/features/PaymentRuleForm';
import { paymentRulesService } from '@/services/payment-rules.service';
import { PaymentRuleFormData } from '@/types/payment-rules.types';

export const CreatePaymentRulePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property_id');

  // If no property_id, redirect to management page
  useEffect(() => {
    if (!propertyId) {
      navigate('/manage/rooms/payment-rules');
    }
  }, [propertyId, navigate]);

  if (!propertyId) {
    return null;
  }

  const handleSubmit = async (data: PaymentRuleFormData) => {
    console.log('[CreatePaymentRule] Form data:', data);

    // Clean up data - only send fields relevant to the rule type
    const cleanedData: any = {
      property_id: propertyId,
      rule_name: data.rule_name,
      description: data.description || undefined,
      rule_type: data.rule_type,
      is_active: data.is_active,
      applies_to_dates: data.applies_to_dates,
      priority: data.priority,
    };

    console.log('[CreatePaymentRule] Cleaned data:', cleanedData);

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

    await paymentRulesService.createPaymentRuleGlobal(cleanedData);
    navigate('/manage/rooms/payment-rules');
  };

  const handleCancel = () => {
    navigate('/manage/rooms/payment-rules');
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Payment Rule
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure deposit requirements and payment schedules
          </p>
        </div>

        <PaymentRuleForm
          mode="create"
          propertyId={propertyId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AuthenticatedLayout>
  );
};
