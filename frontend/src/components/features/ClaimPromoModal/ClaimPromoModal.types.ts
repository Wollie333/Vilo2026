/**
 * ClaimPromoModal Types
 */

export interface ClaimPromoModalProps {
  promotion: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
    discount_value: number;
  };
  propertyId: string;
  propertyName: string;
  onClose: () => void;
  onSuccess: () => void;
}
