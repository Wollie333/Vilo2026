/**
 * Quote Request Detail Modal Types
 *
 * Modal component for viewing and responding to quote requests
 */

import type { QuoteRequestWithDetails } from '@/types/quote-request.types';

export interface QuoteRequestDetailModalProps {
  quote: QuoteRequestWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onRespond?: (quoteId: string, response: string) => Promise<void>;
  onUpdateStatus?: (quoteId: string, status: string) => Promise<void>;
  onConvert?: (quoteId: string) => void;
}
