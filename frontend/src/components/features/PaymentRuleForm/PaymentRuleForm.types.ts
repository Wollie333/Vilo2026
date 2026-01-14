/**
 * PaymentRuleForm Types
 *
 * Type definitions for the PaymentRuleForm component.
 */

import { PaymentRuleFormData, PaymentRule } from '@/types/payment-rules.types';

export interface PaymentRuleFormProps {
  mode: 'create' | 'edit';
  paymentRule?: PaymentRule;
  propertyId: string;
  onSubmit: (data: PaymentRuleFormData) => Promise<void>;
  onCancel: () => void;
}
