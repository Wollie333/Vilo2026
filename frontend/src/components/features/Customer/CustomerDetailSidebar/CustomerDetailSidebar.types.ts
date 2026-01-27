import type { CustomerWithCompany } from '@/types/customer.types';

export interface CustomerDetailSidebarProps {
  customer: CustomerWithCompany;
  activeConversationsCount: number;
  onSendEmail: () => void;
  onCall: () => void;
  onNavigateBack: () => void;
}
