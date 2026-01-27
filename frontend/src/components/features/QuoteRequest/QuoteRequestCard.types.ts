/**
 * Quote Request Card Types
 *
 * List item component for displaying quote requests
 */

import type { QuoteRequestWithDetails } from '@/types/quote-request.types';

export interface QuoteRequestCardProps {
  quote: QuoteRequestWithDetails;
  onClick?: (quote: QuoteRequestWithDetails) => void;
}
