import type { AddOn } from '@/types/addon.types';

export interface AddonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addon: AddOn) => void;
  propertyId: string;
  currency: string;
  mode: 'create' | 'edit';
  addon?: AddOn;
}
