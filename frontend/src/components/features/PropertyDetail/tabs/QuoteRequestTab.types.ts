/**
 * Quote Request Tab Types
 *
 * Tab component for public property page that allows guests to request quotes
 */

export interface QuoteRequestTabProps {
  propertyId: string;
  propertyName: string;
  propertyCurrency: string;
  propertyImage?: string | null;
}
