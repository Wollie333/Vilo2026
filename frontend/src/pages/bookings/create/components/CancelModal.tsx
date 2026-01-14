/**
 * CancelModal Component
 *
 * Confirmation dialog when user wants to cancel booking creation.
 */

import React from 'react';
import { Modal, Button, Alert } from '@/components/ui';
import type { CancelModalProps } from '../CreateBookingPage.types';

export const CancelModal: React.FC<CancelModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Booking?" size="sm">
      <div className="space-y-4">
        <Alert variant="warning">
          All entered information will be lost and you'll be returned to the bookings list.
        </Alert>

        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to cancel creating this booking?
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Keep Editing
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Yes, Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CancelModal;
