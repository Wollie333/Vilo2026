import type { PaymentRule } from '@/types/payment-rules.types';

export interface PaymentRuleManagerProps {
  roomId: string;
  rules: PaymentRule[];
  onRulesChange: () => void;
}
