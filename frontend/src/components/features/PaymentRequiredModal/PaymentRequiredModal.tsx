import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { PaymentRequiredModalProps } from './PaymentRequiredModal.types';

const LockIcon = () => (
  <svg
    className="w-8 h-8 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

export const PaymentRequiredModal: React.FC<PaymentRequiredModalProps> = ({
  isOpen,
  onClose,
  actionName,
}) => {
  const navigate = useNavigate();

  const handleViewPlans = () => {
    onClose();
    navigate('/pricing');
  };

  const title = actionName
    ? `Subscribe to ${actionName}`
    : 'Subscription Required';

  const message = actionName
    ? `You need an active subscription to ${actionName.toLowerCase()}. Upgrade now to unlock all features.`
    : 'You need an active subscription to perform this action. Upgrade now to unlock all features.';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button variant="primary" onClick={handleViewPlans}>
            View Plans
          </Button>
        </div>
      }
    >
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <LockIcon />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      </div>
    </Modal>
  );
};
