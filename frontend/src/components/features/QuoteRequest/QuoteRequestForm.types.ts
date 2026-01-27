/**
 * Quote Request Form Types
 */

import type { QuoteRequestWithDetails } from '@/types/quote-request.types';

export interface QuoteRequestFormProps {
  propertyId: string;
  propertyName: string;
  propertyCurrency: string;
  propertyImage?: string | null;
  onSuccess?: (quote: QuoteRequestWithDetails) => void;
  onCancel?: () => void;
}

export type QuoteFormStep = 1 | 2 | 3 | 4;

export interface QuoteFormStepConfig {
  number: QuoteFormStep;
  title: string;
  description: string;
}
