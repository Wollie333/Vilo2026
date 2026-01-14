/**
 * EnhancedAddonCard Types
 */

export interface AddonDetails {
  id: string;
  addon_id: string;
  addon_name: string;
  unit_price: number;
  quantity: number;
  addon_total: number;
  image_url?: string;
}

export interface EnhancedAddonCardProps {
  addon: AddonDetails;
  currency: string;
}
