export interface PaymentRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName?: string | null;
}
