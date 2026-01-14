export interface AmountDisplayProps {
  amount: number;
  currency?: string;
  showSign?: boolean;
  isCredit?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
