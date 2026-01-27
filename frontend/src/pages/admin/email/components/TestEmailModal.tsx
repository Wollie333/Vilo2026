/**
 * Test Email Modal Component
 *
 * Allows admins to send a test email to verify template rendering and delivery.
 */

import React, { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { HiOutlineX, HiOutlineMail } from 'react-icons/hi';

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipientEmail: string) => Promise<void>;
  defaultEmail?: string;
}

export const TestEmailModal: React.FC<TestEmailModalProps> = ({
  isOpen,
  onClose,
  onSend,
  defaultEmail = '',
}) => {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setRecipientEmail(defaultEmail);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, defaultEmail]);

  const handleSend = async () => {
    setError(null);
    setSuccess(false);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSending(true);
      await onSend(recipientEmail);
      setSuccess(true);

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      {/* Modal Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <HiOutlineMail className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Send Test Email
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <HiOutlineX className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-6 space-y-4">
        {/* Info Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border-l-4 border-blue-500">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            This will send a test email using example variable values to verify your template renders correctly.
          </p>
        </div>

        {/* Email Input */}
        <div>
          <Input
            label="Recipient Email Address"
            type="email"
            placeholder="admin@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            fullWidth
            disabled={isSending}
            error={error || undefined}
          />
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border-l-4 border-green-500">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Test email sent successfully! Check your inbox.
            </p>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={isSending || !recipientEmail}
          isLoading={isSending}
        >
          {isSending ? 'Sending...' : 'Send Test Email'}
        </Button>
      </div>
    </Modal>
  );
};
