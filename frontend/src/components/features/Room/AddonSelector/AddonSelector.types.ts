import type { AddOn } from '@/types/addon.types';

export interface AddonSelectorProps {
  propertyId: string;
  selectedAddonIds: string[];
  onSelectionChange: (addonIds: string[]) => void;
  onCreateNew: () => void;
  onEdit: (addon: AddOn) => void;
  currency: string;
  addons: AddOn[];
}
