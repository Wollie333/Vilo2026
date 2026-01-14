import type { PaymentRule } from '@/types/payment-rules.types';

export interface PaymentRulesDisplayProps {
  rules: PaymentRule[];
  onEdit: (rule: PaymentRule) => void;
  onDelete: (ruleId: string) => void;
  loading?: boolean;
}
