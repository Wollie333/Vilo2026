import { RefundDocument } from '@/types';

export interface DocumentListProps {
  documents: RefundDocument[];
  refundId: string;
  isAdmin?: boolean;
  onDelete?: (docId: string) => void;
  onVerify?: (docId: string) => void;
  isLoading?: boolean;
  verifyingDocId?: string | null;
  deletingDocId?: string | null;
}
