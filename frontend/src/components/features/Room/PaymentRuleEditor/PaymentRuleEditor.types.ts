/**
 * Payment Rule Editor Types
 *
 * Component props for payment rule editor components.
 */

import { PaymentRuleFormData, MilestoneFormData } from '@/types/payment-rules.types';

/**
 * Props for PaymentRuleEditor component
 */
export interface PaymentRuleEditorProps {
  roomId: string;
  rules: PaymentRuleFormData[];
  onChange: (rules: PaymentRuleFormData[]) => void;
  disabled?: boolean;
}

/**
 * Props for DepositRuleForm component
 */
export interface DepositRuleFormProps {
  rule: PaymentRuleFormData;
  onChange: (rule: PaymentRuleFormData) => void;
  disabled?: boolean;
}

/**
 * Props for ScheduleRuleForm component
 */
export interface ScheduleRuleFormProps {
  rule: PaymentRuleFormData;
  onChange: (rule: PaymentRuleFormData) => void;
  disabled?: boolean;
}

/**
 * Props for MilestoneEditor component
 */
export interface MilestoneEditorProps {
  milestones: MilestoneFormData[];
  onChange: (milestones: MilestoneFormData[]) => void;
  currency?: string;
  disabled?: boolean;
}
